# api/prompt_routes.py - Complete API routes for prompt management

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from pydantic import BaseModel, validator
from datetime import datetime
import logging

# Import database components
try:
    from database.models import AnalysisPrompt, AnalysisResult, db_manager
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False
    db_manager = None

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/prompts", tags=["prompts"])

# Pydantic models for request/response
class PromptCreate(BaseModel):
    key: str
    title: str
    description: str = ""
    prompt_template: str
    icon: str = "Brain"
    emoji: str = "🤖"
    category: str = "general"
    gradient_from: str = "cyan-500"
    gradient_to: str = "cyan-600"
    max_tokens: int = 2000
    estimated_time: float = 30.0

    @validator('key')
    def validate_key(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Key cannot be empty')
        # Remove spaces and convert to lowercase for consistency
        return v.strip().lower().replace(' ', '_').replace('-', '_')
    
    @validator('prompt_template')
    def validate_prompt_template(cls, v):
        if '{transcript}' not in v:
            raise ValueError('Prompt template must contain {transcript} placeholder')
        return v

    @validator('max_tokens')
    def validate_max_tokens(cls, v):
        if v < 100 or v > 8000:
            raise ValueError('Max tokens must be between 100 and 8000')
        return v

    @validator('estimated_time')
    def validate_estimated_time(cls, v):
        if v < 1 or v > 300:
            raise ValueError('Estimated time must be between 1 and 300 seconds')
        return v

class PromptUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    prompt_template: Optional[str] = None
    icon: Optional[str] = None
    emoji: Optional[str] = None
    category: Optional[str] = None
    gradient_from: Optional[str] = None
    gradient_to: Optional[str] = None
    max_tokens: Optional[int] = None
    estimated_time: Optional[float] = None
    is_active: Optional[bool] = None

    @validator('prompt_template')
    def validate_prompt_template(cls, v):
        if v is not None and '{transcript}' not in v:
            raise ValueError('Prompt template must contain {transcript} placeholder')
        return v

    @validator('max_tokens')
    def validate_max_tokens(cls, v):
        if v is not None and (v < 100 or v > 8000):
            raise ValueError('Max tokens must be between 100 and 8000')
        return v

    @validator('estimated_time')
    def validate_estimated_time(cls, v):
        if v is not None and (v < 1 or v > 300):
            raise ValueError('Estimated time must be between 1 and 300 seconds')
        return v

class PromptResponse(BaseModel):
    id: int
    key: str
    title: str
    description: str
    icon: str
    emoji: str
    category: str
    gradient_from: str
    gradient_to: str
    is_active: bool
    is_system: bool
    usage_count: int
    estimated_time: float
    created_at: str
    updated_at: Optional[str] = None

# Dependency to get DB session
def get_db():
    if not DATABASE_AVAILABLE or not db_manager:
        raise HTTPException(
            status_code=503, 
            detail="Database not available. Please ensure the database is initialized."
        )
    
    session = db_manager.get_session()
    try:
        yield session
    finally:
        session.close()

@router.get("/", response_model=List[dict])
async def get_all_prompts(
    category: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all analysis prompts, optionally filtered by category"""
    try:
        query = db.query(AnalysisPrompt)
        
        if active_only:
            query = query.filter(AnalysisPrompt.is_active == True)
        
        if category and category != 'all':
            query = query.filter(AnalysisPrompt.category == category)
        
        prompts = query.order_by(AnalysisPrompt.created_at.desc()).all()
        
        return [prompt.to_dict() for prompt in prompts]
        
    except Exception as e:
        logger.error(f"Error fetching prompts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch prompts: {str(e)}")

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all available prompt categories"""
    try:
        categories = db.query(AnalysisPrompt.category).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        
        # Add default categories if not present
        default_categories = ['general', 'meeting', 'content', 'analysis', 'productivity']
        for cat in default_categories:
            if cat not in category_list:
                category_list.append(cat)
        
        return {
            "categories": [
                {"value": "all", "label": "All Categories", "color": "gray"},
                {"value": "general", "label": "General", "color": "blue"},
                {"value": "meeting", "label": "Meeting", "color": "green"},
                {"value": "content", "label": "Content", "color": "purple"},
                {"value": "analysis", "label": "Analysis", "color": "yellow"},
                {"value": "productivity", "label": "Productivity", "color": "orange"}
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@router.get("/{prompt_key}")
async def get_prompt_by_key(prompt_key: str, db: Session = Depends(get_db)):
    """Get a specific prompt by its key"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == prompt_key).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        return prompt.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prompt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch prompt: {str(e)}")

@router.post("/", response_model=dict)
async def create_prompt(
    prompt_data: PromptCreate, 
    db: Session = Depends(get_db)
):
    """Create a new analysis prompt"""
    try:
        # Check if key already exists
        existing = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == prompt_data.key).first()
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Prompt with key '{prompt_data.key}' already exists"
            )
        
        # Validate prompt template
        if "{transcript}" not in prompt_data.prompt_template:
            raise HTTPException(
                status_code=400, 
                detail="Prompt template must contain {transcript} placeholder"
            )
        
        new_prompt = AnalysisPrompt(
            key=prompt_data.key,
            title=prompt_data.title,
            description=prompt_data.description,
            prompt_template=prompt_data.prompt_template,
            icon=prompt_data.icon,
            emoji=prompt_data.emoji,
            category=prompt_data.category,
            gradient_from=prompt_data.gradient_from,
            gradient_to=prompt_data.gradient_to,
            max_tokens=prompt_data.max_tokens,
            estimated_time=prompt_data.estimated_time,
            created_by="admin"  # TODO: Get from auth system when implemented
        )
        
        db.add(new_prompt)
        db.commit()
        db.refresh(new_prompt)
        
        logger.info(f"Created new prompt: {prompt_data.key}")
        return new_prompt.to_dict()
        
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {e}")
        raise HTTPException(status_code=400, detail="Prompt key must be unique")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating prompt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create prompt: {str(e)}")

@router.put("/{prompt_id}", response_model=dict)
async def update_prompt(
    prompt_id: int, 
    prompt_data: PromptUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing prompt"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.id == prompt_id).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        # Don't allow updating system prompts' core fields
        if prompt.is_system and any([
            prompt_data.prompt_template is not None,
            prompt_data.title is not None
        ]):
            raise HTTPException(
                status_code=403, 
                detail="Cannot modify core fields of system prompts"
            )
        
        # Update fields
        update_data = prompt_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(prompt, field) and value is not None:
                setattr(prompt, field, value)
        
        # Update timestamp
        prompt.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(prompt)
        
        logger.info(f"Updated prompt: {prompt.key}")
        return prompt.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating prompt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update prompt: {str(e)}")

@router.delete("/{prompt_id}")
async def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """Delete a prompt (only non-system prompts)"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.id == prompt_id).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        if prompt.is_system:
            raise HTTPException(
                status_code=403, 
                detail="Cannot delete system prompts"
            )
        
        db.delete(prompt)
        db.commit()
        
        logger.info(f"Deleted prompt: {prompt.key}")
        return {"message": "Prompt deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting prompt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete prompt: {str(e)}")

@router.post("/{prompt_key}/toggle")
async def toggle_prompt_status(prompt_key: str, db: Session = Depends(get_db)):
    """Toggle prompt active/inactive status"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == prompt_key).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        prompt.is_active = not prompt.is_active
        prompt.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(prompt)
        
        status = "activated" if prompt.is_active else "deactivated"
        logger.info(f"Prompt {prompt.key} {status}")
        
        return {
            "message": f"Prompt {status} successfully",
            "is_active": prompt.is_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error toggling prompt status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle prompt status: {str(e)}")

@router.post("/{prompt_key}/increment-usage")
async def increment_usage_count(prompt_key: str, db: Session = Depends(get_db)):
    """Increment usage count for analytics"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == prompt_key).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        prompt.usage_count += 1
        db.commit()
        
        return {
            "message": "Usage count incremented",
            "usage_count": prompt.usage_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error incrementing usage count: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to increment usage count: {str(e)}")

@router.get("/analytics/usage")
async def get_usage_analytics(db: Session = Depends(get_db)):
    """Get usage analytics for all prompts"""
    try:
        prompts = db.query(AnalysisPrompt).all()
        
        total_prompts = len(prompts)
        active_prompts = sum(1 for p in prompts if p.is_active)
        total_usage = sum(p.usage_count for p in prompts)
        
        # Category breakdown
        categories = {}
        for prompt in prompts:
            cat = prompt.category
            if cat not in categories:
                categories[cat] = {"count": 0, "total_usage": 0}
            categories[cat]["count"] += 1
            categories[cat]["total_usage"] += prompt.usage_count
        
        # Top used prompts
        top_prompts = sorted(prompts, key=lambda x: x.usage_count, reverse=True)[:5]
        
        return {
            "overview": {
                "total_prompts": total_prompts,
                "active_prompts": active_prompts,
                "total_usage": total_usage,
                "average_usage": total_usage / total_prompts if total_prompts > 0 else 0
            },
            "categories": categories,
            "top_prompts": [
                {
                    "key": p.key,
                    "title": p.title,
                    "usage_count": p.usage_count,
                    "category": p.category
                }
                for p in top_prompts
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")

# Health check endpoint for prompt system
@router.get("/health")
async def prompt_system_health(db: Session = Depends(get_db)):
    """Check prompt system health"""
    try:
        # Test database connection
        prompt_count = db.query(AnalysisPrompt).count()
        active_count = db.query(AnalysisPrompt).filter(AnalysisPrompt.is_active == True).count()
        
        return {
            "status": "healthy",
            "database": "connected",
            "total_prompts": prompt_count,
            "active_prompts": active_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Prompt system health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Prompt system unhealthy: {str(e)}")

# Utility endpoint to get prompt statistics
@router.get("/stats")
async def get_prompt_stats(db: Session = Depends(get_db)):
    """Get basic prompt statistics"""
    try:
        total = db.query(AnalysisPrompt).count()
        active = db.query(AnalysisPrompt).filter(AnalysisPrompt.is_active == True).count()
        system = db.query(AnalysisPrompt).filter(AnalysisPrompt.is_system == True).count()
        custom = total - system
        
        return {
            "total_prompts": total,
            "active_prompts": active,
            "inactive_prompts": total - active,
            "system_prompts": system,
            "custom_prompts": custom
        }
        
    except Exception as e:
        logger.error(f"Error fetching prompt stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

# Endpoint to reset usage counts (for admin purposes)
@router.post("/admin/reset-usage")
async def reset_usage_counts(db: Session = Depends(get_db)):
    """Reset all usage counts to zero (admin only)"""
    try:
        # Reset all usage counts
        db.query(AnalysisPrompt).update({"usage_count": 0})
        db.commit()
        
        logger.info("Reset all prompt usage counts")
        return {"message": "All usage counts reset to zero"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error resetting usage counts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset usage counts: {str(e)}")

# Export the router
__all__ = ["router"]