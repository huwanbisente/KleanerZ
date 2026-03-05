
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from database import get_db
from models.message import Message
from models.user import User
from schemas.message import MessageCreate, MessageOut, ConversationItem
from routers.auth import get_current_user
from typing import List

router = APIRouter(
    prefix="/messages",
    tags=["messages"]
)

@router.post("/", response_model=MessageOut)
def send_message(
    msg: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipient = db.query(User).filter(User.id == msg.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    new_message = Message(
        sender_id=current_user.id,
        recipient_id=msg.recipient_id,
        content=msg.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

@router.get("/{other_user_id}", response_model=List[MessageOut])
def get_conversation(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.recipient_id == current_user.id)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    # Mark received messages as read
    for msg in messages:
        if msg.recipient_id == current_user.id and not msg.is_read:
            msg.is_read = True
    db.commit()
    
    return messages

@router.get("/inbox/conversations", response_model=List[ConversationItem])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # This is a bit complex in raw SQL but let's try a simpler approach for MVP:
    # 1. Get all messages where user is sender or recipient
    # 2. Group by the OTHER user
    
    # Get distinct user IDs communicated with
    sent_ids = db.query(Message.recipient_id).filter(Message.sender_id == current_user.id)
    received_ids = db.query(Message.sender_id).filter(Message.recipient_id == current_user.id)
    
    all_partner_ids = set([x[0] for x in sent_ids] + [x[0] for x in received_ids])
    
    conversations = []
    
    for partner_id in all_partner_ids:
        # Get last message
        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == partner_id),
                and_(Message.sender_id == partner_id, Message.recipient_id == current_user.id)
            )
        ).order_by(Message.timestamp.desc()).first()
        
        unread_count = db.query(Message).filter(
            Message.sender_id == partner_id,
            Message.recipient_id == current_user.id,
            Message.is_read == False
        ).count()
        
        partner = db.query(User).filter(User.id == partner_id).first()
        if partner and last_msg:
            conversations.append(ConversationItem(
                other_user_id=partner.id,
                other_user_name=partner.full_name or partner.email,
                other_user_avatar_url=partner.avatar_url,
                last_message=last_msg.content,
                last_message_time=last_msg.timestamp,
                unread_count=unread_count
            ))
            
    # Sort by recent activity
    conversations.sort(key=lambda x: x.last_message_time, reverse=True)
    return conversations
