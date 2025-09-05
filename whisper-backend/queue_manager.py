# queue_manager.py - Audio Processing Queue Manager

import asyncio
import json
from datetime import datetime
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from database.models import DatabaseManager, AudioQueue

class AudioQueueManager:
    def __init__(self, db_manager: DatabaseManager, max_concurrent: int = 5):
        self.db_manager = db_manager
        self.max_concurrent = max_concurrent
        self.processing_semaphore = asyncio.Semaphore(max_concurrent)
        
    def get_db_session(self):
        """Get database session"""
        return self.db_manager.get_session()
    
    async def add_to_queue(self, user_id: int, user_email: str, session_id: str, 
                          filename: str, file_path: str, file_size: int, 
                          processing_settings: dict) -> int:
        """Add audio file to processing queue and return queue position"""
        db = self.get_db_session()
        try:
            # Create queue entry
            queue_entry = AudioQueue(
                session_id=session_id,
                user_id=user_id,
                user_email=user_email,
                filename=filename,
                file_path=file_path,
                file_size=file_size,
                status="QUEUED",
                processing_settings=json.dumps(processing_settings)
            )
            
            db.add(queue_entry)
            db.commit()
            
            # Calculate queue position
            position = self._calculate_queue_position(db, session_id)
            
            # Update position in database
            queue_entry.queue_position = position
            db.commit()
            
            print(f"Added to queue: {filename} at position {position}")
            return position
            
        except Exception as e:
            db.rollback()
            print(f"Error adding to queue: {e}")
            raise
        finally:
            db.close()
    
    def _calculate_queue_position(self, db: Session, session_id: str) -> int:
        """Calculate current position in queue"""
        # Count QUEUED items created before this one
        current_item = db.query(AudioQueue).filter(AudioQueue.session_id == session_id).first()
        if not current_item:
            return 0
            
        queued_before = db.query(AudioQueue).filter(
            AudioQueue.status == "QUEUED",
            AudioQueue.created_at <= current_item.created_at,
            AudioQueue.id != current_item.id
        ).count()
        
        return queued_before + 1
    
    async def can_process_now(self) -> bool:
        """Check if we can start processing (have available slots)"""
        db = self.get_db_session()
        try:
            processing_count = db.query(AudioQueue).filter(
                AudioQueue.status == "PROCESSING"
            ).count()
            return processing_count < self.max_concurrent
        finally:
            db.close()
    
    async def get_next_queued_item(self) -> Optional[AudioQueue]:
        """Get the next item that should be processed"""
        db = self.get_db_session()
        try:
            return db.query(AudioQueue).filter(
                AudioQueue.status == "QUEUED"
            ).order_by(AudioQueue.created_at.asc()).first()
        finally:
            db.close()
    
    async def start_processing(self, session_id: str) -> bool:
        """Mark item as processing"""
        db = self.get_db_session()
        try:
            queue_item = db.query(AudioQueue).filter(
                AudioQueue.session_id == session_id
            ).first()
            
            if queue_item and queue_item.status == "QUEUED":
                queue_item.status = "PROCESSING"
                queue_item.started_processing_at = datetime.utcnow()
                queue_item.queue_position = 0
                db.commit()
                
                # Recalculate positions for remaining items
                await self._recalculate_queue_positions()
                
                print(f"Started processing: {queue_item.filename}")
                return True
            return False
        finally:
            db.close()
    
    async def complete_processing(self, session_id: str):
        """Mark processing as completed and start next item"""
        db = self.get_db_session()
        try:
            queue_item = db.query(AudioQueue).filter(
                AudioQueue.session_id == session_id
            ).first()
            
            if queue_item:
                queue_item.status = "COMPLETED"
                queue_item.completed_at = datetime.utcnow()
                db.commit()
                print(f"Completed processing: {queue_item.filename}")
        finally:
            db.close()
        
        # Try to start next item in queue
        await self.start_next_if_available()
    
    async def fail_processing(self, session_id: str, error_message: str):
        """Mark processing as failed and start next item"""
        db = self.get_db_session()
        try:
            queue_item = db.query(AudioQueue).filter(
                AudioQueue.session_id == session_id
            ).first()
            
            if queue_item:
                queue_item.status = "FAILED"
                queue_item.completed_at = datetime.utcnow()
                queue_item.error_message = error_message
                db.commit()
                print(f"Failed processing: {queue_item.filename} - {error_message}")
        finally:
            db.close()
        
        # Try to start next item in queue
        await self.start_next_if_available()
    
    async def start_next_if_available(self):
        """Start next queued item if slots available"""
        if await self.can_process_now():
            next_item = await self.get_next_queued_item()
            if next_item:
                await self.start_processing(next_item.session_id)
                # Here we would trigger the actual processing
                # This will be connected in main.py
    
    async def get_queue_status(self, session_id: str) -> Optional[Dict]:
        """Get current status and position for a session"""
        db = self.get_db_session()
        try:
            queue_item = db.query(AudioQueue).filter(
                AudioQueue.session_id == session_id
            ).first()
            
            if not queue_item:
                return None
            
            # If queued, recalculate current position
            if queue_item.status == "QUEUED":
                current_position = self._calculate_queue_position(db, session_id)
                queue_item.queue_position = current_position
                db.commit()
            
            return queue_item.to_dict()
        finally:
            db.close()
    
    async def _recalculate_queue_positions(self):
        """Recalculate queue positions for all queued items"""
        db = self.get_db_session()
        try:
            queued_items = db.query(AudioQueue).filter(
                AudioQueue.status == "QUEUED"
            ).order_by(AudioQueue.created_at.asc()).all()
            
            for i, item in enumerate(queued_items, 1):
                item.queue_position = i
            
            db.commit()
        finally:
            db.close()
    
    async def get_queue_stats(self) -> Dict:
        """Get overall queue statistics"""
        db = self.get_db_session()
        try:
            stats = {
                "queued": db.query(AudioQueue).filter(AudioQueue.status == "QUEUED").count(),
                "processing": db.query(AudioQueue).filter(AudioQueue.status == "PROCESSING").count(),
                "completed": db.query(AudioQueue).filter(AudioQueue.status == "COMPLETED").count(),
                "failed": db.query(AudioQueue).filter(AudioQueue.status == "FAILED").count(),
                "max_concurrent": self.max_concurrent
            }
            return stats
        finally:
            db.close()