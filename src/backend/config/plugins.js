module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  upload: {
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 100000,
      },
    },
  },
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: 'your-email@example.com',
        defaultReplyTo: 'your-email@example.com',
      },
    },
  },
  'custom-plugins': {
    enabled: true,
    resolve: './src/plugins',
    config: {
      // Any global configuration for custom plugins
    },
  },
});
