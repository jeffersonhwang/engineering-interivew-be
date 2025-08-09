import { z } from 'zod';
import { Prisma } from '@prisma/client';

const userSchema = z.object({
  email: z.email(),
  password: z.string().min(1), // password validation is actually done in the controller because this is a hashed password
});

export const UserValidation = Prisma.defineExtension({
  query: {
    user: {
      create({ args, query }) {
        args.data = userSchema.parse(args.data);
        return query(args);
      }
    }
  }
});