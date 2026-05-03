
ALTER TABLE t_p83891015_photo_sharing_clone.posts
  ADD COLUMN media_type VARCHAR(10) DEFAULT 'photo',
  ADD COLUMN video_url TEXT,
  ADD COLUMN thumbnail_url TEXT,
  ADD COLUMN duration_sec INT;

CREATE INDEX idx_posts_media_type ON t_p83891015_photo_sharing_clone.posts(media_type);
