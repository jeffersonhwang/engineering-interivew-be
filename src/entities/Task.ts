import { Task as PrismaTask, TaskStatus as PrismaTaskStatus, User as PrismaUser } from '@prisma/client';

// Export Prisma generated types and enums
export type Task = PrismaTask;
export type TaskWithUser = PrismaTask & {
  user: PrismaUser;
};

// Re-export TaskStatus enum from Prisma
export const TaskStatus = PrismaTaskStatus;
