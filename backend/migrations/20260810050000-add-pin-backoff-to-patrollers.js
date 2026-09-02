'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Patrollers', 'failedPinAttempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      after: 'pin'
    });
    await queryInterface.addColumn('Patrollers', 'pinLockedUntil', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'failedPinAttempts'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Patrollers', 'pinLockedUntil');
    await queryInterface.removeColumn('Patrollers', 'failedPinAttempts');
  }
};
