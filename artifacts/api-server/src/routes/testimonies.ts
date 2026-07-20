import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "gracesocial-secret-key-change-in-production";

function optionalAuth(req: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    return payload.userId;
  } catch {
    return null;
  }
}

function requireAuthOrFail(
  req: any,
  res: any
): number | null {
  const userId = optionalAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  return userId;
}

// GET /api/testimonies
router.get("/testimonies", async (req, res) => {
  const userId = optionalAuth(req);
  try {
    const likedExpr = userId
      ? `EXISTS(SELECT 1 FROM gs_testimony_likes l WHERE l.testimony_id = t.id AND l.user_id = $1)`
      : `false`;
    const params = userId ? [userId] : [];

    const result = await pool.query(
      `SELECT t.id, t.title, t.content, t.likes_count, t.comments_count, t.created_at,
              u.id AS user_id, u.display_name, u.username, u.color, u.avatar_url,
              ${likedExpr} AS is_liked
       FROM gs_testimonies t
       JOIN gs_users u ON u.id = t.user_id
       ORDER BY t.created_at DESC
       LIMIT 50`,
      params
    );
    return res.json({ testimonies: result.rows });
  } catch (err) {
    console.error("GET /testimonies error:", err);
    return res.status(500).json({ error: "Failed to fetch testimonies." });
  }
});

// POST /api/testimonies
router.post("/testimonies", async (req, res) => {
  const userId = requireAuthOrFail(req, res);
  if (!userId) return;
  try {
    const { title, content } = req.body;
    if (!title?.trim())
      return res.status(400).json({ error: "Title is required." });
    if (!content?.trim())
      return res.status(400).json({ error: "Content is required." });

    const result = await pool.query(
      `INSERT INTO gs_testimonies (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING id, title, content, likes_count, comments_count, created_at`,
      [userId, title.trim(), content.trim()]
    );
    return res.status(201).json({ testimony: result.rows[0] });
  } catch (err) {
    console.error("POST /testimonies error:", err);
    return res.status(500).json({ error: "Failed to create testimony." });
  }
});

// POST /api/testimonies/:id/like  (toggle)
router.post("/testimonies/:id/like", async (req, res) => {
  const userId = requireAuthOrFail(req, res);
  if (!userId) return;
  const testimonyId = parseInt(req.params.id, 10);
  if (isNaN(testimonyId))
    return res.status(400).json({ error: "Invalid testimony ID." });

  try {
    const existing = await pool.query(
      "SELECT id FROM gs_testimony_likes WHERE testimony_id = $1 AND user_id = $2",
      [testimonyId, userId]
    );
    let liked: boolean;
    if (existing.rows.length > 0) {
      await pool.query(
        "DELETE FROM gs_testimony_likes WHERE testimony_id = $1 AND user_id = $2",
        [testimonyId, userId]
      );
      await pool.query(
        "UPDATE gs_testimonies SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1",
        [testimonyId]
      );
      liked = false;
    } else {
      await pool.query(
        "INSERT INTO gs_testimony_likes (testimony_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [testimonyId, userId]
      );
      await pool.query(
        "UPDATE gs_testimonies SET likes_count = likes_count + 1 WHERE id = $1",
        [testimonyId]
      );
      liked = true;
    }
    const updated = await pool.query(
      "SELECT likes_count FROM gs_testimonies WHERE id = $1",
      [testimonyId]
    );
    return res.json({ liked, likes_count: updated.rows[0]?.likes_count ?? 0 });
  } catch (err) {
    console.error("POST /testimonies/:id/like error:", err);
    return res.status(500).json({ error: "Failed to toggle like." });
  }
});

// GET /api/testimonies/:id/comments
router.get("/testimonies/:id/comments", async (req, res) => {
  const testimonyId = parseInt(req.params.id, 10);
  if (isNaN(testimonyId))
    return res.status(400).json({ error: "Invalid testimony ID." });
  try {
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at,
              u.id AS user_id, u.display_name, u.username, u.color, u.avatar_url
       FROM gs_testimony_comments c
       JOIN gs_users u ON u.id = c.user_id
       WHERE c.testimony_id = $1
       ORDER BY c.created_at ASC`,
      [testimonyId]
    );
    return res.json({ comments: result.rows });
  } catch (err) {
    console.error("GET /testimonies/:id/comments error:", err);
    return res.status(500).json({ error: "Failed to fetch comments." });
  }
});

// POST /api/testimonies/:id/comments
router.post("/testimonies/:id/comments", async (req, res) => {
  const userId = requireAuthOrFail(req, res);
  if (!userId) return;
  const testimonyId = parseInt(req.params.id, 10);
  if (isNaN(testimonyId))
    return res.status(400).json({ error: "Invalid testimony ID." });
  try {
    const { content } = req.body;
    if (!content?.trim())
      return res.status(400).json({ error: "Comment content is required." });

    const result = await pool.query(
      `INSERT INTO gs_testimony_comments (testimony_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [testimonyId, userId, content.trim()]
    );
    await pool.query(
      "UPDATE gs_testimonies SET comments_count = comments_count + 1 WHERE id = $1",
      [testimonyId]
    );
    const userResult = await pool.query(
      "SELECT id, display_name, username, color, avatar_url FROM gs_users WHERE id = $1",
      [userId]
    );
    const comment = {
      ...result.rows[0],
      user_id: userId,
      display_name: userResult.rows[0]?.display_name,
      username: userResult.rows[0]?.username,
      color: userResult.rows[0]?.color,
      avatar_url: userResult.rows[0]?.avatar_url,
    };
    return res.status(201).json({ comment });
  } catch (err) {
    console.error("POST /testimonies/:id/comments error:", err);
    return res.status(500).json({ error: "Failed to post comment." });
  }
});

export default router;
