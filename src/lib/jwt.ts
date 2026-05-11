import jwt from 'jsonwebtoken';

type JwtPayload = {
  userId: string;
  email: string;
};

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET must be defined in environment variables');
  }
  return secret;
}

export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}
