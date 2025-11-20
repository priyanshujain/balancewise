const MAX_RETRY_COUNT = 3;
const RETRY_DELAYS_MS = [10000, 30000, 60000];

export class RetryStrategy {
  getRetryDelay(retryCount: number): number {
    if (retryCount >= MAX_RETRY_COUNT) {
      return 0;
    }

    return RETRY_DELAYS_MS[retryCount] || 60000;
  }

  shouldRetry(retryCount: number): boolean {
    return retryCount < MAX_RETRY_COUNT;
  }

  async waitForRetry(retryCount: number): Promise<void> {
    const delay = this.getRetryDelay(retryCount);

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  isRetryableError(error: string): boolean {
    const retryablePatterns = [
      'network',
      'timeout',
      'connection',
      'ECONNRESET',
      'ETIMEDOUT',
      'fetch failed',
    ];

    const errorLower = error.toLowerCase();
    return retryablePatterns.some((pattern) => errorLower.includes(pattern));
  }

  isPermanentError(error: string): boolean {
    const permanentPatterns = [
      'quota exceeded',
      'storage full',
      'permission denied',
      'file too large',
      'invalid file',
    ];

    const errorLower = error.toLowerCase();
    return permanentPatterns.some((pattern) => errorLower.includes(pattern));
  }
}

export const retryStrategy = new RetryStrategy();
