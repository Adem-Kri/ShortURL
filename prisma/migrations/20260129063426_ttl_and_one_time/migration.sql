-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShortLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shortCode" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "lastClickedAt" DATETIME,
    "expiresAt" DATETIME,
    "oneTime" BOOLEAN NOT NULL DEFAULT false,
    "consumedAt" DATETIME
);
INSERT INTO "new_ShortLink" ("clickCount", "createdAt", "id", "lastClickedAt", "originalUrl", "shortCode", "updatedAt") SELECT "clickCount", "createdAt", "id", "lastClickedAt", "originalUrl", "shortCode", "updatedAt" FROM "ShortLink";
DROP TABLE "ShortLink";
ALTER TABLE "new_ShortLink" RENAME TO "ShortLink";
CREATE UNIQUE INDEX "ShortLink_shortCode_key" ON "ShortLink"("shortCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
