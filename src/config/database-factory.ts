import { PrismaClient } from '@prisma/client';

// Factory function to get the appropriate database instance
export const getDatabaseClient = (): PrismaClient => {
  // Check if we're in test environment
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    // Use test database configuration
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/task_app_test'
        }
      },
      log: ['error'], // Minimal logging for tests
    });
  }
  
  // Use regular database configuration
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
};

// Export singleton instance
const prisma = getDatabaseClient();
export default prisma;