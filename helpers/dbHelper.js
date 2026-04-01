// helpers/dbHelper.js
// Direct MySQL connection for DB-level assertions and setup/teardown

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

/**
 * Get (or lazily create) a connection pool.
 */
export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.DB_HOST     || '127.0.0.1',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME     || 'playwright_db',
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
}

/** Run any query and return [rows, fields] */
export async function query(sql, params = []) {
  const [rows, fields] = await getPool().execute(sql, params);
  return [rows, fields];
}

/** Fetch all users directly from DB */
export async function getAllUsersFromDB() {
  const [rows] = await query('SELECT * FROM users ORDER BY id ASC');
  return rows;
}

/** Fetch a single user by ID directly from DB */
export async function getUserByIdFromDB(id) {
  const [rows] = await query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

/** Fetch a user by name directly from DB */
export async function getUserByNameFromDB(name) {
  const [rows] = await query('SELECT * FROM users WHERE name = ?', [name]);
  return rows[0] || null;
}

/** Insert a user directly into DB (bypassing API) - useful for setup */
export async function insertUserIntoDB(name, job) {
  const [result] = await query(
    'INSERT INTO users (name, job) VALUES (?, ?)',
    [name, job]
  );
  const id = result.insertId;
  return { id, name, job };
}

/** Delete a user by ID directly from DB */
export async function deleteUserFromDB(id) {
  await query('DELETE FROM users WHERE id = ?', [id]);
}

/** Delete a user by name directly from DB */
export async function deleteUserByNameFromDB(name) {
  await query('DELETE FROM users WHERE name = ?', [name]);
}

/** Wipe all users - use only in test teardown */
export async function clearAllUsers() {
  await query('DELETE FROM users');
}

/** Count total users in DB */
export async function countUsers() {
  const [rows] = await query('SELECT COUNT(*) AS total FROM users');
  return rows[0].total;
}

/** Check whether a user exists in DB by name and job */
export async function userExistsInDB(name, job) {
  const [rows] = await query(
    'SELECT 1 FROM users WHERE name = ? AND job = ? LIMIT 1',
    [name, job]
  );
  return rows.length > 0;
}

/** Close the pool (call in global teardown) */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
