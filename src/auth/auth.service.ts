import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { AuthUser } from '../domain';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET ?? 'dev-only-token-secret';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      token: this.signToken(user),
      user: this.toAuthUser(user),
    };
  }

  async signup(input: {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
  }) {
    const name = input.name.trim();
    const normalizedEmail = input.email.trim().toLowerCase();
    const password = input.password;
    const organizationName = input.organizationName?.trim() || `${name}'s organization`;

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (!this.isValidEmail(normalizedEmail)) {
      throw new BadRequestException('Valid email is required');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = this.hashPassword(password);
    const user = await this.prisma.$transaction(async (transaction) => {
      const organization = await transaction.organization.create({
        data: {
          name: organizationName,
        },
      });

      return transaction.user.create({
        data: {
          organizationId: organization.id,
          name,
          email: normalizedEmail,
          role: UserRole.ORG_OWNER,
          passwordHash,
        },
      });
    });

    return {
      token: this.signToken(user),
      user: this.toAuthUser(user),
    };
  }

  async createPilotAccount(
    admin: AuthUser,
    input: { name: string; email: string; password: string },
  ) {
    if (!['super_admin', 'org_owner', 'org_admin'].includes(admin.role)) {
      throw new BadRequestException('Only admins can create pilot accounts');
    }

    const name = input.name.trim();
    const normalizedEmail = input.email.trim().toLowerCase();
    const password = input.password;

    if (!name) throw new BadRequestException('Name is required');
    if (!this.isValidEmail(normalizedEmail)) throw new BadRequestException('Valid email is required');
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters');

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const user = await this.prisma.user.create({
      data: {
        organizationId: admin.organizationId,
        name,
        email: normalizedEmail,
        role: UserRole.PILOT,
        passwordHash: this.hashPassword(password),
      },
    });

    return { id: user.id, name: user.name, email: user.email, role: 'pilot' };
  }

  async verifyToken(token: string) {
    const [payloadBase64, signature] = token.split('.');

    if (!payloadBase64 || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expectedSignature = this.sign(payloadBase64);

    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8')) as {
      sub: string;
      exp: number;
    };

    if (payload.exp < Date.now()) {
      throw new UnauthorizedException('Token expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthUser(user);
  }

  hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [, salt, hash] = storedHash.split(':');
    const attemptedHash = scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(hash, 'hex');

    return timingSafeEqual(attemptedHash, storedBuffer);
  }

  private signToken(user: { id: string; role: UserRole; organizationId: string }) {
    const payload = {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
      exp: Date.now() + TOKEN_TTL_MS,
    };
    const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    return `${payloadBase64}.${this.sign(payloadBase64)}`;
  }

  private sign(payloadBase64: string) {
    return createHmac('sha256', TOKEN_SECRET).update(payloadBase64).digest('base64url');
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private toAuthUser(user: {
    id: string;
    organizationId: string;
    name: string;
    email: string;
    role: UserRole;
  }): AuthUser {
    return {
      id: user.id,
      organizationId: user.organizationId,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase() as AuthUser['role'],
    };
  }
}
