import { NextRequest } from 'next/server';
import { readJson, writeJson, generateId } from '@/shared/lib/json-db';

interface User { id: string; email: string; name: string; password: string; role: string; createdAt: string; }
interface UsersFile { users: User[]; }

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;
  const data = readJson<UsersFile>('users.json');

  if (action === 'login') {
    const user = data.users.find(u => u.email.toLowerCase() === body.email.toLowerCase() && u.password === body.password);
    if (!user) return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    const { password, ...safe } = user;
    return Response.json(safe);
  }

  if (action === 'register') {
    const exists = data.users.some(u => u.email.toLowerCase() === body.email.toLowerCase());
    if (exists) return Response.json({ error: 'Email already registered' }, { status: 409 });
    const newUser: User = {
      id: generateId('usr'),
      email: body.email,
      name: body.name,
      password: body.password,
      role: body.role || 'USER',
      createdAt: new Date().toISOString(),
    };
    data.users.push(newUser);
    writeJson('users.json', data);
    const { password, ...safe } = newUser;
    return Response.json(safe);
  }

  if (action === 'get-user') {
    const user = data.users.find(u => u.id === body.userId);
    if (!user) return Response.json({ error: 'Not found' }, { status: 404 });
    const { password, ...safe } = user;
    return Response.json(safe);
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
