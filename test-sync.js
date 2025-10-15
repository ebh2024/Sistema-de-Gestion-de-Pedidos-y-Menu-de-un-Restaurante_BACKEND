const { syncDatabase, sequelize, models } = require('./src/models');

/**
 * Script para probar la sincronización de modelos
 * Tarea 3: Probar sincronización de modelos
 */

async function testModelSync() {
  console.log('🚀 Iniciando prueba de sincronización de modelos...\n');
  
  try {
    // Verificar conexión a la base de datos
    console.log('📡 Verificando conexión a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente\n');
    
    // Mostrar información de los modelos disponibles
    console.log('📋 Modelos disponibles:');
    Object.keys(models).forEach(modelName => {
      console.log(`  - ${modelName}`);
    });
    console.log('');
    
    // Probar sincronización sin forzar (mantener datos existentes)
    console.log('🔄 Probando sincronización de modelos (modo seguro)...');
    await syncDatabase({ alter: true });
    
    // Verificar que las tablas se crearon correctamente
    console.log('\n📊 Verificando estructura de tablas...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tablas en la base de datos:');
    tables.forEach(table => {
      console.log(`  - ${table}`);
    });
    
    // Mostrar información de cada modelo
    console.log('\n🔍 Información detallada de modelos:');
    for (const [modelName, model] of Object.entries(models)) {
      console.log(`\n📝 Modelo: ${modelName}`);
      console.log(`  - Tabla: ${model.tableName}`);
      console.log(`  - Atributos: ${Object.keys(model.rawAttributes).join(', ')}`);
      
      // Mostrar asociaciones
      const associations = Object.keys(model.associations || {});
      if (associations.length > 0) {
        console.log(`  - Asociaciones: ${associations.join(', ')}`);
      }
    }
    
    console.log('\n✅ Prueba de sincronización completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error durante la prueba de sincronización:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    // Cerrar conexión
    await sequelize.close();
    console.log('\n🔌 Conexión a la base de datos cerrada');
  }
}

// Ejecutar la prueba
testModelSync();
