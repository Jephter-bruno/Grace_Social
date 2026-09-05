import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "gracesocial-secret-key-change-in-production";

function requireAuth(req: any, res: any): number | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: number };
    if (!payload.userId) throw new Error("Missing user.");
    return payload.userId;
  } catch {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
}

function relativeTime(value: Date | string): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function mediaUrl(id: number, req: any): string {
  const host = req.get("host");
  const forwardedProto = req.headers["x-forwarded-proto"]?.split(",")[0];
  const protocol =
    forwardedProto ||
    (req.protocol === "http" &&
    !host.startsWith("localhost") &&
    !host.startsWith("127.")
      ? "https"
      : req.protocol);
  return `${protocol}://${host}/api/media/${id}`;
}

async function getConversationMessages(
  conversationId: number,
  userId: number,
  req: any,
) {
  const result = await pool.query(
    `SELECT m.id, m.text, m.media_id, m.media_type, m.audio_duration, m.reply_to,
            m.created_at, m.sender_id
     FROM gs_dm_messages m
     JOIN gs_dm_participants p ON p.conversation_id = m.conversation_id
     WHERE m.conversation_id = $1 AND p.user_id = $2
     ORDER BY m.created_at ASC, m.id ASC`,
    [conversationId, userId],
  );
  return result.rows.map((row: any) => ({
    id: `dm-message-${row.id}`,
    text: row.text || "",
    fromMe: Number(row.sender_id) === userId,
    time: relativeTime(row.created_at),
    mediaType: row.media_type || undefined,
    mediaUri: row.media_id ? mediaUrl(Number(row.media_id), req) : undefined,
    audioDuration: row.audio_duration || undefined,
    replyTo: row.reply_to || undefined,
  }));
}

router.get("/conversations", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const conversations = await pool.query(
      `SELECT c.id, mine.unread_count,
              other.id AS member_id, other.name, other.display_name,
              other.username, other.color, other.avatar_url,
              last_message.text AS last_message,
              last_message.created_at AS last_message_at
       FROM gs_dm_conversations c
       JOIN gs_dm_participants mine
         ON mine.conversation_id = c.id AND mine.user_id = $1
       JOIN gs_dm_participants other_participant
         ON other_participant.conversation_id = c.id
        AND other_participant.user_id <> $1
       JOIN gs_users other ON other.id = other_participant.user_id
       LEFT JOIN LATERAL (
         SELECT text, created_at
         FROM gs_dm_messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC, id DESC
         LIMIT 1
       ) last_message ON true
       ORDER BY COALESCE(last_message.created_at, c.updated_at) DESC`,
      [userId],
    );

    const mapped = await Promise.all(
      conversations.rows.map(async (row: any) => ({
        id: `dm-conv-${row.id}`,
        memberId: String(row.member_id),
        userName: row.display_name || row.name || row.username,
        userInitials: (row.display_name || row.name || row.username)
          .split(/\s+/)
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        userColor: row.color || "#4A90A4",
        avatarUrl: row.avatar_url || undefined,
        status: "Active now",
        lastMessage: row.last_message || "",
        time: row.last_message_at ? relativeTime(row.last_message_at) : "Now",
        unread: Number(row.unread_count || 0),
        messages: await getConversationMessages(Number(row.id), userId, req),
      })),
    );
    res.json({ conversations: mapped });
  } catch (error) {
    req.log?.error(error);
    res.status(500).json({ error: "Unable to load conversations." });
  }
});

router.post("/conversations", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const memberId = Number(req.body?.memberId);
  if (!Number.isInteger(memberId) || memberId < 1 || memberId === userId) {
    res.status(400).json({ error: "A valid conversation member is required." });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT c.id
       FROM gs_dm_conversations c
       JOIN gs_dm_participants p1 ON p1.conversation_id = c.id AND p1.user_id = $1
       JOIN gs_dm_participants p2 ON p2.conversation_id = c.id AND p2.user_id = $2
       WHERE (SELECT COUNT(*) FROM gs_dm_participants p3
              WHERE p3.conversation_id = c.id) = 2
       LIMIT 1`,
      [userId, memberId],
    );
    let conversationId = existing.rows[0]?.id;
    if (!conversationId) {
      const created = await client.query(
        "INSERT INTO gs_dm_conversations DEFAULT VALUES RETURNING id",
      );
      conversationId = created.rows[0].id;
      await client.query(
        `INSERT INTO gs_dm_participants (conversation_id, user_id)
         VALUES ($1, $2), ($1, $3)`,
        [conversationId, userId, memberId],
      );
    }
    await client.query("COMMIT");
    res.status(existing.rows[0] ? 200 : 201).json({
      conversationId: `dm-conv-${conversationId}`,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message || "Unable to create conversation." });
  } finally {
    client.release();
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const conversationId = Number(req.params.id.replace("dm-conv-", ""));
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const mediaId = req.body?.mediaId == null ? null : Number(req.body.mediaId);
  const mediaType = typeof req.body?.mediaType === "string" ? req.body.mediaType : null;
  const audioDuration = req.body?.audioDuration == null ? null : Number(req.body.audioDuration);
  const replyTo = typeof req.body?.replyTo === "string" ? req.body.replyTo : null;
  if (!Number.isInteger(conversationId) || conversationId < 1 || (!text && !mediaId)) {
    res.status(400).json({ error: "A message or media attachment is required." });
    return;
  }
  try {
    const participant = await pool.query(
      `SELECT 1 FROM gs_dm_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );
    if (!participant.rows[0]) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    if (mediaId) {
      const media = await pool.query(
        "SELECT 1 FROM gs_media WHERE id = $1 AND owner_id = $2",
        [mediaId, userId],
      );
      if (!media.rows[0]) {
        res.status(403).json({ error: "Media is not owned by this user." });
        return;
      }
    }
    const inserted = await pool.query(
      `INSERT INTO gs_dm_messages
        (conversation_id, sender_id, text, media_id, media_type, audio_duration, reply_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        conversationId,
        userId,
        text.slice(0, 2000),
        mediaId,
        mediaType,
        Number.isFinite(audioDuration) ? audioDuration : null,
        replyTo,
      ],
    );
    await pool.query(
      `UPDATE gs_dm_conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );
    await pool.query(
      `UPDATE gs_dm_participants
       SET unread_count = unread_count + 1
       WHERE conversation_id = $1 AND user_id <> $2`,
      [conversationId, userId],
    );
    res.status(201).json({
      message: {
        id: `dm-message-${inserted.rows[0].id}`,
        text,
        fromMe: true,
        time: "just now",
        mediaType: mediaType || undefined,
        mediaUri: mediaId ? mediaUrl(mediaId, req) : undefined,
        audioDuration: Number.isFinite(audioDuration) ? audioDuration : undefined,
        replyTo: replyTo || undefined,
      },
    });
  } catch (error) {
    req.log?.error(error);
    res.status(500).json({ error: "Unable to send message." });
  }
});

router.post("/conversations/:id/read", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const conversationId = Number(req.params.id.replace("dm-conv-", ""));
  if (!Number.isInteger(conversationId) || conversationId < 1) {
    res.status(400).json({ error: "Invalid conversation." });
    return;
  }
  try {
    await pool.query(
      `UPDATE gs_dm_participants SET unread_count = 0
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Unable to mark conversation read." });
  }
});

export default router;