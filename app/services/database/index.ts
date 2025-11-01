// Re-export database connection functions
export { initDatabase, getDatabase, closeDatabase } from './connection';

// Re-export domain-specific operations
export * from './auth';
export * from './tasks';
export * from './exercises';
export * from './workouts';
export * from './sessions';
export * from './seed';
