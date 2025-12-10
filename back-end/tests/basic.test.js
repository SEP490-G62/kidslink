const request = require('supertest');
const { app } = require('../server');

describe('Basic API Tests', () => {
  test('Health check endpoint works', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  test('Root endpoint works', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('KidsLink');
  });
});
