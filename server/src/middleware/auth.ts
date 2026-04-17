import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Errors } from '../lib/errors';

export interface AuthRequest extends Request {
  userId?: string;
  userTier?: string;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(Errors.unauthorized());

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      tier: string;
    };
    req.userId = payload.userId;
    req.userTier = payload.tier;
    next();
  } catch {
    next(Errors.unauthorized());
  }
}

export function requirePro(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.userTier !== 'PRO' && req.userTier !== 'STUDIO') {
    return next(Errors.forbidden());
  }
  next();
}
