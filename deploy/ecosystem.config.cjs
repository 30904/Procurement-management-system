/**
 * PM2 process manager — run from repo root on the droplet:
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "pms-api",
      cwd: "./backend",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: 5020,
      },
      max_memory_restart: "512M",
      error_file: "../logs/pms-api-error.log",
      out_file: "../logs/pms-api-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
