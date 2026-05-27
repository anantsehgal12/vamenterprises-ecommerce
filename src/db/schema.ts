import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const taxRateEnum = pgEnum("tax_rate_enum", ["0", "5", "12", "18", "20", "40"]);

/* =========================================================
   CATEGORY
========================================================= */

export const Category = pgTable("Category", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* =========================================================
   PRODUCT
========================================================= */

export const Product = pgTable("Product", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  price: decimal("price", {
    precision: 10,
    scale: 2,
  }).notNull(),

  mrp: decimal("mrp", {
    precision: 10,
    scale: 2,
  }),

  taxRate: taxRateEnum("tax_rate").default("18").notNull(),

  stock: integer("stock").default(0).notNull(),

  isLive: boolean("is_live").default(true).notNull(),

  categoryId: uuid("category_id").references(() => Category.id, {
    onDelete: "set null",
  }),

  variants: jsonb("variants").$type<
    {
      name?: string;
    }[]
  >(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* =========================================================
   PRODUCT IMAGES
========================================================= */

export const ProductImage = pgTable("ProductImage", {
  id: uuid("id").defaultRandom().primaryKey(),

  productId: uuid("product_id")
    .notNull()
    .references(() => Product.id, { onDelete: "cascade" }),

  url: text("url").notNull(),
  storagePath: text("storage_path").notNull(),
  altText: varchar("alt_text", { length: 255 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================================================
   USERS
========================================================= */

export const User = pgTable("User", {
  id: uuid("id").defaultRandom().primaryKey(),

  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),

  name: varchar("name", { length: 255 }),

  email: varchar("email", { length: 255 }).notNull().unique(),

  imageUrl: text("image_url"),

  role: varchar("role", { length: 50 }).default("customer").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================================================
   CART
========================================================= */

export const Cart = pgTable("Cart", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => User.clerkId, {
      onDelete: "cascade",
    }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const CartItem = pgTable("CartItem", {
  id: uuid("id").defaultRandom().primaryKey(),

  cartId: uuid("cart_id")
    .notNull()
    .references(() => Cart.id, {
      onDelete: "cascade",
    }),

  productId: uuid("product_id")
    .notNull()
    .references(() => Product.id, {
      onDelete: "cascade",
    }),

  quantity: integer("quantity").default(1).notNull(),

  variant: varchar("variant", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================================================
   ORDERS
========================================================= */

export const Order = pgTable("Order", {
  id: uuid("id").defaultRandom().primaryKey(),

  orderId: varchar("order_id", { length: 255 }).notNull().unique(),

  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),

  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),

  userId: varchar("user_id", { length: 255 }).references(() => User.clerkId, {
    onDelete: "set null",
  }),

  totalAmount: decimal("total_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),

  status: varchar("status", { length: 50 })
    .default("pending")
    .notNull(),

  paymentStatus: varchar("payment_status", {
    length: 50,
  })
    .default("pending")
    .notNull(),

  address: jsonb("address").$type<{
    fullName: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>(),

  invoiceUrl: text("invoice_url"),

  cancelReason: varchar("cancel_reason", { length: 255 }),

  cancelDescription: text("cancel_description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const OrderItem = pgTable("OrderItem", {
  id: uuid("id").defaultRandom().primaryKey(),

  orderId: uuid("order_id")
    .notNull()
    .references(() => Order.id, {
      onDelete: "cascade",
    }),

  productId: uuid("product_id")
    .notNull()
    .references(() => Product.id, {
      onDelete: "set null",
    }),

  quantity: integer("quantity").notNull(),

  price: decimal("price", {
    precision: 10,
    scale: 2,
  }).notNull(),

  variant: varchar("variant", { length: 255 }),
});

/* =========================================================
   WISHLIST
========================================================= */

export const Wishlist = pgTable(
  "Wishlist",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => User.clerkId, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id")
      .notNull()
      .references(() => Product.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.productId],
    }),
  }),
);

/* =========================================================
   ADDRESSES
========================================================= */

export const addresses = pgTable(
  "Address",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    contactNo: varchar("contact_no", { length: 50 }).notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    pincode: varchar("pincode", { length: 20 }).notNull(),
    country: varchar("country", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    unqNamePerUser: unique().on(t.userId, t.name),
  })
);

/* =========================================================
   COUPONS
========================================================= */

export const Coupon = pgTable("Coupon", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  discountType: varchar("discount_type", { length: 50 }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* =========================================================
   NOTIFICATIONS
========================================================= */

export const Notification = pgTable("Notification", {
  id: uuid("id").defaultRandom().primaryKey(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================================================
   STORE SETTINGS
========================================================= */

export const StoreSettings = pgTable("StoreSettings", {
  id: uuid("id").defaultRandom().primaryKey(),
  standardDeliveryFee: decimal("standard_delivery_fee", { precision: 10, scale: 2 }).default("50").notNull(),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }).default("500").notNull(),
  freeDeliveryCoupon: boolean("free_delivery_coupon").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* =========================================================
   RELATIONS
========================================================= */

export const CategoryRelations = relations(Category, ({ many }) => ({
  products: many(Product),
}));

export const ProductRelations = relations(Product, ({ one, many }) => ({
  category: one(Category, {
    fields: [Product.categoryId],
    references: [Category.id],
  }),

  cartItems: many(CartItem),

  orderItems: many(OrderItem),

  wishlistItems: many(Wishlist),

  images: many(ProductImage),
}));

export const ProductImageRelations = relations(ProductImage, ({ one }) => ({
  product: one(Product, {
    fields: [ProductImage.productId],
    references: [Product.id],
  }),
}));

export const UserRelations = relations(User, ({ many }) => ({
  carts: many(Cart),

  orders: many(Order),

  wishlist: many(Wishlist),

  addresses: many(addresses),
}));

export const CartRelations = relations(Cart, ({ one, many }) => ({
  user: one(User, {
    fields: [Cart.userId],
    references: [User.clerkId],
  }),

  items: many(CartItem),
}));

export const CartItemRelations = relations(CartItem, ({ one }) => ({
  cart: one(Cart, {
    fields: [CartItem.cartId],
    references: [Cart.id],
  }),

  product: one(Product, {
    fields: [CartItem.productId],
    references: [Product.id],
  }),
}));

export const AddressRelations = relations(addresses, ({ one }) => ({
  user: one(User, {
    fields: [addresses.userId],
    references: [User.clerkId],
  }),
}));

export const OrderRelations = relations(Order, ({ one, many }) => ({
  user: one(User, {
    fields: [Order.userId],
    references: [User.clerkId],
  }),

  items: many(OrderItem),
}));

export const OrderItemRelations = relations(OrderItem, ({ one }) => ({
  order: one(Order, {
    fields: [OrderItem.orderId],
    references: [Order.id],
  }),

  product: one(Product, {
    fields: [OrderItem.productId],
    references: [Product.id],
  }),
}));

export const WishlistRelations = relations(Wishlist, ({ one }) => ({
  user: one(User, {
    fields: [Wishlist.userId],
    references: [User.clerkId],
  }),

  product: one(Product, {
    fields: [Wishlist.productId],
    references: [Product.id],
  }),
}));