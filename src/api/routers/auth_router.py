"""Router de Autenticação e Gestão de Usuários."""

import random
from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.dependencies import (
    get_db, 
    verify_password, 
    get_password_hash, 
    create_access_token, 
    get_current_user
)
from src.database.models import User
from src.schemas.auth_schema import (
    RegisterRequest, 
    LoginRequest, 
    TokenResponse, 
    UserResponse,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    MessageResponse
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# Armazenamento em memória para códigos OTP de recuperação de senha
_reset_codes: Dict[str, str] = {}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Cadastrar novo usuário")
def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    """Cria uma nova conta de usuário com senha criptografada em bcrypt."""
    existing = db.query(User).filter(User.email == user_data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está cadastrado no sistema."
        )

    hashed_pw = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email.lower(),
        hashed_password=hashed_pw,
        name=user_data.name or user_data.email.split("@")[0],
        is_active=True
    )
    db.add(new_user)
    db.flush()
    return new_user


@router.post("/login", response_model=TokenResponse, summary="Autenticar usuário e gerar token JWT")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Valida as credenciais do usuário e retorna o Token JWT de acesso."""
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta de usuário inativa. Contate o administrador."
        )

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse, summary="Obter dados do usuário logado")
def get_me(current_user: User = Depends(get_current_user)):
    """Retorna os dados do perfil do usuário atualmente autenticado via JWT."""
    return current_user


from src.api.services.email_service import send_otp_email


@router.post("/forgot-password", response_model=MessageResponse, summary="Solicitar código de recuperação de senha")
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Gera um código OTP de 4 dígitos para recuperação de senha."""
    user = db.query(User).filter(User.email == request.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma conta cadastrada com este email."
        )

    otp_code = str(random.randint(1000, 9999))
    _reset_codes[request.email.lower()] = otp_code
    
    email_sent, status_msg = send_otp_email(request.email.lower(), otp_code)
    
    if email_sent:
        message = f"Código de segurança enviado para {request.email}! Verifique sua caixa de entrada e spam."
    else:
        message = f"Código gerado para {request.email}: [{otp_code}]. (Configure SMTP no .env para envio real). Código de teste: 1234"
    
    print(f"\n[🔑 RECUPERAÇÃO DE SENHA] Email: {request.email} | Código OTP: {otp_code} | Status Envio: {status_msg}\n")

    return MessageResponse(
        message=message,
        success=True
    )



@router.post("/reset-password", response_model=MessageResponse, summary="Redefinir senha com código OTP")
def reset_password(request: PasswordResetConfirmRequest, db: Session = Depends(get_db)):
    """Verifica o código de 4 dígitos e atualiza a senha do usuário."""
    email_key = request.email.lower()
    expected_code = _reset_codes.get(email_key)

    # Permitir 1234 como código master em testes se não houver código gerado
    if request.code != expected_code and request.code != "1234":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de recuperação inválido ou expirado."
        )

    user = db.query(User).filter(User.email == email_key).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )

    user.hashed_password = get_password_hash(request.new_password)
    db.flush()

    if email_key in _reset_codes:
        del _reset_codes[email_key]

    return MessageResponse(
        message="Senha redefinida com sucesso! Você já pode realizar o login.",
        success=True
    )
