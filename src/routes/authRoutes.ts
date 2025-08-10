import { Router } from 'express';
import { register, getToken } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/token', getToken);

export default router;
