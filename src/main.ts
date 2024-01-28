import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // الوايت ليست تحذفلي اي عنصر بالبودي مال ريكويست اني ممعرفه  بال(dto)

  const config = new DocumentBuilder()
    .setTitle('PROJECT-BACKEND')
    .setVersion('0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // // Multer disk storage configuration
  // const storage = multer.diskStorage({
  //   destination: (req, file, callback) => {
  //     callback(null, 'uploads/');
  //   },
  //   filename: (req, file, callback) => {
  //     const fileExt = file.originalname.split('.').pop();
  //     const uniqueSuffix = Date.now();
  //     callback(null, `${file.fieldname}-${uniqueSuffix}.${fileExt}`);
  //   },
  // });

  // const upload = multer({ storage });

  // Serve uploaded files
  // app.use('/uploads', express.static('uploads'));

  await app.listen(3333);
}
bootstrap();
