import { Router } from 'express';
import { asterismController } from '../controllers/asterismController';

const router = Router();

router.get('/config', asterismController.getConfig);
router.get('/config/schema', asterismController.getConfigSchema);
router.put('/config', asterismController.updateConfig);

export default router;
