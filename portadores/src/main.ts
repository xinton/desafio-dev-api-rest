import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Holders API')
    .setDescription('API documentation for the Digital Account project')
    .setVersion('1.0')
    .addTag('holders', 'Operations related to account holders')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // API docs will be available at /api

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
