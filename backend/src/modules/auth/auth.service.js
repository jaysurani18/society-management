import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../utils/customErrors.js';

export class AuthService {
  /**
   * Register a new user
   */
  async register(input, ipAddress) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new BadRequestError('A user with this email address already exists');
    }

    // Hash the password (10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    // Create the User and Audit Log in a single transaction
    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          password: passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
        },
      });

      // Append Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTER',
          details: JSON.stringify({
            email: user.email,
            role: user.role,
            message: 'User registered successfully',
          }),
          ipAddress: ipAddress || null,
        },
      });

      return user;
    });

    // Exclude password from response
    const { password, ...userWithoutPassword } = createdUser;
    return userWithoutPassword;
  }

  /**
   * Authenticate a user and issue a JWT token
   */
  async login(input, ipAddress) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify credential matches
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

    // Sign the token with user metadata
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    // Append Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: JSON.stringify({
          email: user.email,
          message: 'User logged in successfully',
        }),
        ipAddress: ipAddress || null,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Handle generating a reset token for a password reset flow
   */
  async forgotPassword(email, ipAddress) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('No user found with this email address');
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
    const resetToken = jwt.sign(
      { email: user.email, purpose: 'password-reset' },
      jwtSecret,
      { expiresIn: '15m' }
    );

    // Append Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_FORGOT',
        details: JSON.stringify({
          email: user.email,
          message: 'Password reset token generated',
        }),
        ipAddress: ipAddress || null,
      },
    });

    return { resetToken };
  }

  /**
   * Reset user password using generated token
   */
  async resetPassword(token, newPassword, ipAddress) {
    let email;
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded.purpose !== 'password-reset') {
        throw new BadRequestError('Invalid reset token purpose');
      }
      email = decoded.email;
    } catch (err) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email },
        data: { password: passwordHash },
      });

      // Append Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET',
          details: JSON.stringify({
            email: user.email,
            message: 'User password reset completed successfully',
          }),
          ipAddress: ipAddress || null,
        },
      });
    });

    return { success: true };
  }

  /**
   * Change user password (authenticated)
   */
  async changePassword(userId, currentPassword, newPassword, ipAddress) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError('Incorrect current password');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: passwordHash },
      });

      // Append Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_CHANGE',
          details: JSON.stringify({
            message: 'User password changed successfully',
          }),
          ipAddress: ipAddress || null,
        },
      });
    });

    return { success: true };
  }

  /**
   * Fetch complete profile of currently logged-in user
   */
  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
