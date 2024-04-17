import { User } from '../entities/users.entity'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class ErrorType {
  @Field()
  message: string

  @Field({ nullable: true })
  code?: string
}

@ObjectType()
export class RegisterResponse {
  @Field()
  activation_token: String

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType
}

@ObjectType()
export class ActivationResponse {
  @Field(() => User)
  user: User

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType
}

@ObjectType()
export class LoginResponse {
  @Field(() => User, { nullable: true })
  user?: User

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType
}
