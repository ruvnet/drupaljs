'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::menu.menu', ({ strapi }) => ({
  async find(params) {
    return strapi.entityService.findMany('api::menu.menu', {
      ...params,
      populate: ['items'],
    });
  },

  async findOne(id, params) {
    return strapi.entityService.findOne('api::menu.menu', id, {
      ...params,
      populate: ['items'],
    });
  },

  async create(params) {
    return strapi.entityService.create('api::menu.menu', params);
  },

  async update(id, params) {
    return strapi.entityService.update('api::menu.menu', id, params);
  },

  async createMenuItem(menuId, itemData) {
    const menu = await strapi.entityService.findOne('api::menu.menu', menuId, {
      populate: ['items'],
    });

    const newItem = await strapi.entityService.create('api::menu.menu-item', {
      data: {
        ...itemData,
        order: menu.items.length + 1,
      },
    });

    await strapi.entityService.update('api::menu.menu', menuId, {
      data: {
        items: [...menu.items, newItem.id],
      },
    });

    return newItem;
  },

  async updateMenuItemOrder(menuId, itemId, newOrder) {
    const menu = await strapi.entityService.findOne('api::menu.menu', menuId, {
      populate: ['items'],
    });

    const updatedItems = menu.items
      .map(item => ({
        ...item,
        order: item.id === itemId ? newOrder : item.order,
      }))
      .sort((a, b) => a.order - b.order);

    await strapi.entityService.update('api::menu.menu', menuId, {
      data: {
        items: updatedItems.map(item => item.id),
      },
    });

    return updatedItems;
  },
}));