import { Request, Response, NextFunction } from 'express';
import { getAuthToken } from './auth-state';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const validToken = getAuthToken();
  if (!validToken) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    res.status(401).json({ error: 'Authorization header must be: Bearer <token>' });
    return;
  }

  if (token !== validToken) {
    res.status(403).json({ error: 'Invalid auth token' });
    return;
  }

  next();
}
