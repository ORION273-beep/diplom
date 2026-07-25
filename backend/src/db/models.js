const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

function applyIdTransform(schema) {
  schema.set('toJSON', {
    versionKey: false,
    transform(_doc, ret) {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  });
  schema.set('toObject', {
    versionKey: false,
    transform(_doc, ret) {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  });
}

// lean/doc -> plain object с id строкой
function toPlain(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  if (obj._id != null && obj.id == null) obj.id = String(obj._id);
  delete obj._id;
  delete obj.__v;
  return obj;
}

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  balance: { type: Number, default: 0 },
  blocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
applyIdTransform(userSchema);

const cartItemSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: null },
    image: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    gameSlug: { type: String, default: null },
    category: { type: String, default: null },
    platform: { type: String, default: null },
  },
  { timestamps: true },
);
cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });
applyIdTransform(cartItemSchema);

const passwordResetTokenSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  userId: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});
applyIdTransform(passwordResetTokenSchema);

const refreshTokenSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  jti: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});
applyIdTransform(refreshTokenSchema);

const gameSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  cover: { type: String, required: true },
  genres: { type: [String], default: [] },
  platforms: { type: [String], default: [] },
  description: { type: String, default: null },
  popular: { type: Boolean, default: false },
});
applyIdTransform(gameSchema);

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  platform: { type: String, required: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number, default: null },
  image: { type: String, required: true },
  description: { type: String, default: null },
  popular: { type: Boolean, default: false },
  inStock: { type: Boolean, default: true },
  stock: { type: Number, default: 100 },
  gameSlug: { type: String, default: null },
});
applyIdTransform(productSchema);

const categorySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, default: null },
  type: { type: String, default: null },
});
applyIdTransform(categorySchema);

const orderItemSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    productId: { type: String, default: null },
    title: { type: String, required: true },
    image: { type: String, default: null },
    quantity: { type: Number, required: true },
    priceAtPurchase: { type: Number, required: true },
  },
  { _id: true },
);

const orderStatusEntrySchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      required: true,
    },
    changedAt: { type: Date, required: true },
    changedBy: { type: String, required: true },
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: null },
  idempotencyKey: { type: String, unique: true, sparse: true },
  items: { type: [orderItemSchema], default: [] },
  statusHistory: { type: [orderStatusEntrySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
applyIdTransform(orderSchema);

const reviewSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  author: { type: String, required: true },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  userId: { type: String, default: null },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
applyIdTransform(reviewSchema);

const faqItemSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  sort: { type: Number, default: 0 },
});
applyIdTransform(faqItemSchema);

function getModel(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

module.exports = {
  toPlain,
  User: getModel('User', userSchema),
  CartItem: getModel('CartItem', cartItemSchema),
  PasswordResetToken: getModel('PasswordResetToken', passwordResetTokenSchema),
  RefreshToken: getModel('RefreshToken', refreshTokenSchema),
  Game: getModel('Game', gameSchema),
  Product: getModel('Product', productSchema),
  Category: getModel('Category', categorySchema),
  Order: getModel('Order', orderSchema),
  Review: getModel('Review', reviewSchema),
  FaqItem: getModel('FaqItem', faqItemSchema),
};
