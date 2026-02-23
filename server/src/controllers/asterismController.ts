import { Request, Response } from 'express';
import logger from '../utils/logger';

const ASTERISM_BASE_URL = process.env.ASTERISM_API_URL || 'http://localhost:20820';
const FETCH_TIMEOUT_MS = 5000;

interface ConfigUpdateBody {
  key: string;
  value: unknown;
}

interface FetchError extends Error {
  code?: string;
  cause?: Error;
}

function buildVerboseErrorMessage(url: string, error: unknown): string {
  const err = error as FetchError;
  const cause = err.cause;
  
  if (err.code === 'ECONNREFUSED') {
    return `Connection refused (ECONNREFUSED) when connecting to ${url}. Is the asterism service running on port 20820?`;
  }
  
  if (err.code === 'ENOTFOUND') {
    return `DNS lookup failed (ENOTFOUND) for ${url}. Check if the hostname is correct.`;
  }
  
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET') {
    return `Connection ${err.code === 'ETIMEDOUT' ? 'timed out' : 'was reset'} (${err.code}) when connecting to ${url}. The asterism service may be unresponsive.`;
  }
  
  if (cause) {
    return `Fetch failed: ${err.message}. Underlying cause: ${cause.message} (${cause.name}). URL: ${url}`;
  }
  
  return `Fetch failed: ${err.message}. URL: ${url}`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS}ms when fetching ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const asterismController = {
  async getConfig(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const url = `${ASTERISM_BASE_URL}/asterism/config`;
    
    try {
      logger.info('Proxying GET /asterism/config', { requestId, details: { url } });
      
      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Asterism config fetch failed', { 
          requestId, 
          details: { status: response.status, errorText, url },
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
      const verboseMessage = buildVerboseErrorMessage(url, error);
      
      logger.error('Error proxying to asterism', { 
        requestId, 
        error,
        details: { 
          url,
          errorCode: (error as FetchError).code,
          cause: (error as FetchError).cause?.message,
        },
      });
      
      res.status(500).json({ 
        success: false, 
        error: verboseMessage 
      });
    }
  },

  async updateConfig(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;
    const url = `${ASTERISM_BASE_URL}/asterism/config`;
    const { key, value } = req.body as ConfigUpdateBody;
    
    if (!key || value === undefined) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: key and value are required' 
      });
      return;
    }
    
    try {
      logger.info('Proxying PUT /asterism/config', { 
        requestId, 
        details: { key, value, url } 
      });
      
      const response = await fetchWithTimeout(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Asterism config update failed', { 
          requestId, 
          details: { status: response.status, errorText, key, url },
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
      const verboseMessage = buildVerboseErrorMessage(url, error);
      
      logger.error('Error proxying update to asterism', { 
        requestId, 
        error,
        details: { 
          url,
          key,
          errorCode: (error as FetchError).code,
          cause: (error as FetchError).cause?.message,
        },
      });
      
      res.status(500).json({ 
        success: false, 
        error: verboseMessage 
      });
    }
  },
};
