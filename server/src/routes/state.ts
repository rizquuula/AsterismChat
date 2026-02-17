import { Router } from 'express';
import { stateController } from '../controllers/stateController';

const router = Router();

// Get full state
router.get('/', stateController.getFullState);

// Save full state
router.post('/', stateController.saveFullState);

// Update active group
router.patch('/active-group', stateController.updateActiveGroup);

export default router;