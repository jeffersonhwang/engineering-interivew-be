import request from 'supertest';
import app from '../app';
import bcrypt from 'bcrypt';
import prisma from '../config/database';

describe('Auth API', () => {
  beforeAll(async () => {
    await prisma.$connect();
    
    await prisma.task.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.task.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany({});
    });

    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com'
        });

      expect(response.status).toBe(400);
    });

    it('should not allow duplicate emails', async () => {
      // Create a user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123'
        });

      // Try to create another user with the same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'anotherpassword'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/token', () => {
    beforeEach(async () => {
      // Clear users before each test
      await prisma.user.deleteMany({});

      // Create a test user
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword
        }
      });
    });

    it('should return a token with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .set('Authorization', 'Basic ' + Buffer.from('test@example.com:testpassword').toString('base64'));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
    });

    it('should require Basic authentication', async () => {
      const response = await request(app)
        .post('/api/auth/token');

      expect(response.status).toBe(401);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .set('Authorization', 'Basic ' + Buffer.from('test@example.com:wrongpassword').toString('base64'));

      expect(response.status).toBe(401);
    });
  });
});
