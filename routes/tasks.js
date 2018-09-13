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
      const tasks = await Task.scope('withAssotiation').findAll();
      ctx.render('tasks/index', { tasks, replaceTagsWithTagLinks });
    })
    .get('newTask', '/tasks/new', async (ctx) => {
      const task = Task.build();
      const statuses = await Status.findAll();
      ctx.render('tasks/new', { f: buildFormObj(task), statuses });
    })
    .post('/tasks', async (ctx) => {
      const { form } = ctx.request.body;
      const task = Task.build(form);
      task.setCreator(ctx.state.signedUser);
      try {
        if (form.AssignedToEmail) {
          await task.setAssocitation({
            model: 'User',
            as: 'AssignedTo',
            querry: { where: { email: form.AssignedToEmail } },
            error: {
              message: 'Can\'t find such user',
              path: 'AssignedToEmail',
            },
          });
        }
        await task.save();
        const tags = await findOrCreateTags(getTags(form.name));
        await linkTagsToTask(tags, task);
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        log(e);
        const statuses = await Status.findAll();
        ctx.render('tasks/new', { f: buildFormObj(form, e), statuses });
      }
    })
    .get('taskEdit', '/tasks/:id/edit', async (ctx) => {
      const { id } = ctx.params;
      const task = await Task.findOne({
        where: { id },
        include: 'AssignedTo',
      });
      if (!task) {
        ctx.throw(404);
      }
      task.AssignedToEmail = task.AssignedTo ? task.AssignedTo.email : '';
      const statuses = await Status.findAll();
      ctx.render('tasks/edit', { f: buildFormObj(task), id, statuses });
    })
    .patch('task', '/tasks/:id', async (ctx) => {
      const { id } = ctx.params;
      const task = await Task.findById(id);
      if (!task) {
        ctx.throw(404);
      }
      const { form } = ctx.request.body;
      try {
        if (form.AssignedToEmail) {
          await task.setAssocitation({
            model: 'User',
            as: 'AssignedTo',
            querry: { where: { email: form.AssignedToEmail } },
            error: {
              message: 'Can\'t find such user',
              path: 'AssignedToEmail',
            },
          });
        } else {
          task.setAssignedTo(null);
        }
        await task.update(form);
        const tags = await findOrCreateTags(getTags(form.name));
        await linkTagsToTask(tags, task);
        ctx.flash.set('Task has been edited');
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        const statuses = await Status.findAll();
        ctx.render('tasks/edit', { f: buildFormObj(form, e), id, statuses });
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
