import { TaskStatus as PrismaTaskStatus } from '@prisma/client';

export interface Task {
  title?: string;
  description?: string;
  status?: PrismaTaskStatus;
  isArchived?: boolean;
}