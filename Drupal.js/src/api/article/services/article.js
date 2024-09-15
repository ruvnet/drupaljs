'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::article.article', ({ strapi }) => ({
  async find(params) {
    return strapi.entityService.findMany('api::article.article', {
      ...params,
      populate: ['author', 'categories'],
    });
  },

  async findOne(id, params) {
    return strapi.entityService.findOne('api::article.article', id, {
      ...params,
      populate: ['author', 'categories'],
    });
  },

  async create(params) {
    const { data } = params;
    if (!data.slug) {
      data.slug = await this.generateSlug(data.title);
    }
    return strapi.entityService.create('api::article.article', params);
  },

  async update(id, params) {
    const { data } = params;
    if (data.title && !data.slug) {
      data.slug = await this.generateSlug(data.title);
    }
    return strapi.entityService.update('api::article.article', id, params);
  },

  async generateSlug(title) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    const existingArticle = await strapi.entityService.findMany('api::article.article', {
      filters: { slug },
    });

    if (existingArticle.length > 0) {
      return `${slug}-${Date.now()}`;
    }

    return slug;
  },
}));