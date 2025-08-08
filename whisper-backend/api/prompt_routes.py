# api/prompt_routes.py - API routes for prompt management

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.models import AnalysisPrompt, AnalysisResult, db_manager

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

# Dependency to get DB session
def get_db():
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
        
        if category:
            query = query.filter(AnalysisPrompt.category == category)
        
        prompts = query.order_by(AnalysisPrompt.usage_count.desc()).all()
        return [prompt.to_dict() for prompt in prompts]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch prompts: {str(e)}")

@router.get("/categories")
async def get_prompt_categories(db: Session = Depends(get_db)):
    """Get all available categories"""
    try:
        categories = db.query(AnalysisPrompt.category).distinct().all()
        return {"categories": [cat[0] for cat in categories if cat[0]]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@router.get("/{prompt_key}", response_model=dict)
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch prompt: {str(e)}")

@router.post("/", response_model=dict)
async def create_prompt(prompt_data: PromptCreate, db: Session = Depends(get_db)):
    """Create a new analysis prompt"""
    try:
        # Check if key already exists
        existing = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == prompt_data.key).first()
        if existing:
            raise HTTPException(status_code=400, detail="Prompt key already exists")
        
        # Validate prompt template has {transcript} placeholder
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
            created_by="admin"  # TODO: Get from auth system
        )
        
        db.add(new_prompt)
        db.commit()
        db.refresh(new_prompt)
        
        return new_prompt.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
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
            prompt_data.prompt_template is not None
        ]):
            raise HTTPException(
                status_code=403, 
                detail="Cannot modify core fields of system prompts"
            )
        
        # Update fields
        update_data = prompt_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(prompt, field, value)
        
        # Validate prompt template if updated
        if prompt_data.prompt_template and "{transcript}" not in prompt_data.prompt_template:
            raise HTTPException(
                status_code=400,
                detail="Prompt template must contain {transcript} placeholder"
            )
        
        prompt.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(prompt)
        
        return prompt.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update prompt: {str(e)}")

@router.delete("/{prompt_id}")
async def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """Delete a prompt (cannot delete system prompts)"""
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
        
        return {"message": "Prompt deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
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
        
        status = "activated" if prompt.is_active else "deactivated"
        return {"message": f"Prompt {status} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to toggle prompt: {str(e)}")

@router.post("/{prompt_key}/increment-usage")
async def increment_usage_count(prompt_key: str, db: Session = Depends(get_db)):
    """Increment usage count for analytics"""
    try:
        prompt = db.query(AnalysisPrompt).filter(AnalysisPrompt.key == prompt_key).first()
        if prompt:
            prompt.usage_count += 1
            db.commit()
        return {"message": "Usage count updated"}
    except Exception as e:
        # Don't fail the request if usage tracking fails
        print(f"Warning: Failed to increment usage count: {e}")
        return {"message": "Usage count update failed"}

@router.get("/analytics/usage")
async def get_usage_analytics(db: Session = Depends(get_db)):
    """Get prompt usage analytics"""
    try:
        prompts = db.query(AnalysisPrompt).order_by(AnalysisPrompt.usage_count.desc()).all()
        
        analytics = {
            "total_prompts": len(prompts),
            "active_prompts": len([p for p in prompts if p.is_active]),
            "most_used": [
                {
                    "key": prompt.key,
                    "title": prompt.title,
                    "usage_count": prompt.usage_count,
                    "category": prompt.category
                }
                for prompt in prompts[:10]  # Top 10
            ],
            "categories": {}
        }
        
        # Group by categories
        for prompt in prompts:
            if prompt.category not in analytics["categories"]:
                analytics["categories"][prompt.category] = {
                    "count": 0,
                    "total_usage": 0
                }
            analytics["categories"][prompt.category]["count"] += 1
            analytics["categories"][prompt.category]["total_usage"] += prompt.usage_count
        
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")