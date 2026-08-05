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
import type { PageDesign } from "@/lib/templates";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
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
    handle: varchar("handle", { length: 32 }).notNull(),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    bio: varchar("bio", { length: 280 }).default("").notNull(),
    avatarInitials: varchar("avatar_initials", { length: 4 }).default("LB").notNull(),
    theme: varchar("theme", { length: 24 }).default("field").notNull(),
    contactEmail: varchar("contact_email", { length: 320 }).default("").notNull(),
    showShare: boolean("show_share").default(true).notNull(),
    showContact: boolean("show_contact").default(true).notNull(),
    design: jsonb("design").$type<Partial<PageDesign>>().default({}).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
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
  label: varchar("label", { length: 80 }).notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const socialChannels = pgTable(
  "social_channels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 24 }).notNull(),
    handle: varchar("handle", { length: 80 }).default("").notNull(),
    url: text("url").notNull(),
    title: varchar("title", { length: 120 }).default("").notNull(),
    description: varchar("description", { length: 280 }).default("").notNull(),
    imageUrl: text("image_url").default("").notNull(),
    siteName: varchar("site_name", { length: 80 }).default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("social_channels_page_url_unique").on(table.pageId, table.url)],
);

export type User = typeof users.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Link = typeof links.$inferSelect;
export type SocialChannel = typeof socialChannels.$inferSelect;
