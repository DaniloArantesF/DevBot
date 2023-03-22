import { getCookie } from 'cookies-next';

interface FetchErrorProps {
  message: string;
  response: Response;
  data?: {
    message: string;
  };
}

export class FetchError extends Error {
  response: Response;
  data: {
    message: string;
  };

  constructor({ message, response, data }: FetchErrorProps) {
    super(message);

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }

    this.name = 'FetchError';
    this.response = response;
    this.data = data ?? { message: message };
  }
}

export default async function fetchJson<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const token = getCookie('token');
  const headers = init?.headers ? new Headers(init.headers) : new Headers();

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new FetchError({
      message: `An error occurred while fetching ${input}`,
      response,
      data,
    });
  }

  return data;
}
