import { FlatService } from './flat.service.js';
import { createFlatSchema } from './flat.validation.js';
import { BadRequestError } from '../../utils/customErrors.js';

export class FlatController {
  constructor() {
    this.flatService = new FlatService();
  }

  /**
   * Handle physical flat asset creation
   */
  create = async (req, res, next) => {
    try {
      const { wing, number, buildingName, flatNumber, floor } = req.body;
      
      let input;
      if (wing !== undefined || number !== undefined) {
        if (!wing || !number) {
          throw new BadRequestError('Both wing and number are required');
        }
        const floorStr = number.match(/\d/)?.[0] || '1';
        const derivedFloor = parseInt(floorStr, 10) || 1;
        input = {
          buildingName: wing.trim(),
          flatNumber: number.trim(),
          floor: derivedFloor
        };
      } else {
        input = createFlatSchema.parse(req.body);
      }

      const actorId = req.user?.id; // Authed user ID from authenticateJWT middleware
      
      const flat = await this.flatService.createFlat(input, actorId, req.ip);

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

  /**
   * Delete physical flat unit
   */
  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;

      await this.flatService.deleteFlat(id, actorId, req.ip);

      res.status(200).json({
        status: 'success',
        message: 'Flat deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}
