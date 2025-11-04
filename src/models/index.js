const { sequelize } = require('../config/database');
const User = require('./User');
const Dish = require('./Dish');
const Table = require('./Table');
const Order = require('./Order');
const OrderDetail = require('./OrderDetail');
const Token = require('./Token');

// Objeto que contendrá todos los modelos
const models = {
  User,
  Dish,
  Table,
  Order,
  OrderDetail,
  Token
};

// Configurar todas las asociaciones
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Relaciones
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Table.hasMany(Order, { foreignKey: 'tableId' });
Order.belongsTo(Table, { foreignKey: 'tableId' });

Order.hasMany(OrderDetail, { foreignKey: 'orderId' });
OrderDetail.belongsTo(Order, { foreignKey: 'orderId' });

Dish.hasMany(OrderDetail, { foreignKey: 'dishId' });
OrderDetail.belongsTo(Dish, { foreignKey: 'dishId' });

// Relación User - Token
User.hasMany(Token, { foreignKey: 'user_id', as: 'tokens' });
Token.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Función para sincronizar la base de datos
const syncDatabase = async (options = {}) => {
  try {
    // options.force = true => DROP y CREATE tablas (CUIDADO: borra datos)
    // options.alter = true => Modifica tablas existentes
    await sequelize.sync(options);
    console.log('✅ Base de datos sincronizada correctamente');
  } catch (error) {
    console.error('❌ Error al sincronizar base de datos:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  models,
  syncDatabase,
  // Exportar modelos individuales para facilitar imports
  User,
  Token,
  Dish,
  Order,
  OrderDetail,
  Table
};