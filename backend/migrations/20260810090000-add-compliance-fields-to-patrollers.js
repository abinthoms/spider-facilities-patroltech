'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Patrollers', 'siaLicenceNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Patrollers', 'siaLicenceType', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Patrollers', 'siaLicenceExpiry', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Patrollers', 'rightToWorkDocumentType', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Patrollers', 'rightToWorkVerifiedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Patrollers', 'rightToWorkExpiry', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Patrollers', 'workingTimeOptOut', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Patrollers', 'nationalInsuranceNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Patrollers', 'nationalInsuranceNumber');
    await queryInterface.removeColumn('Patrollers', 'workingTimeOptOut');
    await queryInterface.removeColumn('Patrollers', 'rightToWorkExpiry');
    await queryInterface.removeColumn('Patrollers', 'rightToWorkVerifiedAt');
    await queryInterface.removeColumn('Patrollers', 'rightToWorkDocumentType');
    await queryInterface.removeColumn('Patrollers', 'siaLicenceExpiry');
    await queryInterface.removeColumn('Patrollers', 'siaLicenceType');
    await queryInterface.removeColumn('Patrollers', 'siaLicenceNumber');
  }
};
