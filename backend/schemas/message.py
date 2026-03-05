
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    recipient_id: int

class MessageOut(MessageBase):
    id: int
    sender_id: int
    recipient_id: int
    timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True

class ConversationItem(BaseModel):
    other_user_id: int
    other_user_name: str
    other_user_avatar_url: Optional[str] = None
    last_message: str
    last_message_time: datetime
    unread_count: int
