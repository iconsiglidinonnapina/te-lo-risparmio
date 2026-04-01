import type { FastifyInstance } from 'fastify';
import { extractAsin, isShortLink, resolveShortLink } from '../services/asin-extractor.js';

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

      // Short links require server-side redirect resolution
      if (isShortLink(url)) {
        const resolved = await resolveShortLink(url);
        if (!resolved.valid || !resolved.asin) {
          return reply
            .status(400)
            .send({ valid: false, error: resolved.error ?? 'Impossibile risolvere il link breve' });
        }
        return { valid: true, asin: resolved.asin };
      }

      const result = extractAsin(url);

      if (!result.valid) {
        return reply.status(400).send({ valid: false, error: result.error });
      }

      return { valid: true, asin: result.asin };
    },
  );
}
