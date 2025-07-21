export interface JwtPayload {
  sub?: string;
  email?: string;
  service?: string;
  role: string;
  iat?: number;
  exp?: number;
}
