import express from 'express';
import { body } from 'express-validator';
import { login, register, getMe, updatePassword, updateProfile, refreshToken } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';

const router = express.Router();

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], validate, login);

router.post('/refresh-token', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], validate, refreshToken);

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'project_manager', 'site_engineer', 'procurement_staff', 'accounts_staff', 'store_keeper']).withMessage('Invalid role')
], validate, authenticate, authorize('admin'), register);

router.get('/me', authenticate, getMe);

router.put('/password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], validate, updatePassword);

router.put('/profile', authenticate, [
  body('name').trim().notEmpty()
], validate, updateProfile);

export default router;
export { router };
