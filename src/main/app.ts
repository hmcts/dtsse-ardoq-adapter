import * as path from 'path';

import { HTTPError } from './HttpError';
import { AppInsights } from './modules/appinsights';
import { Helmet } from './modules/helmet';
import { Nunjucks } from './modules/nunjucks';
import { PropertiesVolume } from './modules/properties-volume';

import * as bodyParser from 'body-parser';
import config = require('config');
import cookieParser from 'cookie-parser';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import { ValidationError } from 'express-openapi-validator/dist/framework/types';
import { glob } from 'glob';

const { setupDev } = require('./development');

const { Logger } = require('@hmcts/nodejs-logging');

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';

export const app = express();

app.locals.ENV = env;

const logger = Logger.getLogger('app');

new PropertiesVolume().enableFor(app);
new AppInsights().enable();
new Nunjucks(developmentMode).enableFor(app);
// secure the application by adding various HTTP headers to its responses
new Helmet(config.get('security')).enableFor(app);

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
const spec = path.join(__dirname, 'openapi.yaml');
app.use('/api/docs', express.static(spec));
app.use(
  OpenApiValidator.middleware({
    apiSpec: spec,
    validateRequests: true, // (default)
    validateResponses: false, // false by default
  })
);
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
  next();
});

glob
  .sync(__dirname + '/routes/**/*.+(ts|js)')
  .map(filename => require(filename))
  .forEach(route => route.default(app));

setupDev(app, developmentMode);
// returning "not found" page for requests with paths not resolved by the router
app.use((req, res) => {
  res.status(404);
  res.render('not-found');
});

app.use((err: HTTPError | ValidationError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.message);
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
  next();
});
