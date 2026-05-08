import { app } from './app.js';
import { env } from './config/env.js';

if (process.env.VERCEL !== '1') {
  app.listen(env.port, () => {
    console.log(`Deal Ledger API running on http://localhost:${env.port}`);
  });
}

export default app;
