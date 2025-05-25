import { collectDefaultMetrics, register } from 'prom-client';
import { Express } from 'express';

export function setupMetrics(app: Express) {
  // Collect default metrics (CPU, memory, etc.)
  collectDefaultMetrics();
  // Expose metrics endpoint
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
} 