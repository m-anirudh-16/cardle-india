import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { generateGeminiResponse, type GeminiRequestBody } from './lib/geminiService.ts';
import {
  resolveCarImageRequest,
  resolvePuzzleRequest,
  type OnlinePuzzlePayload,
} from './lib/puzzleService.ts';

export type { OnlinePuzzlePayload };

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.all('/api/gemini', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as GeminiRequestBody;
    const result = await generateGeminiResponse(body);
    res.status(result.status).json(result.body);
  });

  app.get('/api/car-image', async (req, res) => {
    const result = await resolveCarImageRequest({
      id: String(req.query.id || ''),
      src: String(req.query.src || ''),
    });

    if (!result.buffer || !result.mime) {
      res.status(result.status).send(result.error || 'Image expired or not found');
      return;
    }

    res.setHeader('Content-Type', result.mime);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(result.buffer);
  });

  app.get('/api/puzzle', async (req, res) => {
    const result = await resolvePuzzleRequest({
      mode: req.query.mode === 'daily' ? 'daily' : 'practice',
      era: String(req.query.era || 'All'),
      date: String(req.query.date || new Date().toISOString().slice(0, 10)),
      exclude: String(req.query.exclude || ''),
    });

    res.status(result.status).json(result.body);
  });

  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distDir, 'index.html'));

  if (isProd) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cardle India server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
