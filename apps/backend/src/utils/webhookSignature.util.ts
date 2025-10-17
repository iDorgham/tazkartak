import crypto from 'crypto';

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = generateWebhookSignature(payload, secret);
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Parse webhook signature header
 * Supports both 'sha256=signature' and 'signature' formats
 */
export function parseWebhookSignature(header: string): string {
  if (!header) {
    return '';
  }

  // Handle 'sha256=signature' format
  if (header.startsWith('sha256=')) {
    return header.substring(7);
  }

  // Handle plain signature format
  return header;
}

/**
 * Validate webhook signature from request
 */
export function validateWebhookRequest(
  payload: string | Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
  const signature = parseWebhookSignature(signatureHeader);
  
  return verifyWebhookSignature(payloadString, signature, secret);
}

/**
 * Create webhook signature header
 */
export function createWebhookSignatureHeader(payload: string, secret: string): string {
  const signature = generateWebhookSignature(payload, secret);
  return `sha256=${signature}`;
}

/**
 * Generate webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Webhook signature middleware for Express
 */
export function webhookSignatureMiddleware(secret: string) {
  return (req: any, res: any, next: any) => {
    const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];
    
    if (!signature) {
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    const payload = JSON.stringify(req.body);
    const isValid = validateWebhookRequest(payload, signature as string, secret);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    next();
  };
}

/**
 * Webhook signature validation for custom endpoints
 */
export function validateWebhookSignature(
  req: any,
  secret: string,
  options: {
    headerName?: string;
    algorithm?: string;
  } = {}
): boolean {
  const { headerName = 'x-webhook-signature', algorithm = 'sha256' } = options;
  
  const signature = req.headers[headerName];
  
  if (!signature) {
    return false;
  }

  const payload = JSON.stringify(req.body);
  return validateWebhookRequest(payload, signature, secret);
}

/**
 * Extract webhook event type from payload
 */
export function extractWebhookEvent(payload: any): string | null {
  if (typeof payload === 'object' && payload !== null) {
    return payload.event || payload.type || null;
  }
  return null;
}

/**
 * Create standardized webhook payload
 */
export function createWebhookPayload(
  event: string,
  data: any,
  options: {
    timestamp?: Date;
    id?: string;
    version?: string;
  } = {}
): any {
  const {
    timestamp = new Date(),
    id = crypto.randomUUID(),
    version = '1.0'
  } = options;

  return {
    id,
    event,
    timestamp: timestamp.toISOString(),
    version,
    data
  };
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload(payload: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object');
    return { isValid: false, errors };
  }

  if (!payload.event || typeof payload.event !== 'string') {
    errors.push('Payload must contain a valid event field');
  }

  if (!payload.timestamp || !payload.data) {
    errors.push('Payload must contain timestamp and data fields');
  }

  if (payload.timestamp && isNaN(Date.parse(payload.timestamp))) {
    errors.push('Payload timestamp must be a valid ISO date string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
