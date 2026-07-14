import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import v1Router from './routes/v1.js';
import { NotFoundError } from './utils/customErrors.js';

// Load environment variables
dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204
};

// Enable CORS middleware globally
app.use(cors(corsOptions));

// Explicitly intercept and answer Preflight OPTIONS calls before any routing happens
app.options('*', cors(corsOptions));

// Serve static uploads
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// Morgan request logger integration with Winston
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: morganStream,
  })
);

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'System is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Central Gateway Route Mount
app.use('/api/v1', v1Router);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(new NotFoundError(`Cannot find ${req.originalUrl} on this server`));
});

// Global Error Handler
app.use(errorHandler);

export default app;
