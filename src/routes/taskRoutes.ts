import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { getAllTasks, createTask, updateTask } from '../controllers/taskController';

const router = Router();

router.get('/', authenticateJWT, getAllTasks);
router.post('/', authenticateJWT, createTask);
router.patch('/:task_id', authenticateJWT, updateTask);

export default router;
