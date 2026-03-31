import Fastify from 'fastify';
import { config } from './config.js';

const app = Fastify({
  logger: config.nodeEnv !== 'production',
});

app.get('/api/health', () => {
  return { status: 'ok' };
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
