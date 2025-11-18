// Global test setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

// Set up test database
process.env.DATABASE_URL = 'sqlite::memory:';
