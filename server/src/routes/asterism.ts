import { Router } from 'express';
import { asterismController } from '../controllers/asterismController';

const router = Router();

router.get('/config', asterismController.getConfig);
router.put('/config', asterismController.updateConfig);

export default router;
