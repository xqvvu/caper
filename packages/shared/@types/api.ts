export interface Result<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

export const HttpCode = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type THttpCode = (typeof HttpCode)[keyof typeof HttpCode];

export const ServiceCode = {
  OK: 2000,
  BAD_REQUEST: 4000,
  UNAUTHORIZED: 4001,
  FORBIDDEN: 4003,
  NOT_FOUND: 4004,
  INTERNAL_SERVER_ERROR: 5000,
} as const;

export type TServiceCode = (typeof ServiceCode)[keyof typeof ServiceCode];
