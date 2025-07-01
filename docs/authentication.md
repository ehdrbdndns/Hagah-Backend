# Hagah Backend - Authentication API

This backend provides user authentication services for the Hagah application with support for three authentication providers: Kakao, Apple, and Guest users.

## API Endpoints

### POST /auth/signup
Creates a new user account with the specified authentication provider.

#### Request Body

**For Kakao signup:**
```json
{
  "provider": "kakao",
  "access_token": "kakao_access_token_here"
}
```

**For Apple signup:**
```json
{
  "provider": "apple", 
  "id_token": "apple_id_token_here"
}
```

**For Guest signup:**
```json
{
  "provider": "guest",
  "email": "optional_email@example.com",
  "name": "Optional Name"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user_id": "unique_user_id",
    "provider": "kakao|apple|guest",
    "email": "user@example.com",
    "name": "User Name",
    "profile_image_url": "https://...",
    "token": "jwt_token_here"
  }
}
```

### POST /auth/login
Authenticates an existing user with the specified provider.

#### Request Body

**For Kakao login:**
```json
{
  "provider": "kakao",
  "access_token": "kakao_access_token_here"
}
```

**For Apple login:**
```json
{
  "provider": "apple",
  "id_token": "apple_id_token_here"
}
```

**For Guest login:**
```json
{
  "provider": "guest",
  "guest_user_id": "existing_guest_user_id"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user_id": "unique_user_id",
    "provider": "kakao|apple|guest",
    "email": "user@example.com", 
    "name": "User Name",
    "profile_image_url": "https://...",
    "token": "jwt_token_here"
  }
}
```

## Database Schema

The application uses a MySQL database with the following table:

```sql
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    provider ENUM('kakao', 'apple', 'guest') NOT NULL,
    provider_id VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    name VARCHAR(255) NULL,
    profile_image_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_provider_user (provider, provider_id),
    INDEX idx_provider_id (provider, provider_id),
    INDEX idx_created_at (created_at)
);
```

## Environment Variables

The following environment variables need to be configured:

### Database
- `DB_HOST`: MySQL database host
- `DB_USER`: MySQL database username
- `DB_PASSWORD`: MySQL database password
- `DB_DATABASE`: MySQL database name

### JWT
- `JWT_SECRET_KEY`: Secret key for JWT token signing

## Authentication Flow

### Kakao Authentication
1. Client obtains access token from Kakao OAuth
2. Client sends access token to /auth/signup or /auth/login
3. Backend validates token with Kakao API
4. Backend creates/retrieves user record
5. Backend returns JWT token

### Apple Authentication
1. Client obtains ID token from Apple Sign In
2. Client sends ID token to /auth/signup or /auth/login
3. Backend validates token structure and expiration
4. Backend creates/retrieves user record
5. Backend returns JWT token

### Guest Authentication
1. For signup: Backend generates unique guest user ID
2. For login: Client provides existing guest user ID
3. Backend creates/retrieves user record
4. Backend returns JWT token

## Security Notes

- Apple ID token validation currently uses basic JWT decoding. In production, implement full signature verification against Apple's public keys.
- JWT tokens expire in 1 hour by default.
- All API responses include proper HTTP status codes and error messages.
- Database prevents duplicate users per provider through unique constraints.