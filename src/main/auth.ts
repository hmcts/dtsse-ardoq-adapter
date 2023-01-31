import config from 'config';
import { NextFunction, Request, Response } from 'express';

const { Logger } = require('@hmcts/nodejs-logging');

export function isAuthorised(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? 'undefined';
  const logger = Logger.getLogger('auth');
  const expected: string = config.get('serverApiKey.primary') ?? 'undefined';
  logger.info('Bearer ends with: ' + header.slice(-9));
  logger.info('Bearer is ' + header.length + ' characters long');
  logger.info('Expected to end with: ' + expected.slice(-9));
  logger.info('Bearer is ' + expected.length + ' characters long');
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
