import config from 'config';
import { NextFunction, Request, Response } from 'express';

const { Logger } = require('@hmcts/nodejs-logging');

export function isAuthorised(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? 'undefined';
  const logger = Logger.getLogger('auth');
  logger.info('Bearer ends with: ' + header.slice(-9));
  if (
    req.headers.authorization === 'Bearer ' + config.get('serverApiKey.primary') ||
    req.headers.authorization === 'Bearer ' + config.get('serverApiKey.secondary')
  ) {
    next();
  } else {
    logger.info('Unauthorised request. Bearer ends with: ' + header.slice(-9));
    res.status(403).json({ error: 'Not Authorized' });
    throw new Error('Not Authorized');
  }
}
