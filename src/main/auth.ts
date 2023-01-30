import config from 'config';
import { NextFunction, Request, Response } from 'express';

export function isAuthorised(req: Request, res: Response, next: NextFunction): void {
  if (
    req.headers.authorization === 'Bearer ' + config.get('serverApiKey.primary') ||
    req.headers.authorization === 'Bearer ' + config.get('serverApiKey.secondary')
  ) {
    next();
  } else {
    res.status(403).json({ error: 'Not Authorized' });
    throw new Error('Not Authorized');
  }
}
