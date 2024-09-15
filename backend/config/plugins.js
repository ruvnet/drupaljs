module.exports = ({ env }) => ({
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      playgroundAlways: true,
      defaultLimit: 10,
      maxLimit: 100,
      apolloServer: {
        tracing: true,
      },
    },
  },
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
      locales: ['en', 'es', 'fr'],
    },
  },
  'content-versioning': {
    enabled: true,
  },
});
