function serializeGame(g) {
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    cover: g.cover,
    genres: Array.isArray(g.genres) ? g.genres : [],
    platforms: Array.isArray(g.platforms) ? g.platforms : [],
    description: g.description ?? '',
    popular: g.popular,
  };
}

function serializeProduct(p) {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    platform: p.platform,
    price: p.price,
    oldPrice: p.oldPrice,
    image: p.image,
    description: p.description ?? '',
    popular: p.popular,
    inStock: p.inStock,
    stock: p.stock ?? 0,
    gameSlug: p.gameSlug,
  };
}

function serializeOrder(order) {
  return {
    id: order.id,
    userId: order.userId,
    userEmail: order.user?.email ?? null,
    status: order.status,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod ?? null,
    items: order.items.map((it) => ({
      productId: it.productId,
      title: it.title,
      image: it.image ?? null,
      quantity: it.quantity,
      priceAtPurchase: it.priceAtPurchase,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    statusHistory: (order.statusHistory || []).map((h) => ({
      status: h.status,
      changedAt: h.changedAt.toISOString(),
      changedBy: h.changedBy,
    })),
  };
}

module.exports = { serializeGame, serializeProduct, serializeOrder };
