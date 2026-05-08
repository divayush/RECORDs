import serverless from 'serverless-http';
import { app } from '../../backend/dist/app.js';

export const handler = serverless(app, {
  request(request, event) {
    request.url = event.rawUrl
      ? new URL(event.rawUrl).pathname.replace(/^\/\.netlify\/functions\/api/, '/api')
      : request.url.replace(/^\/\.netlify\/functions\/api/, '/api');
  },
});
