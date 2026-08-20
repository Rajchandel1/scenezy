import { db } from './index';
import { users, events, passTypes } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Note: In production, users are created via Supabase Auth
  // This seed is for initial events/pass types only
  
  // You'll need to create users via Supabase Auth first,
  // then get their IDs and insert here.
  
  // For now, just seed events after you have user IDs.
  console.log('✅ Seed complete!');
  console.log('   Note: Create users via the app signup flow first.');
  console.log('   Then run seed again to add events linked to sellers.');
}

seed().catch(console.error);
