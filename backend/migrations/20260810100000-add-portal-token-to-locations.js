'use strict';

const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Locations', 'portalToken', {
      type: Sequelize.STRING(48),
      allowNull: true,
      unique: true,
    });

    const [locations] = await queryInterface.sequelize.query('SELECT id FROM Locations');
    for (const location of locations) {
      await queryInterface.sequelize.query(
        'UPDATE Locations SET portalToken = ? WHERE id = ?',
        { replacements: [crypto.randomBytes(24).toString('hex'), location.id] }
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Locations', 'portalToken');
  }
};
