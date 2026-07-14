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
      const { firstName, lastName, phone, emergencyName, emergencyPhone, vehicleNumber } = req.body;

      const user = await this.userService.updateProfile(
        userId,
        { firstName, lastName, phone, emergencyName, emergencyPhone, vehicleNumber },
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

  adminResetPassword = async (req, res, next) => {
    try {
      const targetUserId = req.params.id;
      const { newPassword } = req.body;
      const actorId = req.user?.id;

      const result = await this.userService.adminResetPassword(
        targetUserId,
        newPassword,
        actorId,
        req.ip
      );

      res.status(200).json({
        status: 'success',
        message: 'User password reset completed successfully by administrator',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
