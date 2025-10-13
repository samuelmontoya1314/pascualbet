import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    const log = () => {
      const elapsed = Date.now() - start;
      // Formato: [HTTP] METHOD URL STATUS - TIMems
      this.logger.log(`${method} ${originalUrl} ${res.statusCode} - ${elapsed}ms`);
    };

    // 'finish' se dispara cuando la respuesta se ha enviado
    res.on('finish', log);
    // 'close' se dispara si la conexión se cierra antes de completar la respuesta
    res.on('close', log);

    next();
  }
}
