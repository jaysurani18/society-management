import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from './auth.validation.js';

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Handle user registration requests
   */
  register = async (req, res, next) => {
    try {
      // Validate request body
      const validatedInput = registerSchema.parse(req.body);
      
      const user = await this.authService.register(validatedInput, req.ip);

      res.status(201).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle user login requests
   */
  login = async (req, res, next) => {
    try {
      // Validate request body
      const validatedInput = loginSchema.parse(req.body);

      const loginResult = await this.authService.login(validatedInput, req.ip);

      res.status(200).json({
        status: 'success',
        data: loginResult,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle forgot password requests
   */
  forgotPassword = async (req, res, next) => {
    try {
      const validatedInput = forgotPasswordSchema.parse(req.body);
      const result = await this.authService.forgotPassword(validatedInput.email, req.ip);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle password reset requests using token
   */
  resetPassword = async (req, res, next) => {
    try {
      const validatedInput = resetPasswordSchema.parse(req.body);
      const result = await this.authService.resetPassword(
        validatedInput.token,
        validatedInput.newPassword,
        req.ip
      );

      res.status(200).json({
        status: 'success',
        message: 'Password reset successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle change password requests (authenticated)
   */
  changePassword = async (req, res, next) => {
    try {
      const validatedInput = changePasswordSchema.parse(req.body);
      const userId = req.user?.id;

      const result = await this.authService.changePassword(
        userId,
        validatedInput.currentPassword || validatedInput.oldPassword,
        validatedInput.newPassword,
        req.ip
      );

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle fetching logged-in user profile details
   */
  getMe = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const user = await this.authService.getMe(userId);

      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
