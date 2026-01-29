/* eslint-disable */
// Prisma 6.x (used in this project) reads `DATABASE_URL` directly from `.env`
// and uses `prisma/schema.prisma` without needing a `prisma.config.ts`.
//
// This file is kept intentionally inert to avoid TypeScript/module resolution
// issues during `next build`.
//
// Prisma CLI detects this file and skips its own `.env` loading, so we load it
// explicitly here.
require("dotenv").config();
module.exports = {};
