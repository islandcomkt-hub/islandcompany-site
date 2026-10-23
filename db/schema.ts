import {sqliteTable,text,index} from 'drizzle-orm/sqlite-core';
export const leads=sqliteTable('leads',{submissionId:text('submission_id').primaryKey(),journeyId:text('journey_id').notNull(),receivedAt:text('received_at').notNull(),name:text('name').notNull(),company:text('company').notNull(),email:text('email').notNull(),whatsapp:text('whatsapp').notNull(),payload:text('payload').notNull(),classification:text('classification').notNull(),rateKey:text('rate_key').notNull()},table=>[index('leads_journey_received').on(table.journeyId,table.receivedAt),index('leads_rate_received').on(table.rateKey,table.receivedAt)]);
export const leadManagement=sqliteTable('lead_management',{
 journeyId:text('journey_id').primaryKey(),status:text('status').notNull().default('Novo'),
 recommendedIslands:text('recommended_islands'),nextContact:text('next_contact'),updatedAt:text('updated_at').notNull(),revision:text('revision').notNull()
});
export const leadEvents=sqliteTable('lead_events',{
 id:text('id').primaryKey(),journeyId:text('journey_id').notNull(),createdAt:text('created_at').notNull(),
 actor:text('actor').notNull(),status:text('status').notNull(),note:text('note').notNull(),nextContact:text('next_contact')
},table=>[index('lead_events_journey').on(table.journeyId,table.createdAt)]);
