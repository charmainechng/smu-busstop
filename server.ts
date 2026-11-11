import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import healthRouter from './api/health.ts';
import busTimingsRouter from './api/bustimings.ts';
import busStopsRouter from './api/busstops.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// 1. API Endpoints
app.use('/api/health', healthRouter);
app.use('/api/bustimings', busTimingsRouter);
app.use('/api/busstops', busStopsRouter);

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
