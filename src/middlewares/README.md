# Middlewares de Autenticación y Autorización

## auth.js

Middleware de autenticación que verifica el token JWT del usuario.

### Funcionalidad:
- Extrae el token del header `Authorization`
- Verifica la validez del token JWT
- Busca el usuario en la base de datos
- Verifica que el usuario esté activo
- Agrega la información del usuario a `req.user`

### Uso:

```javascript
const auth = require('./middlewares/auth');

// Proteger una ruta
router.get('/profile', auth, (req, res) => {
  res.json({ user: req.user });
});
```

### Respuestas:
- **401**: Token no proporcionado, inválido, expirado o usuario no encontrado
- **500**: Error en la autenticación

---

## checkRole.js

Middleware de autorización que verifica los roles del usuario.

### Funcionalidad:
- Verifica que el usuario tenga uno de los roles permitidos
- Debe usarse **después** del middleware `auth`

### Uso:

```javascript
const auth = require('./middlewares/auth');
const checkRole = require('./middlewares/checkRole');

// Solo administradores
router.delete('/users/:id', auth, checkRole('admin'), (req, res) => {
  // Lógica para eliminar usuario
});

// Administradores y cocineros
router.get('/orders', auth, checkRole('admin', 'cook'), (req, res) => {
  // Lógica para ver órdenes
});

// Todos los roles autenticados
router.get('/menu', auth, checkRole('admin', 'cook', 'waiter'), (req, res) => {
  // Lógica para ver menú
});
```

### Roles disponibles:
- `admin`: Administrador del sistema
- `cook`: Cocinero
- `waiter`: Mesero

### Respuestas:
- **401**: Usuario no autenticado
- **403**: Usuario sin permisos para la acción
- **500**: Error al verificar permisos

---

## Configuración requerida

### Variables de entorno (.env):
```
JWT_SECRET=tu_clave_secreta_aqui
```

### Dependencias:
- `jsonwebtoken`: Para manejar tokens JWT
- `sequelize`: Para consultar la base de datos

---

## Ejemplo completo de uso en rutas:

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

// Ruta pública (sin autenticación)
router.get('/public', (req, res) => {
  res.json({ message: 'Ruta pública' });
});

// Ruta protegida (requiere autenticación)
router.get('/protected', auth, (req, res) => {
  res.json({ 
    message: 'Ruta protegida',
    user: req.user 
  });
});

// Ruta solo para administradores
router.post('/admin-only', auth, checkRole('admin'), (req, res) => {
  res.json({ message: 'Solo administradores' });
});

// Ruta para múltiples roles
router.get('/kitchen', auth, checkRole('admin', 'cook'), (req, res) => {
  res.json({ message: 'Área de cocina' });
});

module.exports = router;
```
