import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppDataSource } from './config/db';
import env from './config/env';
import todosRouter from './routes/todos';
import errorHandler from './middleware/errorHandler';
import { setupSwagger } from './config/swagger';

import { setupMetrics } from './config/metrics';
import authRouter from './routes/auth';
import { authenticate } from './middleware/auth';
import type { RequestHandler } from 'express';

async function startServer() {
  try {
    await AppDataSource.initialize();
    const app = express();
   
    // Security & parsing middleware
    app.use(helmet());
    app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
    app.use(cors({ 
      origin: ['http://localhost:5173', 'http://localhost:3000'], 
      credentials: false 
    }));
    app.use(cookieParser());
    app.use(json());
    app.use(urlencoded({ extended: true }));

    // Metrics endpoint
    setupMetrics(app);
    // Auth routes (register, login, refresh, logout)
    app.use('/api/auth', authRouter);
    // Swagger docs
    setupSwagger(app);

    // Protected API routes
    app.use('/api', authenticate, todosRouter);

    // Global error handler
    app.use(errorHandler);

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer(); 