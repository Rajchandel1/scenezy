import { describe,expect,it } from 'vitest';
import { eventCreateSchema,orderCreateSchema,scannerSchema } from './validation';

describe('production request validation',()=>{
  it('accepts a valid event and rejects negative prices',()=>{
    const event={title:'Live Night',description:'Music',date:'2026-09-10',time:'20:00',location:'Ahmedabad',venue:'Arena',category:'Music',passes:[{name:'General',price:500,available:100}]};
    expect(eventCreateSchema.safeParse(event).success).toBe(true);
    expect(eventCreateSchema.safeParse({...event,passes:[{name:'General',price:-1,available:100}]}).success).toBe(false);
  });
  it('rejects malformed checkout identifiers and quantities',()=>{
    expect(orderCreateSchema.safeParse({eventId:'bad',idempotencyKey:'short',items:[]}).success).toBe(false);
    expect(orderCreateSchema.safeParse({eventId:'550e8400-e29b-41d4-a716-446655440000',idempotencyKey:'checkout-key-123456',items:[{passTypeId:'550e8400-e29b-41d4-a716-446655440001',quantity:2}]}).success).toBe(true);
  });
  it('bounds scanner payloads',()=>{
    expect(scannerSchema.safeParse({credential:'PASS_1234567890123456',gate:'Main Gate'}).success).toBe(true);
    expect(scannerSchema.safeParse({credential:'tiny'}).success).toBe(false);
  });
});
