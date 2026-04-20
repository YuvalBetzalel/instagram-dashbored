import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

const indexHtml = join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');
const hasDist = existsSync(indexHtml);

@Injectable()
export class SpaMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const apiRoute = req.path.startsWith('/api');
    if (!apiRoute && !req.path.includes('.') && hasDist) {
      res.sendFile(indexHtml);
    } else {
      next();
    }
  }
}
