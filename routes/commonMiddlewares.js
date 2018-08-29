const reqAuth = (message = 'Require authorization') => async (ctx, next) => {
  ctx.assert(ctx.state.isSignedIn, 401, message);
  await next();
};

export { reqAuth }; // eslint-disable-line
