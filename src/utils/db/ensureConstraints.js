const { sequelize } = require('../../config/database');
const { QueryTypes } = require('sequelize');


async function ensureConstraints() {
  try {
    const dbRes = await sequelize.query('SELECT DATABASE() AS db', { type: QueryTypes.SELECT });
    const dbName = dbRes?.[0]?.db;

  // Helper to list FKs for a table
  const listFKs = async (table) => {
    const rows = await sequelize.query(
      `SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = :db AND TABLE_NAME = :table`,
      { replacements: { db: dbName, table }, type: QueryTypes.SELECT }
    );
    return Array.isArray(rows) ? rows : [];
  };

  // Helper to drop FK by name
  const dropFK = async (table, constraintName) => {
    try {
      await sequelize.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraintName}\``);
      console.log(`ℹ️  Dropped FK ${constraintName} on ${table}`);
    } catch (e) {
      console.warn(`⚠️  Could not drop FK ${constraintName} on ${table}:`, e.message);
    }
  };

  // 0) Intentar eliminar constraints heredadas por nombre conocido (idempotente)
  console.log('🔧 Ensuring FKs: dropping legacy ibfk constraints if exist...');
  await dropFK('orders', 'orders_ibfk_1');
  await dropFK('orders', 'orders_ibfk_2');
  await dropFK('order_details', 'order_details_ibfk_1');
  await dropFK('order_details', 'order_details_ibfk_2');

  // Ensure FKs for orders
  const ordersFKs = await listFKs('orders');
  for (const fk of ordersFKs || []) {
    const ref = (fk.REFERENCED_TABLE_NAME || '').toLowerCase();
    // Drop any FK that references wrong/capitalized table or legacy ibfk constraints
    if (!['users', 'tables'].includes(ref) || /orders_ibfk_/i.test(fk.CONSTRAINT_NAME)) {
      await dropFK('orders', fk.CONSTRAINT_NAME);
    }
  }

  // Ensure FKs for order_details
  const odFKs = await listFKs('order_details');
  for (const fk of odFKs || []) {
    const ref = (fk.REFERENCED_TABLE_NAME || '').toLowerCase();
    if (!['orders', 'dishes'].includes(ref) || /order_details_ibfk_/i.test(fk.CONSTRAINT_NAME)) {
      await dropFK('order_details', fk.CONSTRAINT_NAME);
    }
  }

  // Recreate expected FKs if missing
  const recreateIfMissing = async (table, expected) => {
    const current = await listFKs(table);
    const currentNames = new Set(current.map(r => r.CONSTRAINT_NAME));

    for (const exp of expected) {
      if (![...currentNames].some(name => name === exp.name)) {
        try {
          await sequelize.query(exp.sql);
          console.log(`✅ Added FK ${exp.name} on ${table}`);
        } catch (e) {
          console.warn(`⚠️  Could not add FK ${exp.name} on ${table}:`, e.message);
        }
      }
    }
  };

  await recreateIfMissing('orders', [
    {
      name: 'orders_user_fk',
      sql: 'ALTER TABLE `orders` ADD CONSTRAINT `orders_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    },
    {
      name: 'orders_table_fk',
      sql: 'ALTER TABLE `orders` ADD CONSTRAINT `orders_table_fk` FOREIGN KEY (`tableId`) REFERENCES `tables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    }
  ]);

  await recreateIfMissing('order_details', [
    {
      name: 'od_order_fk',
      sql: 'ALTER TABLE `order_details` ADD CONSTRAINT `od_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    },
    {
      name: 'od_dish_fk',
      sql: 'ALTER TABLE `order_details` ADD CONSTRAINT `od_dish_fk` FOREIGN KEY (`dishId`) REFERENCES `dishes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    }
  ]);
  } catch (err) {
    console.warn('ensureConstraints warning:', err?.message || err);
    // No propagar error: no bloqueamos el arranque del servidor
  }
}

module.exports = { ensureConstraints };
