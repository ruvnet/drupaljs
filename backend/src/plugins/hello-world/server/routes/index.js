module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/welcome',
      handler: 'hello-world.welcome',
    },
  ],
};
