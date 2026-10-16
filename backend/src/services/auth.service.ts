import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, type User } from '@prisma/client';
import { config } from '../config/env';
import { userRepository, type UserRepository } from '../repositories/user.repository';
import { ConflictError, UnauthorizedError, BadRequestError } from '../errors';
import {
  validateRegisterInput,
  validateLoginInput,
  validateUpdateProfileInput,
  validateChangePasswordInput,
} from '../utils/auth-validation';
import type { UserDto, UserRoleType, JwtUserPayload } from '../types/auth';

const BCRYPT_SALT_ROUNDS = 10;

export class AuthService {
  constructor(private userRepo: UserRepository = userRepository) {}

  /**
   * Sanitizes User model into a customer-safe DTO.
   * Strips passwordHash and internal attributes.
   */
  public sanitizeUser(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role as UserRoleType,
      createdAt: user.createdAt,
    };
  }

  /**
   * Generates a signed JWT session token for the user.
   */
  public generateToken(user: User | UserDto): string {
    const payload: JwtUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role as UserRoleType,
    };

    return jwt.sign(payload, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Registers a new customer account.
   */
  public async register(input: unknown): Promise<{ user: UserDto; token: string }> {
    const validated = validateRegisterInput(input);

    // Check for existing user with this email
    const existing = await this.userRepo.findByEmail(validated.email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists.');
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(validated.password, BCRYPT_SALT_ROUNDS);

    // Create user in database (Always role: CUSTOMER for public registration)
    const newUser = await this.userRepo.create({
      email: validated.email,
      passwordHash,
      firstName: validated.firstName,
      lastName: validated.lastName,
      phone: validated.phone,
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    const userDto = this.sanitizeUser(newUser);
    const token = this.generateToken(userDto);

    return {
      user: userDto,
      token,
    };
  }

  /**
   * Authenticates customer credentials and returns session token.
   */
  public async login(input: unknown): Promise<{ user: UserDto; token: string }> {
    const validated = validateLoginInput(input);

    const user = await this.userRepo.findByEmail(validated.email);

    // Generic error to prevent email enumeration
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const userDto = this.sanitizeUser(user);
    const token = this.generateToken(userDto);

    return {
      user: userDto,
      token,
    };
  }

  /**
   * Retrieves authenticated customer profile.
   */
  public async getCurrentUser(userId: string): Promise<UserDto> {
    const user = await this.userRepo.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or deactivated.');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Updates permitted profile fields (firstName, lastName, phone) for authenticated user.
   * Privileged fields (role, passwordHash, email, isActive) can never be updated through this method.
   */
  public async updateProfile(userId: string, input: unknown): Promise<UserDto> {
    const validated = validateUpdateProfileInput(input);

    const user = await this.userRepo.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or deactivated.');
    }

    const updatedUser = await this.userRepo.update(userId, {
      ...(validated.firstName ? { firstName: validated.firstName } : {}),
      ...(validated.lastName ? { lastName: validated.lastName } : {}),
      ...(validated.phone !== undefined ? { phone: validated.phone } : {}),
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Updates an authenticated customer's password.
   * Strictly validates existing password, verifies the account is active,
   * hashes the new password with bcrypt, and persists only the updated password hash.
   */
  public async changePassword(userId: string, input: unknown): Promise<void> {
    const validated = validateChangePasswordInput(input);

    const user = await this.userRepo.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or deactivated.');
    }

    const isMatch = await bcrypt.compare(validated.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect.');
    }

    if (validated.newPassword === validated.currentPassword) {
      throw new BadRequestError('New password cannot be the same as your current password.');
    }

    const passwordHash = await bcrypt.hash(validated.newPassword, BCRYPT_SALT_ROUNDS);

    await this.userRepo.update(userId, {
      passwordHash,
    });
  }
}

export const authService = new AuthService();
