'use strict';

module.exports = {
  async welcome(ctx) {
    ctx.send({
      message: 'Hello from the Hello World plugin!',
    });
  },
};
