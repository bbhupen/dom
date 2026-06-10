import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { getAuthUser } from './auth-context';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email?: string; password?: string }) {
    return this.authService.login(body.email ?? '', body.password ?? '');
  }

  @Post('signup')
  signup(
    @Body()
    body: {
      name?: string;
      email?: string;
      password?: string;
      organizationName?: string;
    },
  ) {
    return this.authService.signup({
      name: body.name ?? '',
      email: body.email ?? '',
      password: body.password ?? '',
      organizationName: body.organizationName,
    });
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    return getAuthUser(this.authService, authorization);
  }
}
