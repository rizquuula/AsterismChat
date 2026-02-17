import { Router } from 'express';
import { agentsController } from '../controllers/agentsController';

const router = Router();

// Get all agents
router.get('/', agentsController.getAll);

// Get single agent
router.get('/:id', agentsController.getById);

// Create agent
router.post('/', agentsController.create);

// Update agent
router.put('/:id', agentsController.update);

// Delete agent
router.delete('/:id', agentsController.delete);

export default router;