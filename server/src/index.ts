import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './db/client';

// Routes
import agentsRouter from './routes/agents';
import groupsRouter from './routes/groups';
import messagesRouter from './routes/messages';
import stateRouter from './routes/state';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/v1/agents', agentsRouter);
app.use('/api/v1/groups', groupsRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/state', stateRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Start server
async function start() {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 API endpoints:`);
      console.log(`   GET  /api/v1/state        - Get full state`);
      console.log(`   POST /api/v1/state        - Save full state`);
      console.log(`   GET  /api/v1/agents       - List agents`);
      console.log(`   POST /api/v1/agents       - Create agent`);
      console.log(`   GET  /api/v1/groups       - List groups`);
      console.log(`   POST /api/v1/groups       - Create group`);
      console.log(`   GET  /api/v1/messages     - List messages`);
      console.log(`   POST /api/v1/messages     - Create message`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();