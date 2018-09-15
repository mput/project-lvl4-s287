import path from 'path';
import request from 'supertest';
import sequelizeFixtures from 'sequelize-fixtures';

import models from '../models';
import server from '..';

const fixtures = path.join(__dirname, 'fixtures', 'database-data.yml');
const { sequelize } = models;
const app = server().callback();

beforeEach(async (done) => {
  await sequelize.sync();
  await sequelizeFixtures.loadFile(fixtures, models);
  done();
});

afterEach(async (done) => {
  await sequelize.drop();
  done();
});

const getCookie = async () => {
  const authRes = await request(app)
    .post('/session')
    .type('form')
    .send({ form: { email: 'admin@admin.com', password: 'admin' } });
  return authRes.header['set-cookie'];
};

describe('Basic request', () => {
  it('get root', async (done) => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    const authRes = await request(app)
      .get('/')
      .set('Cookie', getCookie());
    expect(authRes.status).toBe(200);
    if (res.error) {
      throw res.error;
    }
    done();
  });

  it('GET 404', async (done) => {
    const res = await request(app).get('/wrong_url');
    expect(res.status).toBe(404);
    done();
  });
});

describe('route:sessions', () => {
  it('get login form', async (done) => {
    const res = await request(app)
      .get('/session/new');
    expect(res.status).toBe(200);
    done();
  });

  it('success login', async (done) => {
    const res = await request(app)
      .post('/session')
      .type('form')
      .send({ form: { email: 'admin@admin.com', password: 'admin' } });
    expect(res.status).toBe(302);
    done();
  });

  it('unsuccessful login', async (done) => {
    const res = await request(app)
      .post('/session')
      .type('form')
      .send({ form: { email: 'admin@admin.com', password: 'wrongPassword' } });
    expect(res.status).toBe(422);
    done();
  });

  it('delete session', async (done) => {
    const cookie = await getCookie();
    const res = await request(app)
      .delete('/session')
      .set('Cookie', cookie);

    expect(res.status).toBe(302);
    done();
  });
});


describe('route:users', () => {
  it('get users', async (done) => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    done();
  });

  it('get new user form', async (done) => {
    const res = await request(app).get('/user/new');
    expect(res.status).toBe(200);
    done();
  });

  it('create new user (couldn\'t reuse email)', async (done) => {
    const res = await request(app)
      .post('/user')
      .type('form')
      .send({
        form: {
          email: 'declan@mail.com', password: 'verystrongpassword', firstName: 'Declan', lastName: 'Jonson',
        },
      });
    expect(res.status).toBe(302);

    const repeatRes = await request(app)
      .post('/user')
      .type('form')
      .send({
        form: {
          email: 'declan@mail.com', password: 'anotherpass', firstName: 'Dorian', lastName: 'Spanser',
        },
      });
    expect(repeatRes.status).toBe(422);
    done();
  });
  it('edit form unauthorized', async (done) => {
    const getRes = await request(app).get('/user/edit');
    expect(getRes.status).toBe(401);
    const patchRes = await request(app)
      .patch('/user')
      .type('form')
      .send({
        form: {
          email: 'declan@mail.com', firstName: 'Dorian', lastName: 'Maried',
        },
      });
    expect(patchRes.status).toBe(401);
    done();
  });

  it('edit form authorized', async (done) => {
    const cookie = await getCookie();
    const res = await request(app)
      .get('/user/edit')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);

    const patchRes = await request(app)
      .patch('/user')
      .set('Cookie', cookie)
      .type('form')
      .send({
        form: {
          email: 'admin@admin.com', password: 'anotherpass', firstName: 'Dorian', lastName: 'Maried',
        },
      });
    expect(patchRes.status).toBe(302);

    const patchWithUsedEmail = await request(app)
      .patch('/user')
      .set('Cookie', cookie)
      .type('form')
      .send({
        form: {
          email: 'karen@mail.com', password: 'anotherpass', firstName: 'Dorian', lastName: 'Maried',
        },
      });
    expect(patchWithUsedEmail.status).toBe(422);
    done();
  });
});
