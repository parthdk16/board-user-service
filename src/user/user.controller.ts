/* eslint-disable no-useless-catch */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account (Student or Moderator)',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    schema: {
      example: {
        success: true,
        message: 'User registered successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          email: 'john.doe@example.com',
          name: 'John Doe',
          role: 'STUDENT',
          studentId: 'STD2024001',
          isActive: true,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
    schema: {
      example: {
        success: false,
        message: 'User with this email already exists',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        message: 'Validation failed',
        errors: ['Email must be a valid email address'],
      },
    },
  })
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return {
        success: true,
        message: 'User registered successfully',
        data: user,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return user details',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            _id: '507f1f77bcf86cd799439011',
            email: 'john.doe@example.com',
            name: 'John Doe',
            role: 'STUDENT',
            studentId: 'STD2024001',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        success: false,
        message: 'Invalid credentials',
      },
    },
  })
  async login(@Body() loginUserDto: LoginUserDto) {
    try {
      if (!loginUserDto) {
        throw new BadRequestException('Missing body data');
      }
      const { email, password } = loginUserDto;
      const user = await this.userService.validateUser(email, password);
      return {
        success: true,
        message: 'Login successful',
        data: {
          user,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          email: 'john.doe@example.com',
          name: 'John Doe',
          role: 'STUDENT',
          studentId: 'STD2024001',
          isActive: true,
          lastLogin: '2024-01-15T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getProfile(@Request() req) {
    try {
      const user = await this.userService.findById(req.user.userId);
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by ID (Moderators only)',
    description: 'Get any user details by ID. Only accessible by Moderators.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          email: 'john.doe@example.com',
          name: 'John Doe',
          role: 'STUDENT',
          studentId: 'STD2024001',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only Moderators can access this endpoint',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.userService.findById(id);
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('student/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by Student ID (Moderators only)',
    description:
      'Get student details by Student ID. Only accessible by Moderators.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 'STD2024001',
  })
  @ApiResponse({
    status: 200,
    description: 'Student found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only Moderators can access',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async getByStudentId(@Param('studentId') studentId: string) {
    try {
      const user = await this.userService.findByStudentId(studentId);
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('students/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all students (Moderators only)',
    description: 'Get list of all students. Only accessible by Moderators.',
  })
  @ApiResponse({
    status: 200,
    description: 'Students list retrieved',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            email: 'john.doe@example.com',
            name: 'John Doe',
            role: 'STUDENT',
            studentId: 'STD2024001',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only Moderators can access',
  })
  async getAllStudents() {
    try {
      const students = await this.userService.getAllStudents();
      return {
        success: true,
        data: students,
      };
    } catch (error) {
      throw error;
    }
  }

  // Inter-service communication endpoint
  @Get('internal/role/:userId')
  @ApiOperation({
    summary: 'Get user role (Internal API)',
    description: 'Internal API for other services to get user role',
  })
  async getUserRole(@Param('userId') userId: string) {
    try {
      const role = await this.userService.getUserRole(userId);
      return {
        success: true,
        data: { role },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('internal/validate/:userId')
  @ApiOperation({
    summary: 'Validate user exists (Internal API)',
    description: 'Internal API for other services to validate user existence',
  })
  async validateUserExists(@Param('userId') userId: string) {
    try {
      const user = await this.userService.findById(userId);
      return {
        success: true,
        data: {
          exists: !!user,
          user: user,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        data: {
          exists: false,
          user: null,
        },
      };
    }
  }
}
