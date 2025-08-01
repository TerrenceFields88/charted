import DOMPurify from 'dompurify';

// Content validation constants
export const VALIDATION_LIMITS = {
  POST_CONTENT: { min: 1, max: 2000 },
  PREDICTION_TEXT: { min: 1, max: 500 },
  USERNAME: { min: 1, max: 50 },
  DISPLAY_NAME: { min: 1, max: 100 },
  BIO: { min: 1, max: 500 },
  COMMENT_CONTENT: { min: 1, max: 1000 },
  COMMUNITY_NAME: { min: 1, max: 100 },
  COMMUNITY_DESCRIPTION: { min: 1, max: 1000 },
} as const;

// File upload security constants
export const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

// Username validation regex
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

// Content sanitization
export const sanitizeContent = (content: string): string => {
  if (!content) return '';
  
  // Use DOMPurify for client-side sanitization
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  return sanitized.trim();
};

// Content validation functions
export const validateContent = (content: string, limits: { min: number; max: number }): string | null => {
  if (!content || content.trim().length === 0) {
    return 'Content cannot be empty';
  }
  
  const length = content.trim().length;
  if (length < limits.min) {
    return `Content must be at least ${limits.min} characters`;
  }
  
  if (length > limits.max) {
    return `Content must be no more than ${limits.max} characters`;
  }
  
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required';
  
  const trimmed = username.trim();
  const lengthError = validateContent(trimmed, VALIDATION_LIMITS.USERNAME);
  if (lengthError) return lengthError;
  
  if (!USERNAME_REGEX.test(trimmed)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  
  return null;
};

export const validatePredictionConfidence = (confidence: number | null): string | null => {
  if (confidence === null || confidence === undefined) return null;
  
  if (confidence < 0 || confidence > 100) {
    return 'Prediction confidence must be between 0 and 100';
  }
  
  return null;
};

// File validation functions
export const validateImageFile = (file: File): string | null => {
  // Check file size
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    return `File size must be less than ${FILE_VALIDATION.MAX_SIZE / (1024 * 1024)}MB`;
  }
  
  // Check file type
  if (!FILE_VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return 'Only JPEG, PNG, and WebP images are allowed';
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = FILE_VALIDATION.ALLOWED_EXTENSIONS.some(ext => 
    fileName.endsWith(ext)
  );
  
  if (!hasValidExtension) {
    return 'Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed';
  }
  
  return null;
};

// Additional security checks for file content
export const validateImageContent = async (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Check minimum dimensions to ensure it's a valid image
      if (img.width < 1 || img.height < 1) {
        resolve('Invalid image file');
        return;
      }
      
      // Check maximum dimensions for security
      if (img.width > 4096 || img.height > 4096) {
        resolve('Image dimensions too large (max 4096x4096)');
        return;
      }
      
      resolve(null);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('Invalid or corrupted image file');
    };
    
    img.src = url;
  });
};

// Secure filename generation
export const generateSecureFilename = (originalName: string, userId: string): string => {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  
  return `${userId}/${timestamp}-${random}.${extension}`;
};

// Rate limiting helper (client-side)
export class RateLimiter {
  private attempts = new Map<string, number[]>();
  
  constructor(private maxAttempts: number = 5, private windowMs: number = 60000) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }
}

// Error message sanitization
export const sanitizeErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return sanitizeContent(error);
  }
  
  if (error?.message) {
    // Remove potentially sensitive information from error messages
    let message = error.message;
    
    // Remove SQL error details
    message = message.replace(/SQL.*?;/gi, 'Database error');
    message = message.replace(/ERROR:.*?DETAIL:/gi, 'An error occurred.');
    
    // Remove file paths
    message = message.replace(/\/[\w\/.-]+/g, '[path]');
    
    // Remove IP addresses
    message = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]');
    
    return sanitizeContent(message);
  }
  
  return 'An unexpected error occurred';
};