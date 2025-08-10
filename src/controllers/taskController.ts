import { Request, Response } from 'express';
import { Task } from '../types';
import prisma from '../services/prisma';
import { z } from 'zod';

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const tasks = await prisma.task.findMany({
      where: { userId }
    });

    return res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, description, status, isArchived } = req.body;
    
    const taskInput: Task = { title, description, status, isArchived };
    
    const savedTask = await prisma.task.create({
      data: {
        title: taskInput.title!,
        description: taskInput.description,
        status: taskInput.status,
        isArchived: taskInput.isArchived,
        userId
      }
    });
    
    return res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.task_id);
    const userId = req.user!.userId;
    const { title, description, status, isArchived } = req.body;
    
    const taskInput: Task = { title, description, status, isArchived };
    
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to update this task' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...taskInput,
        userId
      }
    });
    
    return res.json(updatedTask);
  } catch (error: any) {
    console.error('Error updating task:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};