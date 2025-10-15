# Sistema de Gestión de Pedidos y Menú de un Restaurante (Backend)

Este proyecto es el backend de un sistema de gestión para restaurantes, diseñado para manejar pedidos, menús, usuarios y mesas. Está construido con Node.js, Express y Sequelize, utilizando MySQL como base de datos.

## Tecnologías Utilizadas

*   **Node.js**: Entorno de ejecución de JavaScript.
*   **Express.js**: Framework web para construir APIs RESTful.
*   **Sequelize**: ORM (Object-Relational Mapper) para interactuar con la base de datos MySQL.
*   **MySQL2**: Driver de MySQL para Sequelize.
*   **Dotenv**: Para la gestión de variables de entorno.
*   **CORS**: Middleware para habilitar Cross-Origin Resource Sharing.
*   **Bcryptjs**: Para el hash de contraseñas.
*   **Morgan**: Logger de peticiones HTTP para desarrollo.
*   **Nodemon**: Herramienta para reiniciar automáticamente el servidor durante el desarrollo.

## Estructura del Proyecto

```
.
├── .env.example
├── .gitignore
├── package.json
├── src/
│   ├── .env.example
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Dish.js
│   │   ├── index.js
│   │   ├── Order.js
│   │   ├── OrderDetail.js
│   │   ├── Table.js
│   │   └── User.js
│   └── seeders/
│       └── userSeeder.js
└── README.md
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

## Configuración del Entorno

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/ebh2024/Sistema-de-Gestion-de-Pedidos-y-Menu-de-un-Restaurante_BACKEND.git
    cd Sistema-de-Gestion-de-Pedidos-y-Menu-de-un-Restaurante_BACKEND/backend
    ```
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Configurar variables de entorno**:
    Crea un archivo `.env` en la raíz del proyecto (al mismo nivel que `package.json`) y en `src/` (para `src/.env.example`) basado en `.env.example`.

    Ejemplo de `.env`:
    ```
    PORT=3000
    NODE_ENV=development
    DATABASE_URL="mysql://user:password@host:port/database_name"
    FRONTEND_URL="http://localhost:5173"
    JWT_SECRET="your_jwt_secret_key"
    ```
    Asegúrate de reemplazar `user`, `password`, `host`, `port` y `database_name` con tus credenciales de MySQL.

4.  **Sincronizar la base de datos y ejecutar seeders (opcional)**:
    ```bash
    npm run seed
    ```
    Esto ejecutará el seeder de usuarios y creará las tablas si no existen.

## Ejecución del Servidor

*   **Modo desarrollo**:
    ```bash
    npm run dev
    ```
    El servidor se reiniciará automáticamente con `nodemon` al detectar cambios.

*   **Modo producción**:
    ```bash
    npm start
    ```

## Rutas de la API (Pendientes)

Las rutas principales de la API se definirán en `src/server.js` y se espera que incluyan:

*   `/api/auth`: Autenticación de usuarios.
*   `/api/users`: Gestión de usuarios.
*   `/api/dishes`: Gestión del menú de platos.
*   `/api/tables`: Gestión de mesas.
*   `/api/orders`: Gestión de pedidos.
