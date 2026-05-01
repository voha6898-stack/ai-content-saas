// PM2 config — chạy: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ai-backend',
      script: './backend/server.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      instances: 'max',       // Tự scale theo số CPU
      exec_mode: 'cluster',   // Cluster mode cho production
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/backend-error.log',
      out_file:   './logs/backend-out.log',
    },
    {
      name: 'ai-frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './frontend',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      watch: false,
    },
  ],
};
