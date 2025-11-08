import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleDriveOAuthGuard extends AuthGuard('google-drive-oauth') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // Extract userId from query param if available (set in connect route)
    const state = request.query?.state || request.user?.userId;

    return {
      accessType: 'offline',
      prompt: 'consent',
      state: state,
    };
  }
}
