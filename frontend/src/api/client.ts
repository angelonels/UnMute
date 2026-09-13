const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

async function readError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return new ApiError(
      payload.error?.code ?? 'REQUEST_FAILED',
      payload.error?.message ?? 'Request failed',
      response.status,
    );
  } catch {
    return new ApiError('REQUEST_FAILED', 'Request failed', response.status);
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(baseUrl + url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw await readError(response);
  }

  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
