const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Authentication Flow', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pg-test');
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and set HTTP-only cookies', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Check response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data.user');
      expect(response.body).toHaveProperty('data.tokens');

      // Check that cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      // Check for access token cookie
      const accessTokenCookie = cookies.find(cookie => cookie.includes('accessToken'));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      
      // Check for refresh token cookie
      const refreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken'));
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'invalid@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token using refresh token from cookies', async () => {
      // First login to get cookies
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Extract cookies from login response
      const cookies = loginResponse.headers['set-cookie'];

      // Try to refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('success', true);
      expect(refreshResponse.body).toHaveProperty('data.accessToken');

      // Check that new access token cookie is set
      const newCookies = refreshResponse.headers['set-cookie'];
      const newAccessTokenCookie = newCookies.find(cookie => cookie.includes('accessToken'));
      expect(newAccessTokenCookie).toBeDefined();
    });

    it('should return 401 when no refresh token provided', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'No refresh token provided');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      // First login to get cookies
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Extract cookies from login response
      const cookies = loginResponse.headers['set-cookie'];

      // Get current user
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(meResponse.body).toHaveProperty('success', true);
      expect(meResponse.body).toHaveProperty('data.user');
      expect(meResponse.body.data.user).toHaveProperty('email');
      expect(meResponse.body.data.user).toHaveProperty('role');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
}); 