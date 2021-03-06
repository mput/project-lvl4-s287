import { reqAuth } from './commonMiddlewares';
import buildFormObj from '../lib/formObjectBuilder';
import { Status } from '../models';

const makeDefault = async (status) => {
  const currentDefault = await Status.findOne({ where: { default: true } });
  if (currentDefault) await currentDefault.update({ default: null });
  await status.update({ default: true });
};

export default (router, container) => {
  const { log } = container; // eslint-disable-line
  router
    .use('/statuses', reqAuth()) // Authorization is required for all sub-routes
    .get('statuses', '/statuses', async (ctx) => {
      const status = Status.build();
      const statuses = await Status.scope('defaultScope', 'withTasksCount').findAll();
      ctx.render('statuses/index', { f: buildFormObj(status), statuses });
    })
    .post('/statuses', async (ctx) => {
      const { form } = ctx.request.body;
      const status = Status.build(form);
      try {
        await status.save();
        if (form.makeDefault) await makeDefault(status);
        ctx.flash.set('Status has been created');
        ctx.redirect(router.url('statuses'));
      } catch (e) {
        ctx.flash.set(e.message);
        ctx.redirect(router.url('statuses'));
      }
    })
    .get('statusEdit', '/statuses/:id/edit', async (ctx) => {
      const { id } = ctx.params;
      try {
        const status = await Status.findById(id);
        ctx.render('statuses/edit', { f: buildFormObj(status), id });
      } catch (e) {
        ctx.throw(404);
      }
    })
    .patch('status', '/statuses/:id', async (ctx) => {
      const { id } = ctx.params;
      const { form } = ctx.request.body;
      try {
        const status = await Status.findById(id);
        await status.update(form);
        if (form.makeDefault) await makeDefault(status);
        ctx.flash.set('Status has been updated');
        ctx.redirect(router.url('statuses'));
      } catch (e) {
        ctx.status = 422;
        log(e);
        ctx.render('statuses/edit', { f: buildFormObj(form, e), id });
      }
    })
    .delete('status', '/statuses/:id', async (ctx) => {
      const { id } = ctx.params;
      try {
        const status = await Status.findById(id);
        await status.destroy();
        ctx.flash.set('Status has been deleted');
        ctx.redirect(router.url('statuses'));
      } catch (e) {
        ctx.flash.set(e.message);
        ctx.redirect(router.url('statuses'));
      }
    });
};
