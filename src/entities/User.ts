import { User as PrismaUser, Task as PrismaTask } from '@prisma/client';

// Export Prisma generated types
export type User = PrismaUser;
export type UserWithTasks = PrismaUser & {
  tasks: PrismaTask[];
};
