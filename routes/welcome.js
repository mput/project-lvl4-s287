export default (router) => {
  router.get('root', '/', (ctx) => {
    if (ctx.state.isSignedIn) {
      ctx.redirect(router.url('tasks'));
    } else {
      ctx.render('welcome/index');
    }
  });
};
