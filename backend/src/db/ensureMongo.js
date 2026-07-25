const { connectMongo, disconnectMongo, isMongoReady } = require('./mongo');

async function ensureMongoConnection() {
  const preferred = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onesec';

  try {
    await connectMongo(preferred);
    console.log(`MongoDB connected: ${preferred.replace(/\/\/.*@/, '//***@')}`);
    return { uri: preferred };
  } catch (err) {
    const msg =
      `MongoDB недоступна (${err.message}). ` +
      `Проверь MONGODB_URI и что Mongo запущен (например: docker compose up -d mongo).`;
    console.error(msg);
    throw new Error(msg);
  }
}

async function shutdownMongo() {
  await disconnectMongo();
}

module.exports = {
  ensureMongoConnection,
  shutdownMongo,
  isMongoReady,
};
