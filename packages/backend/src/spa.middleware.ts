import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';

@Injectable()
export class SpaMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const apiRoute = req.path.startsWith('/api') ||
      req.path.startsWith('/uploads');
    if (!apiRoute && !req.path.includes('.')) {
      res.sendFile(join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
    } else {
      next();
    }
  }
}
