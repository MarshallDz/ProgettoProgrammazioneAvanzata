import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.middleware';
import router from './routers/index.routes';
import { ErrorFactory, ErrorTypes } from './utils/errorFactory';

dotenv.config();

const app = express();
app.use(express.json());

const apiPrefix = process.env.API_PREFIX || '/api/v1';

app.use(apiPrefix, router);

// Middleware per gestire le rotte non trovate
app.use((req, res, next) => {
    next(ErrorFactory.createError(ErrorTypes.NotFound, 'Rotta non trovata'));
});

app.use(errorHandler);

export default app;