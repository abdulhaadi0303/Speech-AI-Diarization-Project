# api/prompt_routes.py - Complete API routes for prompt management (UPDATED WITH PUBLIC ENDPOINT)

from fastapi import APIRouter, HTTPException, Depends, status, Query
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
    print("Database models imported successfully")
except ImportError as e:
    print(f"Database not available: {e}")
    DATABASE_AVAILABLE = False
    db_manager = None

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/prompts", tags=["prompts"])

# Default prompts for fallback
DEFAULT_PROMPTS = [
    {
        "id": 1,
        "key": "summary",
        "title": "Conversation Summary",
        "description": "Generate a comprehensive summary of the entire conversation",
        "prompt_template": "Analyze this transcript and provide a comprehensive summary: {transcript}",
        "icon": "FileText",
        "emoji": "📋",
        "category": "general",
        "gradient_from": "cyan-500",
        "gradient_to": "cyan-600",
        "is_active": True,
        "is_system": True,
        "max_tokens": 2000,
        "estimated_time": 30.0,
        "usage_count": 0,
        "created_at": datetime.now().isoformat(),
        "created_by": "system"
    },
    {
        "id": 2,
        "key": "action_items",
        "title": "Action Items & Tasks",
        "description": "Extract actionable tasks and commitments from the conversation",
        "prompt_template": "Extract all action items and tasks from this transcript: {transcript}",
        "icon": "CheckSquare",
        "emoji": "✅",
        "category": "productivity",
        "gradient_from": "green-500",
        "gradient_to": "green-600",
        "is_active": True,
        "is_system": True,
        "max_tokens": 1500,
        "estimated_time": 25.0,
        "usage_count": 0,
        "created_at": datetime.now().isoformat(),
        "created_by": "system"
    },
    {
        "id": 3,
        "key": "sentiment_analysis",
        "title": "Sentiment Analysis",
        "description": "Analyze the emotional tone and sentiment of the conversation",
        "prompt_template": "Analyze the sentiment and emotional tone of this transcript: {transcript}",
        "icon": "Heart",
        "emoji": "💭",
        "category": "analysis",
        "gradient_from": "purple-500",
        "gradient_to": "purple-600",
        "is_active": True,
        "is_system": True,
        "max_tokens": 1800,
        "estimated_time": 35.0,
        "usage_count": 0,
        "created_at": datetime.now().isoformat(),
        "created_by": "system"
    },
    {
        "id": 4,
        "key": "meeting_notes",
        "title": "Meeting Notes",
        "description": "Convert conversation into structured meeting notes",
        "prompt_template": "Convert this transcript into professional meeting notes: {transcript}",
        "icon": "Calendar",
        "emoji": "📝",
        "category": "meeting",
        "gradient_from": "blue-500",
        "gradient_to": "blue-600",
        "is_active": True,
        "is_system": True,
        "max_tokens": 2500,
        "estimated_time": 40.0,
        "usage_count": 0,
        "created_at": datetime.now().isoformat(),
        "created_by": "system"
    }
]

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

# Dependency to get database session
def get_db():
    if not DATABASE_AVAILABLE or not db_manager:
        raise HTTPException(
            status_code=503, 
            detail="Database not available. Please check database connection."
        )
    
    db = db_manager.get_session()
    try:
        yield db
    finally:
        db.close()

# NEW: Public endpoint for Analysis Page (limited access)
@router.get("/public")
async def get_public_prompts():
    """Get only active prompts for analysis page (public access)
    
    This endpoint returns only active prompts with limited fields
    for security. No sensitive information is exposed.
    """
    try:
        if not DATABASE_AVAILABLE or not db_manager:
            logger.info("Database not available, returning filtered default prompts")
            # Return filtered default prompts with only safe fields
            public_prompts = [
                {
                    "key": p["key"],
                    "title": p["title"], 
                    "description": p["description"],
                    "category": p["category"],
                    "icon": p["icon"],
                    "emoji": p["emoji"],
                    "estimated_time": p["estimated_time"],
                    "gradient_from": p["gradient_from"],
                    "gradient_to": p["gradient_to"],
                    "max_tokens": p["max_tokens"]
                }
                for p in DEFAULT_PROMPTS if p.get("is_active", True)
            ]
            return public_prompts
            
        # Get from database - only active prompts
        db = db_manager.get_session()
        try:
            prompts = db.query(AnalysisPrompt).filter(
                AnalysisPrompt.is_active == True
            ).order_by(AnalysisPrompt.created_at.desc()).all()
            
            if not prompts:
                logger.info("No active prompts found in database, returning default prompts")
                # Return filtered defaults if no prompts in database
                return [
                    {
                        "key": p["key"],
                        "title": p["title"], 
                        "description": p["description"],
                        "category": p["category"],
                        "icon": p["icon"],
                        "emoji": p["emoji"],
                        "estimated_time": p["estimated_time"],
                        "gradient_from": p["gradient_from"],
                        "gradient_to": p["gradient_to"],
                        "max_tokens": p["max_tokens"]
                    }
                    for p in DEFAULT_PROMPTS if p.get("is_active", True)
                ]
            
            # Return only safe fields for public consumption
            result = [
                {
                    "key": p.key,
                    "title": p.title,
                    "description": p.description,
                    "category": p.category,
                    "icon": p.icon,
                    "emoji": p.emoji,
                    "estimated_time": p.estimated_time,
                    "gradient_from": p.gradient_from,
                    "gradient_to": p.gradient_to,
                    "max_tokens": p.max_tokens
                    # Exclude sensitive fields: id, prompt_template, usage_count, created_by, etc.
                }
                for p in prompts
            ]
            
            logger.info(f"Returning {len(result)} active prompts for public access")
            return result
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Failed to get public prompts: {e}")
        # Return default prompts as ultimate fallback
        return [
            {
                "key": p["key"],
                "title": p["title"], 
                "description": p["description"],
                "category": p["category"],
                "icon": p["icon"],
                "emoji": p["emoji"],
                "estimated_time": p["estimated_time"],
                "gradient_from": p["gradient_from"],
                "gradient_to": p["gradient_to"],
                "max_tokens": p["max_tokens"]
            }
            for p in DEFAULT_PROMPTS if p.get("is_active", True)
        ]

# EXISTING: Admin endpoint with full access (unchanged)
@router.get("/")
async def get_all_prompts(
    active_only: bool = Query(False, description="Return only active prompts"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: Optional[int] = Query(None, description="Limit number of results"),
    offset: int = Query(0, description="Offset for pagination")
):
    """Get all analysis prompts with optional filtering (ADMIN ACCESS)
    
    This endpoint provides full access to all prompts including
    sensitive fields. Intended for admin use only.
    """
    try:
        if not DATABASE_AVAILABLE or not db_manager:
            logger.info("Database not available, returning default prompts")
            filtered_prompts = DEFAULT_PROMPTS.copy()
            
            if active_only:
                filtered_prompts = [p for p in filtered_prompts if p.get('is_active', True)]
            
            if category and category != 'all':
                filtered_prompts = [p for p in filtered_prompts if p.get('category') == category]
            
            # Apply pagination
            if limit is not None:
                filtered_prompts = filtered_prompts[offset:offset + limit]
            elif offset > 0:
                filtered_prompts = filtered_prompts[offset:]
            
            return filtered_prompts
        
        # Get from database
        db = db_manager.get_session()
        try:
            query = db.query(AnalysisPrompt)
            
            if active_only:
                query = query.filter(AnalysisPrompt.is_active == True)
            
            if category and category != 'all':
                query = query.filter(AnalysisPrompt.category == category)
            
            query = query.order_by(AnalysisPrompt.created_at.desc())
            
            # Apply pagination
            if limit is not None:
                query = query.offset(offset).limit(limit)
            elif offset > 0:
                query = query.offset(offset)
                
            prompts = query.all()
            
            if not prompts:
                logger.info("No prompts found in database, returning default prompts")
                return DEFAULT_PROMPTS
            
            # Convert to dict format (full access for admin)
            result = [prompt.to_dict() for prompt in prompts]
            logger.info(f"Returning {len(result)} prompts for admin access")
            return result
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Failed to get admin prompts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load prompts: {str(e)}")

# EXISTING: Get available categories (unchanged)
@router.get("/categories")
async def get_categories():
    """Get available prompt categories"""
    categories = [
        {"value": "all", "label": "All Categories", "color": "gray"},
        {"value": "general", "label": "General", "color": "blue"},
        {"value": "meeting", "label": "Meeting", "color": "green"},
        {"value": "content", "label": "Content", "color": "purple"},
        {"value": "analysis", "label": "Analysis", "color": "yellow"},
        {"value": "productivity", "label": "Productivity", "color": "orange"}
    ]
    return {"categories": categories}

# EXISTING: Get specific prompt by key (unchanged)
@router.get("/{key}")
async def get_prompt_by_key(key: str):
    """Get a specific prompt by its key"""
    try:
        if not DATABASE_AVAILABLE or not db_manager:
            # Search in default prompts
            for prompt in DEFAULT_PROMPTS:
                if prompt["key"] == key:
                    return prompt
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        db = db_manager.get_session()
        try:
            prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == key).first()
            if not prompt:
                raise HTTPException(status_code=404, detail="Prompt not found")
            return prompt.to_dict()
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get prompt {key}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get prompt: {str(e)}")

# EXISTING: Create new prompt (unchanged)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_prompt(prompt: PromptCreate, db: Session = Depends(get_db)):
    """Create a new analysis prompt"""
    try:
        # Check if key already exists
        existing = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == prompt.key).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Prompt with key '{prompt.key}' already exists")
        
        # Create new prompt
        db_prompt = AnalysisPrompt(
            key=prompt.key,
            title=prompt.title,
            description=prompt.description,
            prompt_template=prompt.prompt_template,
            icon=prompt.icon,
            emoji=prompt.emoji,
            category=prompt.category,
            gradient_from=prompt.gradient_from,
            gradient_to=prompt.gradient_to,
            max_tokens=prompt.max_tokens,
            estimated_time=prompt.estimated_time,
            is_active=True,
            is_system=False,
            usage_count=0,
            created_by="admin"
        )
        
        db.add(db_prompt)
        db.commit()
        db.refresh(db_prompt)
        
        logger.info(f"Created new prompt: {prompt.key}")
        return db_prompt.to_dict()
        
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Prompt with key '{prompt.key}' already exists")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create prompt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create prompt: {str(e)}")

# EXISTING: Update prompt (unchanged)
@router.put("/{prompt_id}")
async def update_prompt(prompt_id: int, prompt_update: PromptUpdate, db: Session = Depends(get_db)):
    """Update an existing prompt"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.id == prompt_id).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        # Check if it's a system prompt
        if prompt.is_system:
            raise HTTPException(status_code=403, detail="Cannot modify system prompts")
        
        # Update fields
        update_data = prompt_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(prompt, field, value)
        
        prompt.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(prompt)
        
        logger.info(f"Updated prompt: {prompt.key}")
        return prompt.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update prompt: {str(e)}")

# EXISTING: Delete prompt (unchanged)
@router.delete("/{prompt_id}")
async def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """Delete a prompt"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.id == prompt_id).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        # Check if it's a system prompt
        if prompt.is_system:
            raise HTTPException(status_code=403, detail="Cannot delete system prompts")
        
        db.delete(prompt)
        db.commit()
        
        logger.info(f"Deleted prompt: {prompt.key}")
        return {"message": "Prompt deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete prompt: {str(e)}")

# EXISTING: Toggle prompt status (unchanged)
@router.post("/{prompt_key}/toggle")
async def toggle_prompt_status(prompt_key: str, db: Session = Depends(get_db)):
    """Toggle a prompt's active status"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == prompt_key).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        prompt.is_active = not prompt.is_active
        prompt.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(prompt)
        
        status = "activated" if prompt.is_active else "deactivated"
        logger.info(f"Prompt {prompt_key} {status}")
        return {"message": f"Prompt {status} successfully", "is_active": prompt.is_active}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to toggle prompt {prompt_key}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle prompt: {str(e)}")

# EXISTING: Increment usage count (unchanged)
@router.post("/{prompt_key}/increment-usage")
async def increment_usage_count(prompt_key: str, db: Session = Depends(get_db)):
    """Increment the usage count for analytics"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == prompt_key).first()
        if prompt:
            prompt.usage_count += 1
            prompt.updated_at = datetime.utcnow()
            db.commit()
            
        return {"message": "Usage count updated"}
        
    except Exception as e:
        logger.error(f"Failed to increment usage for {prompt_key}: {e}")
        # Don't raise error for analytics - it's not critical
        return {"message": "Usage count update failed", "error": str(e)}
    

@router.get("")  # This handles /api/prompts (without trailing slash)
async def get_all_prompts_no_slash(
    active_only: bool = Query(False, description="Return only active prompts"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: Optional[int] = Query(None, description="Limit number of results"),
    offset: int = Query(0, description="Offset for pagination")
):
    """Get all analysis prompts - No trailing slash version"""
    # Call the existing function to avoid code duplication
    return await get_all_prompts(active_only, category, limit, offset)

# EXISTING: Get usage analytics (unchanged)
@router.get("/analytics/usage")
async def get_usage_analytics(db: Session = Depends(get_db)):
    """Get usage analytics for prompts"""
    try:
        prompts = db.query(AnalysisPrompt).all()
        
        total_prompts = len(prompts)
        active_prompts = sum(1 for p in prompts if p.is_active)
        total_usage = sum(p.usage_count for p in prompts)
        average_usage = total_usage / total_prompts if total_prompts > 0 else 0
        
        # Category breakdown
        categories = {}
        for prompt in prompts:
            if prompt.category not in categories:
                categories[prompt.category] = {"count": 0, "usage": 0}
            categories[prompt.category]["count"] += 1
            categories[prompt.category]["usage"] += prompt.usage_count
        
        # Top prompts
        top_prompts = sorted(prompts, key=lambda p: p.usage_count, reverse=True)[:10]
        
        return {
            "overview": {
                "total_prompts": total_prompts,
                "active_prompts": active_prompts,
                "total_usage": total_usage,
                "average_usage": round(average_usage, 2)
            },
            "categories": categories,
            "top_prompts": [{"key": p.key, "title": p.title, "usage": p.usage_count} for p in top_prompts]
        }


        
    except Exception as e:
        logger.error(f"Failed to get analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")