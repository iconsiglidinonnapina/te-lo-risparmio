import { resolve } from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { validateRoutes } from './routes/validate.js';
import { productRoutes } from './routes/product.js';
import { alternativesRoutes } from './routes/alternatives.js';

const app = Fastify({
  logger: config.nodeEnv !== 'production',
});

// CORS — necessario perché il frontend (GitHub Pages) è su un dominio diverso
await app.register(cors, {
  origin: config.corsOrigins,
});

// Serve il build frontend in produzione (fallback SPA per vue-router history mode)
if (config.nodeEnv === 'production') {
  const clientDir = resolve(import.meta.dirname, '..', 'client');
  await app.register(fastifyStatic, {
    root: clientDir,
    wildcard: false,
  });
  app.setNotFoundHandler((_request, reply) => {
    return reply.sendFile('index.html');
  });
}

// Routes
await app.register(validateRoutes);
await app.register(productRoutes);
await app.register(alternativesRoutes);

app.get('/api/health', () => {
  return { status: 'ok' };
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
