import _ from 'lodash';
import { reqAuth } from './commonMiddlewares';
import buildFormObj from '../lib/formObjectBuilder';
import { Task, User, Tag, Status } from '../models'; // eslint-disable-line
import { normilizeTag, getTags, replaceTagsWithTagLinks } from '../lib/tagUtils';

const findOrCreateTags = async (tags) => {
  const tagsSet = new Set(tags.map(tag => normilizeTag(tag)));
  const tagObjects = await Promise.all([...tagsSet].map(tagName => Tag
    .findOrCreate({ where: { name: tagName } })
    .then(([tag]) => tag)
    .catch(() => null)));
  return tagObjects.filter(tag => !!tag);
};

const linkTagsToTask = async (tags, task) => {
  await task.setTags(tags);
};

const scopeBuilders = [
  {
    getMethod: email => ({ method: ['createdByUser', email] }),
    path: 'my',
    name: 'createdByUser',
    valueProc: _.identity,
  },
  {
    getMethod: email => ({ method: ['assignedToUser', email] }),
    path: 'forme',
    name: 'assignedToUser',
    valueProc: _.identity,
  },
  {
    getMethod: StatusId => ({ method: ['hasStatusId', StatusId] }),
    name: 'hasStatusId',
    valueProc: _.identity,
  },
  {
    getMethod: tags => ({ method: ['hasTags', tags] }),
    name: 'hasTags',
    valueProc: tagStr => getTags(tagStr).map(tag => normilizeTag(tag)),
  },
  {
    getMethod: () => 'defaultScope',
    path: 'all',
    name: 'defaultScope',
    valueProc: _.identity,
  },
];

const buildScopes = queries => Object.keys(queries)
  .map((scopeName) => {
    const scopeObj = _.find(scopeBuilders, scope => scope.name === scopeName);
    const scopeValue = queries[scopeName];
    if (!scopeObj || !scopeValue) {
      return false;
    }
    const { getMethod, valueProc } = scopeObj;
    return getMethod(valueProc(scopeValue));
  })
  .filter(scope => !!scope);

export default (router, container) => {
  const { log } = container; // eslint-disable-line
  router
    .use('/tasks', reqAuth()) // Authorization is required for all sub-routes
    .get('newTask', '/tasks/new', async (ctx) => {
      const task = Task.build();
      const statuses = await Status.findAll();
      ctx.render('tasks/new', { f: buildFormObj(task), statuses });
    })
    .get('getTasks', '/tasks/:mainFilter?', async (ctx) => {
      const { mainFilter } = ctx.params;
      if (!mainFilter) {
        ctx.redirect(router.url('getTasks', 'all'));
        return;
      }
      const mainScopeObj = _.find(scopeBuilders,
        filter => filter.path === mainFilter.toLowerCase());
      if (!mainScopeObj) {
        ctx.throw(404);
      }
      const mainScope = mainScopeObj.getMethod(ctx.state.signedUser.email);
      log('MainFilter is %o, scope is %o ', mainFilter, mainScope);
      log('Querry is %o', ctx.query);
      const queries = { assignedToUser: '', hasStatusId: '', Tags: '', ...ctx.query, }; // eslint-disable-line
      const additionatlScopes = buildScopes(queries);

      const tasks = await Task.scope('withAssotiation', mainScope, ...additionatlScopes).findAll();
      const statuses = await Status.findAll();
      ctx.render('tasks/index', {
        f: buildFormObj(queries),
        tasks,
        statuses,
        hasCustomFilter: additionatlScopes.length > 0,
        replaceTagsWithTagLinks,
      });
    })
    .post('tasks', '/tasks', async (ctx) => {
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
        ctx.redirect(router.url('tasks', 'all'));
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
        ctx.redirect(router.url('getTasks', 'all'));
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
      ctx.redirect(router.url('getTasks', 'all'));
    });
};
