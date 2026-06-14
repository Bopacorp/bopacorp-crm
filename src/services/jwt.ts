export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export function decodeJwtPayload(token: string): JwtPayload {
  const base64Url = token.split('.')[1];
  if (!base64Url) throw new Error('Invalid JWT');
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64)) as JwtPayload;
}
