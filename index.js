import path from 'path';
import Koa from 'koa';
import Pug from 'koa-pug';
import Router from 'koa-router';
import koaLogger from 'koa-logger';
import serve from 'koa-static';
import mount from 'koa-mount';
import koaWebpack from 'koa-webpack';
import bodyParser from 'koa-bodyparser';
import session from 'koa-session';
import flash from 'koa-flash-simple';
import _ from 'lodash';
import methodOverride from 'koa-methodoverride';
import Rollbar from 'rollbar';


import webpackConfig from './webpack.config';
import addRoutes from './routes';
import container from './container';
import { User } from './models';

const { log } = container;

export default () => {
  log('starting server');
  const productionMode = process.env.NODE_ENV === 'production';
  const devMode = process.env.NODE_ENV === 'development';

  const app = new Koa();

  const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  app.use(async (ctx, next) => {
    try {
      await next();
      if (ctx.status === 404) {
        ctx.throw(404);
      }
    } catch (err) {
      ctx.status = err.status || 500;
      const message = ctx.status === 404 ? 'The page you are looking for was not found.' : err.message;
      ctx.app.emit('error', err, ctx);
      if (productionMode) {
        await ctx.render('errors/error', { status: ctx.status, message });
      } else {
        ctx.body = err.message;
      }
    }
  });

  app.on('error', (err, ctx) => {
    if (productionMode) {
      rollbar.error(err, ctx.request);
    }
    log('Error %s', err.message);
  });

  app.use(mount('/assets', serve(path.join(__dirname, 'dist'))));

  app.keys = ['some secret hurr'];
  app.use(session(app));
  app.use(flash());
  app.use(async (ctx, next) => {
    ctx.state.flash = ctx.flash;
    ctx.state.path = ctx.path;
    log('Path is %s', ctx.path);
    ctx.state.isSignedIn = !!ctx.session.userId || false;
    if (ctx.state.isSignedIn) {
      ctx.state.signedUser = await User.findById(ctx.session.userId);
      log('User is signed');
    } else {
      log('User is\'t signed');
    }
    await next();
    if (ctx.status === 302 && ctx.method === 'GET') {
      const msg = ctx.state.flash.get();
      ctx.flash.set(msg);
      log('Message was stored for redirected request. Message is %s', msg);
    }
  });
  app.use(bodyParser());
  app.use(methodOverride((req) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      return req.body._method; // eslint-disable-line
    }
    return null;
  }));

  if (devMode) {
    app.use(koaLogger());
    koaWebpack({
      config: webpackConfig,
      devMiddleware: {
        logLevel: 'warn',
      },
      hotClient: false,
    }).then((middleware) => {
      app.use(middleware);
    });
  }

  const router = new Router();
  addRoutes(router, container);
  app.use(router.allowedMethods());
  app.use(router.routes());

  const pug = new Pug({
    viewPath: path.join(__dirname, 'views'),
    noCache: devMode,
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: [],
    basedir: path.join(__dirname, 'views'),
    helperPath: [
      { _ },
      { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);
  log('Server is ready');
  return app;
};
