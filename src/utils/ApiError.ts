import { ZodError } from "zod";

class ApiError extends Error {
  public statusCode: number;
  public message: string;
  public errors: [] | undefined = [];
  static statusCode: number;
  public isOperational: boolean;
  constructor(
    statusCode: number,
    message: string = "Something went Wrong.",
    errors?: [],
    stack: string = ""
  ) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.isOperational = true;
    if (stack) {
      this.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class ValidationError extends ApiError {
  constructor(
    public zodError: ZodError,
    statusCode: number = 401,
    message: string = "Validation error."
  ) {
    super(statusCode, message);
    this.zodError = zodError;
  }
}
export { ApiError, ValidationError };
