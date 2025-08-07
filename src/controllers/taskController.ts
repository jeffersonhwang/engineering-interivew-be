import { Request, Response } from 'express';
import { TaskStatus } from '../entities/Task';
import prisma from '../config/database';

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Validate user authentication
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { title, description, status = TaskStatus.TODO } = req.body;
    
    // Validate user authentication
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const validStatuses = Object.values(TaskStatus);
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        validValues: validStatuses
      });
    }
    
    // Create task
    const savedTask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        userId
      }
    });
    
    return res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.task_id);
    const userId = req.user?.userId;
    const { title, description, status } = req.body;
    
    // Validate user authentication
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check ownership
    if (task.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to update this task' });
    }
    
    // Validate status if provided
    if (status) {
      const validStatuses = Object.values(TaskStatus);
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status',
          validValues: validStatuses
        });
      }
    }
    
    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status })
      }
    });
    
    return res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
