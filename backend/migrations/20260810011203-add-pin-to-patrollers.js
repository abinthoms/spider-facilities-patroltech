'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Patrollers', 'pin', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'phone'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Patrollers', 'pin');
  }
};
