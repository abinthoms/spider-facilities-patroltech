'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Shifts', 'clockInWithinGeofence', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      after: 'clockInLocation'
    });
    await queryInterface.addColumn('Shifts', 'clockOutWithinGeofence', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      after: 'clockOutLocation'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Shifts', 'clockOutWithinGeofence');
    await queryInterface.removeColumn('Shifts', 'clockInWithinGeofence');
  }
};
