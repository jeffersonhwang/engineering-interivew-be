import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import prisma from './config/database';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(errorHandler);

export const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connection established');
    
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      await prisma.$disconnect();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Only start server if this file is run directly (not imported)
if (require.main === module) {
  startServer();
}

export default app;
