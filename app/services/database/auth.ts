import { getDatabase, initDatabase } from './index';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthData {
  token: string;
  user: User;
}

export async function saveAuth(token: string, user: User): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const now = Date.now();

  // Delete any existing auth data (we only keep one session)
  await db.runAsync('DELETE FROM auth');

  // Insert new auth data
  await db.runAsync(
    `INSERT INTO auth (token, user_id, email, name, picture, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [token, user.id, user.email, user.name, user.picture || null, now, now]
  );

  console.log('Auth data saved successfully');
}

export async function getAuth(): Promise<AuthData | null> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getFirstAsync<{
    token: string;
    user_id: string;
    email: string;
    name: string;
    picture: string | null;
  }>('SELECT * FROM auth LIMIT 1');

  if (!result) {
    return null;
  }

  return {
    token: result.token,
    user: {
      id: result.user_id,
      email: result.email,
      name: result.name,
      picture: result.picture || undefined,
    },
  };
}

export async function deleteAuth(): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  await db.runAsync('DELETE FROM auth');
  console.log('Auth data deleted successfully');
}

export async function clearAllData(): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  await db.runAsync('DELETE FROM auth');
  console.log('All data cleared successfully');
}
