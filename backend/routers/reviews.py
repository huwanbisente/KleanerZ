from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import database
from models import review as models_review
from models import quest as models_quest
from models import user as models_user
from schemas import review as schemas_review
from routers.auth import get_current_user

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"]
)

@router.post("/{quest_id}", response_model=schemas_review.ReviewResponse)
def create_review(
    quest_id: int,
    review: schemas_review.ReviewCreate,
    db: Session = Depends(database.get_db),
    current_user: models_user.User = Depends(get_current_user)
):
    # 1. Fetch Quest
    quest = db.query(models_quest.Quest).filter(models_quest.Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # 2. Check if Quest is Completed
    if quest.status != models_quest.QuestStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Reviews can only be left for completed quests")

    # 3. Determine Reviewer and Reviewee
    if current_user.id == quest.client_id:
        reviewee_id = quest.cleaner_id
    elif current_user.id == quest.cleaner_id:
        reviewee_id = quest.client_id
    else:
        raise HTTPException(status_code=403, detail="You are not a participant in this quest")

    if not reviewee_id:
        raise HTTPException(status_code=400, detail="Cannot review (missing participant)")

    # 4. Check for double review
    existing_review = db.query(models_review.Review).filter(
        models_review.Review.quest_id == quest_id,
        models_review.Review.reviewer_id == current_user.id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this quest")

    # 5. Create Review
    new_review = models_review.Review(
        quest_id=quest_id,
        reviewer_id=current_user.id,
        reviewee_id=reviewee_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    
    # 6. Update User Rating Aggregate
    reviewee = db.query(models_user.User).filter(models_user.User.id == reviewee_id).first()
    if reviewee:
        # We can either recalculate from all reviews or update incrementallly
        # Recalculating is safer for consistency
        # First commit current review to include it in calculation
        db.commit() 
        
        stats = db.query(
            func.avg(models_review.Review.rating).label('average'),
            func.count(models_review.Review.id).label('count')
        ).filter(models_review.Review.reviewee_id == reviewee_id).one()
        
        reviewee.rating = float(stats.average or 0)
        reviewee.reviews_count = stats.count
        db.add(reviewee)
        db.commit()
    else:
        db.commit()

    db.refresh(new_review)
    return new_review

@router.get("/user/{user_id}", response_model=List[schemas_review.ReviewResponse])
def get_user_reviews(
    user_id: int, 
    db: Session = Depends(database.get_db)
):
    reviews = db.query(models_review.Review).filter(
        models_review.Review.reviewee_id == user_id
    ).order_by(models_review.Review.created_at.desc()).all()
    
    # Enrich with reviewer names
    for rev in reviews:
        reviewer = db.query(models_user.User).filter(models_user.User.id == rev.reviewer_id).first()
        if reviewer:
            rev.reviewer_name = reviewer.full_name or "Anonymous"
            
    return reviews
