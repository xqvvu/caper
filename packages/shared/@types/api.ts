export interface Result<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}
