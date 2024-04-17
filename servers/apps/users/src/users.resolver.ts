import { Args, Query, Mutation, Resolver, Context } from '@nestjs/graphql'
import { UsersService } from './users.service'
import { ActivationResponse, RegisterResponse } from './types/users.types'
import { ActivationDto, RegisterDto } from './dto/users.dto'
import { BadRequestException } from '@nestjs/common'
import { User } from './entities/users.entity'
import { Response } from 'express'

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

  @Mutation(() => ActivationResponse)
  async activateUser(
    @Args('activationInput') activationDto: ActivationDto,
    @Context() context: { res: Response }
  ) {
    return await this.usersService.activateUser(activationDto, context.res)
  }

  @Query(() => [User])
  async getUsers() {
    return this.usersService.getUsers()
  }
}
