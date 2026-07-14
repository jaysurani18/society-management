import { FlatService } from './flat.service.js';
import { createFlatSchema } from './flat.validation.js';

export class FlatController {
  constructor() {
    this.flatService = new FlatService();
  }

  /**
   * Handle physical flat asset creation
   */
  create = async (req, res, next) => {
    try {
      const validatedInput = createFlatSchema.parse(req.body);
      const actorId = req.user?.id; // Authed user ID from authenticateJWT middleware
      
      const flat = await this.flatService.createFlat(validatedInput, actorId, req.ip);

      res.status(201).json({
        status: 'success',
        data: {
          flat,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch all flats
   */
  getAll = async (req, res, next) => {
    try {
      const flats = await this.flatService.getAllFlats();

      res.status(200).json({
        status: 'success',
        results: flats.length,
        data: {
          flats,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
