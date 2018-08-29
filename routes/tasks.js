import { reqAuth } from './commonMiddlewares';

export default (router) => {
  router.get('tasks', '/tasks', reqAuth(), (ctx) => {
    ctx.render('tasks/index');
  });
};
