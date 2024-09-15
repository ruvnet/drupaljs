'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::page.page', ({ strapi }) => ({
  async find(params) {
    return strapi.entityService.findMany('api::page.page', params);
  },

  async findOne(id, params) {
    return strapi.entityService.findOne('api::page.page', id, params);
  },

  async create(params) {
    const { data } = params;
    if (!data.slug) {
      data.slug = await this.generateSlug(data.title);
    }
    return strapi.entityService.create('api::page.page', params);
  },

  async update(id, params) {
    const { data } = params;
    if (data.title && !data.slug) {
      data.slug = await this.generateSlug(data.title);
    }
    return strapi.entityService.update('api::page.page', id, params);
  },

  async generateSlug(title) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    const existingPage = await strapi.entityService.findMany('api::page.page', {
      filters: { slug },
    });

    if (existingPage.length > 0) {
      return `${slug}-${Date.now()}`;
    }

    return slug;
  },
}));