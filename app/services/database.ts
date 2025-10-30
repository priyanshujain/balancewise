import * as SQLite from 'expo-sqlite';

const DB_NAME = 'balancewise.db';

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

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS auth (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  async saveAuth(token: string, user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();

    // Delete any existing auth data (we only keep one session)
    await this.db.runAsync('DELETE FROM auth');

    // Insert new auth data
    await this.db.runAsync(
      `INSERT INTO auth (token, user_id, email, name, picture, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [token, user.id, user.email, user.name, user.picture || null, now, now]
    );

    console.log('Auth data saved successfully');
  }

  async getAuth(): Promise<AuthData | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{
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

  async deleteAuth(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM auth');
    console.log('Auth data deleted successfully');
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM auth');
    console.log('All data cleared successfully');
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('Database closed');
    }
  }
}

export const db = new DatabaseService();
