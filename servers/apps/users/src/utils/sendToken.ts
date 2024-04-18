import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { User } from '@prisma/client'

export class TokenSender {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  sendToken(user: User) {
    console.log(
      this.config.get<string>('ACCESS_TOKEN_SECRET'),
      this.config.get<string>('REFRESH_TOKEN_SECRET')
    )
    const accessToken = this.jwtService.sign(
      { id: user.id },
      {
        secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m'
      }
    )

    const refreshToken = this.jwtService.sign(
      { id: user.id },
      {
        secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: '3d'
      }
    )

    return { accessToken, refreshToken, user }
  }
}
