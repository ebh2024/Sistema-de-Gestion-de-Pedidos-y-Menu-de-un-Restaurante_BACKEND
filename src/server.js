// Importar dependencias
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const { syncDatabase } = require('./models');

// Configurar variables de entorno
dotenv.config();

// Crear instancia de Express
const app = express();

// Configurar puerto
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// CORS - Permitir peticiones desde el frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // URL de Vite por defecto
  credentials: true
}));

// Morgan - Logger de peticiones HTTP (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser - Leer JSON en el body de las peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS
// ============================================

// Ruta de prueba (Health check)
app.get('/', (req, res) => {
  res.json({
    message: '🍽️ API del Sistema de Gestión de Restaurante',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la aplicación
const authRoutes = require('./routes/authRoutes');
const dishRoutes = require('./routes/dishRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const orderDetailRoutes = require('./routes/orderDetailRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/order_details', orderDetailRoutes);

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada (404)
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

// Sincronizar base de datos y luego iniciar servidor
const startServer = async () => {
  try {
    // Sincronizar base de datos (crear tablas si no existen)
    await syncDatabase({ force: false, alter: true }); // alter: true para modificar tablas existentes

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

// Exportar app para testing (opcional)
module.exports = app;
