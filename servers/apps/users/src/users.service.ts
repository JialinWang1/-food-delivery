import { LoginDto, RegisterDto, ActivationDto } from './dto/users.dto'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { Response } from 'express'
import * as bcrypt from 'bcrypt'
import { EmailService } from './email/email.service'

interface UserData {
  name: string
  email: string
  password: string
  phone_number: number
}

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: EmailService
  ) {}

  async register(registerDto: RegisterDto, response: Response) {
    const { name, email, password, phone_number } = registerDto

    const isEmailExist = await this.prisma.user.findUnique({
      where: {
        email
      }
    })
    if (isEmailExist) {
      throw new BadRequestException('User email is already exist')
    }

    const isPhoneNoExist = await this.prisma.user.findUnique({
      where: {
        phone_number
      }
    })
    if (isPhoneNoExist) {
      throw new BadRequestException('User phone is already exist')
    }

    const hashedPassword = bcrypt.hashSync(password, 10)

    const user = {
      name,
      email,
      password: hashedPassword,
      phone_number
    }

    const { token: activation_token, activationCode } = await this.createActivationToken(user)

    await this.mailService.sendMail({
      email,
      subject: 'Activate your account!',
      template: './activation-mail',
      name,
      activationCode
    })

    return { activation_token, response }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto
    const user = {
      email,
      password
    }
    return user
  }

  async getUsers() {
    return await this.prisma.user.findMany({})
  }

  async createActivationToken(user: UserData) {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString()

    const token = await this.jwtService.sign(
      {
        user,
        activationCode
      },
      {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
        expiresIn: '5m'
      }
    )
    return { token, activationCode }
  }

  async activateUser(activationDto: ActivationDto, response: Response) {
    const { activationToken, activationCode } = activationDto

    const newUser: { user: UserData; activationCode: string } = this.jwtService.verify(
      activationToken,
      {
        secret: this.configService.get<string>('ACTIVATION_SECRET')
      }
    )

    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code')
    }

    const { name, password, email, phone_number } = newUser.user

    const existUser = await this.prisma.user.findUnique({
      where: { email }
    })

    if (existUser) {
      throw new BadRequestException('User already exist with this email!~~')
    }

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password,
        phone_number
      }
    })

    return { user, response }
  }
}
