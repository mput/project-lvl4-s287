export default (router) => {
  router.get('root', '/', (ctx) => {
    if (ctx.state.isSignedIn) {
      ctx.redirect(router.url('getTasks'));
    } else {
      ctx.render('welcome/index');
    }
  });
};
