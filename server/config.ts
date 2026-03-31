import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  creatorsApi: {
    credentialId: process.env.CREATORS_API_CREDENTIAL_ID ?? '',
    credentialSecret: process.env.CREATORS_API_CREDENTIAL_SECRET ?? '',
    credentialVersion: process.env.CREATORS_API_CREDENTIAL_VERSION ?? '1',
    partnerTag: process.env.CREATORS_API_PARTNER_TAG ?? '',
    marketplace: process.env.CREATORS_API_MARKETPLACE ?? 'www.amazon.it',
  },

  /** Origini consentite per CORS (GitHub Pages + dev locale) */
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter((o) => {
      try {
        const url = new URL(o);
        return url.protocol === 'https:' || url.protocol === 'http:';
      } catch {
        return false;
      }
    }),
} as const;
