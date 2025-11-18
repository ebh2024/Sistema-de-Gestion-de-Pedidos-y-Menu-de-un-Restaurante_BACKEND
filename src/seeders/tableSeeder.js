const { Table } = require('../models');

const tablesData = [
  {
    number: 1,
    name: 'Mesa Terraza',
    capacity: 4,
    location: 'Terraza',
    status: 'available'
  },
  {
    number: 2,
    name: 'Mesa Ventana',
    capacity: 2,
    location: 'Sala Principal',
    status: 'available'
  },
  {
    number: 3,
    name: 'Mesa Familiar',
    capacity: 6,
    location: 'Sala Principal',
    status: 'available'
  },
  {
    number: 4,
    name: 'Mesa Romántica',
    capacity: 2,
    location: 'Sala Privada',
    status: 'available'
  },
  {
    number: 5,
    name: 'Mesa Grupo',
    capacity: 8,
    location: 'Sala de Eventos',
    status: 'available'
  },
  {
    number: 6,
    name: 'Mesa Barra',
    capacity: 3,
    location: 'Barra',
    status: 'available'
  }
];

async function seedTables() {
  try {
    console.log('🌱 Creando mesas de ejemplo...');

    // Verificar si ya existen mesas
    const existingTables = await Table.count();
    if (existingTables > 0) {
      console.log('ℹ️  Las mesas ya están creadas. Saltando seeder.');
      return;
    }

    // Crear mesas
    const createdTables = await Table.bulkCreate(tablesData);
    console.log(`✅ ${createdTables.length} mesas creadas exitosamente.`);

    // Mostrar resumen
    console.log('\n📋 Mesas creadas:');
    createdTables.forEach(table => {
      console.log(`   - Mesa ${table.number}: ${table.name} (${table.location}) - Capacidad: ${table.capacity}`);
    });

  } catch (error) {
    console.error('❌ Error al crear mesas:', error);
    throw error;
  }
}

module.exports = { seedTables };

// Ejecutar seeder si se llama directamente
if (require.main === module) {
  const { sequelize } = require('../models');

  sequelize.authenticate()
    .then(() => {
      console.log('✅ Conexión a la base de datos establecida.');
      return seedTables();
    })
    .then(() => {
      console.log('🎉 Seeder completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el seeder:', error);
      process.exit(1);
    });
}
