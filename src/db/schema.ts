import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    handle: text("handle").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio").default("").notNull(),
    avatarText: text("avatar_text").default("").notNull(),
    avatarInitials: varchar("avatar_initials", { length: 4 })
      .default("OB")
      .notNull(),
    theme: text("theme").default("fairway").notNull(),
    accent: text("accent").default("").notNull(),
    style: jsonb("style").$type<Record<string, unknown>>().default({}).notNull(),
    design: jsonb("design").$type<Record<string, unknown>>().default({}).notNull(),
    published: boolean("published").default(true).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    contactEmail: varchar("contact_email", { length: 320 }),
    showShare: boolean("show_share").default(false).notNull(),
    showContact: boolean("show_contact").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("pages_user_id_unique").on(table.userId),
    uniqueIndex("pages_handle_unique").on(table.handle),
  ],
);

export const links = pgTable("links", {
  id: uuid("id").defaultRandom().primaryKey(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  section: text("section").default("").notNull(),
  label: text("label").notNull(),
  sublabel: text("sublabel").default("").notNull(),
  url: text("url").notNull(),
  featured: boolean("featured").default(false).notNull(),
  visible: boolean("visible").default(true).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  position: integer("position").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  kind: text("kind").default("link").notNull(),
  size: text("size").default("auto").notNull(),
  span: integer("span").default(1).notNull(),
  variant: text("variant").default("line").notNull(),
  clickCount: integer("click_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Link = typeof links.$inferSelect;
