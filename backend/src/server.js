require('dotenv').config();

const { createApp } = require('./app');
const { ensureMongoConnection, shutdownMongo } = require('./db/ensureMongo');

const port = Number(process.env.PORT || process.env.BACKEND_PORT || 4000);

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('Missing JWT_ACCESS_SECRET or JWT_REFRESH_SECRET');
  process.exit(1);
}

async function main() {
  await ensureMongoConnection();

  if (process.env.RUN_SEED === 'true') {
    const { runSeed } = require('./db/seed');
    await runSeed({ wipe: true });
  } else {
    const { Product } = require('./db/models');
    const count = await Product.countDocuments();
    if (count === 0) {
      const { runSeed } = require('./db/seed');
      await runSeed({ wipe: false });
    }
  }

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`Backend API listening on http://localhost:${port}`);
  });

  const shutdown = async () => {
    server.close();
    await shutdownMongo();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});

module.exports = {};
