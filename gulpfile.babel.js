// import '@babel/polyfill';

import gulp from 'gulp';
// import gutil from 'gulp-util';
import repl from 'repl';
import container from './container';
import getServer from '.';
import db from './models';


gulp.task('default', () => {
  class Tork {
    constructor(bom) {
      this.message = `From class ${bom}`;
      this.mar = new Map();
    }

    toString() {
      return this.message;
    }
  }
  const tork = new Tork('babel');
  console.log(`${tork}`);
});

gulp.task('console', () => {
  // gutil.log = gutil.noop;

  const replServer = repl.start({
    prompt: 'Application console > ',
  });

  Object.keys(container).forEach((key) => {
    replServer.context[key] = container[key];
  });
  replServer.context.server = getServer();
  replServer.context.db = db;
});

gulp.task('server', (cb) => {
  getServer().listen(process.env.PORT || 3000, cb);
});
