from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role_id: int = 2  # default coordinator


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role_id: int
    role_name: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
