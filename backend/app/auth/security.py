
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.config import settings

password_hash = PasswordHash.recommended()

ALGORITHM = "HS256"


def _prepare_password(password: str) -> str:
    """Combine the password with the server-side pepper."""
    return hmac.new(
        settings.PASSWORD_PEPPER.encode("utf-8"),
        password.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def hash_password(password: str) -> str:
    """Create an Argon2 password hash."""
    return password_hash.hash(_prepare_password(password))


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against its stored Argon2 hash."""
    return password_hash.verify(
        _prepare_password(password),
        stored_hash,
    )


def create_access_token(user_id: int, role: str) -> str:
    """Create a signed JWT access token."""
    now = datetime.now(timezone.utc)

    expires_at = now + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """Verify the JWT signature and expiration."""
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[ALGORITHM],
    )


def create_refresh_token() -> str:
    """Generate a cryptographically secure random refresh token."""
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    """Return the SHA-256 hash of a refresh token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_refresh_token(token: str, stored_hash: str) -> bool:
    """Compare a refresh token with its stored hash securely."""
    return hmac.compare_digest(
        hash_refresh_token(token),
        stored_hash,
    )
