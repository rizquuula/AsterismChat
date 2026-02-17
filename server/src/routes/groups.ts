import { Router } from 'express';
import { groupsController } from '../controllers/groupsController';

const router = Router();

// Get all groups
router.get('/', groupsController.getAll);

// Get single group
router.get('/:id', groupsController.getById);

// Create group
router.post('/', groupsController.create);

// Update group
router.put('/:id', groupsController.update);

// Delete group
router.delete('/:id', groupsController.delete);

export default router;