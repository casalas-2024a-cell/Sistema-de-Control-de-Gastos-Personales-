// [FILE] common/pipes/pagination.pipe.ts
// Reusable pipe that parses and validates pagination query params (skip & take).
//
// WHY A PIPE: In NestJS, pipes transform and validate incoming data before it
// reaches the controller method. By extracting pagination logic here, we avoid
// duplicating parseInt/validation across every controller that supports paging.
//
// USAGE: @Query() pagination: PaginationParams (after applying in controller)

import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

export interface PaginationParams {
  skip: number;  // Number of records to skip (offset)
  take: number;  // Number of records to return (limit)
}

@Injectable()
export class PaginationPipe implements PipeTransform {
  // Default values: start at offset 0, return 10 records
  private readonly DEFAULT_SKIP = 0;
  private readonly DEFAULT_TAKE = 10;
  // Hard cap to prevent massive queries that could degrade performance
  private readonly MAX_TAKE = 100;

  transform(value: any, metadata: ArgumentMetadata): PaginationParams {
    // Parse skip — default to 0 if not provided or NaN
    const skip = value?.skip !== undefined
      ? parseInt(value.skip, 10)
      : this.DEFAULT_SKIP;

    // Parse take — default to 10 if not provided or NaN
    const take = value?.take !== undefined
      ? parseInt(value.take, 10)
      : this.DEFAULT_TAKE;

    // Validate skip: must be a non-negative integer
    if (isNaN(skip) || skip < 0) {
      throw new BadRequestException('El parámetro "skip" debe ser un entero mayor o igual a 0.');
    }

    // Validate take: must be a positive integer not exceeding MAX_TAKE
    // WHY: Prevents accidental or malicious requests fetching all records at once
    if (isNaN(take) || take < 1 || take > this.MAX_TAKE) {
      throw new BadRequestException(`El parámetro "take" debe estar entre 1 y ${this.MAX_TAKE}.`);
    }

    return { skip, take };
  }
}
