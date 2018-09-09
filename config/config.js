module.exports = {
  development: {
    database: 'tasker-plan',
    dialect: 'postgres',
    host: 'db',
    username: 'root',
    password: 'pgpass',
  },
  test: {
    database: 'database_test',
    storage: ':memory:',
    dialect: 'sqlite',
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    database: 'database_production',
    dialect: 'postgres',
  },
};
