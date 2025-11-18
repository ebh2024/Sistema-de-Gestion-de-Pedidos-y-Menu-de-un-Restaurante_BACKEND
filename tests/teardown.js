// Global test teardown
const { sequelize } = require('../src/models');

module.exports = async () => {
  // Close database connection after all tests
  if (sequelize) {
    await sequelize.close();
  }
};
