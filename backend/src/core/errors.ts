export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export type ErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export function errorBody(code: string, message: string): ErrorBody {
  return {
    error: { code, message },
  };
}
