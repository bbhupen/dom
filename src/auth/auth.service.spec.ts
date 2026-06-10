import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const user = {
    id: 'USR-0001',
    organizationId: 'ORG-0001',
    name: 'Admin User',
    email: 'admin@droneops.in',
    role: 'SUPER_ADMIN' as const,
    passwordHash:
      'scrypt:9b6827c67ce625b691095c85b23469ce:3d724c0c073244ae0f7d3d1170fcdb68dc56ba1a8268477844cec5034ee9147138fa062b995b37896b308ad98ef3613d7c3cfc95e27e4a5845990ac180e8e1bd',
  };
  const prisma = {
    $transaction: jest.fn(),
    organization: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    prisma.$transaction.mockReset();
    prisma.organization.create.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.create.mockReset();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    service = new AuthService(prisma as never);
  });

  it('logs in a seeded admin user and verifies the returned token', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.login('admin@droneops.in', 'password123');

    expect(result.user.role).toBe('super_admin');
    expect(result.token).toBeTruthy();
    await expect(service.verifyToken(result.token)).resolves.toEqual(result.user);
  });

  it('rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.login('admin@droneops.in', 'wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('signs up an organization owner with a new organization', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.organization.create.mockResolvedValue({ id: 'ORG-NEW', name: 'Aarav Solar' });
    prisma.user.create.mockResolvedValue({
      id: 'USR-NEW',
      organizationId: 'ORG-NEW',
      name: 'Aarav',
      email: 'aarav@example.com',
      role: 'ORG_OWNER',
      passwordHash: user.passwordHash,
    });

    const result = await service.signup({
      name: 'Aarav',
      email: 'AARAV@example.com',
      password: 'password123',
      organizationName: 'Aarav Solar',
    });

    expect(result.user).toMatchObject({
      organizationId: 'ORG-NEW',
      name: 'Aarav',
      email: 'aarav@example.com',
      role: 'org_owner',
    });
    expect(result.token).toBeTruthy();
  });

  it('rejects duplicate signup emails', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      service.signup({
        name: 'Admin',
        email: 'admin@droneops.in',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects weak signup passwords', async () => {
    await expect(
      service.signup({
        name: 'Aarav',
        email: 'aarav@example.com',
        password: 'short',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
