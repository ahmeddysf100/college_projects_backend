import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SocketIOAdapter } from './socket-io-adapter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Main (main.ts)');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('PORT'));
  // const clientPort = parseInt(configService.get('CLIENT_PORT'));

  app.enableCors({
    // origin: [
    //   `http://localhost:${clientPort}`,
    //   new RegExp(`/^http:\/\/192\.168\.31\.([1-9]|[1-9]\d):${clientPort}$/`),    // only works with 192.168.31.1-99:(3000 from env)
    // ],
    origin: '*',
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true })); // الوايت ليست تحذفلي اي عنصر بالبودي مال ريكويست اني ممعرفه  بال(dto)

  // const config = new DocumentBuilder()
  //   .setTitle('PROJECT-BACKEND')
  //   .setVersion('0.1')
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, document);

  app.useWebSocketAdapter(new SocketIOAdapter(app, configService));

  await app.listen(port);

  logger.log(`Server running on port ${port}`);
}
bootstrap();
