const dotenv = require('dotenv');

dotenv.config();
module.exports = {
  development: {
    database: 'tasker-plan',
    dialect: 'postgres',
    host: 'db',
    username: 'root',
    password: process.env.DB_PASS,
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
