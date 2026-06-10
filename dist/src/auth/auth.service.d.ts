import { AuthUser } from '../domain';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    login(email: string, password: string): Promise<{
        token: string;
        user: AuthUser;
    }>;
    signup(input: {
        name: string;
        email: string;
        password: string;
        organizationName?: string;
    }): Promise<{
        token: string;
        user: AuthUser;
    }>;
    verifyToken(token: string): Promise<AuthUser>;
    hashPassword(password: string): string;
    private verifyPassword;
    private signToken;
    private sign;
    private isValidEmail;
    private toAuthUser;
}
