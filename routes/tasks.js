import { reqAuth } from './commonMiddlewares';
import buildFormObj from '../lib/formObjectBuilder';
import { Task, User, Tag, Status } from '../models'; // eslint-disable-line


const normilizeTag = tag => tag.slice(1).toLowerCase();

const findOrCreateTags = async (tagsStr) => {
  const tagsSet = new Set(tagsStr.map(tag => normilizeTag(tag)));
  const tags = await Promise.all([...tagsSet].map(tagName => Tag
    .findOrCreate({ where: { name: tagName } })
    .then(([{ id, name }]) => ({ id, name }))
    .catch(() => null)));
  return tags.filter(tag => !!tag)
    .reduce((acc, { id, name }) => ({ ...acc, [name]: [id] }), {});
};

const buildTagsStringTemplate = async (string) => {
  const tagRegexp = /#([\w-]+)/g;
  const tagsWithId = await findOrCreateTags(string.match(tagRegexp) || []);
  return string.replace(tagRegexp, (tag) => {
    const id = tagsWithId[normilizeTag(tag)];
    return id ? `<a href="<%= tagId_${id} %>">${tag}</a>` : tag;
  });
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
          Status],
      });
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
      const { descriptionRaw } = form;
      const descriptionTempleted = await buildTagsStringTemplate(descriptionRaw);
      console.log(descriptionRaw);
      console.log(descriptionTempleted);
      const task = Task.build({ ...form, description: descriptionTempleted });
      task.setCreator(ctx.state.signedUser);
      try {
        await task.save();
        // log(task);
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        // log('%o', e);
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
