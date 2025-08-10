import { z } from 'zod';
import { Prisma, TaskStatus as PrismaTaskStatus } from '@prisma/client';

export const TaskStatus = PrismaTaskStatus;

const taskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less')
    .transform(val => val.trim()),
  description: z.string()
    .max(10000, 'Description must be 10000 characters or less')
    .transform(val => val?.trim())
    .optional(),
  status: z.enum(TaskStatus).optional().default(TaskStatus.TODO),
  isArchived: z.boolean().optional().default(false),
  userId: z.number().int()
});

export const TaskValidation = Prisma.defineExtension({
  query: {
    task: {
      create({ args, query }) {
        args.data = taskSchema.parse(args.data);
        return query(args);
      },
      update({ args, query }) {
        args.data = taskSchema.partial().parse(args.data);
        return query(args);
      }
    }
  }
});