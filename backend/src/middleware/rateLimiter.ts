import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface LimiterOptions {
  /** nom du compteur, pour garder les limites séparées */
  name: string;
  windowMs: number;
  max: number;
}

const store = new Map<string, RateLimitEntry>();

const cleanExpiredEntries = (): void => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
};

export const createRateLimiter = ({ name, windowMs, max }: LimiterOptions) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    cleanExpiredEntries();

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${name}:${ip}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    entry.count++;
    if (entry.count > max) {
      throw new AppError(429, 'Too many requests, please try again later');
    }
    next();
  };
};

/** Limite générale : large, car plusieurs membres d'un même groupe partagent souvent la même adresse IP. */
export const rateLimiter = createRateLimiter({
  name: 'general',
  windowMs: config.rate_limit_window * 60 * 1000,
  max: config.rate_limit_max_requests
});

/** Limite stricte sur la connexion et l'inscription, contre les essais de mots de passe. */
export const authRateLimiter = createRateLimiter({
  name: 'auth',
  windowMs: config.rate_limit_window * 60 * 1000,
  max: config.auth_rate_limit_max_requests
});
