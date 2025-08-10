import { PrismaClient } from '@prisma/client';
import { TaskValidation } from '../models/Task';
import { UserValidation } from '../models/User';

const prisma = new PrismaClient()
                    .$extends(TaskValidation)
                    .$extends(UserValidation);

export default prisma;