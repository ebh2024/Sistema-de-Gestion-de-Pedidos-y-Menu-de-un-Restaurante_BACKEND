const { sequelize } = require('../config/database');
const User = require('./User');
const Dish = require('./Dish');
const Table = require('./Table');
const Order = require('./Order');
const OrderDetail = require('./OrderDetail');

// Objeto que contendrá todos los modelos
const models = {
  User,
  Dish,
  Table,
  Order,
  OrderDetail
};

// Configurar todas las asociaciones
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

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
  User
};