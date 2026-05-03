"""
Личные сообщения между пользователями.
GET /?action=dialogs — список диалогов текущего пользователя
GET /?action=chat&user_id=X — история переписки с пользователем X
POST /?action=send — отправить сообщение
POST /?action=read&user_id=X — отметить сообщения прочитанными
"""
import json, os, psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p83891015_photo_sharing_clone")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
    "Content-Type": "application/json",
}

def db(): return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}

def get_user_id(event):
    h = event.get("headers", {})
    token = (h.get("X-Authorization") or h.get("x-authorization") or "").replace("Bearer ", "").strip()
    if not token: return None
    import hashlib, hmac, base64, time
    secret = os.environ.get("JWT_SECRET", "fallback-secret")
    try:
        decoded = base64.b64decode(token.encode()).decode()
        parts = decoded.rsplit(":", 1)
        if len(parts) != 2: return None
        payload, sig = parts
        expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected): return None
        uid_str, exp_str = payload.split(":", 1)
        if int(exp_str) < int(time.time()): return None
        return int(uid_str)
    except Exception: return None

def handler(event: dict, context) -> dict:
    """Личные сообщения: список диалогов, чат, отправка."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "dialogs")
    user_id = get_user_id(event)

    if not user_id:
        return resp(401, {"error": "Не авторизован"})

    conn = db()
    cur = conn.cursor()
    try:
        # GET dialogs — все диалоги
        if method == "GET" and action == "dialogs":
            cur.execute(f"""
                SELECT DISTINCT ON (partner_id)
                    partner_id,
                    partner_username,
                    partner_emoji,
                    partner_display_name,
                    last_text,
                    last_time,
                    unread_count
                FROM (
                    SELECT
                        CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END as partner_id,
                        CASE WHEN m.sender_id = %s THEN ru.username ELSE su.username END as partner_username,
                        CASE WHEN m.sender_id = %s THEN ru.avatar_emoji ELSE su.avatar_emoji END as partner_emoji,
                        CASE WHEN m.sender_id = %s THEN ru.display_name ELSE su.display_name END as partner_display_name,
                        m.text as last_text,
                        m.created_at as last_time,
                        (SELECT COUNT(*) FROM {SCHEMA}.messages sub
                         WHERE sub.sender_id = CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END
                           AND sub.receiver_id = %s AND sub.is_read = false) as unread_count
                    FROM {SCHEMA}.messages m
                    JOIN {SCHEMA}.users su ON su.id = m.sender_id
                    JOIN {SCHEMA}.users ru ON ru.id = m.receiver_id
                    WHERE m.sender_id = %s OR m.receiver_id = %s
                    ORDER BY m.created_at DESC
                ) sub
                ORDER BY partner_id, last_time DESC
            """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id))
            rows = cur.fetchall()
            dialogs = [{"partner_id": r[0], "username": r[1], "avatar_emoji": r[2],
                        "display_name": r[3], "last_text": r[4],
                        "last_time": str(r[5]), "unread_count": r[6]} for r in rows]
            return resp(200, {"dialogs": dialogs})

        # GET chat — история переписки
        if method == "GET" and action == "chat":
            partner_id = int(params.get("user_id", 0))
            cur.execute(f"""
                SELECT m.id, m.sender_id, m.text, m.is_read, m.created_at
                FROM {SCHEMA}.messages m
                WHERE (m.sender_id=%s AND m.receiver_id=%s) OR (m.sender_id=%s AND m.receiver_id=%s)
                ORDER BY m.created_at ASC LIMIT 100
            """, (user_id, partner_id, partner_id, user_id))
            rows = cur.fetchall()
            messages = [{"id": r[0], "sender_id": r[1], "text": r[2],
                         "is_read": r[3], "created_at": str(r[4]),
                         "is_mine": r[1] == user_id} for r in rows]
            # Отмечаем прочитанными
            cur.execute(f"UPDATE {SCHEMA}.messages SET is_read=true WHERE sender_id=%s AND receiver_id=%s AND is_read=false",
                        (partner_id, user_id))
            conn.commit()
            return resp(200, {"messages": messages})

        # POST send
        if method == "POST" and action == "send":
            body = json.loads(event.get("body") or "{}")
            receiver_id = int(body.get("receiver_id", 0))
            text = (body.get("text") or "").strip()
            if not text: return resp(400, {"error": "Пустое сообщение"})
            if not receiver_id: return resp(400, {"error": "Не указан получатель"})
            cur.execute(f"INSERT INTO {SCHEMA}.messages (sender_id, receiver_id, text) VALUES (%s,%s,%s) RETURNING id, created_at",
                        (user_id, receiver_id, text))
            mid, mcat = cur.fetchone()
            conn.commit()
            return resp(201, {"message": {"id": mid, "sender_id": user_id, "receiver_id": receiver_id,
                                          "text": text, "created_at": str(mcat), "is_mine": True, "is_read": False}})

        # GET unread count
        if method == "GET" and action == "unread":
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.messages WHERE receiver_id=%s AND is_read=false", (user_id,))
            count = cur.fetchone()[0]
            return resp(200, {"unread_count": count})

        return resp(404, {"error": "Маршрут не найден"})
    finally:
        cur.close()
        conn.close()
