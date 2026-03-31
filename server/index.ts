import { resolve } from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { validateRoutes } from './routes/validate.js';
import { productRoutes } from './routes/product.js';
import { alternativesRoutes } from './routes/alternatives.js';

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
  },
  bodyLimit: 1_048_576, // 1 MB max body
  requestTimeout: 30_000, // 30s timeout
  trustProxy: config.nodeEnv === 'production',
});

// Security headers (Helmet)
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        "'self'",
        'https://m.media-amazon.com',
        'https://images-na.ssl-images-amazon.com',
        'data:',
      ],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // allow loading Amazon images
});

// CORS — necessario perché il frontend (GitHub Pages) è su un dominio diverso
await app.register(cors, {
  origin: config.corsOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400,
});

// Rate limiting — protezione abuse (T8.1.3)
await app.register(rateLimit, {
  max: 30,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    error: 'Troppe richieste. Riprova tra qualche minuto.',
    statusCode: 429,
  }),
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
