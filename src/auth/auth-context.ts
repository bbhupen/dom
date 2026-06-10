import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

export async function getAuthUser(authService: AuthService, authorization?: string) {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

  if (!token) {
    throw new UnauthorizedException('Missing bearer token');
  }

  return authService.verifyToken(token);
}
