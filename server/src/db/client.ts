import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export default prisma;

export async function connectDatabase() {
  const startTime = Date.now();
  try {
    await prisma.$connect();
    const duration = Date.now() - startTime;
    logger.info('Database connected', { 
      operation: 'connectDatabase', 
      duration,
      details: { host: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || 'default' }
    });
  } catch (error) {
    logger.error('Failed to connect to database', { 
      operation: 'connectDatabase',
      error: error as Error 
    });
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected', { operation: 'disconnectDatabase' });
  } catch (error) {
    logger.error('Failed to disconnect from database', { 
      operation: 'disconnectDatabase',
      error: error as Error 
    });
  }
}
