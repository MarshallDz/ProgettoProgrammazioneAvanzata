import app from './app';
import dotenv from 'dotenv';
import { initModels } from './models/index';

dotenv.config();

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database models
    await initModels();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
};

startServer();