// Global test setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

// Set up test database - use SQLite for testing
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

// Suppress console.error and console.warn during tests to keep output clean
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Mock sequelize globally to prevent database connections during tests
jest.mock('sequelize', () => {
  const actualSequelize = jest.requireActual('sequelize');
  const mockDefine = jest.fn(() => ({
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    associate: jest.fn(),
  }));

  return {
    ...actualSequelize,
    Sequelize: jest.fn(() => ({
      define: mockDefine,
      sync: jest.fn(),
      close: jest.fn(),
      authenticate: jest.fn(),
    })),
  };
});
