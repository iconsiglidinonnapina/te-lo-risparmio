import type { FastifyInstance } from 'fastify';

export function alternativesRoutes(app: FastifyInstance) {
  app.get<{ Params: { asin: string } }>(
    '/api/alternatives/:asin',
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
      // TODO: T4.1.5 — implementare ricerca alternative via Creators API SearchItems
      return reply.status(501).send({ error: 'Not implemented' });
    },
  );
}
