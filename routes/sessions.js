import buildFormObj from '../lib/formObjectBuilder';
import { encrypt } from '../lib/secure';
import { User } from '../models';

export default (router, container) => {
  const { log } = container;
  router
    .get('newSession', '/session/new', async (ctx) => {
      const data = {};
      ctx.render('sessions/new', { f: buildFormObj(data) });
    })
    .post('session', '/session', async (ctx) => {
      const { form } = ctx.request.body;
      form.email = form.email.toLowerCase();
      const { email, password } = form;
      log('Attempt to login with %s', email);
      const user = await User.findOne({
        where: {
          email,
        },
      });
      if (user && user.passwordDigest === encrypt(password)) {
        ctx.session.userId = user.id;
        ctx.redirect(router.url('tasks'));
        return;
      }
      ctx.status = 422;
      ctx.render('sessions/new', { f: buildFormObj({ email }), error: true });
    })
    .delete('session', '/session', (ctx) => {
      ctx.session = {};
      ctx.redirect(router.url('root'));
    });
};
