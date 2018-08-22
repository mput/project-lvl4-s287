module.exports = {
  development: {
    database: 'database_development',
    dialect: 'sqlite',
    storage: './db.development.sqlite',
  },
  test: {
    database: 'database_test',
    storage: ':memory:',
    dialect: 'sqlite',
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DATABASE_URL,
    database: 'database_production',
    dialect: 'postgres',
  },
};
