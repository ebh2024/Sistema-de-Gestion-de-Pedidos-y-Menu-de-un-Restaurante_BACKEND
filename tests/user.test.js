const request = require('supertest');
const { app, server } = require('../server');
const { sequelize } = require('../config/db');
const User = require('../models/User');

let token;

beforeAll(async () => {
  // Asegurar que la base de datos esté sincronizada y limpia antes de las pruebas
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Cerrar el servidor y la conexión a la base de datos después de las pruebas
  await server.close();
  await sequelize.close();
});

describe('API de Usuario', () => {
  it('debería registrar un nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Usuario de Prueba',
        email: 'prueba@example.com',
        password: 'password123',
        role: 'admin',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toEqual('prueba@example.com');
  });

  it('no debería registrar un usuario con un correo electrónico existente', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Otro Usuario',
        email: 'prueba@example.com',
        password: 'password123',
        role: 'mesero',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('User already exists');
  });

  it('debería iniciar sesión un usuario y devolver un token', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'prueba@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('no debería iniciar sesión con una contraseña inválida', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'prueba@example.com',
        password: 'contraseñainválida',
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Invalid email or password');
  });

  it('debería obtener el perfil del usuario con un token válido', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toEqual('prueba@example.com');
  });

  it('no debería obtener el perfil del usuario sin token', async () => {
    const res = await request(app)
      .get('/api/users/profile');
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Not authorized, no token');
  });

  it('no debería obtener el perfil del usuario con un token inválido', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer tokennoinválido`);
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Not authorized, token failed');
  });
});
