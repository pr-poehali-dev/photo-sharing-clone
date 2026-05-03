
CREATE TABLE t_p83891015_photo_sharing_clone.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_emoji VARCHAR(10) DEFAULT '🧑‍🎨',
    location VARCHAR(100),
    website VARCHAR(255),
    is_private BOOLEAN DEFAULT FALSE,
    photos_count INT DEFAULT 0,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON t_p83891015_photo_sharing_clone.users(email);
CREATE INDEX idx_users_username ON t_p83891015_photo_sharing_clone.users(username);
