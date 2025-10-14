const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderDetail = sequelize.define('OrderDetail', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = OrderDetail;
