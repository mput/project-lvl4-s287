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
    .get('newUser', '/users/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })
    .post('users', '/users', async (ctx) => {
      const { form } = ctx.request.body;
      const user = User.build(form);
      try {
        await user.save();
        ctx.flash.set('User has been created');
        ctx.session.userId = user.id;
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })
    .get('editProfile', '/profile/edit', reqAuth('Please login to edit your profile!'), (ctx) => {
      const { signedUser } = ctx.state;
      ctx.render('users/profile', { f: buildFormObj(signedUser) });
    })
    .patch('editProfile', '/profile/edit', reqAuth(), async (ctx) => {
      const { form } = ctx.request.body;
      try {
        await ctx.state.signedUser.update(form);
        log('Update user profile');
        ctx.flash.set('Profile has been updated');
        ctx.redirect(router.url('editProfile'));
      } catch (e) {
        ctx.render('users/profile', { f: buildFormObj(form, e) });
      }
    });
};
