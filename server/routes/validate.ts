import type { FastifyInstance } from 'fastify';
import { extractAsin } from '../services/asin-extractor.js';

export function validateRoutes(app: FastifyInstance) {
  app.post<{ Body: { url: string } }>(
    '/api/validate-link',
    {
      schema: {
        body: {
          type: 'object',
          required: ['url'],
          additionalProperties: false,
          properties: {
            url: { type: 'string', maxLength: 2048 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              asin: { type: 'string', nullable: true },
            },
          },
          400: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { url } = request.body;
      const result = extractAsin(url);

      if (!result.valid) {
        return reply.status(400).send({ valid: false, error: result.error });
      }

      return { valid: true, asin: result.asin };
    },
  );
}
