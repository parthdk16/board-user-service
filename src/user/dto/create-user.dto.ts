import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.STUDENT,
  })
  @IsEnum(UserRole, { message: 'Role must be either STUDENT or MODERATOR' })
  role: UserRole;

  @ApiProperty({
    description: 'Student ID (required for students)',
    example: 'STD2024001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Student ID must contain only uppercase letters and numbers',
  })
  studentId?: string;

  @ApiProperty({
    description: 'Additional profile information',
    required: false,
    example: {
      phone: '+1234567890',
      address: '123 Main St, City, Country',
    },
  })
  @IsOptional()
  profile?: {
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
    [key: string]: any;
  };
}
