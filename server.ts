import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import healthHandler from './api/health.ts';
import busTimingsHandler from './api/bustimings.ts';
import busStopsHandler from './api/busstops.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Enable global CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 1. API Endpoints (Mount universal serverless handlers)
app.all(['/api/health', '/api/health/', '/api/health.ts', '/health'], (req, res) => {
  return healthHandler(req, res);
});

app.all(['/api/bustimings', '/api/bustimings/', '/api/bustimings.ts', '/bustimings'], (req, res) => {
  return busTimingsHandler(req, res);
});

app.all(['/api/busstops', '/api/busstops/', '/api/busstops.ts', '/busstops'], (req, res) => {
  return busStopsHandler(req, res);
});

// 2. Frontend integration (Vite dev server or static build)
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SMU Transit Server] Running at http://0.0.0.0:${PORT}`);
  console.log(`[LTA DataMall API] Endpoints ready at /api/bustimings, /api/busstops, /api/health`);
});
