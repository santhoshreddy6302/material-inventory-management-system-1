import express from 'express';
import { body } from 'express-validator';
import { getAll, create, update, resetPassword } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('admin'), getAll);
router.post('/', authorize('admin'), [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin','project_manager','site_engineer','procurement_staff','accounts_staff','store_keeper'])
], validate, create);
router.put('/:id', authorize('admin'), update);
router.put('/:id/reset-password', authorize('admin'), [
  body('password').isLength({ min: 6 })
], validate, resetPassword);

export default router;
