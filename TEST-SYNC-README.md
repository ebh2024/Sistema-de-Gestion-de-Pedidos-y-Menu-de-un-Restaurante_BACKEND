# Pruebas de Sincronización de Modelos

## Tarea 3: Probar sincronización de modelos

Este directorio contiene scripts para probar la sincronización de modelos y verificar que todas las relaciones funcionen correctamente.

## Scripts Disponibles

### 1. `test-sync.js`
Script básico para probar la sincronización de modelos:
- Verifica la conexión a la base de datos
- Lista todos los modelos disponibles
- Sincroniza los modelos con la base de datos
- Muestra la estructura de tablas creadas
- Proporciona información detallada de cada modelo

**Ejecutar:**
```bash
npm run test:sync
# o
node test-sync.js
```

### 2. `test-relations.js`
Script avanzado para probar relaciones entre modelos:
- Crea datos de prueba para todos los modelos
- Verifica que las relaciones FK funcionen correctamente
- Prueba consultas con `include` para cargar relaciones
- Muestra estadísticas de la base de datos
- Valida la integridad referencial

**Ejecutar:**
```bash
npm run test:relations
# o
node test-relations.js
```

### 3. Ejecutar ambas pruebas
```bash
npm run test:models
```

## Modelos Probados

Los siguientes modelos son probados en estos scripts:

- **User**: Usuarios del sistema (meseros, administradores)
- **Table**: Mesas del restaurante
- **Dish**: Platos del menú
- **Order**: Órdenes de pedidos
- **OrderDetail**: Detalles de cada orden

## Relaciones Verificadas

### Relaciones principales:
- `User` → `Order` (1:N) - Un usuario puede tener múltiples órdenes
- `Table` → `Order` (1:N) - Una mesa puede tener múltiples órdenes
- `Order` → `OrderDetail` (1:N) - Una orden puede tener múltiples detalles
- `Dish` → `OrderDetail` (1:N) - Un plato puede estar en múltiples detalles

### Claves foráneas:
- `Order.userId` → `User.id`
- `Order.tableId` → `Table.id`
- `OrderDetail.orderId` → `Order.id`
- `OrderDetail.dishId` → `Dish.id`

## Configuración Requerida

Antes de ejecutar las pruebas, asegúrate de tener:

1. **Variables de entorno configuradas** en `.env`:
   ```
   DB_NAME=nombre_base_datos
   DB_USER=usuario_db
   DB_PASSWORD=password_db
   DB_HOST=localhost
   ```

2. **Base de datos MySQL** ejecutándose y accesible

3. **Dependencias instaladas**:
   ```bash
   npm install
   ```

## Resultados Esperados

### test-sync.js
- ✅ Conexión a la base de datos establecida
- ✅ Lista de modelos disponibles
- ✅ Sincronización exitosa
- ✅ Tablas creadas en la base de datos
- ✅ Información detallada de cada modelo

### test-relations.js
- ✅ Datos de prueba creados exitosamente
- ✅ Relaciones FK funcionando correctamente
- ✅ Consultas con `include` ejecutándose sin errores
- ✅ Estadísticas de la base de datos mostradas
- ✅ Integridad referencial validada

## Solución de Problemas

### Error de conexión a la base de datos
- Verificar que MySQL esté ejecutándose
- Confirmar credenciales en `.env`
- Verificar que la base de datos exista

### Error de clave foránea
- Verificar que las relaciones estén definidas correctamente
- Confirmar que los modelos tengan los campos FK necesarios
- Revisar el orden de creación de datos

### Error de sincronización
- Verificar permisos de la base de datos
- Confirmar que no haya conflictos de esquema
- Usar `{ force: true }` para recrear tablas (¡CUIDADO: borra datos!)

## Notas Importantes

- Las pruebas usan `{ alter: true }` para modificar tablas existentes sin borrar datos
- Para recrear completamente las tablas, usar `{ force: true }` (¡borra todos los datos!)
- Los scripts cierran automáticamente la conexión a la base de datos
- Los datos de prueba se crean en cada ejecución de `test-relations.js`
