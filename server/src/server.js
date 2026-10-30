import app from './app.js';
import { config } from './config/index.js';
import prisma from './lib/prisma.js';

let server;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('PostgreSQL database connected successfully.');

    // Bind to 0.0.0.0 for container/cloud compatibility
    server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`🪔 DiGlow Candle Store API server running on port ${config.port}`);
      console.log(`🌐 Mode: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to initialize server or connect to database:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Draining connections and shutting down gracefully...`);
  
  if (server) {
    server.close(async () => {
      console.log('HTTP connection pool closed.');
      try {
        await prisma.$disconnect();
        console.log('PostgreSQL database disconnected cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('Error during database disconnect:', err.message);
        process.exit(1);
      }
    });

    // Timeout safety net (force shutdown if requests hang for >10s)
    setTimeout(() => {
      console.error('Graceful shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  handleShutdown('uncaughtException');
});

startServer();
