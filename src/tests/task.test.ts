import { TaskStatus } from '../models/Task';
import request from 'supertest';
import app from '../app';
import bcrypt from 'bcrypt';
import prisma from '../factories/database-factory';

describe('Task API', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    await prisma.$connect();
    
    await prisma.task.deleteMany({});
    await prisma.user.deleteMany({});

    const hashedPassword = await bcrypt.hash('taskpassword', 10);
    const savedUser = await prisma.user.create({
      data: {
        email: 'taskuser@example.com',
        password: hashedPassword
      }
    });
    
    userId = savedUser.id;

    const response = await request(app)
      .post('/api/auth/token')
      .set('Authorization', 'Basic ' + Buffer.from('taskuser@example.com:taskpassword').toString('base64'));

    authToken = response.body.token;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await prisma.task.deleteMany({});
    });

    it('should return an empty array when no tasks exist', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should only return tasks for the authenticated user', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@example.com',
          password: await bcrypt.hash('otherpassword', 10)
        }
      });

      await prisma.task.create({
        data: {
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.TODO,
          userId
        }
      });

      await prisma.task.create({
        data: {
          title: 'Test Task 2',
          description: 'Test Description 2',
          status: TaskStatus.IN_PROGRESS,
          userId: otherUser.id
        }
      });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Test Task');
      expect(response.body[0].status).toBe(TaskStatus.TODO);
      expect(response.body[0].userId).toBe(userId);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Task',
          description: 'New Description',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Task');
      expect(response.body.description).toBe('New Description');
      expect(response.body.status).toBe(TaskStatus.TODO);
      expect(response.body.isArchived).toBe(false);
      expect(response.body.userId).toBe(userId);
    });

    it('should require a title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'New Description'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toBe('title');
      expect(response.body.errors[0].message.length).toBeGreaterThan(0);
    });

    it('should require a title with maximum length of 255 characters', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'a'.repeat(256),
          description: 'New Description'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toBe('title');
      expect(response.body.errors[0].message.length).toBeGreaterThan(0);
    });

    it('should require a description with maximum length of 1000 characters', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Task',
          description: 'a'.repeat(1001)
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toBe('description');
      expect(response.body.errors[0].message.length).toBeGreaterThan(0);
    });

    it('should validate task status', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Task',
          status: 'Invalid Status'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toBe('status');
      expect(response.body.errors[0].message.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/tasks/:task_id', () => {
    let taskId: number;

    beforeEach(async () => {
      await prisma.task.deleteMany({});
      
      const savedTask = await prisma.task.create({
        data: {
          title: 'Test Task for Update',
          description: 'Test Description',
          status: TaskStatus.TODO,
          userId
        }
      });
      taskId = savedTask.id;
    });

    it('should update a task', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          status: TaskStatus.IN_PROGRESS
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .patch('/api/tasks/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(404);
    });

    it('should validate task status on update', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Invalid Status'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toBe('status');
      expect(response.body.errors[0].message.length).toBeGreaterThan(0);
    });
  });

  describe('Unexpected error handling', () => {
    it('should handle unexpected database errors gracefully', async () => {
      const findManySpy = jest.spyOn(prisma.task, 'findMany')
        .mockRejectedValueOnce(new Error('Unexpected database error'));

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: 'Internal server error',
        error: undefined
      });

      findManySpy.mockRestore();
    });
  });
});
