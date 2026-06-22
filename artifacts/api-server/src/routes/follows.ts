import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "gracesocial-secret-key-change-in-production";

async function getAuthUserId(authHeader: string | undefined): Promise<number | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const session = await pool.query(
      "SELECT id FROM gs_sessions WHERE token = $1 AND expires_at > NOW()",
      [token]
    );
    if (session.rows.length === 0) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

router.post("/users/:userId/follow", async (req, res) => {
  try {
    const currentUserId = await getAuthUserId(req.headers.authorization);
    if (!currentUserId) return res.status(401).json({ error: "Not authenticated." });

    const targetId = parseInt(req.params.userId, 10);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID." });
    if (targetId === currentUserId) return res.status(400).json({ error: "You cannot follow yourself." });

    const targetUser = await pool.query("SELECT id FROM gs_users WHERE id = $1", [targetId]);
    if (targetUser.rows.length === 0) return res.status(404).json({ error: "User not found." });

    await pool.query(
      "INSERT INTO gs_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [currentUserId, targetId]
    );

    await pool.query(
      "UPDATE gs_users SET followers_count = (SELECT COUNT(*) FROM gs_follows WHERE following_id = $1) WHERE id = $1",
      [targetId]
    );
    await pool.query(
      "UPDATE gs_users SET following_count = (SELECT COUNT(*) FROM gs_follows WHERE follower_id = $1) WHERE id = $1",
      [currentUserId]
    );

    const updated = await pool.query(
      "SELECT followers_count FROM gs_users WHERE id = $1",
      [targetId]
    );

    return res.json({ success: true, followersCount: updated.rows[0].followers_count });
  } catch (err) {
    console.error("Follow error:", err);
    return res.status(500).json({ error: "Follow failed." });
  }
});

router.delete("/users/:userId/follow", async (req, res) => {
  try {
    const currentUserId = await getAuthUserId(req.headers.authorization);
    if (!currentUserId) return res.status(401).json({ error: "Not authenticated." });

    const targetId = parseInt(req.params.userId, 10);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID." });

    await pool.query(
      "DELETE FROM gs_follows WHERE follower_id = $1 AND following_id = $2",
      [currentUserId, targetId]
    );

    await pool.query(
      "UPDATE gs_users SET followers_count = (SELECT COUNT(*) FROM gs_follows WHERE following_id = $1) WHERE id = $1",
      [targetId]
    );
    await pool.query(
      "UPDATE gs_users SET following_count = (SELECT COUNT(*) FROM gs_follows WHERE follower_id = $1) WHERE id = $1",
      [currentUserId]
    );

    const updated = await pool.query(
      "SELECT followers_count FROM gs_users WHERE id = $1",
      [targetId]
    );

    return res.json({ success: true, followersCount: updated.rows[0].followers_count });
  } catch (err) {
    console.error("Unfollow error:", err);
    return res.status(500).json({ error: "Unfollow failed." });
  }
});

router.get("/users/:userId/followers", async (req, res) => {
  try {
    const currentUserId = await getAuthUserId(req.headers.authorization);
    const targetId = parseInt(req.params.userId, 10);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID." });

    const result = await pool.query(
      `SELECT u.id, u.name, u.username, u.display_name, u.bio, u.avatar_url, u.color,
              u.followers_count, u.following_count,
              CASE WHEN f2.id IS NOT NULL THEN true ELSE false END AS is_following_back
       FROM gs_follows f
       JOIN gs_users u ON u.id = f.follower_id
       LEFT JOIN gs_follows f2 ON f2.follower_id = $2 AND f2.following_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [targetId, currentUserId ?? 0]
    );

    return res.json({ users: result.rows });
  } catch (err) {
    console.error("Followers list error:", err);
    return res.status(500).json({ error: "Failed to fetch followers." });
  }
});

router.get("/users/:userId/following", async (req, res) => {
  try {
    const currentUserId = await getAuthUserId(req.headers.authorization);
    const targetId = parseInt(req.params.userId, 10);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID." });

    const result = await pool.query(
      `SELECT u.id, u.name, u.username, u.display_name, u.bio, u.avatar_url, u.color,
              u.followers_count, u.following_count,
              CASE WHEN f2.id IS NOT NULL THEN true ELSE false END AS is_following_back
       FROM gs_follows f
       JOIN gs_users u ON u.id = f.following_id
       LEFT JOIN gs_follows f2 ON f2.follower_id = $2 AND f2.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [targetId, currentUserId ?? 0]
    );

    return res.json({ users: result.rows });
  } catch (err) {
    console.error("Following list error:", err);
    return res.status(500).json({ error: "Failed to fetch following." });
  }
});

router.get("/users/:userId/follow-status", async (req, res) => {
  try {
    const currentUserId = await getAuthUserId(req.headers.authorization);
    if (!currentUserId) return res.json({ isFollowing: false });

    const targetId = parseInt(req.params.userId, 10);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID." });

    const result = await pool.query(
      "SELECT id FROM gs_follows WHERE follower_id = $1 AND following_id = $2",
      [currentUserId, targetId]
    );

    return res.json({ isFollowing: result.rows.length > 0 });
  } catch (err) {
    console.error("Follow status error:", err);
    return res.status(500).json({ error: "Failed to check follow status." });
  }
});

router.get("/users/search", async (req, res) => {
  try {
    const currentUserId = await getAuthUserId(req.headers.authorization);
    const q = (req.query.q as string || '').trim();
    if (!q) return res.json({ users: [] });

    const result = await pool.query(
      `SELECT u.id, u.name, u.username, u.display_name, u.bio, u.avatar_url, u.color,
              u.followers_count, u.following_count,
              CASE WHEN f.id IS NOT NULL THEN true ELSE false END AS is_following_back
       FROM gs_users u
       LEFT JOIN gs_follows f ON f.follower_id = $1 AND f.following_id = u.id
       WHERE u.id != $1
         AND (
           LOWER(u.name) LIKE $2
           OR LOWER(u.username) LIKE $2
           OR LOWER(u.display_name) LIKE $2
         )
       ORDER BY u.followers_count DESC
       LIMIT 30`,
      [currentUserId ?? 0, `%${q.toLowerCase()}%`]
    );

    return res.json({ users: result.rows });
  } catch (err) {
    console.error("User search error:", err);
    return res.status(500).json({ error: "Search failed." });
  }
});

export default router;
