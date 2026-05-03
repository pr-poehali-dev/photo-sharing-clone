"""
Авторизация пользователей: регистрация, вход, получение профиля.
Методы: POST /register, POST /login, GET /me
"""
import json
import os
import hashlib
import hmac
import base64
import time
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p83891015_photo_sharing_clone")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, X-User-Id, X-Auth-Token",
    "Content-Type": "application/json",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}:{h.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, h_hex = stored.split(":", 1)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return hmac.compare_digest(h.hex(), h_hex)


def create_token(user_id: int) -> str:
    secret = os.environ.get("JWT_SECRET", "fallback-secret")
    payload = f"{user_id}:{int(time.time()) + 86400 * 30}"
    sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    data = base64.b64encode(f"{payload}:{sig}".encode()).decode()
    return data


def verify_token(token: str) -> int | None:
    try:
        secret = os.environ.get("JWT_SECRET", "fallback-secret")
        decoded = base64.b64decode(token.encode()).decode()
        parts = decoded.rsplit(":", 1)
        if len(parts) != 2:
            return None
        payload, sig = parts
        expected_sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        uid_str, exp_str = payload.split(":", 1)
        if int(exp_str) < int(time.time()):
            return None
        return int(uid_str)
    except Exception:
        return None


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(body, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Авторизация: регистрация, вход, профиль текущего пользователя."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    # Роутинг по action или по пути
    def is_action(name: str) -> bool:
        return action == name or path.endswith(f"/{name}")

    # POST /register
    if method == "POST" and is_action("register"):
        body = json.loads(event.get("body") or "{}")
        username = (body.get("username") or "").strip().lower()
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        display_name = (body.get("display_name") or username).strip()

        if not username or not email or not password:
            return resp(400, {"error": "Заполните все поля"})
        if len(username) < 3:
            return resp(400, {"error": "Имя пользователя минимум 3 символа"})
        if len(password) < 6:
            return resp(400, {"error": "Пароль минимум 6 символов"})
        if "@" not in email:
            return resp(400, {"error": "Введите корректный email"})

        pw_hash = hash_password(password)
        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (username, email, password_hash, display_name) VALUES (%s, %s, %s, %s) RETURNING id, username, email, display_name, avatar_emoji, bio, location, photos_count, followers_count, following_count, created_at",
                (username, email, pw_hash, display_name)
            )
            row = cur.fetchone()
            conn.commit()
            user = {
                "id": row[0], "username": row[1], "email": row[2],
                "display_name": row[3], "avatar_emoji": row[4],
                "bio": row[5], "location": row[6],
                "photos_count": row[7], "followers_count": row[8],
                "following_count": row[9],
                "created_at": str(row[10])
            }
            token = create_token(user["id"])
            return resp(201, {"user": user, "token": token})
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return resp(409, {"error": "Пользователь с таким email или именем уже существует"})
        finally:
            cur.close()
            conn.close()

    # POST /login
    if method == "POST" and is_action("login"):
        body = json.loads(event.get("body") or "{}")
        login = (body.get("login") or "").strip().lower()
        password = body.get("password") or ""

        if not login or not password:
            return resp(400, {"error": "Введите логин и пароль"})

        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute(
                f"SELECT id, username, email, password_hash, display_name, avatar_emoji, bio, location, photos_count, followers_count, following_count, created_at FROM {SCHEMA}.users WHERE email = %s OR username = %s",
                (login, login)
            )
            row = cur.fetchone()
            if not row or not verify_password(password, row[3]):
                return resp(401, {"error": "Неверный логин или пароль"})
            user = {
                "id": row[0], "username": row[1], "email": row[2],
                "display_name": row[4], "avatar_emoji": row[5],
                "bio": row[6], "location": row[7],
                "photos_count": row[8], "followers_count": row[9],
                "following_count": row[10],
                "created_at": str(row[11])
            }
            token = create_token(user["id"])
            return resp(200, {"user": user, "token": token})
        finally:
            cur.close()
            conn.close()

    # GET /me
    if method == "GET" and is_action("me"):
        auth_header = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
        token = auth_header.replace("Bearer ", "").strip()
        if not token:
            return resp(401, {"error": "Не авторизован"})

        user_id = verify_token(token)
        if not user_id:
            return resp(401, {"error": "Токен недействителен или истёк"})

        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute(
                f"SELECT id, username, email, display_name, avatar_emoji, bio, location, photos_count, followers_count, following_count, created_at FROM {SCHEMA}.users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Пользователь не найден"})
            user = {
                "id": row[0], "username": row[1], "email": row[2],
                "display_name": row[3], "avatar_emoji": row[4],
                "bio": row[5], "location": row[6],
                "photos_count": row[7], "followers_count": row[8],
                "following_count": row[9],
                "created_at": str(row[10])
            }
            return resp(200, {"user": user})
        finally:
            cur.close()
            conn.close()

    return resp(404, {"error": "Маршрут не найден"})