const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = Order;
