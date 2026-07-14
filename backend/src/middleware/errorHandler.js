import { AppError } from '../utils/customErrors.js';
import logger from '../utils/logger.js';
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    logger.warn(`AppError [${statusCode}]: ${message} - Path: ${req.originalUrl}`);
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn(`ValidationError: ${JSON.stringify(details)} - Path: ${req.originalUrl}`);
  } else {
    logger.error(`Unexpected Error: ${err.message}`, err);
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal Server Error';
    } else {
      message = err.message;
    }
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
