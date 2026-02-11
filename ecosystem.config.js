module.exports = {
  apps: [
    {
      name: 'csm-app',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // Advanced features
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000,

      // Source maps support
      source_map_support: true,
    },
  ],
};
