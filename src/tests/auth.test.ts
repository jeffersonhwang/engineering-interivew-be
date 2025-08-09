import request from 'supertest';
import app from '../app';
import bcrypt from 'bcrypt';
import prisma from '../factories/database-factory';

describe('Auth API', () => {
  beforeAll(async () => {
    await prisma.$connect();
    
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
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

    it('should require a valid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toBe('email');
      expect(response.body.errors[0].message.length).toBeGreaterThan(0);
    });

    it('should require a valid password', async () => { 
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'short'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Password must be at least 8 characters long');
    });

    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com'
        });

      expect(response.status).toBe(422);
    });

    it('should hash the password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });

      const user = await prisma.user.findUnique({
        where: {
          email: 'newuser@example.com'
        }
      });

      expect(user).toBeDefined();
      expect(user?.password).not.toBe('password123');
    });

    it('should not allow duplicate emails', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123'
        });

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
      await prisma.user.deleteMany({});

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
