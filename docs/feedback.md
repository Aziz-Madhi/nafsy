Yes, you can create a feedback section in Convex so that when users fill out a feedback page in your app, their feedback is saved in Convex and can be reviewed along with user details.

How to implement this:

Define a feedback table in your schema:
You can create a feedback table that references the user who submitted the feedback. For example:

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
  feedback: defineTable({
    user: v.id("users"),
    message: v.string(),
    createdAt: v.number(),
  }),
});

See schema examples

Save feedback with user details:
In your mutation, use authentication to get the current user and save the feedback with a reference to their user document:

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitFeedback = mutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to mutation");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.insert("feedback", {
      user: user._id,
      message: args.message,
      createdAt: Date.now(),
    });
  },
});

Pattern for associating data with users

Query feedback with user details:
When reviewing feedback, you can join the feedback and user tables to display both the feedback and the user information:

import { query } from "./_generated/server";

export const listFeedback = query({
  args: {},
  handler: async (ctx) => {
    const feedbacks = await ctx.db.query("feedback").collect();
    return Promise.all(
      feedbacks.map(async (fb) => {
        const user = await ctx.db.get(fb.user);
        return {
          ...fb,
          userName: user?.name ?? "Anonymous",
        };
      })
    );
  },
});

See example of joining user data

This approach ensures that every feedback entry is associated with a user, and you can easily review all feedback along with user details in your admin UI.