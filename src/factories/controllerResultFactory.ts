interface ControllerResult {
    success: boolean;
    data?: any;
    error?: string;
    status?: number;
    metadata?: Record<string, any>;
  }
  
  class ControllerResultFactory {
    static success(data?: any, status: number = 200): ControllerResult {
      return {
        success: true,
        data,
        status
      };
    }
  
    static error(error: string, status: number = 500): ControllerResult {
      return {
        success: false,
        error,
        status
      };
    }
  
    static notFound(message: string = "Resource not found"): ControllerResult {
      return {
        success: false,
        error: message,
        status: 404
      };
    }
  
    static fromError(error: any): ControllerResult {
      if (error.name === 'ValidationError') {
        return {
          success: false,
          error: "Validation failed",
          data: error.errors,
          status: 400
        };
      }
      return {
        success: false,
        error: error.message,
        status: error.statusCode || 500
      };
    }
  }
  
  export default ControllerResultFactory;