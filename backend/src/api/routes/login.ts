import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { setAuthToken, getAuthToken } from '../middleware/auth-state';

const VALID_EMAIL = 'brendon1798@gmail.com';
const VALID_PASSWORD = 'test123!';

function ensureToken(): string {
  const existing = getAuthToken();
  if (existing) return existing;
  const token = `rivryn_${crypto.randomBytes(24).toString('hex')}`;
  setAuthToken(token);
  return token;
}

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = ensureToken();
  res.json({ token });
});

export { router as loginRoutes };
