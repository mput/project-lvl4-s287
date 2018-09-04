import { reqAuth } from './commonMiddlewares';
import buildFormObj from '../lib/formObjectBuilder';

export default (router) => {
  router.get('tasks', '/tasks', reqAuth(), (ctx) => {
    const filter = {};
    ctx.render('tasks/index', { f: buildFormObj(filter) });
  });
};
