import config from 'config';
import { NextFunction, Request, Response } from 'express';

const { Logger } = require('@hmcts/nodejs-logging');

export function isAuthorised(req: Request, res: Response, next: NextFunction): void {
  if (
    req.headers.authorization === 'Bearer ' + config.get('serverApiKey.primary') ||
    req.headers.authorization === 'Bearer ' + config.get('serverApiKey.secondary')
  ) {
    next();
  } else {
    const logger = Logger.getLogger('app');
    const header = req.headers.authorization ?? 'undefined';
    logger.error('Unauthorised request. Beader ends with: ' + header.slice(-9));
    res.status(403).json({ error: 'Not Authorized' });
    throw new Error('Not Authorized');
  }
}
