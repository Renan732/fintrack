import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não definido no arquivo .env');
  }
  return secret;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}
