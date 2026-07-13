import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, organizationsTable, membershipsTable } from "@workspace/db";
import { GetMeResponse } from "@workspace/api-zod";
import { requireOrg, type AuthedRequest } from "../middlewares/requireOrg";

const router: IRouter = Router();

router.get("/me", requireOrg, async (req, res): Promise<void> => {
  const { organizationId, clerkUserId } = req as unknown as AuthedRequest;

  const [organization] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, organizationId));

  const [membership] = await db
    .select()
    .from(membershipsTable)
    .where(eq(membershipsTable.clerkUserId, clerkUserId));

  if (!organization || !membership) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }

  let name = membership.name;
  let email = membership.email;
  if (!name || !email) {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    name =
      name ??
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ??
      null;
    email = email ?? clerkUser.primaryEmailAddress?.emailAddress ?? null;
  }

  res.json(
    GetMeResponse.parse({
      userId: membership.id,
      name,
      email,
      role: membership.role,
      organization: {
        id: organization.id,
        name: organization.name,
        createdAt: organization.createdAt,
      },
    }),
  );
});

export default router;
