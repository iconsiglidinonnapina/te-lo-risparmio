import type { FastifyInstance } from 'fastify';

export function productRoutes(app: FastifyInstance) {
  app.get<{ Params: { asin: string } }>(
    '/api/product/:asin',
    {
      schema: {
        params: {
          type: 'object',
          required: ['asin'],
          properties: {
            asin: { type: 'string', pattern: '^[A-Z0-9]{10}$' },
          },
        },
      },
    },
    async (request, reply) => {
      // TODO: T3.1.4 — implementare recupero dati prodotto via Creators API
      return reply.status(501).send({ error: 'Not implemented' });
    },
  );
}
