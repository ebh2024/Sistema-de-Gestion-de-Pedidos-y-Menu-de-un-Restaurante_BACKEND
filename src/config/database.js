const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

let sequelize;

if (process.env.DB_DIALECT === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: false,
      // For development, try socket connection
      socketPath: process.env.DB_SOCKET || '/var/run/mysqld/mysqld.sock',
    }
  );
}

module.exports = { sequelize };
