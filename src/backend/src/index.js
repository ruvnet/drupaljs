'use strict';

const loadPlugins = require('./plugins');

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Load and initialize custom plugins
    const plugins = loadPlugins();
    for (const [pluginName, plugin] of Object.entries(plugins)) {
      console.log(`Initializing plugin: ${pluginName}`);
      await plugin.initialize(strapi);
    }
  },
};