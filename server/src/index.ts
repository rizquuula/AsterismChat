import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './db/client';
import logger from './utils/logger';

// Routes
import agentsRouter from './routes/agents';
import groupsRouter from './routes/groups';
import messagesRouter from './routes/messages';
import sessionRouter from './routes/session';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced request logging middleware with timing
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = logger.generateRequestId();
  const startTime = Date.now();
  
  // Attach requestId to request for use in route handlers
  (req as any).requestId = requestId;
  
  // Skip body logging for large payloads
  const skipBody = req.path.startsWith('/api/v1/agents') && req.method === 'POST';
  
  // Log request
  logger.logRequest(req, requestId, { skipBody });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logResponse(req, res, duration, requestId);
  });
  
  next();
});

// Routes
app.use('/api/v1/agents', agentsRouter);
app.use('/api/v1/groups', groupsRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/session', sessionRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = (req as any).requestId;
  logger.error('Unhandled error', {
    requestId,
    error: err,
    stack: err.stack,
    details: { path: req.path, method: req.method },
  });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  const requestId = (req as any).requestId;
  logger.warn(`Route not found: ${req.method} ${req.path}`, { requestId });
  res.status(404).json({ success: false, error: 'Not found' });
});

// Start server
async function start() {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      logger.info(`Server ready`, {
        details: {
          url: `http://localhost:${PORT}`,
          endpoints: [
            { method: 'GET', path: '/api/v1/agents', description: 'List agents' },
            { method: 'POST', path: '/api/v1/agents', description: 'Create agent' },
            { method: 'GET', path: '/api/v1/groups', description: 'List groups' },
            { method: 'POST', path: '/api/v1/groups', description: 'Create group' },
            { method: 'GET', path: '/api/v1/messages', description: 'List messages' },
            { method: 'POST', path: '/api/v1/messages', description: 'Create message' },
            { method: 'PATCH', path: '/api/v1/session/active-group', description: 'Update active group' },
            { method: 'GET', path: '/health', description: 'Health check' },
          ],
        },
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error as Error });
    process.exit(1);
  }
}

start();