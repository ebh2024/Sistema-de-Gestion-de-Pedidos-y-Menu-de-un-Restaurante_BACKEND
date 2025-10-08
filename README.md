# Sistema de Gestión de Pedidos y Menú de un Restaurante - Backend

Este repositorio contiene el código fuente del backend para un sistema de gestión de pedidos y menú de un restaurante. Está diseñado para manejar la lógica de negocio, la autenticación de usuarios con diferentes roles (administrador, cocinero, mesero) y la interacción con la base de datos para gestionar pedidos, menús y usuarios.

## Tecnologías Utilizadas

*   **Node.js**: Entorno de ejecución para JavaScript.
*   **Express.js**: Framework web para Node.js, utilizado para construir la API RESTful.
*   **Sequelize**: ORM (Object-Relational Mapper) para Node.js, que facilita la interacción con bases de datos relacionales.
*   **MySQL**: Sistema de gestión de bases de datos relacionales.
*   **JWT (JSON Web Tokens)**: Para la autenticación y autorización de usuarios.
*   **Bcrypt.js**: Para el hash seguro de contraseñas.

## Estructura del Proyecto

El proyecto sigue una estructura modular para facilitar la organización y el mantenimiento:

*   `config/`: Contiene la configuración de la base de datos.
*   `controllers/`: Lógica de negocio para cada ruta.
*   `middleware/`: Funciones intermedias para autenticación y manejo de errores.
*   `models/`: Definiciones de los modelos de la base de datos (Sequelize).
*   `routes/`: Definición de las rutas de la API.
*   `utils/`: Funciones de utilidad, como la generación de tokens JWT.
*   `tests/`: Archivos de pruebas unitarias e integración.
*   `server.js`: Punto de entrada principal de la aplicación.
*   `.env`: Variables de entorno para la configuración de la aplicación.

## Endpoints de Usuarios

Los siguientes endpoints están disponibles para la gestión de usuarios:

-   `POST /api/users/register`: Registra un nuevo usuario.
    -   **Roles disponibles**:
        *   `admin`: Acceso completo al sistema, puede gestionar usuarios, menús y pedidos.
        *   `cocinero`: Puede ver y actualizar el estado de los pedidos relacionados con la cocina.
        *   `mesero`: Puede tomar pedidos, gestionar mesas y ver el estado de los pedidos.
    -   **Cuerpo de la solicitud (JSON)**:
        ```json
        {
            "name": "Nombre del Usuario",
            "email": "correo@ejemplo.com",
            "password": "password123",
            "role": "mesero"
        }
        ```
    -   **Respuesta exitosa (201 Created)**:
        ```json
        {
            "id": 1,
            "name": "Nombre del Usuario",
            "email": "correo@ejemplo.com",
            "role": "mesero",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
        ```

-   `POST /api/users/login`: Autentica un usuario y devuelve un JSON Web Token (JWT).
    -   **Cuerpo de la solicitud (JSON)**:
        ```json
        {
            "email": "correo@ejemplo.com",
            "password": "password123"
        }
        ```
    -   **Respuesta exitosa (200 OK)**:
        ```json
        {
            "id": 1,
            "name": "Nombre del Usuario",
            "email": "correo@ejemplo.com",
            "role": "mesero",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
        ```

-   `GET /api/users/profile`: Obtiene el perfil del usuario autenticado.
    -   **Cabeceras de la solicitud**:
        -   `Authorization`: `Bearer <TOKEN_JWT>` (reemplaza `<TOKEN_JWT>` con el token obtenido en el login).
    -   **Respuesta exitosa (200 OK)**:
        ```json
        {
            "id": 1,
            "name": "Nombre del Usuario",
            "email": "correo@ejemplo.com",
            "role": "mesero"
        }
        ```

## Pruebas

Para ejecutar las pruebas unitarias y de integración, utiliza el siguiente comando:

```bash
npm test
```

## Configuración de la Base de Datos (MySQL)

1.  **Asegúrate de que MySQL esté funcionando** en tu sistema.
2.  **Crea una base de datos** llamada `restaurant_management` en tu servidor MySQL.
3.  **Actualiza el archivo `.env`** con tus credenciales de usuario de MySQL si son diferentes de las predeterminadas (root, sin contraseña).
    ```
    MYSQL_HOST=localhost
    MYSQL_USER=root
    MYSQL_PASSWORD=
    MYSQL_DATABASE=restaurant_management
    JWT_SECRET=your_jwt_secret
    ```
    -   `JWT_SECRET` debe ser una cadena de texto larga y segura para firmar los tokens JWT.

## Ejecución de la Aplicación

1.  Navega al directorio `backend` en tu terminal.
2.  **Instala las dependencias** (si no lo has hecho ya):
    ```bash
    npm install
    ```
3.  Para **desarrollo** (con reinicio automático del servidor al detectar cambios en los archivos):
    ```bash
    npm run dev
    ```
4.  Para **producción**:
    ```bash
    npm start
    ```

La aplicación creará automáticamente la tabla `Users` en tu base de datos `restaurant_management` cuando se inicie.
