"""
Загрузка медиа-файлов (фото и видео) в S3 и создание поста.
POST /?action=upload_photo — загрузить фото и создать пост
POST /?action=upload_video — загрузить видео и создать пост
Тело запроса: base64-encoded файл + метаданные
"""
import json, os, base64, uuid, time
import boto3
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p83891015_photo_sharing_clone")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
    "Content-Type": "application/json",
}

def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

def cdn_url(key: str) -> str:
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"

def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}

def get_user_id(event):
    h = event.get("headers", {})
    token = (h.get("X-Authorization") or h.get("x-authorization") or "").replace("Bearer ", "").strip()
    if not token:
        return None
    import hashlib, hmac as _hmac
    secret = os.environ.get("JWT_SECRET", "fallback-secret")
    try:
        decoded = base64.b64decode(token.encode()).decode()
        parts = decoded.rsplit(":", 1)
        if len(parts) != 2:
            return None
        payload, sig = parts
        expected = _hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not _hmac.compare_digest(sig, expected):
            return None
        uid_str, exp_str = payload.split(":", 1)
        if int(exp_str) < int(time.time()):
            return None
        return int(uid_str)
    except Exception:
        return None

def handler(event: dict, context) -> dict:
    """Загрузка фото и видео в S3, создание поста."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    user_id = get_user_id(event)

    if not user_id:
        return resp(401, {"error": "Не авторизован"})

    if method != "POST":
        return resp(405, {"error": "Только POST"})

    body_raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        body_raw = base64.b64decode(body_raw).decode("utf-8")
    body = json.loads(body_raw)

    caption = (body.get("caption") or "").strip()
    tags_raw = (body.get("tags") or "").strip()
    tags = [t.strip() for t in tags_raw.replace(",", " ").split() if t.strip().startswith("#")] if tags_raw else []

    s3 = s3_client()
    conn = db()
    cur = conn.cursor()

    try:
        # ——— ФОТО ———
        if action == "upload_photo":
            file_data = body.get("file_data", "")
            mime = body.get("mime_type", "image/jpeg")
            if not file_data:
                return resp(400, {"error": "Нет данных файла"})

            raw = base64.b64decode(file_data)
            if len(raw) > 20 * 1024 * 1024:
                return resp(400, {"error": "Файл слишком большой (макс 20 МБ)"})

            ext = "jpg" if "jpeg" in mime else mime.split("/")[-1]
            key = f"posts/{uuid.uuid4().hex}.{ext}"
            s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime)
            image_url = cdn_url(key)

            cur.execute(
                f"""INSERT INTO {SCHEMA}.posts (user_id, image_url, caption, tags, media_type)
                    VALUES (%s, %s, %s, %s, 'photo') RETURNING id, created_at""",
                (user_id, image_url, caption, tags)
            )
            pid, pcat = cur.fetchone()
            cur.execute(f"UPDATE {SCHEMA}.users SET photos_count = photos_count+1 WHERE id=%s", (user_id,))
            conn.commit()

            return resp(201, {
                "post": {"id": pid, "image_url": image_url, "media_type": "photo",
                         "caption": caption, "tags": tags, "created_at": str(pcat)}
            })

        # ——— ВИДЕО ———
        if action == "upload_video":
            video_data = body.get("file_data", "")
            mime = body.get("mime_type", "video/mp4")
            thumbnail_data = body.get("thumbnail_data", "")

            if not video_data:
                return resp(400, {"error": "Нет данных видео"})

            raw_video = base64.b64decode(video_data)
            if len(raw_video) > 100 * 1024 * 1024:
                return resp(400, {"error": "Видео слишком большое (макс 100 МБ)"})

            ext = mime.split("/")[-1] if "/" in mime else "mp4"
            vid_key = f"videos/{uuid.uuid4().hex}.{ext}"
            s3.put_object(Bucket="files", Key=vid_key, Body=raw_video, ContentType=mime)
            video_url = cdn_url(vid_key)

            # Миниатюра (обложка)
            thumbnail_url = None
            if thumbnail_data:
                raw_thumb = base64.b64decode(thumbnail_data)
                thumb_key = f"thumbnails/{uuid.uuid4().hex}.jpg"
                s3.put_object(Bucket="files", Key=thumb_key, Body=raw_thumb, ContentType="image/jpeg")
                thumbnail_url = cdn_url(thumb_key)

            cur.execute(
                f"""INSERT INTO {SCHEMA}.posts (user_id, image_url, video_url, thumbnail_url, caption, tags, media_type)
                    VALUES (%s, %s, %s, %s, %s, %s, 'video') RETURNING id, created_at""",
                (user_id, thumbnail_url or "", video_url, thumbnail_url, caption, tags)
            )
            pid, pcat = cur.fetchone()
            cur.execute(f"UPDATE {SCHEMA}.users SET photos_count = photos_count+1 WHERE id=%s", (user_id,))
            conn.commit()

            return resp(201, {
                "post": {"id": pid, "video_url": video_url, "thumbnail_url": thumbnail_url,
                         "media_type": "video", "caption": caption, "tags": tags, "created_at": str(pcat)}
            })

        return resp(400, {"error": "Неизвестное действие"})

    finally:
        cur.close()
        conn.close()
