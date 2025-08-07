import { PrismaClient } from '@prisma/client';

// Create a test-specific Prisma Client
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/task_app_test'
    }
  },
  log: process.env.NODE_ENV !== 'production' ? ['error'] : ['error'], // Reduce logging in tests
});

export default testPrisma;