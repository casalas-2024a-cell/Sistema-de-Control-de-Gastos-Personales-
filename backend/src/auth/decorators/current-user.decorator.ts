// [FILE] auth/decorators/current-user.decorator.ts
// Custom parameter decorator that extracts the authenticated user from the request.
//
// HU-09 CRITERIA: "Decorador @CurrentUser() para extraer el usuario del token"
//
// HOW IT WORKS:
//   1. JwtAuthGuard validates the token and runs JwtStrategy.validate()
//   2. JwtStrategy.validate() returns { userId, email } which NestJS stores in req.user
//   3. @CurrentUser() reads req.user and either returns the whole object
//      or a specific field if a property key is passed: @CurrentUser('userId')
//
// WHY A DECORATOR:
//   Without it, controllers must do:  const user = req.user as { userId: number };
//   With it:  @CurrentUser('userId') userId: number  → cleaner, type-safe, DRY.

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a property key is specified, return just that field
    // Example: @CurrentUser('userId') → returns the number directly
    if (data) {
      return user?.[data];
    }
    // Otherwise return the full user object from the JWT payload
    return user;
  },
);
