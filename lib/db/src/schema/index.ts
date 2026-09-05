import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const binaryData = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export const usersTable = pgTable(
  "gs_users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    color: text("color").default("#4A90A4").notNull(),
    followersCount: integer("followers_count").default(0).notNull(),
    followingCount: integer("following_count").default(0).notNull(),
    postsCount: integer("posts_count").default(0).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("gs_users_username_unique").on(table.username),
    uniqueIndex("gs_users_email_unique").on(table.email),
  ],
);

export const sessionsTable = pgTable("gs_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

export const followsTable = pgTable(
  "gs_follows",
  {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: integer("following_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    unique("gs_follows_follower_following_unique").on(
      table.followerId,
      table.followingId,
    ),
  ],
);

export const mediaTable = pgTable("gs_media", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  fileName: text("file_name").notNull(),
  data: binaryData("data").notNull(),
  byteSize: integer("byte_size").notNull(),
  createdAt: createdAt(),
});

export const postsTable = pgTable("gs_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  caption: text("caption").default("").notNull(),
  bibleReference: text("bible_reference"),
  bibleText: text("bible_text"),
  isRealm: boolean("is_realm").default(false).notNull(),
  realmCategory: integer("realm_category"),
  realmDuration: text("realm_duration"),
  realmAudioName: text("realm_audio_name"),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  sharesCount: integer("shares_count").default(0).notNull(),
  createdAt: createdAt(),
});

export const postMediaTable = pgTable(
  "gs_post_media",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => mediaTable.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    position: integer("position").default(0).notNull(),
  },
  (table) => [
    unique("gs_post_media_post_media_unique").on(table.postId, table.mediaId),
  ],
);

export const postLikesTable = pgTable(
  "gs_post_likes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    unique("gs_post_likes_post_user_unique").on(table.postId, table.userId),
  ],
);

export const postSharesTable = pgTable(
  "gs_post_shares",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    unique("gs_post_shares_post_user_unique").on(table.postId, table.userId),
  ],
);

export const postCommentsTable = pgTable("gs_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: createdAt(),
});

export const storiesTable = pgTable("gs_stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

export const storyItemsTable = pgTable("gs_story_items", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id")
    .notNull()
    .references(() => storiesTable.id, { onDelete: "cascade" }),
  text: text("text"),
  gradient: jsonb("gradient"),
  scriptureReference: text("scripture_reference"),
  scriptureText: text("scripture_text"),
  mediaId: integer("media_id").references(() => mediaTable.id, {
    onDelete: "set null",
  }),
  mediaType: text("media_type"),
  createdAt: createdAt(),
});

export const storyViewsTable = pgTable(
  "gs_story_views",
  {
    id: serial("id").primaryKey(),
    storyId: integer("story_id")
      .notNull()
      .references(() => storiesTable.id, { onDelete: "cascade" }),
    viewerId: integer("viewer_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("gs_story_views_story_viewer_unique").on(
      table.storyId,
      table.viewerId,
    ),
  ],
);

export const storyLikesTable = pgTable(
  "gs_story_likes",
  {
    id: serial("id").primaryKey(),
    storyId: integer("story_id")
      .notNull()
      .references(() => storiesTable.id, { onDelete: "cascade" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => storyItemsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    unique("gs_story_likes_story_item_user_unique").on(
      table.storyId,
      table.itemId,
      table.userId,
    ),
  ],
);

export const storyRepliesTable = pgTable("gs_story_replies", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id")
    .notNull()
    .references(() => storiesTable.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => storyItemsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: createdAt(),
});

export const storySharesTable = pgTable(
  "gs_story_shares",
  {
    id: serial("id").primaryKey(),
    storyId: integer("story_id")
      .notNull()
      .references(() => storiesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    unique("gs_story_shares_story_user_unique").on(table.storyId, table.userId),
  ],
);

export const testimoniesTable = pgTable("gs_testimonies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: createdAt(),
});

export const testimonyLikesTable = pgTable(
  "gs_testimony_likes",
  {
    id: serial("id").primaryKey(),
    testimonyId: integer("testimony_id")
      .notNull()
      .references(() => testimoniesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    unique("gs_testimony_likes_testimony_user_unique").on(
      table.testimonyId,
      table.userId,
    ),
  ],
);

export const testimonyCommentsTable = pgTable("gs_testimony_comments", {
  id: serial("id").primaryKey(),
  testimonyId: integer("testimony_id")
    .notNull()
    .references(() => testimoniesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: createdAt(),
});