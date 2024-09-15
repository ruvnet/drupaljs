module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('SUPABASE_HOST', 'db.supabase.co'),
      port: env.int('SUPABASE_PORT', 5432),
      database: env('SUPABASE_DB', 'postgres'),
      user: env('SUPABASE_USER', 'postgres'),
      password: env('SUPABASE_PASSWORD', 'your_supabase_password'),
      ssl: { rejectUnauthorized: false },
    },
    debug: false,
  },
});
