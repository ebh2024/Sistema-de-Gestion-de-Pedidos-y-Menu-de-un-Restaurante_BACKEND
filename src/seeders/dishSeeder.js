const { Dish } = require('../models');

const dishesData = [
  {
    name: 'Pizza Margherita',
    description: 'Pizza clásica con salsa de tomate, mozzarella fresca y albahaca',
    price: 12.50,
    category: 'Pizzas',
    available: true
  },
  {
    name: 'Pasta Carbonara',
    description: 'Pasta con salsa cremosa de huevo, panceta, queso pecorino y pimienta negra',
    price: 15.00,
    category: 'Pastas',
    available: true
  },
  {
    name: 'Risotto ai Funghi',
    description: 'Risotto cremoso con champiñones frescos, vino blanco y queso parmesano',
    price: 18.00,
    category: 'Risottos',
    available: true
  },
  {
    name: 'Ensalada César',
    description: 'Lechuga romana, crutones, queso parmesano y aderezo César',
    price: 10.00,
    category: 'Ensaladas',
    available: true
  },
  {
    name: 'Tiramisú',
    description: 'Postre italiano con bizcochos, café, mascarpone y cacao',
    price: 7.25,
    category: 'Postres',
    available: true
  },
  {
    name: 'Coca Cola',
    description: 'Refresco de cola clásico',
    price: 3.50,
    category: 'Bebidas',
    available: true
  },
  {
    name: 'Agua Mineral',
    description: 'Agua mineral natural con gas',
    price: 2.50,
    category: 'Bebidas',
    available: true
  },
  {
    name: 'Café Espresso',
    description: 'Café espresso italiano tradicional',
    price: 2.00,
    category: 'Bebidas',
    available: true
  },
  {
    name: 'Tarta de Manzana',
    description: 'Tarta casera de manzana con canela',
    price: 6.00,
    category: 'Postres',
    available: true
  },
  {
    name: 'Pasta Pesto',
    description: 'Pasta con salsa pesto genovés, piñones y queso parmesano',
    price: 14.00,
    category: 'Pastas',
    available: true
  }
];

async function seedDishes() {
  try {
    console.log('🌱 Creando platos de ejemplo...');

    // Verificar si ya existen platos
    const existingDishes = await Dish.count();
    if (existingDishes > 0) {
      console.log('ℹ️  Los platos ya están creados. Saltando seeder.');
      return;
    }

    // Crear platos
    const createdDishes = await Dish.bulkCreate(dishesData);
    console.log(`✅ ${createdDishes.length} platos creados exitosamente.`);

    // Mostrar resumen
    console.log('\n📋 Platos creados:');
    createdDishes.forEach(dish => {
      console.log(`   - ${dish.name} (${dish.category}) - $${dish.price}`);
    });

  } catch (error) {
    console.error('❌ Error al crear platos:', error);
    throw error;
  }
}

module.exports = { seedDishes };

// Ejecutar seeder si se llama directamente
if (require.main === module) {
  const { sequelize } = require('../models');

  sequelize.authenticate()
    .then(() => {
      console.log('✅ Conexión a la base de datos establecida.');
      return seedDishes();
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
