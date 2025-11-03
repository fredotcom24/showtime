export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    verified: boolean;
  };

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
