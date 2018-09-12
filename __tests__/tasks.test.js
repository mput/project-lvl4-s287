import path from 'path';
import request from 'supertest';
import sequelizeFixtures from 'sequelize-fixtures';

import models from '../models';
import server from '..';

const fixtures = path.join(__dirname, 'fixtures', 'database-data.yml');
const { sequelize } = models;
const app = server().callback();

let cookie;

beforeEach(async (done) => {
  await sequelize.sync({ force: true });
  await sequelizeFixtures.loadFile(fixtures, models);
  const authRes = await request(app)
    .post('/session')
    .type('form')
    .send({ form: { email: 'admin@admin.com', password: 'admin' } });
  cookie = authRes.header['set-cookie'];
  done();
});


describe('Statuses', () => {
  it('status: get statuses', async (done) => {
    const res = await request(app)
      .get('/statuses')
      .set('cookie', cookie);
    expect(res.status).toBe(200);
    done();
  });
  it('status: create status', async (done) => {
    const res = await request(app)
      .post('/user')
      .set('cookie', cookie)
      .type('form')
      .send({
        form: {
          name: 'TestStatus',
        },
      });
    expect(res.status).toBe(302);
    const createdStatus = await sequelize.models.Status.findOne({ where: { name: 'New' } });
    expect(createdStatus.default).toBe(true);
    done();
  });
  it('status: create default status', async (done) => {
    const name = 'TestStatus';
    const res = await request(app)
      .post('/statuses')
      .set('cookie', cookie)
      .type('form')
      .send({
        form: {
          name, makeDefault: 'on',
        },
      });
    expect(res.status).toBe(302);
    const createdStatus = await sequelize.models.Status.findOne({ where: { name } });
    expect(createdStatus.default).toBeTruthy();
    done();
  });
});

describe('Statuses unauthorized', () => {
  it('status: get statuses', async (done) => {
    const res = await request(app)
      .get('/statuses');
    expect(res.status).toBe(401);
    done();
  });
});
