-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    provider ENUM('kakao', 'apple', 'guest') NOT NULL,
    provider_id VARCHAR(255) NULL, -- External ID from kakao/apple, null for guest
    email VARCHAR(255) NULL,
    name VARCHAR(255) NULL,
    profile_image_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_provider_user (provider, provider_id),
    INDEX idx_provider_id (provider, provider_id),
    INDEX idx_created_at (created_at)
);