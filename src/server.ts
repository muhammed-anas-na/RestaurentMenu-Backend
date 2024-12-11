import app from './app';
import config from './config/env';
import { connectDB } from './config/database';

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.server.port, () => {
      console.log(`Server running on port ${config.server.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
