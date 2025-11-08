import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleDriveOAuthStrategy extends PassportStrategy(
  Strategy,
  'google-drive-oauth',
) {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL =
      'http://localhost:3000/user-services/google-drive/callback';

    super({
      clientID: clientID!,
      clientSecret: clientSecret!,
      callbackURL: callbackURL,
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
      passReqToCallback: true,
    } as any);
  }

  validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): any {
    const { id, emails } = profile;
    // Extract userId from OAuth state parameter
    const userId = req.query?.state;

    const user = {
      providerId: id,
      email: emails?.[0]?.value,
      accessToken,
      refreshToken,
      userId,
    };

    done(null, user);
  }
}
