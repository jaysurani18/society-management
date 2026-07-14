import { ResidentService } from './resident.service.js';
import { onboardResidentSchema, updateResidentSchema } from './resident.validation.js';
import { ForbiddenError } from '../../utils/customErrors.js';

export class ResidentController {
  constructor() {
    this.residentService = new ResidentService();
  }

  /**
   * Onboard a new resident profile (Admin only)
   */
  onboard = async (req, res, next) => {
    try {
      const validatedInput = onboardResidentSchema.parse(req.body);
      const actorId = req.user?.id;

      const profile = await this.residentService.onboardResident(validatedInput, actorId, req.ip);

      res.status(201).json({
        status: 'success',
        data: {
          resident: profile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch all residents (Paginated, Search, Status filter)
   */
  getAll = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || '';
      const status = req.query.status || '';

      const result = await this.residentService.getResidents({
        page,
        limit,
        search,
        status,
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch single resident profile
   */
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const profile = await this.residentService.getResidentById(id, actorId, actorRole);

      res.status(200).json({
        status: 'success',
        data: {
          resident: profile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update personal/contact info (Admin or Profile Owner)
   */
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      // 1. Fetch current profile details to determine owner userId
      const profile = await this.residentService.getResidentById(id, actorId, actorRole);
      
      // 2. Validate: Must be ADMIN or the owner of the user profile
      if (actorRole !== 'ADMIN' && profile.userId !== actorId) {
        throw new ForbiddenError('You can only modify your own profile details');
      }

      // 3. Parse input validations
      const validatedInput = updateResidentSchema.parse(req.body);

      // 4. Update the profile
      const updated = await this.residentService.updateResident(id, validatedInput, actorId, req.ip);

      res.status(200).json({
        status: 'success',
        data: {
          resident: updated,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft delete a resident profile (Admin only)
   */
  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;

      const result = await this.residentService.deleteResident(id, actorId, req.ip);

      res.status(200).json({
        status: 'success',
        message: 'Resident successfully soft-deleted',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
