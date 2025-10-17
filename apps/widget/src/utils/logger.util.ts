/**
 * Simple logger utility for the widget
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  error(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, data || '');
    }
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}

export const logger = new Logger();
