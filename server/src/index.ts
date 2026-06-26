import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? '3001';

// Parse allowed origins from environment variable (comma-separated)
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server, curl)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin '${origin}' is not allowed by CORS policy`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'leetcode-ai-sync-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
app.use('/auth', authRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err.message);
  const statusCode = (err as NodeJS.ErrnoException).code === 'ERR_CORS' ? 403 : 500;
  res.status(statusCode).json({ error: err.message ?? 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n\u{1F680} LeetCode AI Sync server running at http://localhost:${PORT}`);
  console.log(`   Allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '(none - set ALLOWED_ORIGINS)'}`);
  console.log(`   Health check:    http://localhost:${PORT}/\n`);
});

export default app;
