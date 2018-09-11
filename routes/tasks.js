import { reqAuth } from './commonMiddlewares';
import buildFormObj from '../lib/formObjectBuilder';
import { Task, User, Tag, Status } from '../models'; // eslint-disable-line
import { normilizeTag, getTags, replaceTagsWithTagLinks } from '../lib/tagUtils';

const findOrCreateTags = async (tagsStr) => {
  const tagsSet = new Set(tagsStr.map(tag => normilizeTag(tag)));
  const tags = await Promise.all([...tagsSet].map(tagName => Tag
    .findOrCreate({ where: { name: tagName } })
    .then(([tag]) => tag)
    .catch(() => null)));
  return tags.filter(tag => !!tag);
};

const linkTagsToTask = async (tags, task) => {
  await task.addTags(tags);
};


export default (router, container) => {
  const { log } = container; // eslint-disable-line
  router
    .use('/tasks', reqAuth()) // Authorization is required for all sub-routes
    .get('tasks', '/tasks', async (ctx) => {
      const tasks = await Task.findAll({
        include: [
          { model: User, as: 'Creator' },
          { model: User, as: 'AssignedTo' },
          Tag,
          Status],
      });
      ctx.render('tasks/index', { tasks, replaceTagsWithTagLinks });
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
      const tags = await findOrCreateTags(getTags(form.name));
      try {
        await task.save();
        await linkTagsToTask(tags, task);
        ctx.redirect(router.url('tasks'));
      } catch (e) {
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
        const tags = await findOrCreateTags(getTags(form.name));
        await linkTagsToTask(tags, task);
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
