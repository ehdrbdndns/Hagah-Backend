import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { promisePool } from '/opt/nodejs/customMysql';
import { generateToken } from '/opt/nodejs/customJwt';
import axios from 'axios';

interface LoginRequest {
  provider: 'kakao' | 'apple' | 'guest';
  access_token?: string; // For kakao/apple
  id_token?: string; // For apple
  guest_user_id?: string; // For guest login
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

    const body = JSON.parse(event.body) as LoginRequest;
    const { provider, access_token, id_token, guest_user_id } = body;

    if (!provider || !validateProvider(provider)) {
      return createResponse(400, false, null, 'Invalid provider. Must be kakao, apple, or guest');
    }

    let providerId: string;

    // Get provider ID based on provider type
    try {
      switch (provider) {
        case 'kakao':
          if (!access_token) {
            return createResponse(400, false, null, 'access_token is required for Kakao login');
          }
          providerId = await validateKakaoTokenAndGetId(access_token);
          break;

        case 'apple':
          if (!id_token) {
            return createResponse(400, false, null, 'id_token is required for Apple login');
          }
          providerId = await validateAppleTokenAndGetId(id_token);
          break;

        case 'guest':
          if (!guest_user_id) {
            return createResponse(400, false, null, 'guest_user_id is required for guest login');
          }
          providerId = guest_user_id;
          break;

        default:
          throw new Error('Invalid provider');
      }
    } catch (error) {
      console.error('Provider validation failed:', error);
      return createResponse(401, false, null, error instanceof Error ? error.message : 'Provider validation failed');
    }

    // Find user in database
    const [users] = await promisePool.execute(
      'SELECT user_id, provider, email, name, profile_image_url, created_at FROM users WHERE provider = ? AND provider_id = ?',
      [provider, providerId]
    ) as any[];

    if (users.length === 0) {
      return createResponse(404, false, null, 'User not found. Please sign up first.');
    }

    const user = users[0];

    // Generate JWT token
    const token = generateToken({ user_id: user.user_id });

    return createResponse(200, true, {
      user_id: user.user_id,
      provider: user.provider,
      email: user.email,
      name: user.name,
      profile_image_url: user.profile_image_url,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return createResponse(500, false, null, 'Internal server error');
  }
};

async function validateKakaoTokenAndGetId(accessToken: string): Promise<string> {
  try {
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      timeout: 10000
    });

    const userData: KakaoUserInfo = response.data;
    return userData.id.toString();
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

async function validateAppleTokenAndGetId(idToken: string): Promise<string> {
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

    return payload.sub;
  } catch (error) {
    console.error('Apple token validation failed:', error);
    throw new Error('Invalid Apple ID token');
  }
}