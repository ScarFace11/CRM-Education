import type { NextFunction, Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import {
  db,
  membershipsTable,
  organizationsTable,
  pipelineStagesTable,
} from "@workspace/db";
import { logger } from "../lib/logger";

export interface AuthedRequest extends Request {
  organizationId: number;
  clerkUserId: string;
}

/**
 * Resolves the authenticated Clerk user's organization, JIT-provisioning a
 * personal organization + membership on first authenticated request. Every
 * downstream route reads `req.organizationId` for tenant isolation -- the
 * organization id is never accepted from the client.
 */
export async function requireOrg(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(membershipsTable)
      .where(eq(membershipsTable.clerkUserId, userId));

    if (existing) {
      (req as unknown as AuthedRequest).organizationId = existing.organizationId;
      (req as unknown as AuthedRequest).clerkUserId = userId;
      next();
      return;
    }

    // First authenticated request for this Clerk user -- provision a
    // personal organization, an owner membership, and a default pipeline.
    const clerkUser = await clerkClient.users.getUser(userId);
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.primaryEmailAddress?.emailAddress ||
      "New user";
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;

    const organization = await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizationsTable)
        .values({ name: `${name}'s Organization` })
        .returning();

      if (!org) {
        throw new Error("Failed to create organization");
      }

      await tx.insert(membershipsTable).values({
        clerkUserId: userId,
        organizationId: org.id,
        name,
        email,
        role: "owner",
      });

      // Seed a sensible default pipeline for a micro-school enrollment
      // funnel so a new organization isn't a completely blank slate.
      await tx.insert(pipelineStagesTable).values([
        {
          organizationId: org.id,
          name: "New Inquiry",
          order: 0,
          color: "#6366f1",
        },
        {
          organizationId: org.id,
          name: "Tour Scheduled",
          order: 1,
          color: "#0ea5e9",
        },
        {
          organizationId: org.id,
          name: "Application Sent",
          order: 2,
          color: "#f59e0b",
        },
        {
          organizationId: org.id,
          name: "Enrolled",
          order: 3,
          color: "#22c55e",
        },
      ]);

      return org;
    });

    (req as unknown as AuthedRequest).organizationId = organization.id;
    (req as unknown as AuthedRequest).clerkUserId = userId;
    next();
  } catch (err) {
    req.log?.error({ err }, "Failed to resolve organization for user");
    res.status(500).json({ error: "Failed to resolve organization" });
  }
}
