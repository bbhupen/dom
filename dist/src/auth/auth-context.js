"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthUser = getAuthUser;
const common_1 = require("@nestjs/common");
async function getAuthUser(authService, authorization) {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (!token) {
        throw new common_1.UnauthorizedException('Missing bearer token');
    }
    return authService.verifyToken(token);
}
//# sourceMappingURL=auth-context.js.map