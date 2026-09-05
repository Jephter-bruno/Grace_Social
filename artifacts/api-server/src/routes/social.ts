import { Router } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { pool } from "@workspace/db";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});
const JWT_SECRET =
  process.env.JWT_SECRET || "gracesocial-secret-key-change-in-production";

function optionalAuth(req: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: number };
    return payload.userId;
  } catch {
    return null;
  }
}

function requireAuth(req: any, res: any): number | null {
  const userId = optionalAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  return userId;
}

function relativeTime(value: Date | string): string {
  const date = new Date(value).getTime();
  const minutes = Math.max(0, Math.floor((Date.now() - date) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function mediaUrl(id: number, req?: any): string {
  if (!req) return `/api/media/${id}`;
  const host = req.get("host");
  const forwardedProto = req.headers["x-forwarded-proto"]?.split(",")[0];
  const protocol =
    forwardedProto ||
    (req.protocol === "http" && !host.startsWith("localhost") && !host.startsWith("127.")
      ? "https"
      : req.protocol);
  return `${protocol}://${host}/api/media/${id}`;
}

function mapPost(row: any, media: any[], userId: number | null, req?: any) {
  return {
    id: `server-post-${row.id}`,
    userId: String(row.user_id),
    userName: row.display_name || row.name || row.username,
    userHandle: `@${row.username}`,
    userInitials: (row.display_name || row.name || row.username)
      .split(/\s+/)
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    userColor: row.color || "#4A90A4",
    avatarUrl: row.avatar_url,
    imageIndex: row.image_index,
    mediaItems: media.map((item) => ({
      uri: mediaUrl(item.media_id, req),
      type: item.media_type,
    })),
    localImageUri:
      media.length === 1 && media[0].media_type === "image"
        ? mediaUrl(media[0].media_id, req)
        : undefined,
    videoUri:
      media.length === 1 && media[0].media_type === "video"
        ? mediaUrl(media[0].media_id, req)
        : undefined,
    caption: row.caption,
    bibleVerse: row.bible_reference
      ? { reference: row.bible_reference, text: row.bible_text || "" }
      : undefined,
    likes: Number(row.likes_count || 0),
    comments: Number(row.comments_count || 0),
    shares: Number(row.shares_count || 0),
    views: Number(row.view_count || 0),
    reposts: 0,
    isLiked: Boolean(row.is_liked),
    isSaved: false,
    timestamp: relativeTime(row.created_at),
  };
}

function mapReel(row: any, media: any[], req?: any) {
  const video = media.find((item) => item.media_type === "video");
  const displayName = row.display_name || row.name || row.username;
  return {
    id: `server-post-${row.id}`,
    userName: displayName,
    userHandle: `@${row.username}`,
    userInitials: displayName
      .split(/\s+/)
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    userColor: row.color || "#4A90A4",
    avatarUrl: row.avatar_url,
    description: row.caption,
    bibleVerse: row.bible_text || "",
    likes: Number(row.likes_count || 0),
    comments: Number(row.comments_count || 0),
    shares: Number(row.shares_count || 0),
    views: Number(row.view_count || 0),
    isLiked: Boolean(row.is_liked),
    isSaved: false,
    imageIndex: Number(row.realm_category || 0),
    videoUri: video ? mediaUrl(Number(video.media_id), req) : undefined,
    duration: row.realm_duration || "0:15",
    isFollowing: false,
    audioName: row.realm_audio_name || `Original audio · @${row.username}`,
  };
}

function parseServerId(value: string, prefix: string): number | null {
  if (!value.startsWith(prefix)) return null;
  const id = Number(value.slice(prefix.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Media is stored in PostgreSQL bytea so a picked file is not tied to one device.
router.post("/media", upload.single("file"), async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  if (!req.file) {
    res.status(400).json({ error: "A media file is required." });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO gs_media (owner_id, content_type, file_name, data, byte_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, content_type`,
      [
        userId,
        req.file.mimetype,
        req.file.originalname || "upload",
        req.file.buffer,
        req.file.size,
      ],
    );
    res.status(201).json({
      id: Number(result.rows[0].id),
      url: mediaUrl(Number(result.rows[0].id), req),
      contentType: result.rows[0].content_type,
    });
  } catch (error) {
    req.log?.error(error);
    res.status(500).json({ error: "Unable to store media." });
  }
});

router.get("/media/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(404).end();
    return;
  }
  try {
    const result = await pool.query(
      "SELECT content_type, file_name, data FROM gs_media WHERE id = $1",
      [id],
    );
    if (!result.rows[0]) {
      res.status(404).end();
      return;
    }
    res.setHeader("Content-Type", result.rows[0].content_type);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(result.rows[0].data);
  } catch {
    res.status(500).json({ error: "Unable to load media." });
  }
});

router.get("/posts", async (req, res) => {
  const userId = optionalAuth(req);
  try {
    const posts = await pool.query(
      `SELECT p.*, u.name, u.display_name, u.username, u.color, u.avatar_url,
              EXISTS(
                SELECT 1 FROM gs_post_likes pl
                WHERE pl.post_id = p.id AND pl.user_id = $1
              ) AS is_liked,
              (SELECT COUNT(*)::int FROM gs_post_views pv WHERE pv.post_id = p.id) AS view_count
       FROM gs_posts p
       JOIN gs_users u ON u.id = p.user_id
       WHERE p.is_realm = false
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [userId],
    );
    const media = await pool.query(
      `SELECT pm.post_id, pm.media_id, pm.media_type
       FROM gs_post_media pm
       JOIN gs_posts p ON p.id = pm.post_id
       ORDER BY pm.position ASC`,
    );
    const mediaByPost = new Map<number, any[]>();
    for (const item of media.rows) {
      const list = mediaByPost.get(Number(item.post_id)) || [];
      list.push(item);
      mediaByPost.set(Number(item.post_id), list);
    }
    res.json({
      posts: posts.rows.map((row: any) =>
        mapPost(row, mediaByPost.get(Number(row.id)) || [], userId, req),
      ),
    });
  } catch (error) {
    req.log?.error(error);
    res.status(500).json({ error: "Unable to load posts." });
  }
});

router.post("/posts", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const { caption, bibleVerse, mediaItems = [] } = req.body || {};
  if (typeof caption !== "string" || !caption.trim()) {
    res.status(400).json({ error: "A caption is required." });
    return;
  }
  if (
    !Array.isArray(mediaItems) ||
    mediaItems.length > 10 ||
    mediaItems.some(
      (item: any) =>
        !Number.isInteger(Number(item.mediaId)) ||
        !["image", "video"].includes(item.type),
    )
  ) {
    res.status(400).json({ error: "Invalid post media." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const postResult = await client.query(
      `INSERT INTO gs_posts (user_id, caption, bible_reference, bible_text, is_realm)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id`,
      [
        userId,
        caption.trim(),
        bibleVerse?.reference || null,
        bibleVerse?.text || null,
      ],
    );
    const postId = Number(postResult.rows[0].id);
    for (let index = 0; index < mediaItems.length; index += 1) {
      const item = mediaItems[index];
      const mediaExists = await client.query(
        "SELECT id FROM gs_media WHERE id = $1 AND owner_id = $2",
        [Number(item.mediaId), userId],
      );
      if (!mediaExists.rows[0]) {
        throw new Error("Media does not belong to the current user.");
      }
      await client.query(
        `INSERT INTO gs_post_media (post_id, media_id, media_type, position)
         VALUES ($1, $2, $3, $4)`,
        [postId, Number(item.mediaId), item.type, index],
      );
    }
    await client.query(
      "UPDATE gs_users SET posts_count = posts_count + 1 WHERE id = $1",
      [userId],
    );
    await client.query("COMMIT");
    const result = await pool.query(
      `SELECT p.*, u.name, u.display_name, u.username, u.color, u.avatar_url,
              false AS is_liked
       FROM gs_posts p JOIN gs_users u ON u.id = p.user_id WHERE p.id = $1`,
      [postId],
    );
    const postMedia = await pool.query(
      `SELECT media_id, media_type FROM gs_post_media
       WHERE post_id = $1 ORDER BY position ASC`,
      [postId],
    );
    res.status(201).json({
      post: mapPost(result.rows[0], postMedia.rows, userId, req),
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    req.log?.error(error);
    res.status(400).json({ error: error.message || "Unable to create post." });
  } finally {
    client.release();
  }
});

router.get("/realms", async (req, res) => {
  const userId = optionalAuth(req);
  try {
    const realms = await pool.query(
      `SELECT p.*, u.name, u.display_name, u.username, u.color, u.avatar_url,
              EXISTS(
                SELECT 1 FROM gs_post_likes pl
                WHERE pl.post_id = p.id AND pl.user_id = $1
              ) AS is_liked,
              (SELECT COUNT(*)::int FROM gs_post_views pv WHERE pv.post_id = p.id) AS view_count
       FROM gs_posts p
       JOIN gs_users u ON u.id = p.user_id
       WHERE p.is_realm = true
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [userId],
    );
    const media = await pool.query(
      `SELECT pm.post_id, pm.media_id, pm.media_type
       FROM gs_post_media pm
       JOIN gs_posts p ON p.id = pm.post_id
       WHERE p.is_realm = true
       ORDER BY pm.position ASC`,
    );
    const mediaByPost = new Map<number, any[]>();
    for (const item of media.rows) {
      const list = mediaByPost.get(Number(item.post_id)) || [];
      list.push(item);
      mediaByPost.set(Number(item.post_id), list);
    }
    res.json({
      reels: realms.rows.map((row: any) =>
        mapReel(row, mediaByPost.get(Number(row.id)) || [], req),
      ),
    });
  } catch (error) {
    req.log?.error(error);
    res.status(500).json({ error: "Unable to load Realms." });
  }
});

router.post("/realms", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const {
    description,
    bibleVerse,
    mediaId,
    category = 0,
    duration = "0:15",
    audioName,
  } = req.body || {};
  const parsedMediaId = Number(mediaId);
  const parsedCategory = Number(category);

  if (typeof description !== "string" || !description.trim()) {
    res.status(400).json({ error: "A description is required." });
    return;
  }
  if (
    !Number.isInteger(parsedMediaId) ||
    parsedMediaId < 1 ||
    !Number.isInteger(parsedCategory) ||
    parsedCategory < 0 ||
    parsedCategory > 4
  ) {
    res.status(400).json({ error: "A valid Realm video and category are required." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const mediaExists = await client.query(
      `SELECT id FROM gs_media
       WHERE id = $1 AND owner_id = $2 AND content_type LIKE 'video/%'`,
      [parsedMediaId, userId],
    );
    if (!mediaExists.rows[0]) {
      throw new Error("The Realm video is not available.");
    }

    const realmResult = await client.query(
      `INSERT INTO gs_posts
         (user_id, caption, bible_text, is_realm, realm_category, realm_duration, realm_audio_name)
       VALUES ($1, $2, $3, true, $4, $5, $6)
       RETURNING id`,
      [
        userId,
        description.trim(),
        typeof bibleVerse === "string" && bibleVerse.trim()
          ? bibleVerse.trim()
          : null,
        parsedCategory,
        typeof duration === "string" && duration.trim() ? duration.trim() : "0:15",
        typeof audioName === "string" && audioName.trim() ? audioName.trim() : null,
      ],
    );
    const realmId = Number(realmResult.rows[0].id);
    await client.query(
      "INSERT INTO gs_post_media (post_id, media_id, media_type, position) VALUES ($1, $2, 'video', 0)",
      [realmId, parsedMediaId],
    );
    await client.query(
      "UPDATE gs_users SET posts_count = posts_count + 1 WHERE id = $1",
      [userId],
    );
    await client.query("COMMIT");

    const result = await pool.query(
      `SELECT p.*, u.name, u.display_name, u.username, u.color, u.avatar_url,
              false AS is_liked
       FROM gs_posts p
       JOIN gs_users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [realmId],
    );
    const realmMedia = await pool.query(
      `SELECT media_id, media_type FROM gs_post_media
       WHERE post_id = $1 ORDER BY position ASC`,
      [realmId],
    );
    res.status(201).json({
      reel: mapReel(result.rows[0], realmMedia.rows, req),
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    req.log?.error(error);
    res.status(400).json({ error: error.message || "Unable to create Realm." });
  } finally {
    client.release();
  }
});

router.post("/posts/:id/like", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const postId = parseServerId(req.params.id, "server-post-");
  if (!postId) {
    res.status(400).json({ error: "Invalid post id." });
    return;
  }
  try {
    const existing = await pool.query(
      "SELECT 1 FROM gs_post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, userId],
    );
    if (existing.rows[0]) {
      await pool.query(
        "DELETE FROM gs_post_likes WHERE post_id = $1 AND user_id = $2",
        [postId, userId],
      );
    } else {
      await pool.query(
        "INSERT INTO gs_post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [postId, userId],
      );
    }
    const count = await pool.query(
      "SELECT COUNT(*)::int AS count FROM gs_post_likes WHERE post_id = $1",
      [postId],
    );
    await pool.query("UPDATE gs_posts SET likes_count = $1 WHERE id = $2", [
      count.rows[0].count,
      postId,
    ]);
    res.json({ isLiked: !existing.rows[0], likes: count.rows[0].count });
  } catch {
    res.status(500).json({ error: "Unable to update post like." });
  }
});

router.post("/posts/:id/view", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const postId = parseServerId(req.params.id, "server-post-");
  if (!postId) {
    res.status(400).json({ error: "Invalid post id." });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO gs_post_views (post_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [postId, userId],
    );
    const count = await pool.query(
      "SELECT COUNT(*)::int AS count FROM gs_post_views WHERE post_id = $1",
      [postId],
    );
    res.json({ views: count.rows[0].count });
  } catch {
    res.status(500).json({ error: "Unable to record post view." });
  }
});

router.post("/posts/:id/share", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const postId = parseServerId(req.params.id, "server-post-");
  if (!postId) {
    res.status(400).json({ error: "Invalid post id." });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO gs_post_shares (post_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [postId, userId],
    );
    const count = await pool.query(
      "SELECT COUNT(*)::int AS count FROM gs_post_shares WHERE post_id = $1",
      [postId],
    );
    await pool.query("UPDATE gs_posts SET shares_count = $1 WHERE id = $2", [
      count.rows[0].count,
      postId,
    ]);
    res.json({ shares: count.rows[0].count });
  } catch {
    res.status(500).json({ error: "Unable to share post." });
  }
});

router.get("/posts/:id/comments", async (req, res) => {
  const postId = parseServerId(req.params.id, "server-post-");
  if (!postId) {
    res.status(400).json({ error: "Invalid post id." });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT c.id, c.text, c.created_at, u.display_name, u.name, u.username, u.color,
              u.avatar_url,
              COUNT(DISTINCT pcl.id)::int AS likes,
              EXISTS(
                SELECT 1 FROM gs_post_comment_likes pcl2
                WHERE pcl2.comment_id = c.id AND pcl2.user_id = $2
              ) AS is_liked
       FROM gs_post_comments c JOIN gs_users u ON u.id = c.user_id
       LEFT JOIN gs_post_comment_likes pcl ON pcl.comment_id = c.id
       WHERE c.post_id = $1
       GROUP BY c.id, c.text, c.created_at, u.display_name, u.name, u.username, u.color, u.avatar_url
       ORDER BY c.created_at DESC`,
      [postId, optionalAuth(req)],
    );
    res.json({
      comments: result.rows.map((row: any) => ({
        id: `server-comment-${row.id}`,
        postId: req.params.id,
        userName: row.display_name || row.name || row.username,
        userInitials: (row.display_name || row.name || row.username)
          .split(/\s+/)
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        userColor: row.color || "#4A90A4",
        text: row.text,
        timestamp: relativeTime(row.created_at),
        likes: Number(row.likes || 0),
        isLiked: Boolean(row.is_liked),
      })),
    });
  } catch {
    res.status(500).json({ error: "Unable to load comments." });
  }
});

router.post("/posts/:id/comments/:commentId/like", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const postId = parseServerId(req.params.id, "server-post-");
  const commentId = Number(req.params.commentId.replace("server-comment-", ""));
  if (!postId || !Number.isInteger(commentId) || commentId < 1) {
    res.status(400).json({ error: "Invalid post comment." });
    return;
  }
  try {
    const ownsPost = await pool.query(
      "SELECT 1 FROM gs_post_comments WHERE id = $1 AND post_id = $2",
      [commentId, postId],
    );
    if (!ownsPost.rows[0]) {
      res.status(404).json({ error: "Comment not found." });
      return;
    }
    const existing = await pool.query(
      "SELECT 1 FROM gs_post_comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, userId],
    );
    if (existing.rows[0]) {
      await pool.query(
        "DELETE FROM gs_post_comment_likes WHERE comment_id = $1 AND user_id = $2",
        [commentId, userId],
      );
    } else {
      await pool.query(
        "INSERT INTO gs_post_comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [commentId, userId],
      );
    }
    const count = await pool.query(
      "SELECT COUNT(*)::int AS count FROM gs_post_comment_likes WHERE comment_id = $1",
      [commentId],
    );
    res.json({ isLiked: !existing.rows[0], likes: count.rows[0].count });
  } catch {
    res.status(500).json({ error: "Unable to update comment like." });
  }
});

router.post("/posts/:id/comments", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const postId = parseServerId(req.params.id, "server-post-");
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!postId || !text) {
    res.status(400).json({ error: "A valid post and comment are required." });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO gs_post_comments (post_id, user_id, text)
       VALUES ($1, $2, $3) RETURNING id, created_at`,
      [postId, userId, text.slice(0, 1000)],
    );
    await pool.query(
      "UPDATE gs_posts SET comments_count = comments_count + 1 WHERE id = $1",
      [postId],
    );
    const user = await pool.query(
      "SELECT name, display_name, username, color FROM gs_users WHERE id = $1",
      [userId],
    );
    const row = user.rows[0];
    res.status(201).json({
      comment: {
        id: `server-comment-${result.rows[0].id}`,
        postId: req.params.id,
        userName: row.display_name || row.name || row.username,
        userInitials: (row.display_name || row.name || row.username)
          .split(/\s+/)
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        userColor: row.color || "#4A90A4",
        text,
        timestamp: "just now",
        likes: 0,
        isLiked: false,
      },
    });
  } catch {
    res.status(500).json({ error: "Unable to add comment." });
  }
});

function mapStory(row: any, items: any[], userId: number | null, req?: any) {
  return {
    id: `server-story-${row.id}`,
    userId: Number(row.user_id),
    displayName: row.display_name || row.name || row.username,
    username: row.username,
    color: row.color || "#4A90A4",
    avatarUrl: row.avatar_url || null,
    initials: (row.display_name || row.name || row.username)
      .split(/\s+/)
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    items: items.map((item) => ({
      id: `server-story-item-${item.id}`,
      text: item.text || undefined,
      gradient: item.gradient || ["#1a3a4a", "#2d6a7f", "#1a3a4a"],
      scripture: item.scripture_reference
        ? { reference: item.scripture_reference, text: item.scripture_text || "" }
        : undefined,
      timestamp: relativeTime(item.created_at),
      mediaUri: item.media_id ? mediaUrl(Number(item.media_id), req) : undefined,
      mediaType: item.media_type || undefined,
      likeCount: Number(item.like_count || 0),
      isLiked: Boolean(item.is_liked),
    })),
    seen: Boolean(row.seen),
    isOwn: Number(row.user_id) === userId,
    viewCount: Number(row.user_id) === userId ? Number(row.view_count || 0) : undefined,
    viewers: Number(row.user_id) === userId ? row.viewers || [] : undefined,
  };
}

router.get("/stories", async (req, res) => {
  const userId = optionalAuth(req);
  try {
    const stories = await pool.query(
      `SELECT s.*, u.name, u.display_name, u.username, u.color, u.avatar_url,
              EXISTS(
                SELECT 1 FROM gs_story_views sv
                WHERE sv.story_id = s.id AND sv.viewer_id = $1
              ) AS seen,
              (SELECT COUNT(*)::int FROM gs_story_views sv WHERE sv.story_id = s.id) AS view_count
              ,
              COALESCE((
                SELECT json_agg(json_build_object(
                  'id', u.id::text,
                  'username', u.username,
                  'name', COALESCE(u.display_name, u.name, u.username),
                  'initials', UPPER(LEFT(COALESCE(u.display_name, u.name, u.username), 2)),
                  'color', COALESCE(u.color, '#4A90A4'),
                  'time', 'recently',
                  'liked', EXISTS(
                    SELECT 1 FROM gs_story_likes sl
                    WHERE sl.story_id = s.id AND sl.user_id = u.id
                  )
                ) ORDER BY sv.viewed_at DESC)
                FROM gs_story_views sv JOIN gs_users u ON u.id = sv.viewer_id
                WHERE sv.story_id = s.id
              ), '[]'::json) AS viewers
       FROM gs_stories s JOIN gs_users u ON u.id = s.user_id
       WHERE s.expires_at > NOW()
       ORDER BY s.user_id = $1 DESC, s.created_at DESC`,
      [userId],
    );
    const items = await pool.query(
      `SELECT si.*, COALESCE(l.like_count, 0)::int AS like_count,
              COALESCE(l.is_liked, false) AS is_liked
       FROM gs_story_items si
       LEFT JOIN (
         SELECT sl.item_id, COUNT(*)::int AS like_count,
                BOOL_OR(sl.user_id = $1) AS is_liked
         FROM gs_story_likes sl GROUP BY sl.item_id
       ) l ON l.item_id = si.id
       WHERE si.story_id = ANY($2::int[])
       ORDER BY si.created_at ASC`,
      [userId, stories.rows.map((row: any) => Number(row.id))],
    );
    const itemsByStory = new Map<number, any[]>();
    for (const item of items.rows) {
      const list = itemsByStory.get(Number(item.story_id)) || [];
      list.push(item);
      itemsByStory.set(Number(item.story_id), list);
    }
    res.json({
      stories: stories.rows.map((row: any) =>
        mapStory(row, itemsByStory.get(Number(row.id)) || [], userId, req),
      ),
    });
  } catch (error) {
    req.log?.error(error);
    res.status(500).json({ error: "Unable to load stories." });
  }
});

router.post("/stories", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const { text, gradient, scripture, mediaId, mediaType } = req.body || {};
  if (
    (text != null && typeof text !== "string") ||
    (mediaId != null && !Number.isInteger(Number(mediaId))) ||
    (mediaType != null && !["image", "video"].includes(mediaType))
  ) {
    res.status(400).json({ error: "Invalid story content." });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let story = await client.query(
      `SELECT id FROM gs_stories
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    let storyId: number;
    if (story.rows[0]) {
      storyId = Number(story.rows[0].id);
    } else {
      const created = await client.query(
        `INSERT INTO gs_stories (user_id, expires_at)
         VALUES ($1, NOW() + INTERVAL '24 hours') RETURNING id`,
        [userId],
      );
      storyId = Number(created.rows[0].id);
    }
    if (mediaId != null) {
      const mediaExists = await client.query(
        "SELECT id FROM gs_media WHERE id = $1 AND owner_id = $2",
        [Number(mediaId), userId],
      );
      if (!mediaExists.rows[0]) throw new Error("Media does not belong to the current user.");
    }
    await client.query(
      `INSERT INTO gs_story_items
       (story_id, text, gradient, scripture_reference, scripture_text, media_id, media_type)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)`,
      [
        storyId,
        text?.trim() || null,
        JSON.stringify(
          Array.isArray(gradient) && gradient.length === 3
            ? gradient
            : ["#1a3a4a", "#2d6a7f", "#1a3a4a"],
        ),
        scripture?.reference || null,
        scripture?.text || null,
        mediaId == null ? null : Number(mediaId),
        mediaType || null,
      ],
    );
    await client.query("COMMIT");
    res.status(201).json({ storyId: `server-story-${storyId}` });
  } catch (error: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message || "Unable to create story." });
  } finally {
    client.release();
  }
});

router.post("/stories/:id/view", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const storyId = parseServerId(req.params.id, "server-story-");
  if (!storyId) {
    res.status(204).end();
    return;
  }
  try {
    await pool.query(
      `INSERT INTO gs_story_views (story_id, viewer_id)
       VALUES ($1, $2) ON CONFLICT (story_id, viewer_id)
       DO UPDATE SET viewed_at = NOW()`,
      [storyId, userId],
    );
    const count = await pool.query(
      "SELECT COUNT(*)::int AS count FROM gs_story_views WHERE story_id = $1",
      [storyId],
    );
    res.json({ viewCount: count.rows[0].count });
  } catch {
    res.status(500).json({ error: "Unable to record story view." });
  }
});

router.post("/stories/:id/like", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const storyId = parseServerId(req.params.id, "server-story-");
  const itemId = Number(req.body?.itemId);
  if (!storyId || !Number.isInteger(itemId)) {
    res.status(400).json({ error: "Invalid story item." });
    return;
  }
  try {
    const existing = await pool.query(
      `SELECT 1 FROM gs_story_likes
       WHERE story_id = $1 AND item_id = $2 AND user_id = $3`,
      [storyId, itemId, userId],
    );
    if (existing.rows[0]) {
      await pool.query(
        "DELETE FROM gs_story_likes WHERE story_id = $1 AND item_id = $2 AND user_id = $3",
        [storyId, itemId, userId],
      );
    } else {
      await pool.query(
        `INSERT INTO gs_story_likes (story_id, item_id, user_id)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [storyId, itemId, userId],
      );
    }
    const count = await pool.query(
      "SELECT COUNT(*)::int AS count FROM gs_story_likes WHERE item_id = $1",
      [itemId],
    );
    res.json({ isLiked: !existing.rows[0], likeCount: count.rows[0].count });
  } catch {
    res.status(500).json({ error: "Unable to update story like." });
  }
});

router.post("/stories/:id/replies", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const storyId = parseServerId(req.params.id, "server-story-");
  const itemId = Number(req.body?.itemId);
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!storyId || !Number.isInteger(itemId) || !text) {
    res.status(400).json({ error: "A valid story reply is required." });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO gs_story_replies (story_id, item_id, user_id, text)
       VALUES ($1, $2, $3, $4)`,
      [storyId, itemId, userId, text.slice(0, 1000)],
    );
    res.status(201).json({ ok: true });
  } catch {
    res.status(500).json({ error: "Unable to send story reply." });
  }
});

router.post("/stories/:id/share", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const storyId = parseServerId(req.params.id, "server-story-");
  if (!storyId) {
    res.status(400).json({ error: "Invalid story id." });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO gs_story_shares (story_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [storyId, userId],
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Unable to share story." });
  }
});

export default router;