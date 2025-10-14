const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Table = sequelize.define('Table', {
  number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'reserved'),
    defaultValue: 'available'
  }
});

module.exports = Table;
