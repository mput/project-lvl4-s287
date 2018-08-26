export default (router) => {
  router.get('tasks', '/tasks', (ctx) => {
    ctx.render('tasks/index');
  });
};
