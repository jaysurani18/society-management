import { UserService } from './user.service.js';

export class UserController {
  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const user = await this.userService.getProfile(userId);

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

  updateProfile = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const { firstName, lastName, phone } = req.body;

      const user = await this.userService.updateProfile(
        userId,
        { firstName, lastName, phone },
        req.ip
      );

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
