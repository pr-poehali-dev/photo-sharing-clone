
CREATE TABLE t_p83891015_photo_sharing_clone.posts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES t_p83891015_photo_sharing_clone.users(id),
    image_url TEXT NOT NULL,
    caption TEXT,
    tags TEXT[] DEFAULT '{}',
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_posts_user_id ON t_p83891015_photo_sharing_clone.posts(user_id);
CREATE INDEX idx_posts_created_at ON t_p83891015_photo_sharing_clone.posts(created_at DESC);

CREATE TABLE t_p83891015_photo_sharing_clone.likes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES t_p83891015_photo_sharing_clone.users(id),
    post_id INT NOT NULL REFERENCES t_p83891015_photo_sharing_clone.posts(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);
CREATE INDEX idx_likes_post_id ON t_p83891015_photo_sharing_clone.likes(post_id);

CREATE TABLE t_p83891015_photo_sharing_clone.comments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES t_p83891015_photo_sharing_clone.users(id),
    post_id INT NOT NULL REFERENCES t_p83891015_photo_sharing_clone.posts(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_comments_post_id ON t_p83891015_photo_sharing_clone.comments(post_id);

CREATE TABLE t_p83891015_photo_sharing_clone.messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES t_p83891015_photo_sharing_clone.users(id),
    receiver_id INT NOT NULL REFERENCES t_p83891015_photo_sharing_clone.users(id),
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_messages_pair ON t_p83891015_photo_sharing_clone.messages(sender_id, receiver_id);
CREATE INDEX idx_messages_created_at ON t_p83891015_photo_sharing_clone.messages(created_at DESC);

CREATE TABLE t_p83891015_photo_sharing_clone.follows (
    id SERIAL PRIMARY KEY,
    follower_id INT NOT NULL REFERENCES t_p83891015_photo_sharing_clone.users(id),
    following_id INT NOT NULL REFERENCES t_p83891015_photo_sharing_clone.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);
