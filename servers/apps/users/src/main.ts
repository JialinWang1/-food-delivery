import { NestFactory } from '@nestjs/core'
import { UsersModule } from './users.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import { User } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      refreshToken?: string
      accessToken?: string
      user?: User
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(UsersModule)
  app.useStaticAssets(join(__dirname, '..', 'public'))
  app.setBaseViewsDir(join(__dirname, '..', 'servers/email-templates'))
  app.setViewEngine('ejs')
  console.log('running on 4001')
  await app.listen(4001)
}
bootstrap()
