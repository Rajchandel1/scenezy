import { z } from 'zod';

const cleanText=(max:number)=>z.string().trim().min(1).max(max);
export const uuidSchema=z.string().uuid();

export const eventCreateSchema=z.object({
  title:cleanText(120),description:z.string().trim().max(5000).optional().default(''),
  date:cleanText(80),time:z.union([z.literal(''),z.string().regex(/^\d{2}:\d{2}$/)]).default(''),
  location:cleanText(120),locationUrl:z.string().trim().max(2000).refine(value=>!value||value.startsWith('https://'),'Location URL must use HTTPS').optional().default(''),venue:cleanText(160),category:cleanText(50),
  posterUrl:z.string().trim().max(2000).refine(value=>!value||value.startsWith('https://')||value.startsWith('/api/data/uploads/event-poster?path='),'Invalid poster URL').optional().default(''),
  passes:z.array(z.object({name:cleanText(60),price:z.number().int().min(0).max(10_000_000),benefits:z.string().trim().max(500).optional().default(''),available:z.number().int().min(1).max(1_000_000),transferAllowed:z.boolean().optional().default(true)})).min(1).max(20),
});
export const eventUpdateSchema=eventCreateSchema.omit({passes:true}).partial().extend({eventId:uuidSchema});

export const orderCreateSchema=z.object({
  eventId:uuidSchema,idempotencyKey:z.string().min(16).max(100),
  items:z.array(z.object({passTypeId:uuidSchema,quantity:z.number().int().min(1).max(10)})).min(1).max(10),
});

export const scannerSchema=z.object({credential:z.string().trim().min(12).max(512),gate:z.string().trim().min(1).max(80).optional().default('Main Gate')});

export function validationError(error:z.ZodError){return Response.json({error:'Invalid request',issues:error.issues.map(issue=>({field:issue.path.join('.'),message:issue.message}))},{status:400})}
