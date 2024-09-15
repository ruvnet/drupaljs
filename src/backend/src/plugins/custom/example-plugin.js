module.exports = {
  name: 'Example Plugin',
  version: '1.0.0',
  description: 'An example plugin to demonstrate the plugin system',
  initialize: async (strapi) => {
    // Plugin initialization logic
    console.log('Example plugin initialized');

    // Register a new API endpoint
    strapi.routes.push({
      method: 'GET',
      path: '/example-plugin',
      handler: (ctx) => {
        ctx.body = 'Hello from the example plugin!';
      },
    });

    // Add a hook
    strapi.hooks.addHook('beforeCreate:article', async (data) => {
      console.log('Article being created:', data);
    });
  },
};