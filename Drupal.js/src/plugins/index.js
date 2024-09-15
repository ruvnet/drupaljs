const fs = require('fs');
const path = require('path');

const loadPlugins = () => {
  const pluginsDir = path.join(__dirname, 'custom');
  const plugins = {};

  if (fs.existsSync(pluginsDir)) {
    fs.readdirSync(pluginsDir).forEach(file => {
      if (file.endsWith('.js')) {
        const pluginName = path.basename(file, '.js');
        const pluginPath = path.join(pluginsDir, file);
        plugins[pluginName] = require(pluginPath);
      }
    });
  }

  return plugins;
};

module.exports = loadPlugins;