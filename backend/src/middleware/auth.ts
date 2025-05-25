import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { AppDataSource } from '../config/db';
import { User } from '../entities/User.entity';
import type { RequestHandler } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    console.log('🔐 Authentication middleware triggered');
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid Authorization header found');
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 Token extracted from header, length:', token.length);
    
    const payload = jwt.verify(token, env.jwtSecret) as { sub: string };
    console.log('✅ Token verified for user ID:', payload.sub);
    
    const user = await AppDataSource.getRepository(User).findOneBy({ id: payload.sub });
    if (!user) {
      console.log('❌ User not found for ID:', payload.sub);
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Authentication error:', err);
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
}; 