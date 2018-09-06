import { reqAuth } from './commonMiddlewares';
import buildFormObj from '../lib/formObjectBuilder';
import { Task, User, Status } from '../models';

export default (router, container) => {
  const { log } = container; // eslint-disable-line
  router
    .use('/tasks', reqAuth()) // Authorization is required for all sub-routes
    .get('tasks', '/tasks', async (ctx) => {
      const tasks = await Task.findAll({
        include: [
          { model: User, as: 'Creator' },
          { model: User, as: 'AssignedTo' },
          Status],
      });
      log('%O', tasks);
      ctx.render('tasks/index', { tasks });
    })
    .get('newTask', '/tasks/new', async (ctx) => {
      const task = Task.build();
      const statuses = await Status.findAll();
      const users = await User.findAll();
      ctx.render('tasks/new', { f: buildFormObj(task), statuses, users });
    })
    .post('/tasks', async (ctx) => {
      const { form } = ctx.request.body;
      const task = Task.build(form);
      task.setCreator(ctx.state.signedUser);
      try {
        await task.save();
        log(task);
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        log('%o', e);
        ctx.throw(e);
      }
    })
    .get('taskEdit', '/tasks/:id/edit', async (ctx) => {
      const { id } = ctx.params;
      try {
        const task = await Task.findById(id);
        const statuses = await Status.findAll();
        const users = await User.findAll();
        ctx.render('tasks/edit', { f: buildFormObj(task), statuses, users });
      } catch (e) {
        ctx.throw(e);
      }
    })
    .patch('task', '/tasks/:id', async (ctx) => {
      const { id } = ctx.params;
      const task = await Task.findById(id);
      const { form } = ctx.request.body;
      try {
        await task.update(form);
        ctx.flash.set('Task has been edited');
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        ctx.throw(e);
      }
    })
    .delete('task', '/tasks/:id', async (ctx) => {
      const { id } = ctx.params;
      const task = await Task.findById(id);
      await task.destroy();
      ctx.flash.set('Task has been deleted');
      ctx.redirect(router.url('tasks'));
    });
};
