import buildFormObj from '../lib/formObjectBuilder';
import { User } from '../models';
import { reqAuth } from './commonMiddlewares';

export default (router, container) => {
  const { log } = container;
  router
    .get('users', '/users', async (ctx) => {
      const users = await User.findAll();
      ctx.render('users', { users });
    })
    .get('newUser', '/user/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })
    .post('user', '/user', async (ctx) => {
      const { form } = ctx.request.body;
      const user = User.build(form);
      try {
        await user.save();
        ctx.flash.set('User has been created');
        ctx.session.userId = user.id;
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.status = 422;
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })
    .get('editUser', '/user/edit', reqAuth('Please login to edit your profile!'), (ctx) => {
      const { signedUser } = ctx.state;
      ctx.render('users/profile', { f: buildFormObj(signedUser) });
    })
    .patch('/user', reqAuth(), async (ctx) => {
      const { form } = ctx.request.body;
      try {
        await ctx.state.signedUser.update(form);
        log('Update user profile');
        ctx.flash.set('Profile has been updated');
        ctx.redirect(router.url('editUser'));
      } catch (e) {
        ctx.status = 422;
        ctx.render('users/profile', { f: buildFormObj(form, e) });
      }
    });
};
