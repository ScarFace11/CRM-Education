import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { contactsTable } from "./contacts";
import { pipelineStagesTable } from "./pipelineStages";

export const dealsTable = pgTable("deals", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizationsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  value: numeric("value", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  status: text("status").notNull().default("open"), // open | won | lost
  stageId: integer("stage_id")
    .notNull()
    .references(() => pipelineStagesTable.id, { onDelete: "restrict" }),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contactsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertDealSchema = createInsertSchema(dealsTable).omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof dealsTable.$inferSelect;
