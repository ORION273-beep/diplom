const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const {
  User,
  Product,
  Category,
  Game,
  Order,
  Review,
  FaqItem,
  CartItem,
  RefreshToken,
  PasswordResetToken,
} = require('./models');

function loadJson() {
  const p = path.join(__dirname, '..', '..', 'data', 'db.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function clearAll() {
  await Promise.all([
    Order.deleteMany({}),
    CartItem.deleteMany({}),
    RefreshToken.deleteMany({}),
    PasswordResetToken.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Game.deleteMany({}),
    Review.deleteMany({}),
    FaqItem.deleteMany({}),
  ]);
}

async function runSeed({ wipe = true } = {}) {
  const data = loadJson();
  if (wipe) await clearAll();

  const reviews = [
    {
      _id: '1',
      author: 'макс',
      rating: 5,
      text: 'uc пришли за пару минут, норм',
      published: true,
      createdAt: new Date('2026-03-02T14:20:00Z'),
    },
    {
      _id: '2',
      author: 'Алина',
      rating: 5,
      text: 'Беру кристаллы тут уже третий раз. Один раз поддержка ответила только к вечеру, но разобрались.',
      published: true,
      createdAt: new Date('2026-04-11T09:05:00Z'),
    },
    {
      _id: '3',
      author: 'egor_rb',
      rating: 4,
      text: 'Робуксы ок. Интерфейс местами кривой, но работает.',
      published: true,
      createdAt: new Date('2026-05-18T21:40:00Z'),
    },
    {
      _id: '4',
      author: 'Илья',
      rating: 5,
      text: 'Стим-карту купил без сюрпризов. История заказов удобная.',
      published: true,
      createdAt: new Date('2026-06-01T12:00:00Z'),
    },
  ];
  await Review.insertMany(reviews);

  const faqItems = [
    {
      _id: '1',
      question: 'Сколько ждать после оплаты?',
      answer: 'Обычно минуты. Если банк тупит — до получаса. Статус смотри в «Мои заказы».',
      sort: 1,
    },
    {
      _id: '2',
      question: 'Чем можно платить?',
      answer: 'Карта, СБП, баланс в аккаунте. Список на чекауте — там актуальный.',
      sort: 2,
    },
    {
      _id: '3',
      question: 'Можно отменить оплаченный заказ?',
      answer: 'Если товар уже выдан — нет. До выдачи иногда получается, пиши в контакты.',
      sort: 3,
    },
    {
      _id: '4',
      question: 'Заказ висит и ничего не происходит',
      answer: 'Обнови страницу заказов. Если больше часа — напиши номер заказа в поддержку.',
      sort: 4,
    },
    {
      _id: '5',
      question: 'Забыл пароль',
      answer: 'На логине есть «забыл пароль». Письмо иногда падает в спам.',
      sort: 5,
    },
  ];
  await FaqItem.insertMany(faqItems);

  await Game.insertMany(
    (data.games || []).map((g) => ({
      _id: String(g.id),
      slug: g.slug,
      name: g.name,
      cover: g.cover,
      genres: g.genres ?? [],
      platforms: g.platforms ?? [],
      description: g.description ?? null,
      popular: Boolean(g.popular),
    })),
  );

  await Category.insertMany(
    (data.categories || []).map((c) => ({
      _id: String(c.id),
      name: c.name,
      icon: c.icon ?? null,
      type: c.type ?? null,
    })),
  );

  await Product.insertMany(
    (data.products || []).map((p) => ({
      _id: String(p.id),
      title: p.title,
      category: p.category,
      platform: p.platform,
      price: Number(p.price),
      oldPrice: p.oldPrice == null ? null : Number(p.oldPrice),
      image: p.image,
      description: p.description ?? null,
      popular: Boolean(p.popular),
      inStock: p.inStock !== false,
      stock: p.stock != null ? Number(p.stock) : 100,
      gameSlug: p.gameSlug ? String(p.gameSlug) : null,
    })),
  );

  for (const u of data.users || []) {
    const rawPassword = String(u.password);
    const hasBcrypt = rawPassword.startsWith('$2a$') || rawPassword.startsWith('$2b$');
    const password = hasBcrypt ? rawPassword : await bcrypt.hash(rawPassword, 10);
    await User.create({
      _id: String(u.id),
      email: String(u.email).trim().toLowerCase(),
      password,
      role: u.role === 'admin' ? 'ADMIN' : 'USER',
      balance: u.balance != null ? Number(u.balance) : u.role === 'admin' ? 5000 : 1000,
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    });
  }

  for (const o of data.orders || []) {
    const orderId = String(o.id);
    const status = (o.status || 'pending').toLowerCase();
    const valid = ['pending', 'processing', 'completed', 'failed', 'refunded'].includes(status)
      ? status
      : 'pending';
    const createdAt = o.createdAt ? new Date(o.createdAt) : new Date();
    const orderDoc = {
      _id: orderId,
      userId: String(o.userId),
      status: valid,
      totalAmount: Number(o.totalAmount),
      createdAt,
      updatedAt: o.updatedAt ? new Date(o.updatedAt) : createdAt,
      items: (o.items || []).map((it) => ({
        productId: it.productId != null ? String(it.productId) : null,
        title: String(it.title),
        image: it.image ? String(it.image) : null,
        quantity: Number(it.quantity),
        priceAtPurchase: Number(it.priceAtPurchase),
      })),
      statusHistory:
        Array.isArray(o.statusHistory) && o.statusHistory.length > 0
          ? o.statusHistory.map((h) => ({
              status: String(h.status).toLowerCase(),
              changedAt: new Date(h.changedAt),
              changedBy: String(h.changedBy ?? 'system'),
            }))
          : [{ status: valid, changedAt: createdAt, changedBy: 'system' }],
    };
    if (o.idempotencyKey) orderDoc.idempotencyKey = String(o.idempotencyKey);
    await Order.create(orderDoc);
  }

  console.log('Seed completed.');
}

async function main() {
  const { ensureMongoConnection, shutdownMongo } = require('./ensureMongo');
  const wipe = process.argv.includes('--wipe');
  await ensureMongoConnection();
  await runSeed({ wipe });
  await shutdownMongo();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runSeed };
