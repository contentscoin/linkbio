import {
  boolean,
  index,
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
    mcpTokenHash: text("mcp_token_hash"),
    mcpTokenPrefix: varchar("mcp_token_prefix", { length: 24 }),
    mcpTokenCreatedAt: timestamp("mcp_token_created_at", { withTimezone: true }),
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
    // Backs findPageByMcpToken (lib/mcp-token.ts), which runs on every
    // authenticated MCP request. Unique because that lookup does .limit(1), so
    // two pages sharing a token hash would resolve to an arbitrary one.
    // Multiple NULLs are still allowed, which is what pages without a token need.
    uniqueIndex("pages_mcp_token_hash_unique").on(table.mcpTokenHash),
  ],
);

export const links = pgTable(
  "links",
  {
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
    mobileSpan: integer("mobile_span").default(1).notNull(),
    variant: text("variant").default("line").notNull(),
    layout: text("layout").default("horizontal").notNull(),
    iconPlacement: text("icon_placement").default("leading").notNull(),
    iconSize: integer("icon_size").default(20).notNull(),
    iconKey: text("icon_key").default("").notNull(),
    iconUrl: text("icon_url").default("").notNull(),
    iconImageUrl: text("icon_image_url").default("").notNull(),
    badge: text("badge").default("").notNull(),
    showArrow: boolean("show_arrow").default(true).notNull(),
    arrowStyle: text("arrow_style").default("plain").notNull(),
    arrowPosition: text("arrow_position").default("trailing").notNull(),
    showDivider: boolean("show_divider").default(false).notNull(),
    leadingIconUrl: text("leading_icon_url").default("").notNull(),
    secondaryText: text("secondary_text").default("").notNull(),
    trailingIcon: text("trailing_icon").default("").notNull(),
    cardPadding: text("card_padding").default("").notNull(),
    cardMinHeight: integer("card_min_height").default(0).notNull(),
    cardHeight: integer("card_height").default(0).notNull(),
    aspectRatio: text("aspect_ratio").default("").notNull(),
    rowSpan: integer("row_span").default(1).notNull(),
    trailingText: text("trailing_text").default("").notNull(),
    subtitlePlacement: text("subtitle_placement").default("body").notNull(),
    objectFit: text("object_fit").default("").notNull(),
    imageSize: integer("image_size").default(0).notNull(),
    imagePosition: text("image_position").default("").notNull(),
    mobileCardMinHeight: integer("mobile_card_min_height").default(0).notNull(),
    mobileCardHeight: integer("mobile_card_height").default(0).notNull(),
    mobileCardPadding: text("mobile_card_padding").default("").notNull(),
    clickCount: integer("click_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Every read of a page's links filters by page_id and sorts by
    // (sort_order, created_at) — see lib/page-bundle.ts and [handle]/page.tsx.
    // Without this the filter is a seq scan of the whole table. The key
    // includes the sort columns so an ordered index scan can also satisfy the
    // ORDER BY; at current row counts the planner still prefers a bitmap scan
    // plus a small in-memory sort, which is fine — the seq scan is the win.
    index("links_page_id_sort_idx").on(
      table.pageId,
      table.sortOrder,
      table.createdAt,
    ),
  ],
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    mimeType: text("mime_type").notNull(),
    contentBase64: text("content_base64").notNull(),
    byteSize: integer("byte_size").default(0).notNull(),
    purpose: text("purpose").default("general").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  // scripts/migrate-link-icons.mjs creates this index but it was never declared
  // here; the name matches so wherever that script has run, this is a no-op.
  // Backs the ON DELETE CASCADE from pages.
  (table) => [index("assets_page_id_idx").on(table.pageId)],
);

export type User = typeof users.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Asset = typeof assets.$inferSelect;
