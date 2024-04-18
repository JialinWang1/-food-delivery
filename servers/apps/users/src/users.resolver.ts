import { Args, Query, Mutation, Resolver, Context } from '@nestjs/graphql'
import { UsersService } from './users.service'
import {
  ActivationResponse,
  LoginResponse,
  LogoutResponse,
  RegisterResponse
} from './types/users.types'
import { ActivationDto, RegisterDto } from './dto/users.dto'
import { BadRequestException, UseGuards } from '@nestjs/common'
import { User } from './entities/users.entity'
import { Request, Response } from 'express'
import { AuthGuard } from './guards/auth.guard'

@Resolver('User')
export class UserResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => RegisterResponse)
  async register(
    @Args('registerInput') registerDto: RegisterDto,
    @Context() context: { res: Response }
  ) {
    const { name, email, password } = registerDto
    if (!name || !email || !password) {
      throw new BadRequestException('Please fill all fields')
    }

    const { activation_token } = await this.usersService.register(registerDto, context.res)
    return { activation_token }
  }

  @Mutation(() => LoginResponse)
  async Login(@Args('email') email: string, @Args('password') password: string) {
    return await this.usersService.login({ email, password })
  }

  @Query(() => LoginResponse)
  @UseGuards(AuthGuard)
  async getLoggedInUsers(@Context() context: { req: Request }) {
    return await this.usersService.getLoggedInUser(context.req)
  }

  @Query(() => LogoutResponse)
  async logout(@Context() context: { req: Request }) {
    return await this.usersService.logout(context.req)
  }

  @Mutation(() => ActivationResponse)
  async activateUser(
    @Args('activationDto') activationDto: ActivationDto,
    @Context() context: { res: Response }
  ) {
    return await this.usersService.activateUser(activationDto, context.res)
  }

  @Query(() => [User])
  async getUsers() {
    return this.usersService.getUsers()
  }
}
