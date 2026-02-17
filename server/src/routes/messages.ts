import { Router } from 'express';
import { messagesController } from '../controllers/messagesController';

const router = Router();

// Get all messages (with optional filters)
router.get('/', messagesController.getAll);

// Get single message
router.get('/:id', messagesController.getById);

// Create message
router.post('/', messagesController.create);

// Update message
router.put('/:id', messagesController.update);

// Delete message
router.delete('/:id', messagesController.delete);

// Clear messages by sessionId
router.delete('/clear/session', messagesController.clearBySession);

export default router;