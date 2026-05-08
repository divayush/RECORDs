import dotenv from 'dotenv';

dotenv.config();

const parsePort = (value: string | undefined) => {
  const port = Number(value ?? 4000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer.');
  }

  return port;
};

export const env = {
  port: parsePort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendOrigins: (process.env.FRONTEND_ORIGIN ?? 'http://127.0.0.1:5173,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  auth: {
    username: process.env.AUTH_USERNAME ?? '',
    password: process.env.AUTH_PASSWORD ?? '',
    sessionToken: process.env.AUTH_SESSION_TOKEN ?? '',
  },
};
