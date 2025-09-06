/**
 * Base service class providing common functionality for all services
 */
export abstract class BaseService {
  /**
   * Handle service errors and provide consistent error format
   */
  protected handleError(error: unknown, context: string): never {
    if (error instanceof Error) {
      throw new TypeError(`${context}: ${error.message}`);
    }
    throw new Error(`${context}: Unknown error occurred`);
  }

  /**
   * Validate input using a validator function
   */
  protected validateInput<T>(input: unknown, validator: (input: unknown) => T, context: string): T {
    try {
      return validator(input);
    }
    catch (error) {
      this.handleError(error, `Validation failed in ${context}`);
    }
  }
}
