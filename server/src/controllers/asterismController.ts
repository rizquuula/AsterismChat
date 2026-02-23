import { Request, Response } from 'express';
import logger from '../utils/logger';

const ASTERISM_BASE_URL = process.env.ASTERISM_API_URL || 'http://localhost:20820';

interface ConfigUpdateBody {
  key: string;
  value: unknown;
}

export const asterismController = {
  async getConfig(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    
    try {
      logger.info('Proxying GET /asterism/config', { requestId });
      
      const response = await fetch(`${ASTERISM_BASE_URL}/asterism/config`);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Asterism config fetch failed', { 
          requestId, 
          details: { status: response.status, errorText },
        });
        res.status(response.status).json({ 
          success: false, 
          error: `Failed to fetch config: ${response.statusText}` 
        });
        return;
      }
      
      const data = await response.json();
      res.json({ success: true, data });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error proxying to asterism', { requestId, error });
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Internal server error' 
      });
    }
  },

  async updateConfig(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const { key, value } = req.body as ConfigUpdateBody;
    
    if (!key || value === undefined) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: key and value are required' 
      });
      return;
    }
    
    try {
      logger.info('Proxying PUT /asterism/config', { requestId, details: { key, value } });
      
      const response = await fetch(`${ASTERISM_BASE_URL}/asterism/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Asterism config update failed', { 
          requestId, 
          details: { status: response.status, errorText, key },
        });
        res.status(response.status).json({ 
          success: false, 
          error: `Failed to update config: ${response.statusText}` 
        });
        return;
      }
      
      const data = await response.json();
      res.json({ success: true, data });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error proxying update to asterism', { requestId, error, details: { key } });
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Internal server error' 
      });
    }
  },
};
