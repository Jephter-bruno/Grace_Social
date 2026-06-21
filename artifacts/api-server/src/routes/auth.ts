import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "gracesocial-secret-key-change-in-production";
const TOKEN_EXPIRY_DAYS = 30;

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: `${TOKEN_EXPIRY_DAYS}d` });
}

function makeUsername(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${base}${suffix}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Name is required." });
    if (!email?.trim()) return res.status(400).json({ error: "Email is required." });
    if (!password || password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters." });

    const emailLower = email.toLowerCase().trim();

    const existing = await pool.query(
      "SELECT id FROM gs_users WHERE email = $1",
      [emailLower]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    const username = makeUsername(name);

    const result = await pool.query(
      `INSERT INTO gs_users (name, username, email, password_hash, display_name, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, username, email, display_name, bio, avatar_url, color, followers_count, following_count, posts_count, created_at`,
      [name.trim(), username, emailLower, passwordHash, name.trim(), "#4A90A4"]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

    await pool.query(
      "INSERT INTO gs_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expiresAt]
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        displayName: user.display_name,
        username: user.username,
        handle: `@${user.username}`,
        email: user.email,
        bio: user.bio || "",
        avatarUrl: user.avatar_url || null,
        color: user.color,
        initials: initials(user.name),
        followersCount: user.followers_count,
        followingCount: user.following_count,
        postsCount: user.posts_count,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername?.trim())
      return res.status(400).json({ error: "Please enter your email or username." });
    if (!password?.trim())
      return res.status(400).json({ error: "Please enter your password." });

    const identifier = emailOrUsername.trim().toLowerCase();
    const isEmail = identifier.includes("@") && identifier.includes(".");

    const result = await pool.query(
      isEmail
        ? "SELECT * FROM gs_users WHERE email = $1"
        : "SELECT * FROM gs_users WHERE username = $1",
      [isEmail ? identifier : identifier.replace(/^@/, "")]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: "No account found with that email or username." });

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch)
      return res.status(401).json({ error: "Incorrect password. Please try again." });

    const token = generateToken(user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

    await pool.query(
      "INSERT INTO gs_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expiresAt]
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        displayName: user.display_name || user.name,
        username: user.username,
        handle: `@${user.username}`,
        email: user.email,
        bio: user.bio || "",
        avatarUrl: user.avatar_url || null,
        color: user.color || "#4A90A4",
        initials: initials(user.name),
        followersCount: user.followers_count,
        followingCount: user.following_count,
        postsCount: user.posts_count,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      await pool.query("DELETE FROM gs_sessions WHERE token = $1", [token]);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "Logout failed." });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "No token provided." });

    const token = authHeader.slice(7);

    let payload: { userId: number };
    try {
      payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const sessionResult = await pool.query(
      "SELECT id FROM gs_sessions WHERE token = $1 AND expires_at > NOW()",
      [token]
    );
    if (sessionResult.rows.length === 0)
      return res.status(401).json({ error: "Session expired. Please log in again." });

    const userResult = await pool.query(
      `SELECT id, name, username, email, display_name, bio, avatar_url, color,
              followers_count, following_count, posts_count
       FROM gs_users WHERE id = $1`,
      [payload.userId]
    );

    if (userResult.rows.length === 0)
      return res.status(404).json({ error: "User not found." });

    const user = userResult.rows[0];
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        displayName: user.display_name || user.name,
        username: user.username,
        handle: `@${user.username}`,
        email: user.email,
        bio: user.bio || "",
        avatarUrl: user.avatar_url || null,
        color: user.color || "#4A90A4",
        initials: initials(user.name),
        followersCount: user.followers_count,
        followingCount: user.following_count,
        postsCount: user.posts_count,
      },
    });
  } catch (err) {
    console.error("Auth/me error:", err);
    return res.status(500).json({ error: "Failed to fetch user." });
  }
});

router.patch("/auth/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "No token provided." });

    const token = authHeader.slice(7);
    let payload: { userId: number };
    try {
      payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const { displayName, username, bio, avatarUrl, color } = req.body;

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (displayName !== undefined) { fields.push(`display_name = $${idx++}`); values.push(displayName); }
    if (username !== undefined) {
      const taken = await pool.query("SELECT id FROM gs_users WHERE username = $1 AND id != $2", [username, payload.userId]);
      if (taken.rows.length > 0) return res.status(409).json({ error: "Username is already taken." });
      fields.push(`username = $${idx++}`); values.push(username);
    }
    if (bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(bio); }
    if (avatarUrl !== undefined) { fields.push(`avatar_url = $${idx++}`); values.push(avatarUrl); }
    if (color !== undefined) { fields.push(`color = $${idx++}`); values.push(color); }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update." });

    fields.push(`updated_at = NOW()`);
    values.push(payload.userId);

    const result = await pool.query(
      `UPDATE gs_users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, username, email, display_name, bio, avatar_url, color, followers_count, following_count, posts_count`,
      values
    );

    const user = result.rows[0];
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        displayName: user.display_name || user.name,
        username: user.username,
        handle: `@${user.username}`,
        email: user.email,
        bio: user.bio || "",
        avatarUrl: user.avatar_url || null,
        color: user.color || "#4A90A4",
        initials: initials(user.name),
        followersCount: user.followers_count,
        followingCount: user.following_count,
        postsCount: user.posts_count,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Profile update failed." });
  }
});

export default router;
