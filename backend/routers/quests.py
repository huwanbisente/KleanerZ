from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import database
from models import quest as models_quest
from models import user as models_user
from models import quest_application as models_app
from schemas import quest as schemas_quest
from core.auth import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(
    prefix="/quests",
    tags=["quests"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models_user.User).filter(models_user.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/", response_model=schemas_quest.QuestResponse)
async def create_quest(
    quest: schemas_quest.QuestCreate, 
    db: Session = Depends(database.get_db),
    current_user: models_user.User = Depends(get_current_user)
):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can post quests")

    db_quest = models_quest.Quest(
        **quest.dict(),
        client_id=current_user.id
    )
    db.add(db_quest)
    db.commit()
    db.refresh(db_quest)
    
    # Broadcast to WebSocket
    from core.websocket import manager
    await manager.broadcast_quest_update({
        "type": "NEW_QUEST",
        "quest": {
            "id": db_quest.id,
            "title": db_quest.title,
            "price": db_quest.price,
            "address_masked": db_quest.address_masked,
            "description": db_quest.description
        }
    })
    return db_quest

@router.get("/all", response_model=List[schemas_quest.QuestResponse])
def get_all_quests(db: Session = Depends(database.get_db)):
    """Returns ALL quests regardless of status (Admin/Debug)"""
    return db.query(models_quest.Quest).all()

@router.get("/", response_model=List[schemas_quest.QuestResponse])
def get_quests(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Returns only PENDING quests (Available for everyone to see/claim)"""
    return db.query(models_quest.Quest).filter(
        models_quest.Quest.status == models_quest.QuestStatus.PENDING
    ).offset(skip).limit(limit).all()

@router.get("/my-missions", response_model=List[schemas_quest.QuestDetailedResponse])
def get_my_missions(
    db: Session = Depends(database.get_db),
    current_user: models_user.User = Depends(get_current_user)
):
    """Returns quests where the user is involved (Cleaner or Client)"""
    if current_user.role == "cleaner":
        return db.query(models_quest.Quest).filter(
            (models_quest.Quest.cleaner_id == current_user.id) | 
            (models_quest.Quest.applications.any(models_app.QuestApplication.cleaner_id == current_user.id))
        ).all()
    return db.query(models_quest.Quest).filter(models_quest.Quest.client_id == current_user.id).all()

@router.put("/{quest_id}/claim", response_model=schemas_quest.QuestDetailedResponse)
def claim_quest(
    quest_id: int,
    db: Session = Depends(database.get_db),
    current_user: models_user.User = Depends(get_current_user)
):
    if current_user.role != "cleaner":
        raise HTTPException(status_code=403, detail="Only cleaners can claim quests")
        
    quest = db.query(models_quest.Quest).filter(models_quest.Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
        
    if quest.status != models_quest.QuestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Quest already claimed or unavailable")
        
    quest.status = models_quest.QuestStatus.CLAIMED
    quest.cleaner_id = current_user.id
    db.commit()
    db.refresh(quest)
    return quest

@router.put("/{quest_id}/complete", response_model=schemas_quest.QuestDetailedResponse)
def complete_quest(
    quest_id: int,
    completion_data: schemas_quest.QuestComplete,
    db: Session = Depends(database.get_db),
    current_user: models_user.User = Depends(get_current_user)
):
    quest = db.query(models_quest.Quest).filter(models_quest.Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
        
    # Verify ownership
    if quest.cleaner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to complete this quest")

    if quest.status != models_quest.QuestStatus.CLAIMED:
        raise HTTPException(status_code=400, detail="Quest must be CLAIMED to be completed")

    quest.status = models_quest.QuestStatus.PENDING_APPROVAL
    quest.photos_before = completion_data.photos_before
    quest.photos_after = completion_data.photos_after
    
    # Status will change to COMPLETED when client approves
    
    db.commit()
    db.refresh(quest)
    return quest

@router.put("/{quest_id}/approve", response_model=schemas_quest.QuestDetailedResponse)
def approve_quest(
    quest_id: int,
    db: Session = Depends(database.get_db),
    current_user: models_user.User = Depends(get_current_user)
):
    """Client approves a completed job"""
    quest = db.query(models_quest.Quest).filter(models_quest.Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
        
    print(f"Approve Attempt: Quest ID {quest_id} by User {current_user.id} ({current_user.email})")
    
    # Verify the current user is the client who posted this job
    if quest.client_id != current_user.id:
        print(f"FORBIDDEN: Quest Client ID is {quest.client_id}, but current user ID is {current_user.id}")
        raise HTTPException(status_code=403, detail="Only the job owner can approve completion")

    if quest.status != models_quest.QuestStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail="Quest must be PENDING_APPROVAL to be approved")

    quest.status = models_quest.QuestStatus.COMPLETED
    
    # In a real app, we would trigger payment/escrow release here
    
    db.commit()
    db.refresh(quest)
    return quest

@router.post("/{quest_id}/apply")
def apply_to_quest(
    quest_id: int,
    db: Session = Depends(database.get_db),
    current_user: models_user.User = Depends(get_current_user)
):
    if current_user.role != "cleaner":
        raise HTTPException(status_code=403, detail="Only cleaners can apply for quests")
    
    # Check if quest exists and is pending
    quest = db.query(models_quest.Quest).filter(models_quest.Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.status != models_quest.QuestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Quest is no longer open for applications")

    # Check if already applied
    existing = db.query(models_app.QuestApplication).filter_by(quest_id=quest_id, cleaner_id=current_user.id).first()
    if existing:
        return {"message": "Already applied"}

    new_app = models_app.QuestApplication(quest_id=quest_id, cleaner_id=current_user.id)
    db.add(new_app)
    db.commit()
    return {"message": "Application submitted successfully"}

@router.post("/{quest_id}/select/{cleaner_id}")
def select_cleaner(
    quest_id: int,
    cleaner_id: int,
    db: Session = Depends(database.get_db),
    current_user: models_user.User = Depends(get_current_user)
):
    quest = db.query(models_quest.Quest).filter(models_quest.Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the quest owner can select a cleaner")
        
    if quest.status != models_quest.QuestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Quest is not in PENDING state")

    # Verify if cleaner applied
    application = db.query(models_app.QuestApplication).filter_by(quest_id=quest_id, cleaner_id=cleaner_id).first()
    if not application:
        raise HTTPException(status_code=400, detail="This cleaner has not applied for this quest")

    # Select cleaner and update status
    quest.cleaner_id = cleaner_id
    quest.status = models_quest.QuestStatus.CLAIMED 
    
    # Mark application as accepted, maybe reject others?
    application.status = "accepted"
    
    db.commit()
    db.refresh(quest)
    return quest

@router.get("/{quest_id}/applicants", response_model=List[schemas_quest.QuestApplicationOut])
def get_applicants(
    quest_id: int,
    db: Session = Depends(database.get_db),
    current_user: models_user.User = Depends(get_current_user)
):
    quest = db.query(models_quest.Quest).filter(models_quest.Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the quest owner can view applicants")
        
    return quest.applications
