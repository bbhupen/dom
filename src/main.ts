import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    const chunks: Buffer[] = [];
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = (chunk: any, ...args: any[]) => { if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); return originalWrite(chunk, ...args); };
    res.end = (chunk: any, ...args: any[]) => { if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); return originalEnd(chunk, ...args); };

    res.on('finish', () => {
      const duration = Date.now() - start;
      const body = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : null;
      const responseBody = chunks.length ? Buffer.concat(chunks).toString('utf8').slice(0, 500) : null;
      console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
      if (body) console.log(`  body:     ${body}`);
      if (responseBody) console.log(`  response: ${responseBody}`);
    });
    next();
  });
  await app.listen(process.env.PORT ?? 3000, process.env.HOST ?? '127.0.0.1');
}
bootstrap();
