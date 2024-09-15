'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::category.category', ({ strapi }) => ({
  async find(params) {
    return strapi.entityService.findMany('api::category.category', {
      ...params,
      populate: ['articles'],
    });
  },

  async findOne(id, params) {
    return strapi.entityService.findOne('api::category.category', id, {
      ...params,
      populate: ['articles'],
    });
  },

  async create(params) {
    const { data } = params;
    if (!data.slug) {
      data.slug = await this.generateSlug(data.name);
    }
    return strapi.entityService.create('api::category.category', params);
  },

  async update(id, params) {
    const { data } = params;
    if (data.name && !data.slug) {
      data.slug = await this.generateSlug(data.name);
    }
    return strapi.entityService.update('api::category.category', id, params);
  },

  async generateSlug(name) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    const existingCategory = await strapi.entityService.findMany('api::category.category', {
      filters: { slug },
    });

    if (existingCategory.length > 0) {
      return `${slug}-${Date.now()}`;
    }

    return slug;
  },
}));