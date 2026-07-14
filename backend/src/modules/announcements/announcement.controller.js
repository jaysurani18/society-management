import { AnnouncementService } from './announcement.service.js';
import { createAnnouncementSchema, updateAnnouncementSchema } from './announcement.validation.js';

export class AnnouncementController {
  constructor() {
    this.announcementService = new AnnouncementService();
  }

  /**
   * Handle notice announcement creation (Admin/Committee only)
   */
  create = async (req, res, next) => {
    try {
      const validatedInput = createAnnouncementSchema.parse(req.body);
      const actorId = req.user?.id;

      const announcement = await this.announcementService.createAnnouncement(
        validatedInput,
        actorId,
        req.ip
      );

      res.status(201).json({
        status: 'success',
        data: {
          announcement,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Modify existing notice announcement (Admin/Committee only)
   */
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const validatedInput = updateAnnouncementSchema.parse(req.body);
      const actorId = req.user?.id;

      const announcement = await this.announcementService.updateAnnouncement(
        id,
        validatedInput,
        actorId,
        req.ip
      );

      res.status(200).json({
        status: 'success',
        data: {
          announcement,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove notice announcement (Admin/Committee only)
   */
  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;

      const result = await this.announcementService.deleteAnnouncement(id, actorId, req.ip);

      res.status(200).json({
        status: 'success',
        message: 'Announcement notice successfully deleted',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch all notice announcements (Authenticated Users)
   */
  getAll = async (req, res, next) => {
    try {
      const announcements = await this.announcementService.getAnnouncements();

      res.status(200).json({
        status: 'success',
        results: announcements.length,
        data: {
          announcements,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
