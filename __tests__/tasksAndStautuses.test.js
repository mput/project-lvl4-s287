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
  it('create status', async (done) => {
    const res = await request(app)
      .post('/statuses')
      .set('cookie', cookie)
      .type('form')
      .send({
        form: {
          name: 'TestStatus',
        },
      });
    expect(res.status).toBe(302);
    const createdStatus = await sequelize.models.Status.findOne({ where: { name: 'TestStatus' } });
    expect(createdStatus.default).toBe(null);
    done();
  });
  it('create default status', async (done) => {
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
  it('attempt to create unprocessible status', async (done) => {
    const res = await request(app)
      .post('/statuses')
      .set('cookie', cookie)
      .type('form')
      .send({
        form: {
          name: 'New',
        },
      });
    expect(res.status).toBe(302);
    done();
  });
  it('get edit form', async (done) => {
    const res = await request(app)
      .get('/statuses/1/edit')
      .set('cookie', cookie);
    expect(res.status).toBe(200);
    done();
  });
  it('get edit form with non-existent id', async (done) => {
    const res = await request(app)
      .get('/statuses/14/edit')
      .set('cookie', cookie);
    expect(res.status).toBe(404);
    done();
  });
  it('edit status', async (done) => {
    const name = 'Test';
    const id = 2;
    const res = await request(app)
      .patch(`/statuses/${id}`)
      .set('cookie', cookie)
      .type('form')
      .send({
        form: {
          name,
          makeDefault: 'on',
        },
      });
    expect(res.status).toBe(302);
    const createdStatus = await sequelize.models.Status.findById(id);
    expect(createdStatus.default).toBe(true);
    done();
  });
  it('attempt to edit unprocessible status', async (done) => {
    const name = 'New';
    const id = 2;
    const res = await request(app)
      .patch(`/statuses/${id}`)
      .set('cookie', cookie)
      .type('form')
      .send({
        form: {
          name,
          makeDefault: 'on',
        },
      });
    expect(res.status).toBe(422);
    done();
  });
  it('delete status', async (done) => {
    const id = 2;
    const res = await request(app)
      .delete(`/statuses/${id}`)
      .set('cookie', cookie);
    expect(res.status).toBe(302);
    const createdStatus = await sequelize.models.Status.findById(id);
    expect(createdStatus).toBe(null);
    done();
  });
  it('attempt to delete non-existent status', async (done) => {
    const id = 20;
    const res = await request(app)
      .delete(`/statuses/${id}`)
      .set('cookie', cookie);
    expect(res.status).toBe(302);
    const createdStatus = await sequelize.models.Status.findById(id);
    expect(createdStatus).toBe(null);
    done();
  });
  it('attempt to get statuses when unauthorized', async (done) => {
    const res = await request(app)
      .get('/statuses');
    expect(res.status).toBe(401);
    done();
  });
});

describe('Tasks', () => {
  it('get tasks', async () => {
    const res = await request(app)
      .get('/tasks')
      .set('cookie', cookie);
    expect(res.status).toBe(200);
  });
  it('get tasks with filters', async () => {
    const res = await request(app)
      .get('/tasks/my?assignedToUser=johnson%40me.com&hasStatusId=1&hasTags=%23Tags')
      .set('cookie', cookie);
    expect(res.status).toBe(200);
  });
  it('attempt to get tasks unauthorized', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(401);
  });
  it('get new task form', async () => {
    const res = await request(app)
      .get('/tasks/new')
      .set('cookie', cookie);
    expect(res.status).toBe(200);
  });
  it('create new task', async () => {
    const form = {
      name: 'Test task #with #new_tag',
      description: 'Has description #tag',
      StatusId: '1',
      AssignedToId: '3',
    };
    const res = await request(app)
      .post('/tasks')
      .set('cookie', cookie)
      .type('form')
      .send({ form });
    expect(res.status).toBe(302);
    const createdTask = await sequelize.models.Task.scope('withAssotiation').findOne({ where: { name: form.name } });
    expect(createdTask.CreatorId).toBe(2);
    expect(createdTask.AssignedToId).toBe(3);
    expect(createdTask.StatusId).toBe(1);
  });
  it('get edit task form', async () => {
    const res = await request(app)
      .get('/tasks/2/edit')
      .set('cookie', cookie);
    expect(res.status).toBe(200);
    const badRes = await request(app)
      .get('/tasks/20/edit')
      .set('cookie', cookie);
    expect(badRes.status).toBe(404);
  });
  it('edit task', async () => {
    const name = 'Test task #with #new_tag';
    const id = 1;
    const res = await request(app)
      .patch(`/tasks/${id}`)
      .set('cookie', cookie)
      .type('form')
      .send({ form: { name } });
    expect(res.status).toBe(302);
    const createdTask = await sequelize.models.Task.findById(id);
    expect(createdTask.name).toBe(name);
  });
  it('delete task', async () => {
    const name = 'Test task #with #new_tag';
    const id = 1;
    const res = await request(app)
      .delete(`/tasks/${id}`)
      .set('cookie', cookie)
      .type('form')
      .send({ form: { name } });
    expect(res.status).toBe(302);
    const createdTask = await sequelize.models.Task.findById(id);
    expect(createdTask).toBe(null);
  });
});
