# Sistema de Gestión de Pedidos y Menú de un Restaurante (Backend)

Este proyecto es el backend de un sistema completo de gestión para restaurantes, diseñado para manejar pedidos, menús, usuarios, mesas y detalles de pedidos. Está construido con Node.js, Express y Sequelize ORM, utilizando SQLite como base de datos por defecto (con soporte para MySQL).

## 🚀 Características

- **Autenticación JWT** con roles de usuario (admin, cook, waiter)
- **Gestión de usuarios** con recuperación de contraseña
- **Catálogo de platos** con búsqueda y filtros
- **Gestión de mesas** del restaurante
- **Sistema de pedidos** con detalles de cada plato
- **Generación de tickets PDF** para pedidos
- **API RESTful** completa con documentación
- **Suite de pruebas** completa (unitarias e integración)
- **Envío de emails** con SendGrid para recuperación de contraseña

## 🛠️ Tecnologías Utilizadas

### Core
*   **Node.js**: Entorno de ejecución de JavaScript
*   **Express.js**: Framework web para construir APIs RESTful
*   **Sequelize**: ORM (Object-Relational Mapper) para bases de datos

### Base de Datos
*   **SQLite3**: Base de datos por defecto (archivo local)
*   **MySQL2**: Soporte alternativo para MySQL

### Seguridad y Autenticación
*   **bcryptjs**: Hash de contraseñas
*   **jsonwebtoken**: Tokens JWT para autenticación
*   **CORS**: Middleware para Cross-Origin Resource Sharing

### Utilidades
*   **Dotenv**: Gestión de variables de entorno
*   **Morgan**: Logger de peticiones HTTP
*   **PDFKit**: Generación de documentos PDF
*   **@sendgrid/mail**: Envío de emails

### Desarrollo y Testing
*   **Nodemon**: Reinicio automático del servidor en desarrollo
*   **Jest**: Framework de testing
*   **Supertest**: Testing de APIs HTTP

## 📁 Estructura del Proyecto

```
.
├── .env.example                    # Variables de entorno de ejemplo
├── .gitignore                      # Archivos ignorados por Git
├── database.sqlite                 # Base de datos SQLite (generada automáticamente)
├── jest.config.js                  # Configuración de Jest para testing
├── package.json                    # Dependencias y scripts del proyecto
├── README.md                       # Este archivo
├── src/
│   ├── .env.example               # Variables de entorno para src/
│   ├── server.js                  # Punto de entrada de la aplicación
│   ├── config/
│   │   └── database.js            # Configuración de la base de datos
│   ├── constants/                 # Constantes de la aplicación
│   │   ├── authConstants.js
│   │   ├── dishConstants.js
│   │   └── orderConstants.js
│   ├── controllers/               # Controladores de la API
│   │   ├── authController.js
│   │   ├── dishController.js
│   │   ├── orderController.js
│   │   ├── orderDetailController.js
│   │   ├── tableController.js
│   │   └── userController.js
│   ├── middlewares/               # Middlewares personalizados
│   │   ├── auth.js               # Autenticación JWT
│   │   ├── checkRole.js          # Verificación de roles
│   │   └── README.md
│   ├── models/                    # Modelos de Sequelize
│   │   ├── Dish.js
│   │   ├── index.js              # Definición de relaciones
│   │   ├── Order.js
│   │   ├── OrderDetail.js
│   │   ├── Table.js
│   │   ├── Token.js
│   │   └── User.js
│   ├── routes/                    # Definición de rutas de la API
│   │   ├── authRoutes.js
│   │   ├── dishRoutes.js
│   │   ├── orderDetailRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── tableRoutes.js
│   │   └── userRoutes.js
│   ├── seeders/                   # Datos iniciales
│   │   └── userSeeder.js
│   ├── services/                  # Lógica de negocio
│   │   ├── authService.js
│   │   ├── dishService.js
│   │   └── orderService.js
│   ├── utils/                     # Utilidades
│   │   ├── checkRole.js
│   │   └── emailService.js
│   ├── validators/                # Validadores de entrada
│   │   ├── authValidators.js
│   │   ├── dishValidators.js
│   │   └── orderValidators.js
│   └── jwt.js                     # Utilidades JWT
├── tests/                         # Suite de pruebas
│   ├── setup.js                   # Configuración de tests
│   ├── teardown.js                # Limpieza después de tests
│   ├── integration/               # Tests de integración
│   │   ├── auth.routes.test.js
│   │   ├── dish.routes.test.js
│   │   ├── order.routes.test.js
│   │   ├── orderDetail.routes.test.js
│   │   ├── table.routes.test.js
│   │   └── user.routes.test.js
│   └── unit/                      # Tests unitarios
│       ├── auth.middleware.test.js
│       ├── authService.test.js
│       ├── checkRole.middleware.test.js
│       ├── dishController.test.js
│       ├── dishService.test.js
│       ├── dishValidators.test.js
│       ├── emailService.test.js
│       ├── jwt.test.js
│       ├── orderController.test.js
│       ├── orderDetailController.test.js
│       ├── orderService.test.js
│       ├── orderValidators.test.js
│       ├── tableController.test.js
│       └── userController.test.js
└── test-*.js                      # Scripts de testing adicionales
```

## Relaciones de la Base de Datos

El sistema de gestión de restaurantes se basa en las siguientes entidades y sus relaciones:

*   **Usuario (User)**: Representa a los usuarios del sistema (empleados, administradores, etc.).
    *   Un `Usuario` puede tener muchas `Ordenes`.
*   **Mesa (Table)**: Representa las mesas disponibles en el restaurante.
    *   Una `Mesa` puede tener muchas `Ordenes`.
*   **Plato (Dish)**: Representa los elementos del menú del restaurante.
    *   Un `Plato` puede estar en muchos `Detalles de Orden`.
*   **Orden (Order)**: Representa un pedido realizado por un usuario en una mesa específica.
    *   Una `Orden` pertenece a un `Usuario`.
    *   Una `Orden` pertenece a una `Mesa`.
    *   Una `Orden` puede tener muchos `Detalles de Orden`.
*   **Detalle de Orden (OrderDetail)**: Representa un plato específico dentro de una orden, incluyendo la cantidad.
    *   Un `Detalle de Orden` pertenece a una `Orden`.
    *   Un `Detalle de Orden` pertenece a un `Plato`.

### Diagrama de Relaciones (Conceptual)

```
+----------+       +---------+       +-------+       +-----------+       +-----------+
|   User   |       |  Table  |       |  Dish |       |   Order   |       | OrderDetail |
+----------+       +---------+       +-------+       +-----------+       +-----------+
| id       |       | id      |       | id    |       | id        |       | id          |
| name     |       | number  |       | name  |       | userId    |------>| orderId     |------>
| email    |       | capacity|       | price |       | tableId   |------>| dishId      |------>
| password |       | status  |       |       |       | status    |       | quantity    |
+----------+       +---------+       +-------+       | total     |       +-----------+
     |                   |                           +-----------+
     |                   |                               |
     |                   |                               |
     V                   V                               V
+---------------------------------------------------------------------------------------+
|                                       Database                                        |
+---------------------------------------------------------------------------------------+
```

## ⚙️ Configuración del Entorno

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/ebh2024/Sistema-de-Gestion-de-Pedidos-y-Menu-de-un-Restaurante_BACKEND.git
    cd Sistema-de-Gestion-de-Pedidos-y-Menu-de-un-Restaurante_BACKEND
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**:
    Crea un archivo `.env` en la raíz del proyecto basado en `.env.example`.

    **Configuración para SQLite (por defecto)**:
    ```env
    PORT=3000
    NODE_ENV=development

    # Base de datos SQLite (por defecto)
    DB_DIALECT=sqlite
    DB_STORAGE=./database.sqlite

    # JWT Configuration
    JWT_SECRET=tu_clave_secreta_muy_segura_aqui
    JWT_EXPIRES_IN=24h

    # SendGrid Configuration (opcional)
    SENDGRID_API_KEY=tu_api_key_de_sendgrid_aqui
    SENDGRID_FROM_EMAIL=noreply@restaurante.com

    # Frontend URL
    FRONTEND_URL=http://localhost:5173
    ```

    **Configuración alternativa para MySQL**:
    ```env
    PORT=3000
    NODE_ENV=development

    # Base de datos MySQL
    DB_DIALECT=mysql
    DB_HOST=localhost
    DB_PORT=3306
    DB_NAME=restaurant_db
    DB_USER=tu_usuario
    DB_PASSWORD=tu_contraseña

    # JWT Configuration
    JWT_SECRET=tu_clave_secreta_muy_segura_aqui
    JWT_EXPIRES_IN=24h

    # SendGrid Configuration (opcional)
    SENDGRID_API_KEY=tu_api_key_de_sendgrid_aqui
    SENDGRID_FROM_EMAIL=noreply@restaurante.com

    # Frontend URL
    FRONTEND_URL=http://localhost:5173
    ```

4.  **Sincronizar la base de datos y ejecutar seeders (opcional)**:
    ```bash
    npm run seed
    ```
    Esto ejecutará el seeder de usuarios y creará las tablas automáticamente.

## 🚀 Ejecución del Servidor

*   **Modo desarrollo**:
    ```bash
    npm run dev
    ```
    El servidor se ejecutará en `http://localhost:3000` y se reiniciará automáticamente con `nodemon` al detectar cambios.

*   **Modo producción**:
    ```bash
    npm start
    ```

## 🧪 Testing

El proyecto incluye una suite completa de pruebas:

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar solo pruebas unitarias
npm run test:unit

# Ejecutar solo pruebas de integración
npm run test:integration

# Ejecutar pruebas con cobertura
npm run test:coverage

# Ejecutar pruebas en modo watch
npm run test:watch
```

## 📚 API Documentation

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Registrar nuevo usuario | Público |
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/forgot-password` | Solicitar recuperación de contraseña | Público |
| POST | `/api/auth/reset-password` | Restablecer contraseña con token | Público |

### Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/api/users/profile` | Obtener perfil del usuario autenticado | Privado |

### Platos (`/api/dishes`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/api/dishes` | Obtener todos los platos (con filtros) | Público |
| GET | `/api/dishes/:id` | Obtener plato por ID | Público |
| POST | `/api/dishes` | Crear nuevo plato | Admin |
| PUT | `/api/dishes/:id` | Actualizar plato | Admin |
| DELETE | `/api/dishes/:id` | Eliminar plato | Admin |

**Parámetros de consulta para GET /api/dishes**:
- `available`: Filtrar por disponibilidad (true/false)
- `search`: Buscar por nombre

### Mesas (`/api/tables`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/api/tables` | Obtener todas las mesas (con filtros) | Público |
| GET | `/api/tables/:id` | Obtener mesa por ID | Público |
| POST | `/api/tables` | Crear nueva mesa | Admin |
| PUT | `/api/tables/:id` | Actualizar mesa | Admin |
| DELETE | `/api/tables/:id` | Eliminar mesa | Admin |

**Parámetros de consulta para GET /api/tables**:
- `number`: Número de mesa
- `disponible`: Filtrar por disponibilidad
- `minCapacity`: Capacidad mínima
- `maxCapacity`: Capacidad máxima

### Pedidos (`/api/orders`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| POST | `/api/orders` | Crear nuevo pedido | Waiter, Admin |
| GET | `/api/orders` | Obtener pedidos (con filtros por rol) | Privado |
| GET | `/api/orders/:id` | Obtener pedido por ID | Privado |
| GET | `/api/orders/:id/ticket` | Generar PDF del ticket | Privado |
| PUT | `/api/orders/:id` | Actualizar estado del pedido | Privado |
| DELETE | `/api/orders/:id` | Eliminar pedido | Admin |

### Detalles de Pedido (`/api/order_details`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/api/order_details/:orderId` | Obtener detalles de un pedido | Privado |

### Roles de Usuario

- **admin**: Acceso completo a todas las funcionalidades
- **cook**: Acceso limitado (principalmente para ver pedidos)
- **waiter**: Puede crear y gestionar pedidos, ver mesas y platos

### Estados de Pedido

- `pending`: Pedido creado, esperando confirmación
- `confirmed`: Pedido confirmado por la cocina
- `preparing`: En preparación
- `ready`: Listo para servir
- `delivered`: Entregado
- `cancelled`: Cancelado

### Ejemplos de Uso de la API

#### Crear un pedido
```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "tableId": 1,
  "orderDetails": [
    {
      "dishId": 1,
      "quantity": 2
    },
    {
      "dishId": 3,
      "quantity": 1
    }
  ]
}
```

#### Obtener platos con filtros
```bash
GET /api/dishes?available=true&search=pizza
```

#### Actualizar estado de pedido
```bash
PUT /api/orders/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ready"
}
```
