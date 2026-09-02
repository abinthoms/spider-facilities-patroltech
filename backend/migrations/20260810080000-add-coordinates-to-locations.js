'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Locations', 'latitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
      after: 'address'
    });
    await queryInterface.addColumn('Locations', 'longitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
      after: 'latitude'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Locations', 'longitude');
    await queryInterface.removeColumn('Locations', 'latitude');
  }
};
