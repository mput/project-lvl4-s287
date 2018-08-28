module.exports = {
  development: {
    database: 'database_development',
    dialect: 'sqlite',
    storage: './db.development.sqlite',
    logging: console.log,
  },
  test: {
    database: 'database_test',
    storage: ':memory:',
    dialect: 'sqlite',
    logging: console.log,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    database: 'database_production',
    dialect: 'postgres',
    logging: console.log,
  },
};
