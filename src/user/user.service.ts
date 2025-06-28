// user.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      // Generate student ID if not provided
      let studentId = createUserDto.studentId;
      if (!studentId && createUserDto.role === UserRole.STUDENT) {
        studentId = await this.generateStudentId();
      }

      // Create user
      const user = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
        studentId,
      });

      const savedUser = await user.save();

      // Return user without password
      const { password, ...userWithoutPassword } = savedUser.toObject();
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ email }).select('+password');

      if (!user) {
        return null;
      }

      // Compare password with hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      // Update last login
      await this.userModel.findByIdAndUpdate(user._id, {
        lastLogin: new Date(),
      });

      // Return user without password
      const { password: userPassword, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    } catch (error) {
      throw new Error(`Failed to validate user: ${error.message}`);
    }
  }

  async findById(id: string): Promise<any> {
    try {
      const user = await this.userModel.findById(id).select('-password');
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findByStudentId(studentId: string): Promise<any> {
    try {
      const user = await this.userModel
        .findOne({ studentId })
        .select('-password');
      console.log('User: ', user, ' for student: ', studentId);
      if (!user) {
        throw new NotFoundException('Student not found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to find student: ${error.message}`);
    }
  }

  async getAllStudents(): Promise<any[]> {
    try {
      const students = await this.userModel
        .find({ role: UserRole.STUDENT })
        .select('-password');
      return students;
    } catch (error) {
      throw new Error(`Failed to get students: ${error.message}`);
    }
  }

  async getUserRole(userId: string): Promise<string> {
    try {
      const user = await this.userModel.findById(userId).select('role');
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user.role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get user role: ${error.message}`);
    }
  }

  private async generateStudentId(): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `STD${currentYear}`;

      // Find the latest student ID for current year
      const latestStudent = await this.userModel
        .findOne({
          studentId: { $regex: `^${prefix}` },
        })
        .sort({ studentId: -1 });

      let nextNumber = 1;
      if (latestStudent && latestStudent.studentId) {
        const lastNumber = parseInt(
          latestStudent.studentId.replace(prefix, ''),
        );
        nextNumber = lastNumber + 1;
      }

      // Pad with zeros (e.g., STD2024001)
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      throw new Error(`Failed to generate student ID: ${error.message}`);
    }
  }
}
