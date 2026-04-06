import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get the authenticated user ID from the session.
 * Throws if no session exists.
 */
export async function getAuthUser(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("UNAUTHENTICATED");
  }
  return userId;
}

/**
 * Get the role of a user from the userRoles table.
 * Throws if role not found.
 */
export async function getUserRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<"freelancer" | "client"> {
  const roleDoc = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  if (!roleDoc) {
    throw new ConvexError("Role not found for user");
  }

  return roleDoc.role;
}

/**
 * Require a specific role for the authenticated user.
 * Throws if unauthenticated or wrong role.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  expectedRole: "freelancer" | "client"
): Promise<{ userId: Id<"users">; role: "freelancer" | "client" }> {
  const userId = await getAuthUser(ctx);
  const role = await getUserRole(ctx, userId);

  if (role !== expectedRole) {
    throw new ConvexError({
      message: "UNAUTHORIZED",
      expected: expectedRole,
      actual: role,
    });
  }

  return { userId, role };
}

/**
 * Get the authenticated user and their role.
 * Throws if unauthenticated.
 */
export async function getAuthUserWithRole(
  ctx: QueryCtx | MutationCtx
): Promise<{ userId: Id<"users">; role: "freelancer" | "client" }> {
  const userId = await getAuthUser(ctx);
  const role = await getUserRole(ctx, userId);
  return { userId, role };
}
