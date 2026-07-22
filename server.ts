import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Config validation helper endpoint
  app.post('/api/validate-config', (req, res) => {
    const { appName, region, memoryMb, volumeSizeGb, gatewayPort, omniroutePort, redisPort, gatewayToken } = req.body;
    const issues: { type: 'warning' | 'error' | 'info'; message: string }[] = [];

    if (!appName || appName.trim() === '') {
      issues.push({ type: 'error', message: 'Fly.io App Name is required.' });
    } else if (!/^[a-z0-9-]+$/.test(appName)) {
      issues.push({ type: 'error', message: 'App Name must contain only lowercase letters, numbers, and hyphens.' });
    }

    if (!region || region.trim() === '') {
      issues.push({ type: 'warning', message: 'Region is unset. Defaulting to "iad" (Ashburn, VA).' });
    }

    if (memoryMb < 512) {
      issues.push({ type: 'warning', message: '512MB RAM may cause Node.js OOM crashes when running both OmniRoute & OpenClaw. 1024MB or higher is recommended.' });
    } else if (memoryMb >= 1024) {
      issues.push({ type: 'info', message: `${memoryMb}MB RAM allocated — sufficient for Node.js runtimes + Redis.` });
    }

    if (volumeSizeGb < 1) {
      issues.push({ type: 'error', message: 'Volume size must be at least 1 GB.' });
    }

    if (gatewayPort === omniroutePort || gatewayPort === redisPort || omniroutePort === redisPort) {
      issues.push({ type: 'error', message: 'Port collision detected! OpenClaw Gateway, OmniRoute, and Redis must use distinct ports.' });
    }

    if (!gatewayToken || gatewayToken.trim().length < 12) {
      issues.push({ type: 'warning', message: 'OPENCLAW_GATEWAY_TOKEN should be at least 12 characters for secure access.' });
    }

    res.json({
      valid: issues.filter(i => i.type === 'error').length === 0,
      issues,
    });
  });

  // Gemini AI Assistant endpoint
  app.post('/api/gemini/advisor', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
      }

      const { prompt, configContext } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are a DevOps & AI Systems Architecture expert specializing in Fly.io multi-process deployments, Docker multi-stage builds, supervisord, OmniRoute (local AI gateway), OpenClaw (autonomous AI agent framework), and Redis caching.
Give clear, direct, actionable technical advice. Focus on performance, memory optimization, networking between local ports (18789, 20128, 6379), environment variables, and Fly.io volume persistence.`;

      const contents = `System Context: User is setting up OmniRoute + OpenClaw combined Fly.io deployment stack.
User Configuration:
- App Name: ${configContext?.appName || 'claw-omni-stack'}
- Region: ${configContext?.region || 'iad'}
- Memory: ${configContext?.memoryMb || 1024} MB
- Volume Size: ${configContext?.volumeSizeGb || 2} GB
- OpenClaw Port: ${configContext?.gatewayPort || 18789}
- OmniRoute Port: ${configContext?.omniroutePort || 20128}

User Question: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.status(500).json({ error: err.message || 'Failed to query Gemini AI Advisor.' });
    }
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
