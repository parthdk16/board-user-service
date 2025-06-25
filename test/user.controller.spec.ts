import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service.spec';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './schemas/user.schema';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;
  let jwtService: JwtService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.STUDENT,
    isActive: true,
  };

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    validateUser: jest.fn(),
    validateUserWithDto: jest.fn(),
    findByStudentId: jest.fn(),
    getAllStudents: jest.fn(),
    getUserRole: jest.fn(),
    updateLastLogin: jest.fn(),
    deactivateUser: jest.fn(),
    activateUser: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: UserRole.STUDENT,
      };

      mockUserService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual({
        message: 'User created successfully',
        user: mockUser,
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      mockUserService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Users retrieved successfully',
        users: users,
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = '507f1f77bcf86cd799439011';
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne(userId);

      expect(service.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        message: 'User retrieved successfully',
        user: mockUser,
      });
    });
  });

  describe('login', () => {
    it('should login user and return JWT token', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const token = 'jwt-token';
      mockUserService.validateUserWithDto.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(token);

      const result = await controller.login(loginDto);

      expect(service.validateUserWithDto).toHaveBeenCalledWith(loginDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toEqual({
        message: 'Login successful',
        access_token: token,
        user: mockUser,
      });
    });

    it('should throw error for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUserService.validateUserWithDto.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow();
    });
  });

  describe('findByStudentId', () => {
    it('should return student by studentId', async () => {
      const studentId = 'STU123';
      const student = { ...mockUser, studentId };
      mockUserService.findByStudentId.mockResolvedValue(student);

      const result = await controller.findByStudentId(studentId);

      expect(service.findByStudentId).toHaveBeenCalledWith(studentId);
      expect(result).toEqual({
        message: 'Student retrieved successfully',
        user: student,
      });
    });
  });

  describe('getAllStudents', () => {
    it('should return all students', async () => {
      const students = [mockUser];
      mockUserService.getAllStudents.mockResolvedValue(students);

      const result = await controller.getAllStudents();

      expect(service.getAllStudents).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Students retrieved successfully',
        students: students,
      });
    });
  });

  describe('getUserRole', () => {
    it('should return user role', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const roleResponse = { role: UserRole.STUDENT };
      mockUserService.getUserRole.mockResolvedValue(roleResponse);

      const result = await controller.getUserRole(userId);

      expect(service.getUserRole).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        message: 'User role retrieved successfully',
        ...roleResponse,
      });
    });
  });
});
