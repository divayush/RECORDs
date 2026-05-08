import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';
import { env } from '../config/env.js';

const safeCompare = (value: string, expected: string) => {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!env.auth.sessionToken || !safeCompare(token, env.auth.sessionToken)) {
    res.status(401).json({ error: 'Please log in again.' });
    return;
  }

  next();
};
