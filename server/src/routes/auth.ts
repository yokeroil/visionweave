import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { Errors } from '../lib/errors';
import { logger } from '../lib/logger';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  locale: z.string().default('en'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signTokens(userId: string, tier: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts = (exp: string) => ({ expiresIn: exp } as any);
  const accessToken = jwt.sign({ userId, tier }, process.env.JWT_SECRET!, opts(process.env.JWT_EXPIRES_IN ?? '15m'));
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, opts(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'));
  return { accessToken, refreshToken };
}

router.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const { email, password, name, locale } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(Errors.conflict('Email already registered'));

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, locale },
    });

    const tokens = signTokens(user.id, user.tier);
    logger.info({ userId: user.id }, 'User registered');

    res.status(201).json({ user: { id: user.id, email, name, locale, tier: user.tier }, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(Errors.unauthorized());

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return next(Errors.unauthorized());

    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    const tokens = signTokens(user.id, user.tier);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, locale: user.locale, tier: user.tier },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(Errors.unauthorized());

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return next(Errors.unauthorized());

    const tokens = signTokens(user.id, user.tier);
    res.json(tokens);
  } catch {
    next(Errors.unauthorized());
  }
});

export default router;
