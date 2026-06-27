import express from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/enquiryController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;