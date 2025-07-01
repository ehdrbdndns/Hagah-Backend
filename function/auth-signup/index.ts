import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { promisePool, createUniqId } from '/opt/nodejs/customMysql';
import { generateToken } from '/opt/nodejs/customJwt';
import axios from 'axios';

interface SignupRequest {
  provider: 'kakao' | 'apple' | 'guest';
  access_token?: string; // For kakao/apple
  id_token?: string; // For apple
  email?: string;
  name?: string;
}

interface KakaoUserInfo {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

interface AppleIdTokenPayload {
  sub: string; // Apple user ID
  email?: string;
  email_verified?: boolean;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

const createResponse = (statusCode: number, success: boolean, data?: any, message?: string): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'OPTIONS,POST'
    },
    body: JSON.stringify({
      success,
      ...(data && { data }),
      ...(message && { message })
    })
  };
};

const validateProvider = (provider: string): provider is 'kakao' | 'apple' | 'guest' => {
  return ['kakao', 'apple', 'guest'].includes(provider);
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, false, null, 'Request body is required');
    }

    const body = JSON.parse(event.body) as SignupRequest;
    const { provider, access_token, id_token, email, name } = body;

    if (!provider || !validateProvider(provider)) {
      return createResponse(400, false, null, 'Invalid provider. Must be kakao, apple, or guest');
    }

    let userInfo: {
      providerId?: string;
      email?: string;
      name?: string;
      profileImageUrl?: string;
    } = {};

    // Validate and get user info based on provider
    try {
      switch (provider) {
        case 'kakao':
          if (!access_token) {
            return createResponse(400, false, null, 'access_token is required for Kakao signup');
          }
          userInfo = await validateKakaoToken(access_token);
          break;

        case 'apple':
          if (!id_token) {
            return createResponse(400, false, null, 'id_token is required for Apple signup');
          }
          userInfo = await validateAppleToken(id_token);
          break;

        case 'guest':
          userInfo = {
            providerId: createUniqId(),
            email: email,
            name: name || 'Guest User'
          };
          break;
      }
    } catch (error) {
      console.error('Provider validation failed:', error);
      return createResponse(401, false, null, error instanceof Error ? error.message : 'Provider validation failed');
    }

    // Check if user already exists
    const [existingUsers] = await promisePool.execute(
      'SELECT user_id FROM users WHERE provider = ? AND provider_id = ?',
      [provider, userInfo.providerId]
    ) as any[];

    if (existingUsers.length > 0) {
      return createResponse(409, false, null, 'User already exists with this provider');
    }

    // Create new user
    const userId = createUniqId();
    await promisePool.execute(
      'INSERT INTO users (user_id, provider, provider_id, email, name, profile_image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId,
        provider,
        userInfo.providerId,
        userInfo.email,
        userInfo.name,
        userInfo.profileImageUrl
      ]
    );

    // Generate JWT token
    const token = generateToken({ user_id: userId });

    return createResponse(201, true, {
      user_id: userId,
      provider,
      email: userInfo.email,
      name: userInfo.name,
      profile_image_url: userInfo.profileImageUrl,
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    return createResponse(500, false, null, 'Internal server error');
  }
};

async function validateKakaoToken(accessToken: string): Promise<{
  providerId: string;
  email?: string;
  name?: string;
  profileImageUrl?: string;
}> {
  try {
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      timeout: 10000
    });

    const userData: KakaoUserInfo = response.data;
    
    return {
      providerId: userData.id.toString(),
      email: userData.kakao_account?.email,
      name: userData.kakao_account?.profile?.nickname || userData.properties?.nickname,
      profileImageUrl: userData.kakao_account?.profile?.profile_image_url || userData.properties?.profile_image
    };
  } catch (error) {
    console.error('Kakao token validation failed:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Kakao access token');
      }
      throw new Error(`Kakao API error: ${error.response?.status || 'Unknown'}`);
    }
    throw new Error('Kakao token validation failed');
  }
}

async function validateAppleToken(idToken: string): Promise<{
  providerId: string;
  email?: string;
  name?: string;
}> {
  try {
    // Simple JWT decode without verification for now
    // In production, you should verify the signature against Apple's public keys
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid Apple ID token format');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    ) as AppleIdTokenPayload;

    // Basic validation
    if (payload.iss !== 'https://appleid.apple.com') {
      throw new Error('Invalid Apple ID token issuer');
    }

    if (payload.exp * 1000 < Date.now()) {
      throw new Error('Apple ID token expired');
    }

    return {
      providerId: payload.sub,
      email: payload.email
    };
  } catch (error) {
    console.error('Apple token validation failed:', error);
    throw new Error('Invalid Apple ID token');
  }
}