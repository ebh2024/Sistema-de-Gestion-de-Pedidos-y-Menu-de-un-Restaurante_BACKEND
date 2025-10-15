const { syncDatabase, sequelize, models } = require('./src/models');

/**
 * Script avanzado para probar sincronización y relaciones de modelos
 * Incluye pruebas de inserción de datos para verificar relaciones FK
 */

async function testModelRelations() {
  console.log('🚀 Iniciando prueba avanzada de modelos y relaciones...\n');
  
  try {
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');
    
    // Sincronizar modelos
    console.log('🔄 Sincronizando modelos...');
    await syncDatabase({ alter: true });
    console.log('✅ Modelos sincronizados\n');
    
    // Crear datos de prueba
    console.log('📝 Creando datos de prueba...');
    
    // Crear usuarios
    const user1 = await models.User.create({
      name: 'Juan Pérez',
      email: 'juan@test.com',
      password: 'password123',
      role: 'waiter'
    });
    console.log('✅ Usuario creado:', user1.name);
    
    // Crear mesas
    const table1 = await models.Table.create({
      number: 1,
      capacity: 4,
      status: 'available'
    });
    console.log('✅ Mesa creada:', `Mesa ${table1.number}`);
    
    // Crear platos
    const dish1 = await models.Dish.create({
      name: 'Pizza Margherita',
      description: 'Pizza con tomate, mozzarella y albahaca',
      price: 15.99,
      category: 'main',
      available: true
    });
    console.log('✅ Plato creado:', dish1.name);
    
    const dish2 = await models.Dish.create({
      name: 'Coca Cola',
      description: 'Bebida refrescante',
      price: 3.50,
      category: 'beverage',
      available: true
    });
    console.log('✅ Plato creado:', dish2.name);
    
    // Crear orden
    const order = await models.Order.create({
      userId: user1.id,
      tableId: table1.id,
      status: 'pending',
      total: 19.49
    });
    console.log('✅ Orden creada:', `Orden #${order.id}`);
    
    // Crear detalles de orden
    const orderDetail1 = await models.OrderDetail.create({
      orderId: order.id,
      dishId: dish1.id,
      quantity: 1,
      price: dish1.price
    });
    console.log('✅ Detalle de orden creado:', `${orderDetail1.quantity}x ${dish1.name}`);
    
    const orderDetail2 = await models.OrderDetail.create({
      orderId: order.id,
      dishId: dish2.id,
      quantity: 2,
      price: dish2.price
    });
    console.log('✅ Detalle de orden creado:', `${orderDetail2.quantity}x ${dish2.name}`);
    
    // Probar relaciones con includes
    console.log('\n🔍 Probando relaciones...');
    
    // Obtener orden con relaciones
    const orderWithRelations = await models.Order.findOne({
      where: { id: order.id },
      include: [
        { model: models.User, attributes: ['name', 'email'] },
        { model: models.Table, attributes: ['number', 'capacity'] },
        { 
          model: models.OrderDetail, 
          include: [{ model: models.Dish, attributes: ['name', 'price'] }]
        }
      ]
    });
    
    console.log('\n📊 Datos de la orden con relaciones:');
    console.log(`  - Orden #${orderWithRelations.id}`);
    console.log(`  - Mesero: ${orderWithRelations.User.name}`);
    console.log(`  - Mesa: ${orderWithRelations.Table.number}`);
    console.log(`  - Estado: ${orderWithRelations.status}`);
    console.log(`  - Total: $${orderWithRelations.total}`);
    console.log('  - Platos:');
    orderWithRelations.OrderDetails.forEach(detail => {
      console.log(`    * ${detail.quantity}x ${detail.Dish.name} - $${detail.price}`);
    });
    
    // Verificar conteos
    console.log('\n📈 Estadísticas de la base de datos:');
    const userCount = await models.User.count();
    const tableCount = await models.Table.count();
    const dishCount = await models.Dish.count();
    const orderCount = await models.Order.count();
    const orderDetailCount = await models.OrderDetail.count();
    
    console.log(`  - Usuarios: ${userCount}`);
    console.log(`  - Mesas: ${tableCount}`);
    console.log(`  - Platos: ${dishCount}`);
    console.log(`  - Órdenes: ${orderCount}`);
    console.log(`  - Detalles de orden: ${orderDetailCount}`);
    
    console.log('\n✅ Prueba avanzada completada exitosamente!');
    console.log('✅ Todas las relaciones FK funcionan correctamente');
    
  } catch (error) {
    console.error('\n❌ Error durante la prueba:');
    console.error(error.message);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('🔗 Error de clave foránea - verificar relaciones');
    }
  } finally {
    await sequelize.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar la prueba
testModelRelations();
