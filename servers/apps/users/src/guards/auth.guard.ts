import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GqlExecutionContext } from '@nestjs/graphql'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { Request } from 'express'
import { PrismaService } from '../../../../prisma/prisma.service'

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly ACCESS_TOKEN_SECRET: string
  private readonly REFRESH_TOKEN_SECRET: string
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.ACCESS_TOKEN_SECRET = this.config.get<string>('ACCESS_TOKEN_SECRET')
    this.REFRESH_TOKEN_SECRET = this.config.get<string>('REFRESH_TOKEN_SECRET')
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context)
    const { req }: { req: Request } = gqlContext.getContext()

    const accessToken = req.headers.accesstoken as string
    const refreshToken = req.headers.refreshtoken as string

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Please login to access this resource!')
    }

    const decode = this.jwtService.verify(accessToken, {
      secret: this.ACCESS_TOKEN_SECRET
    })

    if (!decode) {
      throw new UnauthorizedException('Invalid access token!')
    }

    await this.updateAccessToken(req, refreshToken)

    return true
  }

  async updateAccessToken(req: Request, refreshToken: string) {
    try {
      const decode = this.jwtService.verify(refreshToken, {
        secret: this.REFRESH_TOKEN_SECRET
      })

      if (!decode) {
        throw new UnauthorizedException('Invalid refresh token!')
      }
      const user = await this.prisma.user.findUnique({
        where: {
          id: decode.id
        }
      })

      console.log(user, decode)

      const newAccessToken = this.jwtService.sign(
        { id: user.id },
        {
          secret: this.ACCESS_TOKEN_SECRET,
          expiresIn: '15m'
        }
      )

      const newRefreshToken = this.jwtService.sign(
        { id: user.id },
        {
          secret: this.REFRESH_TOKEN_SECRET,
          expiresIn: '15d'
        }
      )
      req.accessToken = newAccessToken
      req.refreshToken = newRefreshToken
      req.user = user
    } catch (error) {
      console.log(error)
    }
  }
}
