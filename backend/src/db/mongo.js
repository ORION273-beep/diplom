const mongoose = require('mongoose');

async function connectMongo(uri = process.env.MONGODB_URI) {
  const mongoUri = uri || 'mongodb://127.0.0.1:27017/onesec';
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  return mongoose.connection;
}

async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectMongo, disconnectMongo, isMongoReady };
