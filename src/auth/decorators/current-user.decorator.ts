import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../strategies/jwt.strategy';

/**
 * 从请求中取出当前登录用户（由 JWT 解析得到）
 * 仅在受 JwtAuthGuard 保护的接口中有效
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext): JwtUser | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser;
    if (data) {
      return user?.[data];
    }
    return user;
  },
);
