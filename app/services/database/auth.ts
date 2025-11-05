import { getDatabase, initDatabase } from './connection';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  hasDrivePermission?: boolean;
}

export interface AuthData {
  token: string;
  user: User;
}

export async function saveAuth(token: string, user: User): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const now = Date.now();

  await db.runAsync('DELETE FROM auth');

  await db.runAsync(
    `INSERT INTO auth (token, user_id, email, name, picture, has_drive_permission, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [token, user.id, user.email, user.name, user.picture || null, user.hasDrivePermission ? 1 : 0, now, now]
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
    has_drive_permission: number;
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
      hasDrivePermission: result.has_drive_permission === 1,
    },
  };
}

export async function updateDrivePermission(hasPermission: boolean): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const now = Date.now();

  await db.runAsync(
    `UPDATE auth SET has_drive_permission = ?, updated_at = ?`,
    [hasPermission ? 1 : 0, now]
  );

  console.log('Drive permission updated successfully');
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
