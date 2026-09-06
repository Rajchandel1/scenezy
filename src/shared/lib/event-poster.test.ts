import { describe,expect,it } from 'vitest';
import { eventPosterUrl } from './event-poster';

describe('eventPosterUrl',()=>{
  it('keeps app proxy URLs stable',()=>expect(eventPosterUrl('/api/data/uploads/event-poster?path=a')).toBe('/api/data/uploads/event-poster?path=a'));
  it('converts Supabase public object URLs to the authenticated proxy',()=>{
    expect(eventPosterUrl('https://project.supabase.co/storage/v1/object/public/event-posters/user/month/poster.webp')).toBe('/api/data/uploads/event-poster?path=user%2Fmonth%2Fposter.webp');
  });
  it('preserves external HTTPS artwork',()=>expect(eventPosterUrl('https://images.example.com/poster.jpg')).toBe('https://images.example.com/poster.jpg'));
});
