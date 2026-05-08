import { timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';

const safeCompare = (value: string, expected: string) => {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
};

export const authController = {
  login(req: Request, res: Response) {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const isValid =
      env.auth.username.length > 0 &&
      env.auth.password.length > 0 &&
      env.auth.sessionToken.length > 0 &&
      safeCompare(username, env.auth.username) &&
      safeCompare(password, env.auth.password);

    if (!isValid) {
      res.status(401).json({ error: 'Username or password is incorrect.' });
      return;
    }

    res.json({
      data: {
        token: env.auth.sessionToken,
      },
    });
  },
};
