import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../utils/validation.util';

export const validationMiddleware = validateRequest;
