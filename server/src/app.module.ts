import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { ApuestasService } from './apuestas/apuestas.service';
import { ApuestasController } from './apuestas/apuestas.controller';

@Module({
  imports: [],
  controllers: [AppController, UsersController, ApuestasController],
  providers: [AppService, UsersService, ApuestasService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
