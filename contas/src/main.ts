import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Accounts API')
    .setDescription('API documentation for the Accounts service')
    .setVersion('1.0')
    .addTag('accounts', 'Operations related to bank accounts')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('accounts/api', app, document); // API docs will be available at accounts/api

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useLogger(app.get(Logger));
  //await app.listen(process.env.PORT ?? 3001);
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
