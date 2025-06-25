import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

// Define a type for user without password
export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    // Check if user already exists
    const existingUser = await this.userModel
      .findOne({
        email: createUserDto.email,
      })
      .exec();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // Create user with hashed password
    const userData = {
      ...createUserDto,
      password: hashedPassword,
    };

    const createdUser = new this.userModel(userData);
    const savedUser = await createdUser.save();

    // Return user without password using toObject() and destructuring
    const { password, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword as UserWithoutPassword;
  }

  async findAll(): Promise<UserWithoutPassword[]> {
    const users = await this.userModel
      .find()
      .select('-password') // Exclude password field
      .lean() // Return plain objects instead of Mongoose documents
      .exec();

    return users as UserWithoutPassword[];
  }

  async findById(id: string): Promise<UserWithoutPassword> {
    const user = await this.userModel
      .findById(id)
      .select('-password') // Exclude password field
      .lean() // Return plain object
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user as UserWithoutPassword;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // async update(
  //   id: string,
  //   updateUserDto: UpdateUserDto,
  // ): Promise<UserWithoutPassword> {
  //   // If password is being updated, hash it
  //   if (updateUserDto.password) {
  //     const saltRounds = 10;
  //     updateUserDto.password = await bcrypt.hash(
  //       updateUserDto.password,
  //       saltRounds,
  //     );
  //   }

  //   const updatedUser = await this.userModel
  //     .findByIdAndUpdate(id, updateUserDto, { new: true })
  //     .select('-password') // Exclude password field
  //     .lean() // Return plain object
  //     .exec();

  //   if (!updatedUser) {
  //     throw new NotFoundException('User not found');
  //   }

  //   return updatedUser as UserWithoutPassword;
  // }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword as UserWithoutPassword;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { lastLogin: new Date() })
      .exec();
  }

  async deactivateUser(id: string): Promise<UserWithoutPassword> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .select('-password')
      .lean()
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser as UserWithoutPassword;
  }

  async activateUser(id: string): Promise<UserWithoutPassword> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .select('-password')
      .lean()
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser as UserWithoutPassword;
  }

  // Additional methods that your controller is calling
  async createUser(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    return this.create(createUserDto);
  }

  async findByStudentId(studentId: string): Promise<UserWithoutPassword> {
    const user = await this.userModel
      .findOne({ studentId })
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('Student not found');
    }

    return user as UserWithoutPassword;
  }

  async getAllStudents(): Promise<UserWithoutPassword[]> {
    const students = await this.userModel
      .find({ role: 'STUDENT' }) // Assuming you have a STUDENT role
      .select('-password')
      .lean()
      .exec();

    return students as UserWithoutPassword[];
  }

  async getUserRole(userId: string): Promise<{ role: string }> {
    const user = await this.userModel
      .findById(userId)
      .select('role')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { role: user.role };
  }
}
