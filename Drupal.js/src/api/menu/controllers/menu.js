'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::menu.menu', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    const entity = await strapi.service('api::menu.menu').find(query);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;
    const entity = await strapi.service('api::menu.menu').findOne(id, query);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async create(ctx) {
    const { data } = ctx.request.body;
    const entity = await strapi.service('api::menu.menu').create({ data });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;
    const entity = await strapi.service('api::menu.menu').update(id, { data });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.service('api::menu.menu').delete(id);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));