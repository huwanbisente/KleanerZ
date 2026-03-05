
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserResponse
from routers.auth import get_current_user
from typing import List, Optional

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/search", response_model=List[UserResponse])
def search_users(
    query: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search for users by name or email.
    If role is specified, filter by that role.
    """
    q = db.query(User)
    
    if role:
        q = q.filter(User.role == role)
        
    if query:
        search = f"%{query}%"
        q = q.filter((User.full_name.ilike(search)) | (User.email.ilike(search)))
    
    # Exclude self
    q = q.filter(User.id != current_user.id)
        
    return q.limit(20).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
