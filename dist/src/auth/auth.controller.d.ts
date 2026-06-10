import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        email?: string;
        password?: string;
    }): Promise<{
        token: string;
        user: import("../domain").AuthUser;
    }>;
    signup(body: {
        name?: string;
        email?: string;
        password?: string;
        organizationName?: string;
    }): Promise<{
        token: string;
        user: import("../domain").AuthUser;
    }>;
    me(authorization?: string): Promise<import("../domain").AuthUser>;
}
