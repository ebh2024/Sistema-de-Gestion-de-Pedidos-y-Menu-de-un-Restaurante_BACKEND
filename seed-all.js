const { seedUsers } = require('./src/seeders/userSeeder.js');
const { seedDishes } = require('./src/seeders/dishSeeder.js');
const { seedTables } = require('./src/seeders/tableSeeder.js');

async function runAllSeeders() {
  try {
    console.log('🚀 Iniciando seeders...\n');

    console.log('👥 Ejecutando seeder de usuarios...');
    await seedUsers();
    console.log('✅ Usuarios creados/actualizados\n');

    console.log('🍽️  Ejecutando seeder de platos...');
    await seedDishes();
    console.log('✅ Platos creados\n');

    console.log('🪑 Ejecutando seeder de mesas...');
    await seedTables();
    console.log('✅ Mesas creadas\n');

    console.log('🎉 Todos los seeders completados exitosamente!');
    console.log('\n📊 Datos de ejemplo creados:');
    console.log('   👤 3 usuarios (admin, cook, waiter)');
    console.log('   🍽️  10 platos de ejemplo');
    console.log('   🪑 6 mesas con nombres y ubicaciones');

  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    process.exit(1);
  }
}

runAllSeeders();
