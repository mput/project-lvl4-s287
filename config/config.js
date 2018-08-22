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
    use_env_variable: 'DATABASE_URL',
    database: 'database_production',
    dialect: 'postgres',
  },
};
