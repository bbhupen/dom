"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET ?? 'dev-only-token-secret';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async login(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user || !this.verifyPassword(password, user.passwordHash)) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        return {
            token: this.signToken(user),
            user: this.toAuthUser(user),
        };
    }
    async signup(input) {
        const name = input.name.trim();
        const normalizedEmail = input.email.trim().toLowerCase();
        const password = input.password;
        const organizationName = input.organizationName?.trim() || `${name}'s organization`;
        if (!name) {
            throw new common_1.BadRequestException('Name is required');
        }
        if (!this.isValidEmail(normalizedEmail)) {
            throw new common_1.BadRequestException('Valid email is required');
        }
        if (password.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            throw new common_1.ConflictException('An account with this email already exists');
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
                    role: client_1.UserRole.ORG_OWNER,
                    passwordHash,
                },
            });
        });
        return {
            token: this.signToken(user),
            user: this.toAuthUser(user),
        };
    }
    async verifyToken(token) {
        const [payloadBase64, signature] = token.split('.');
        if (!payloadBase64 || !signature) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
        const expectedSignature = this.sign(payloadBase64);
        const signatureBuffer = Buffer.from(signature);
        const expectedSignatureBuffer = Buffer.from(expectedSignature);
        if (signatureBuffer.length !== expectedSignatureBuffer.length ||
            !(0, crypto_1.timingSafeEqual)(signatureBuffer, expectedSignatureBuffer)) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
        if (payload.exp < Date.now()) {
            throw new common_1.UnauthorizedException('Token expired');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.toAuthUser(user);
    }
    hashPassword(password) {
        const salt = (0, crypto_1.randomBytes)(16).toString('hex');
        const hash = (0, crypto_1.scryptSync)(password, salt, 64).toString('hex');
        return `scrypt:${salt}:${hash}`;
    }
    verifyPassword(password, storedHash) {
        const [, salt, hash] = storedHash.split(':');
        const attemptedHash = (0, crypto_1.scryptSync)(password, salt, 64);
        const storedBuffer = Buffer.from(hash, 'hex');
        return (0, crypto_1.timingSafeEqual)(attemptedHash, storedBuffer);
    }
    signToken(user) {
        const payload = {
            sub: user.id,
            role: user.role,
            organizationId: user.organizationId,
            exp: Date.now() + TOKEN_TTL_MS,
        };
        const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
        return `${payloadBase64}.${this.sign(payloadBase64)}`;
    }
    sign(payloadBase64) {
        return (0, crypto_1.createHmac)('sha256', TOKEN_SECRET).update(payloadBase64).digest('base64url');
    }
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    toAuthUser(user) {
        return {
            id: user.id,
            organizationId: user.organizationId,
            name: user.name,
            email: user.email,
            role: user.role.toLowerCase(),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map