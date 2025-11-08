import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let user: any = null;

    const authHeader = request.headers.authorization;

    // Try Authorization header first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      try {
        user = await this.authService.verifyToken(token);
      } catch (error) {
        throw new UnauthorizedException('Invalid token');
      }
    }
    // Try query parameter (for OAuth redirects)
    else if (request.query && request.query.token) {
      const token = request.query.token;

      try {
        user = await this.authService.verifyToken(token);
      } catch (error) {
        throw new UnauthorizedException('Invalid token in query parameter');
      }
    }
    // Try cookie
    else if (request.cookies && request.cookies.currentUser) {
      try {
        const cookieData = JSON.parse(request.cookies.currentUser);

        if (cookieData.token) {
          user = await this.authService.verifyToken(cookieData.token);
        }
        else if (cookieData.user) {
          user = cookieData.user;
        }
      } catch (error) {
        throw new UnauthorizedException('Invalid session');
      }
    }

    if (!user) {
      throw new UnauthorizedException('No authentication provided');
    }

    request.user = user;

    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        throw new UnauthorizedException('Insufficient permissions');
      }
    }

    return true;
  }
}
