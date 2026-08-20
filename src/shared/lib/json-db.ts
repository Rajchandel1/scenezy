import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'src', 'data');

export function readJson<T>(filename: string): T {
  try {
    const filePath = join(DATA_DIR, filename);
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { users: [], events: [], passes: [], orders: [], transfers: [] } as T;
  }
}

export function writeJson<T>(filename: string, data: T): void {
  const filePath = join(DATA_DIR, filename);
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
