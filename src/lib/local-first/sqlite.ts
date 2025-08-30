/**
 * Local-first SQLite foundation (v1)
 * - Initializes a small on-device DB with WAL
 * - Provides mood repository helpers and an outbox table
 * - Emits change events so hooks can react to local writes/imports
 */

import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { logger } from '~/lib/logger';
import type { Id } from '../../../convex/_generated/dataModel';

// Type definitions for server data
interface ServerMood {
  _id: Id<'moods'>;
  _creationTime?: number;
  userId?: string;
  mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry';
  rating?: number;
  moodCategory?: string;
  note?: string;
  tags?: string[];
  timeOfDay?: 'morning' | 'evening';
  createdAt?: number;
  updatedAt?: number;
}

interface ServerExercise {
  _id: Id<'exercises'>;
  _creationTime?: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category:
    | 'breathing'
    | 'mindfulness'
    | 'journaling'
    | 'movement'
    | 'relaxation';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  instructions: string[];
  instructionsAr: string[];
  updatedAt?: number;
}

interface ServerProgress {
  _id: Id<'userProgress'>;
  _creationTime?: number;
  userId?: string;
  exerciseId: Id<'exercises'>;
  duration: number;
  feedback?: string;
  completedAt?: number;
  updatedAt?: number;
}

// Simple event emitter to refresh subscribers when local data changes
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribeLocalFirst(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notify() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      logger.warn('Local-first listener failed', 'SQLite', e);
    }
  });
}

// Per-user DB cache and active user binding
let activeUserId: string | null = null;
let currentDbKey = 'default';
const dbCache = new Map<string, Promise<SQLiteDatabase>>();

export function setActiveLocalUser(userId: string | null) {
  activeUserId = userId ? String(userId) : null;
  currentDbKey = activeUserId ? `user:${activeUserId}` : 'default';
  // Do not clear cache to preserve other users' DBs; we switch by key.
  logger.info(`Active local user set to ${currentDbKey}`, 'SQLite');
}

export function getActiveLocalUser(): string | null {
  return activeUserId;
}

function getDbNameForKey(key: string): string {
  if (key === 'default') return 'nafsy-local-first.db';
  // key format: user:<id>
  const id = key.slice('user:'.length).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `nafsy-local-first-${id}.db`;
}

async function getDB(): Promise<SQLiteDatabase> {
  const key = currentDbKey;
  if (!dbCache.has(key)) {
    const p = (async () => {
      const dbName = getDbNameForKey(key);
      const db = await openDatabaseAsync(dbName);
      // Enable WAL + FK
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await runMigrations(db);
      // Best-effort seed for offline-first UX
      try {
        await seedExercisesLocalIfEmpty(db);
      } catch (e) {
        logger.warn('Exercise seed skipped/failed', 'SQLite', e);
      }
      return db;
    })();
    dbCache.set(key, p);
  }
  return dbCache.get(key)!;
}

// Migration definitions
const migrations: {
  version: number;
  description: string;
  migrate: (db: SQLiteDatabase) => Promise<void>;
}[] = [
  {
    version: 1,
    description: 'Initial schema with moods, outbox, and sync state',
    migrate: async (db) => {
      // Moods
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mood_entries (
          id TEXT PRIMARY KEY,
          server_id TEXT,
          user_id TEXT,
          mood TEXT,
          rating INTEGER,
          mood_category TEXT,
          note TEXT,
          tags_json TEXT,
          time_of_day TEXT,
          at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted INTEGER NOT NULL DEFAULT 0
        );
      `);
      await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_moods_server_id ON mood_entries (server_id);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_moods_user_updated ON mood_entries (user_id, updated_at);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_moods_user_at ON mood_entries (user_id, at);'
      );

      // Outbox for ops
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS outbox_ops (
          op_id TEXT PRIMARY KEY,
          entity TEXT NOT NULL,
          op TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          client_time INTEGER NOT NULL,
          tries INTEGER NOT NULL DEFAULT 0
        );
      `);
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_outbox_time ON outbox_ops (client_time);'
      );

      // Sync state cursors
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 2,
    description: 'Add exercises and exercise_logs tables',
    migrate: async (db) => {
      // Exercises table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY,
          server_id TEXT,
          user_id TEXT,
          title TEXT NOT NULL,
          title_ar TEXT NOT NULL,
          description TEXT NOT NULL,
          description_ar TEXT NOT NULL,
          category TEXT NOT NULL,
          duration INTEGER NOT NULL,
          difficulty TEXT NOT NULL,
          image_url TEXT,
          instructions_json TEXT NOT NULL,
          instructions_ar_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted INTEGER NOT NULL DEFAULT 0
        );
      `);
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_exercises_updated ON exercises (updated_at);'
      );

      // Exercise logs table with foreign key
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercise_logs (
          id TEXT PRIMARY KEY,
          server_id TEXT,
          user_id TEXT,
          exercise_id TEXT NOT NULL,
          duration_sec INTEGER,
          feedback TEXT,
          at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
        );
      `);
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_logs_exercise ON exercise_logs (exercise_id, at);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_logs_updated ON exercise_logs (updated_at);'
      );
    },
  },
  {
    version: 3,
    description: 'Add failed_ops (DLQ) table for exhausted outbox',
    migrate: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS failed_ops (
          fail_id TEXT PRIMARY KEY,
          entity TEXT NOT NULL,
          op TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          last_error TEXT,
          tries INTEGER NOT NULL,
          failed_at INTEGER NOT NULL
        );
      `);
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_failed_entity ON failed_ops (entity, failed_at);'
      );
    },
  },
  {
    version: 4,
    description: 'Add chat tables for offline persistence',
    migrate: async (db) => {
      // Coach chat messages (formerly mainChat)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS coach_chat_messages (
          id TEXT PRIMARY KEY,
          server_id TEXT,
          user_id TEXT,
          session_id TEXT NOT NULL,
          content TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted INTEGER DEFAULT 0
        );
      `);
      await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_msg_server_id ON coach_chat_messages (server_id);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_coach_msg_session ON coach_chat_messages (session_id, created_at);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_coach_msg_user_session ON coach_chat_messages (user_id, session_id);'
      );

      // Event/Vent chat messages
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS event_chat_messages (
          id TEXT PRIMARY KEY,
          server_id TEXT,
          user_id TEXT,
          session_id TEXT,
          content TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted INTEGER DEFAULT 0
        );
      `);
      await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_event_msg_server_id ON event_chat_messages (server_id);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_event_msg_session ON event_chat_messages (session_id, created_at);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_event_msg_user_session ON event_chat_messages (user_id, session_id);'
      );

      // Companion chat messages
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS companion_chat_messages (
          id TEXT PRIMARY KEY,
          server_id TEXT,
          user_id TEXT,
          session_id TEXT NOT NULL,
          content TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted INTEGER DEFAULT 0
        );
      `);
      await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_companion_msg_server_id ON companion_chat_messages (server_id);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_companion_msg_session ON companion_chat_messages (session_id, created_at);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_companion_msg_user_session ON companion_chat_messages (user_id, session_id);'
      );

      // Chat sessions (all types)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          server_id TEXT,
          user_id TEXT,
          session_id TEXT NOT NULL,
          title TEXT,
          chat_type TEXT NOT NULL CHECK (chat_type IN ('coach', 'event', 'companion')),
          started_at INTEGER NOT NULL,
          last_message_at INTEGER,
          message_count INTEGER DEFAULT 0,
          updated_at INTEGER NOT NULL,
          deleted INTEGER DEFAULT 0
        );
      `);
      await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_session_server_id ON chat_sessions (server_id);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_chat_session_session_id ON chat_sessions (session_id);'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_chat_session_user_type ON chat_sessions (user_id, chat_type);'
      );
    },
  },
];

async function runMigrations(db: SQLiteDatabase) {
  // Get current version
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = versionRow?.user_version ?? 0;

  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      logger.info(
        `Running migration ${migration.version}: ${migration.description}`,
        'SQLite'
      );
      await db.withTransactionAsync(async () => {
        await migration.migrate(db);
        await db.execAsync(`PRAGMA user_version = ${migration.version};`);
      });
    }
  }

  const finalVersion = migrations[migrations.length - 1]?.version ?? 0;
  if (currentVersion === finalVersion) {
    logger.info(`Database is up to date (version ${currentVersion})`, 'SQLite');
  } else {
    logger.info(
      `Migrations complete. Database updated to version ${finalVersion}`,
      'SQLite'
    );
  }
}

// Utilities
function now() {
  return Date.now();
}

function generateId() {
  // Collision-resistant enough for local temp ids
  return `loc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Public init used by app bootstrap
export async function initLocalFirstDB() {
  await getDB();
}

// Mood repository
export interface MoodRow {
  id: string; // local primary id (stable)
  server_id?: string | null;
  user_id?: string | null;
  mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry' | null;
  rating?: number | null;
  mood_category?: string | null;
  note?: string | null;
  tags_json?: string | null; // JSON array
  time_of_day?: 'morning' | 'evening' | null;
  at: number; // timestamp of mood
  updated_at: number; // server authoritative when known
  deleted?: number; // 0/1
}

export async function upsertMoodLocal(
  row: Omit<MoodRow, 'id' | 'updated_at'> & {
    id?: string;
    updated_at?: number;
  },
  silent: boolean = false
) {
  const db = await getDB();
  const id = row.id ?? generateId();
  const updated_at = row.updated_at ?? now();
  await db.runAsync(
    `INSERT INTO mood_entries (id, server_id, user_id, mood, rating, mood_category, note, tags_json, time_of_day, at, updated_at, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?,0))
     ON CONFLICT(id) DO UPDATE SET
       server_id=excluded.server_id,
       user_id=excluded.user_id,
       mood=excluded.mood,
       rating=excluded.rating,
       mood_category=excluded.mood_category,
       note=excluded.note,
       tags_json=excluded.tags_json,
       time_of_day=excluded.time_of_day,
       at=excluded.at,
       updated_at=excluded.updated_at,
       deleted=excluded.deleted
    `,
    [
      id,
      row.server_id ?? null,
      row.user_id ?? null,
      row.mood ?? null,
      row.rating ?? null,
      row.mood_category ?? null,
      row.note ?? null,
      row.tags_json ?? null,
      row.time_of_day ?? null,
      row.at,
      updated_at,
      row.deleted ?? 0,
    ]
  );
  if (!silent) {
    notify();
  }
  return id;
}

export async function recordMoodLocal(mood: {
  userId: string; // server user id
  mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry';
  rating?: number;
  moodCategory?: string;
  note?: string;
  tags?: string[];
  timeOfDay?: 'morning' | 'evening';
}) {
  const id = generateId();
  const at = now();
  await upsertMoodLocal({
    id,
    user_id: mood.userId,
    mood: mood.mood ?? null,
    rating: mood.rating ?? null,
    mood_category: mood.moodCategory ?? null,
    note: mood.note ?? null,
    tags_json: mood.tags ? JSON.stringify(mood.tags) : null,
    time_of_day: mood.timeOfDay ?? null,
    at,
  });
  await enqueueOutbox('moods', 'upsert', {
    userId: mood.userId,
    localId: id,
    mood: mood.mood,
    rating: mood.rating,
    moodCategory: mood.moodCategory,
    note: mood.note,
    tags: mood.tags,
    timeOfDay: mood.timeOfDay,
    at,
  });
  return id;
}

export async function ackMoodSynced(params: {
  localId: string;
  serverId: string;
  updatedAt?: number;
}) {
  const db = await getDB();
  const updatedAt = params.updatedAt ?? now();
  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM mood_entries WHERE server_id = ? LIMIT 1',
      [params.serverId]
    );

    if (existing && existing.id !== params.localId) {
      // A row already imported for this server id exists.
      // Merge by keeping the server-linked row, drop the local duplicate.
      await db.runAsync(
        'UPDATE mood_entries SET updated_at=? WHERE id=?',
        [updatedAt, existing.id]
      );
      await db.runAsync('DELETE FROM mood_entries WHERE id=?', [params.localId]);
      await deleteOutboxByLocalId('moods', params.localId);
    } else {
      await db.runAsync(
        'UPDATE mood_entries SET server_id=?, updated_at=? WHERE id=?',
        [params.serverId, updatedAt, params.localId]
      );
      await deleteOutboxByLocalId('moods', params.localId);
    }
  });
  notify();
}

export async function importMoodsFromServer(serverMoods: ServerMood[]) {
  const db = await getDB();
  try {
    // Avoid starting a transaction here to prevent nested/parallel
    // transaction conflicts when multiple imports run concurrently.
    for (const m of serverMoods) {
        const serverId = String(m._id);
        const updated =
          (m.updatedAt as number) ?? (m._creationTime as number) ?? now();
        // Try to locate an existing local row that already linked to this server id
        const existing = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM mood_entries WHERE server_id = ? LIMIT 1',
          [serverId]
        );
        const idForInsert = existing?.id ?? serverId; // avoid dupes; use serverId as id for imported rows

        // Direct SQL insert/update instead of calling upsertMoodLocal to avoid nested transaction issues
        await db.runAsync(
          `INSERT INTO mood_entries (id, server_id, user_id, mood, rating, mood_category, note, tags_json, time_of_day, at, updated_at, deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?,0))
           ON CONFLICT(id) DO UPDATE SET
             server_id=excluded.server_id,
             user_id=excluded.user_id,
             mood=excluded.mood,
             rating=excluded.rating,
             mood_category=excluded.mood_category,
             note=excluded.note,
             tags_json=excluded.tags_json,
             time_of_day=excluded.time_of_day,
             at=excluded.at,
             updated_at=excluded.updated_at,
             deleted=excluded.deleted
          `,
          [
            idForInsert,
            serverId,
            (m.userId as string) ?? null,
            (m.mood as MoodRow['mood']) ?? null,
            (m.rating as number) ?? null,
            (m.moodCategory as string) ?? null,
            (m.note as string) ?? null,
            m.tags ? JSON.stringify(m.tags) : null,
            (m.timeOfDay as MoodRow['time_of_day']) ?? null,
            (m.createdAt as number) ?? (m._creationTime as number) ?? updated,
            updated,
            0,
          ]
        );
    }
    notify();
  } catch (error) {
    logger.error('Failed to import moods from server', 'SQLite', error);
    throw error;
  }
}

export async function getLastNMoods(
  userId: string,
  limit: number
): Promise<
  {
    id: string;
    serverId?: string | null;
    mood?: MoodRow['mood'];
    rating?: number | null;
    moodCategory?: string | null;
    note?: string | null;
    tags?: string[] | undefined;
    timeOfDay?: MoodRow['time_of_day'];
    createdAt: number;
    updatedAt: number;
  }[]
> {
  const db = await getDB();
  const rows = await db.getAllAsync<MoodRow>(
    'SELECT * FROM mood_entries WHERE deleted=0 AND user_id = ? ORDER BY at DESC LIMIT ?;',
    [userId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    serverId: r.server_id ?? null,
    mood: r.mood ?? undefined,
    rating: r.rating ?? undefined,
    moodCategory: r.mood_category ?? undefined,
    note: r.note ?? undefined,
    tags: r.tags_json
      ? (() => {
          try {
            return JSON.parse(r.tags_json) as string[];
          } catch {
            logger.warn(`Failed to parse tags JSON for mood ${r.id}`, 'SQLite');
            return undefined;
          }
        })()
      : undefined,
    timeOfDay: r.time_of_day ?? undefined,
    createdAt: r.at,
    updatedAt: r.updated_at,
  }));
}

export async function getTodayMood(userId: string): Promise<
  ReturnType<typeof getLastNMoods>[number] | undefined
> {
  const db = await getDB();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const start = d.getTime();
  const end = start + 24 * 60 * 60 * 1000;
  const rows = await db.getAllAsync<MoodRow>(
    'SELECT * FROM mood_entries WHERE deleted=0 AND user_id = ? AND at >= ? AND at < ? ORDER BY at DESC LIMIT 1;',
    [userId, start, end]
  );
  if (!rows.length) return undefined;
  const r = rows[0];
  return {
    id: r.id,
    serverId: r.server_id ?? null,
    mood: r.mood ?? undefined,
    rating: r.rating ?? undefined,
    moodCategory: r.mood_category ?? undefined,
    note: r.note ?? undefined,
    tags: r.tags_json
      ? (() => {
          try {
            return JSON.parse(r.tags_json) as string[];
          } catch {
            logger.warn(`Failed to parse tags JSON for mood ${r.id}`, 'SQLite');
            return undefined;
          }
        })()
      : undefined,
    timeOfDay: r.time_of_day ?? undefined,
    createdAt: r.at,
    updatedAt: r.updated_at,
  };
}

// Outbox helpers (basic, client-side only for now)
export async function enqueueOutbox(entity: string, op: string, payload: any) {
  const db = await getDB();
  const opId = generateId();
  await db.runAsync(
    'INSERT INTO outbox_ops (op_id, entity, op, payload_json, client_time, tries) VALUES (?, ?, ?, ?, ?, 0);',
    [opId, entity, op, JSON.stringify(payload), now()]
  );
}

export async function deleteOutboxByLocalId(entity: string, localId: string) {
  const db = await getDB();
  // Best effort delete; payload_json contains localId
  await db.runAsync(
    `DELETE FROM outbox_ops WHERE entity=? AND json_extract(payload_json, '$.localId') = ?;`,
    [entity, localId]
  );
}

// Outbox utilities for sync manager
export interface OutboxRow {
  op_id: string;
  entity: string;
  op: string;
  payload_json: string;
  client_time: number;
  tries: number;
}

export async function getOutboxOps(
  entity: string,
  limit: number
): Promise<OutboxRow[]> {
  const db = await getDB();
  return db.getAllAsync<OutboxRow>(
    'SELECT * FROM outbox_ops WHERE entity = ? ORDER BY client_time ASC LIMIT ?;',
    [entity, limit]
  );
}

export async function deleteOutbox(opId: string) {
  const db = await getDB();
  await db.runAsync('DELETE FROM outbox_ops WHERE op_id = ?;', [opId]);
}

export async function incrementOutboxTries(opId: string) {
  const db = await getDB();
  await db.runAsync(
    'UPDATE outbox_ops SET tries = tries + 1 WHERE op_id = ?;',
    [opId]
  );
}

export async function getOutboxCount(entity: string): Promise<number> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM outbox_ops WHERE entity = ?;',
    [entity]
  );
  return row?.c ?? 0;
}

// DLQ helpers
export async function moveOutboxToFailed(
  op: OutboxRow,
  lastError: string
) {
  const db = await getDB();
  const failId = `fail_${op.op_id}`;
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO failed_ops (fail_id, entity, op, payload_json, last_error, tries, failed_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [
        failId,
        op.entity,
        op.op,
        op.payload_json,
        lastError,
        op.tries + 1,
        now(),
      ]
    );
    await db.runAsync('DELETE FROM outbox_ops WHERE op_id = ?;', [op.op_id]);
  });
}

export async function getFailedOpsCount(entity: string): Promise<number> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM failed_ops WHERE entity = ?;',
    [entity]
  );
  return row?.c ?? 0;
}

// =========================
// Exercises (catalog) repo
// =========================

export interface ExerciseRow {
  id: string; // local primary id (for server items, use server id)
  server_id?: string | null;
  user_id?: string | null; // optional future personalization
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  category:
    | 'breathing'
    | 'mindfulness'
    | 'journaling'
    | 'movement'
    | 'relaxation';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  image_url?: string | null;
  instructions_json: string; // en
  instructions_ar_json: string; // ar
  updated_at: number;
  deleted?: number;
}

// Exercises schema is now handled by migrations

export async function importExercisesFromServer(exercises: ServerExercise[]) {
  const db = await getDB();
  try {
    // Avoid wrapping in a transaction to prevent conflicts when called in parallel
    for (const e of exercises) {
        const serverId = String(e._id);
        const updated =
          (e.updatedAt as number) ?? (e._creationTime as number) ?? now();
        await db.runAsync(
          `INSERT INTO exercises (
            id, server_id, user_id, title, title_ar, description, description_ar, category, duration, difficulty, image_url, instructions_json, instructions_ar_json, updated_at, deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
          ON CONFLICT(id) DO UPDATE SET
            title=excluded.title,
            title_ar=excluded.title_ar,
            description=excluded.description,
            description_ar=excluded.description_ar,
            category=excluded.category,
            duration=excluded.duration,
            difficulty=excluded.difficulty,
            image_url=excluded.image_url,
            instructions_json=excluded.instructions_json,
            instructions_ar_json=excluded.instructions_ar_json,
            updated_at=excluded.updated_at,
            deleted=excluded.deleted
          `,
          [
            serverId,
            serverId,
            null,
            e.title ?? '',
            e.titleAr ?? '',
            e.description ?? '',
            e.descriptionAr ?? '',
            e.category ?? 'mindfulness',
            e.duration ?? 0,
            e.difficulty ?? 'beginner',
            e.imageUrl ?? null,
            JSON.stringify(e.instructions ?? []),
            JSON.stringify(e.instructionsAr ?? []),
            updated,
          ]
        );
    }
    notify();
  } catch (error) {
    logger.error('Failed to import exercises from server', 'SQLite', error);
    throw error;
  }
}

export async function getExercises(params?: {
  category?: string;
  limit?: number;
}): Promise<ExerciseRow[]> {
  const db = await getDB();
  const where = params?.category
    ? 'WHERE deleted=0 AND category = ?'
    : 'WHERE deleted=0';
  const limit = params?.limit ? ' LIMIT ?' : '';
  const args: any[] = [];
  if (params?.category) args.push(params.category);
  if (params?.limit) args.push(params.limit);
  return db.getAllAsync<ExerciseRow>(
    `SELECT * FROM exercises ${where} ORDER BY difficulty, updated_at DESC${limit};`,
    args
  );
}

export async function searchExercisesLocal(
  query: string,
  lang: 'en' | 'ar'
): Promise<ExerciseRow[]> {
  const db = await getDB();
  const q = `%${query.toLowerCase()}%`;
  if (lang === 'ar') {
    return db.getAllAsync<ExerciseRow>(
      `SELECT * FROM exercises WHERE deleted=0 AND (
        lower(title_ar) LIKE ? OR lower(description_ar) LIKE ?
      ) ORDER BY updated_at DESC;`,
      [q, q]
    );
  }
  return db.getAllAsync<ExerciseRow>(
    `SELECT * FROM exercises WHERE deleted=0 AND (
      lower(title) LIKE ? OR lower(description) LIKE ?
    ) ORDER BY updated_at DESC;`,
    [q, q]
  );
}

// =========================
// User progress (exercise_logs)
// =========================

export interface ProgressRow {
  id: string; // local id
  server_id?: string | null;
  user_id?: string | null;
  exercise_id: string; // references exercises.id (server id)
  duration_sec: number;
  feedback?: string | null;
  at: number;
  updated_at: number;
  deleted?: number;
}

// Progress schema is now handled by migrations

export async function recordProgressLocal(progress: {
  userId: string; // server user id
  exerciseId: string;
  duration: number;
  feedback?: string;
  at?: number;
}) {
  const db = await getDB();
  const id = generateId();
  const at = progress.at ?? now();
  // Convert duration from minutes to seconds for storage
  const durationInSeconds = minutesToSeconds(progress.duration);
  await db.runAsync(
    `INSERT INTO exercise_logs (id, server_id, user_id, exercise_id, duration_sec, feedback, at, updated_at, deleted)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0);
    `,
    [
      id,
      progress.userId,
      progress.exerciseId,
      durationInSeconds,
      progress.feedback ?? null,
      at,
      at,
    ]
  );
  await enqueueOutbox('userProgress', 'upsert', {
    userId: progress.userId,
    localId: id,
    exerciseId: progress.exerciseId,
    duration: progress.duration,
    feedback: progress.feedback,
    completedAt: at,
  });
  notify();
  return id;
}

export async function ackProgressSynced(params: {
  localId: string;
  serverId: string;
  updatedAt?: number;
}) {
  const db = await getDB();
  await db.runAsync(
    'UPDATE exercise_logs SET server_id = ?, updated_at = ? WHERE id = ?;',
    [params.serverId, params.updatedAt ?? now(), params.localId]
  );
  await deleteOutboxByLocalId('userProgress', params.localId);
  notify();
}

export async function importUserProgressFromServer(
  progressList: ServerProgress[]
) {
  const db = await getDB();
  try {
    // Avoid wrapping in a transaction to prevent conflicts when called in parallel
    for (const p of progressList) {
        const serverId = String(p._id);
        const updated =
          (p.updatedAt as number) ?? (p._creationTime as number) ?? now();
        const at = p.completedAt ?? p._creationTime ?? updated;
        await db.runAsync(
          `INSERT INTO exercise_logs (id, server_id, user_id, exercise_id, duration_sec, feedback, at, updated_at, deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
           ON CONFLICT(id) DO UPDATE SET
             exercise_id=excluded.exercise_id,
             duration_sec=excluded.duration_sec,
             feedback=excluded.feedback,
             at=excluded.at,
             updated_at=excluded.updated_at,
             deleted=excluded.deleted
          `,
          // Convert duration from minutes to seconds when importing from server
          [
            serverId,
            serverId,
            p.userId ?? null,
            String(p.exerciseId ?? ''),
            minutesToSeconds(p.duration ?? 0),
            p.feedback ?? null,
            at,
            updated,
          ]
        );
    }
    notify();
  } catch (error) {
    logger.error('Failed to import user progress from server', 'SQLite', error);
    throw error;
  }
}

export async function getExercisesWithProgress(params?: {
  userId?: string;
  category?: string;
  limit?: number;
}) {
  const exercises = await getExercises(params);
  const db = await getDB();
  const sums = await db.getAllAsync<{
    exercise_id: string;
    c: number;
    last: number;
  }>(
    params?.userId
      ? `SELECT exercise_id, COUNT(*) as c, MAX(at) as last
         FROM exercise_logs WHERE deleted=0 AND user_id = ? GROUP BY exercise_id;`
      : `SELECT exercise_id, COUNT(*) as c, MAX(at) as last
         FROM exercise_logs WHERE deleted=0 GROUP BY exercise_id;`,
    params?.userId ? [params.userId] : []
  );
  const map = new Map<string, { c: number; last: number }>();
  for (const s of sums)
    map.set(String(s.exercise_id), { c: s.c, last: s.last });
  return exercises.map((e) => {
    const agg = map.get(e.id) || { c: 0, last: 0 };
    return {
      _id: e.server_id ?? e.id,
      title: e.title,
      titleAr: e.title_ar,
      description: e.description,
      descriptionAr: e.description_ar,
      category: e.category,
      duration: e.duration,
      difficulty: e.difficulty,
      imageUrl: e.image_url ?? undefined,
      instructions: (() => {
        try {
          return JSON.parse(e.instructions_json) as string[];
        } catch {
          logger.warn(
            `Failed to parse instructions JSON for exercise ${e.id}`,
            'SQLite'
          );
          return [];
        }
      })(),
      instructionsAr: (() => {
        try {
          return JSON.parse(e.instructions_ar_json) as string[];
        } catch {
          logger.warn(
            `Failed to parse Arabic instructions JSON for exercise ${e.id}`,
            'SQLite'
          );
          return [];
        }
      })(),
      isCompleted: agg.c > 0,
      completionCount: agg.c,
      lastCompleted: agg.last || undefined,
    };
  });
}

export async function getMoodStats(userId: string, days: number = 30) {
  const db = await getDB();
  const since = now() - days * 86400000;

  const moods = await db.getAllAsync<MoodRow>(
    'SELECT * FROM mood_entries WHERE deleted = 0 AND user_id = ? AND at >= ? ORDER BY at DESC',
    [userId, since]
  );

  const totalEntries = moods.length;

  // Calculate average rating
  const ratingsSum = moods.reduce((sum, mood) => sum + (mood.rating || 0), 0);
  const averageRating = totalEntries > 0 ? ratingsSum / totalEntries : 0;

  // Count moods by type
  const moodCounts: Record<string, number> = {};
  moods.forEach((mood) => {
    if (mood.mood) {
      moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
    }
  });

  // Calculate streak (consecutive days with mood entries)
  const daysSet = new Set(
    moods.map((mood) => {
      const d = new Date(mood.at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let current = new Date();
  current.setHours(0, 0, 0, 0);
  let streak = 0;

  while (daysSet.has(current.getTime())) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return {
    totalEntries,
    averageRating,
    moodCounts,
    streak,
  };
}

// Sync state helpers for incremental sync
export async function getSyncCursor(key: string): Promise<number | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_state WHERE key = ?;',
    [key]
  );
  return row ? parseInt(row.value, 10) : null;
}

export async function setSyncCursor(key: string, value: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    [key, value.toString()]
  );
}

export async function getUserProgressStats(userId: string, days?: number) {
  const db = await getDB();
  const since = days ? now() - days * 86400000 : 0;
  const rows = await db.getAllAsync<ProgressRow>(
    days
      ? 'SELECT * FROM exercise_logs WHERE deleted=0 AND user_id = ? AND at >= ? ORDER BY at DESC;'
      : 'SELECT * FROM exercise_logs WHERE deleted=0 AND user_id = ? ORDER BY at DESC;',
    days ? [userId, since] : [userId]
  );
  const totalSessions = rows.length;
  const totalMinutes = secondsToMinutes(
    rows.reduce((a, r) => a + (r.duration_sec || 0), 0)
  );
  const uniqueExercises = new Set(rows.map((r) => r.exercise_id)).size;
  const averageDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0;
  // Streak: count consecutive days with at least one log
  const daysSet = new Set(
    rows.map((r) => {
      const d = new Date(r.at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  let streak = 0;
  while (daysSet.has(current.getTime())) {
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return {
    totalSessions,
    totalMinutes,
    uniqueExercises,
    averageDuration,
    streak,
    categoryCounts: {},
  };
}

// ========
// Helpers
// ========
function minutesToSeconds(min: number): number {
  return Math.round((min || 0) * 60);
}
function secondsToMinutes(sec: number): number {
  return (sec || 0) / 60;
}

// =========================
// Chat repository functions
// =========================

// Type definitions for chat data
export type ChatType = 'coach' | 'event' | 'companion';

interface ServerChatMessage {
  _id: string;
  _creationTime?: number;
  userId?: string;
  content: string;
  role: 'user' | 'assistant';
  sessionId: string;
  createdAt?: number;
}

interface ServerChatSession {
  _id?: string;
  _creationTime?: number;
  userId?: string;
  sessionId: string;
  title: string;
  startedAt?: number;
  lastMessageAt?: number;
  messageCount?: number;
}

export interface ChatMessageRow {
  id: string;
  server_id?: string | null;
  user_id?: string | null;
  session_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: number;
  updated_at: number;
  deleted?: number;
}

export interface ChatSessionRow {
  id: string;
  server_id?: string | null;
  user_id?: string | null;
  session_id: string;
  title?: string | null;
  chat_type: ChatType;
  started_at: number;
  last_message_at?: number | null;
  message_count?: number;
  updated_at: number;
  deleted?: number;
}

// Get table name for chat type
function getChatMessageTable(chatType: ChatType): string {
  switch (chatType) {
    case 'coach':
      return 'coach_chat_messages';
    case 'event':
      return 'event_chat_messages';
    case 'companion':
      return 'companion_chat_messages';
    default:
      throw new Error(`Invalid chat type: ${chatType}`);
  }
}

// Import chat messages from server
export async function importChatMessagesFromServer(
  messages: ServerChatMessage[],
  chatType: ChatType
) {
  const db = await getDB();
  const tableName = getChatMessageTable(chatType);
  
  try {
    for (const msg of messages) {
      const serverId = String(msg._id);
      const createdAt = (msg.createdAt as number) ?? (msg._creationTime as number) ?? now();
      
      await db.runAsync(
        `INSERT INTO ${tableName} (id, server_id, user_id, session_id, content, role, created_at, updated_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(id) DO UPDATE SET
           content=excluded.content,
           role=excluded.role,
           updated_at=excluded.updated_at,
           deleted=excluded.deleted`,
        [
          serverId, // Use server ID as local ID for imported messages
          serverId,
          (msg.userId as string) ?? null,
          msg.sessionId,
          msg.content,
          msg.role,
          createdAt,
          createdAt,
        ]
      );
    }
    notify();
  } catch (error) {
    logger.error(`Failed to import ${chatType} chat messages`, 'SQLite', error);
    throw error;
  }
}

// Import chat sessions from server
export async function importChatSessionsFromServer(
  sessions: ServerChatSession[],
  chatType: ChatType
) {
  const db = await getDB();
  
  try {
    for (const session of sessions) {
      const serverId = session._id ? String(session._id) : session.sessionId;
      const startedAt = (session.startedAt as number) ?? (session._creationTime as number) ?? now();
      const lastMessageAt = (session.lastMessageAt as number) ?? startedAt;
      
      await db.runAsync(
        `INSERT INTO chat_sessions (id, server_id, user_id, session_id, title, chat_type, started_at, last_message_at, message_count, updated_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title,
           last_message_at=excluded.last_message_at,
           message_count=excluded.message_count,
           updated_at=excluded.updated_at,
           deleted=excluded.deleted`,
        [
          serverId,
          serverId,
          (session.userId as string) ?? null,
          session.sessionId,
          session.title ?? null,
          chatType,
          startedAt,
          lastMessageAt,
          session.messageCount ?? 0,
          lastMessageAt,
        ]
      );
    }
    notify();
  } catch (error) {
    logger.error(`Failed to import ${chatType} chat sessions`, 'SQLite', error);
    throw error;
  }
}

// Get chat messages for a session
export async function getChatMessages(
  userId: string,
  sessionId: string,
  chatType: ChatType,
  limit: number = 50
): Promise<ChatMessageRow[]> {
  const db = await getDB();
  const tableName = getChatMessageTable(chatType);
  
  return db.getAllAsync<ChatMessageRow>(
    `SELECT * FROM ${tableName} 
     WHERE deleted = 0 AND user_id = ? AND session_id = ? 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [userId, sessionId, limit]
  );
}

// Get all chat sessions for a user
export async function getChatSessions(
  userId: string,
  chatType: ChatType
): Promise<ChatSessionRow[]> {
  const db = await getDB();
  
  return db.getAllAsync<ChatSessionRow>(
    `SELECT * FROM chat_sessions 
     WHERE deleted = 0 AND user_id = ? AND chat_type = ? 
     ORDER BY last_message_at DESC`,
    [userId, chatType]
  );
}

// Get current session for a chat type
export async function getCurrentChatSession(
  userId: string,
  sessionId: string,
  chatType: ChatType
): Promise<ChatSessionRow | undefined> {
  const db = await getDB();
  
  const row = await db.getFirstAsync<ChatSessionRow>(
    `SELECT * FROM chat_sessions 
     WHERE deleted = 0 AND user_id = ? AND session_id = ? AND chat_type = ?`,
    [userId, sessionId, chatType]
  );
  
  return row ?? undefined;
}

// Record a chat message locally (for queueing when offline)
export async function recordChatMessageLocal(params: {
  userId: string;
  sessionId: string;
  content: string;
  role: 'user' | 'assistant';
  chatType: ChatType;
}) {
  const db = await getDB();
  const id = generateId();
  const tableName = getChatMessageTable(params.chatType);
  const createdAt = now();
  
  await db.runAsync(
    `INSERT INTO ${tableName} (id, server_id, user_id, session_id, content, role, created_at, updated_at, deleted)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0)`,
    [
      id,
      params.userId,
      params.sessionId,
      params.content,
      params.role,
      createdAt,
      createdAt,
    ]
  );
  
  // Queue for sync
  await enqueueOutbox(`chat_${params.chatType}`, 'upsert', {
    userId: params.userId,
    localId: id,
    sessionId: params.sessionId,
    content: params.content,
    role: params.role,
    createdAt,
  });
  
  notify();
  return id;
}

// Acknowledge chat message synced
export async function ackChatMessageSynced(params: {
  localId: string;
  serverId: string;
  chatType: ChatType;
}) {
  const db = await getDB();
  const tableName = getChatMessageTable(params.chatType);
  
  await db.runAsync(
    `UPDATE ${tableName} SET server_id = ?, updated_at = ? WHERE id = ?`,
    [params.serverId, now(), params.localId]
  );
  
  await deleteOutboxByLocalId(`chat_${params.chatType}`, params.localId);
  notify();
}

// =========================
// Data hygiene utilities
// =========================
/**
 * Clear all local-first data from SQLite. Use on sign-out to prevent
 * cross-account data exposure on shared devices.
 */
export async function clearLocalFirstDB(): Promise<void> {
  const db = await getDB();
  await db.withTransactionAsync(async () => {
    try {
      await db.execAsync('DELETE FROM mood_entries;');
      await db.execAsync('DELETE FROM exercise_logs;');
      await db.execAsync('DELETE FROM coach_chat_messages;');
      await db.execAsync('DELETE FROM event_chat_messages;');
      await db.execAsync('DELETE FROM companion_chat_messages;');
      await db.execAsync('DELETE FROM chat_sessions;');
      await db.execAsync('DELETE FROM outbox_ops;');
      await db.execAsync('DELETE FROM failed_ops;');
      await db.execAsync('DELETE FROM sync_state;');
    } catch (e) {
      logger.warn('Failed clearing some local tables', 'SQLite', e);
    }
  });
  notify();
}

/**
 * Purge dead-letter queue items older than a TTL in ms (default 7 days).
 */
export async function purgeFailedOps(ttlMs: number = 7 * 24 * 3600 * 1000) {
  const db = await getDB();
  const cutoff = Date.now() - ttlMs;
  try {
    await db.runAsync('DELETE FROM failed_ops WHERE failed_at < ?;', [cutoff]);
  } catch (e) {
    logger.warn('Failed to purge failed_ops', 'SQLite', e);
  }
}

// ==============================
// Local exercise seed (offline)
// ==============================
async function seedExercisesLocalIfEmpty(db: SQLiteDatabase) {
  // Only seed if table exists and empty
  try {
    const row = await db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='exercises';"
    );
    if (!row || row.c === 0) return; // table not yet created
    const count = await db.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM exercises;'
    );
    if ((count?.c ?? 0) > 0) return;
  } catch {
    return;
  }

  const nowTs = now();
  const seed = [
    {
      id: 'seed_breathing_box',
      title: 'Box Breathing',
      titleAr: 'تنفس الصندوق',
      description: 'A simple technique to reduce stress and anxiety',
      descriptionAr: 'تقنية بسيطة لتقليل التوتر والقلق',
      category: 'breathing',
      duration: 5,
      difficulty: 'beginner',
      imageUrl: null as string | null,
      instructions: [
        'Sit comfortably with your back straight',
        'Breathe in slowly for 4 counts',
        'Hold your breath for 4 counts',
        'Breathe out slowly for 4 counts',
        'Hold empty for 4 counts',
        'Repeat for 5-10 cycles',
      ],
      instructionsAr: [
        'اجلس بشكل مريح مع ظهر مستقيم',
        'استنشق ببطء لمدة 4 عدات',
        'احبس أنفاسك لمدة 4 عدات',
        'ازفر ببطء لمدة 4 عدات',
        'احبس نفسك فارغًا لمدة 4 عدات',
        'كرر لمدة 5-10 دورات',
      ],
    },
    {
      id: 'seed_mindfulness_body_scan',
      title: 'Body Scan Meditation',
      titleAr: 'تأمل مسح الجسم',
      description: 'Mindful awareness of physical sensations',
      descriptionAr: 'الوعي الذهني بالأحاسيس الجسدية',
      category: 'mindfulness',
      duration: 10,
      difficulty: 'beginner',
      imageUrl: null as string | null,
      instructions: [
        'Lie down comfortably on your back',
        'Close your eyes and take deep breaths',
        'Focus on your toes, notice any sensations',
        'Slowly move your attention up through your body',
        'Notice without judgment any tension or relaxation',
        'End at the top of your head',
      ],
      instructionsAr: [
        'استلقِ بشكل مريح على ظهرك',
        'أغلق عينيك وخذ أنفاسًا عميقة',
        'ركز على أحاسيسك من أصابع القدم إلى الرأس',
        'حرك انتباهك ببطء عبر الجسم',
        'لاحظ دون حكم أي توتر أو استرخاء',
        'انهِ عند قمة الرأس',
      ],
    },
    {
      id: 'seed_movement_mindful_walking',
      title: 'Mindful Walking',
      titleAr: 'المشي الواعي',
      description: 'Combine movement with present-moment awareness',
      descriptionAr: 'اجمع بين الحركة والوعي باللحظة الحالية',
      category: 'movement',
      duration: 20,
      difficulty: 'beginner',
      imageUrl: null as string | null,
      instructions: [
        'Find a quiet path or space',
        'Walk at a natural pace',
        'Focus on the sensation of walking',
        'Notice your breath and surroundings',
        'When mind wanders, return to walking',
        'End with gratitude',
      ],
      instructionsAr: [
        'ابحث عن مسار هادئ',
        'امشِ بوتيرة طبيعية',
        'ركز على إحساس المشي',
        'لاحظ تنفسك ومحيطك',
        'عندما يشرد ذهنك، ارجع إلى المشي',
        'انتهِ بالامتنان',
      ],
    },
  ];

  for (const e of seed) {
    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (
        id, server_id, user_id, title, title_ar, description, description_ar, category, duration, difficulty, image_url, instructions_json, instructions_ar_json, updated_at, deleted
      ) VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);`,
      [
        e.id,
        e.title,
        e.titleAr,
        e.description,
        e.descriptionAr,
        e.category,
        e.duration,
        e.difficulty,
        e.imageUrl,
        JSON.stringify(e.instructions),
        JSON.stringify(e.instructionsAr),
        nowTs,
      ]
    );
  }
  notify();
}
