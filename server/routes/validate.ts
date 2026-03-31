import type { FastifyInstance } from 'fastify';

export function validateRoutes(app: FastifyInstance) {
  app.post<{ Body: { url: string } }>(
    '/api/validate-link',
    {
      schema: {
        body: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', maxLength: 2048 },
          },
        },
      },
    },
    async (request, reply) => {
      // TODO: T2.1.2 — implementare validazione URL + estrazione ASIN
      return reply.status(501).send({ error: 'Not implemented' });
    },
  );
}
