import request from 'supertest';
import server from '..';

const app = server().callback();

describe('requests', () => {
  it('GET 200', async (done) => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
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
