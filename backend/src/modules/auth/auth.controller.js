import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.validation.js';

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
}
