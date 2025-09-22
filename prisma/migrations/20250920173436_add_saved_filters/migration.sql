-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entity" TEXT NOT NULL,
    "filterConfig" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT,
    CONSTRAINT "saved_filters_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_filter_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "savedFilterId" TEXT NOT NULL,
    "userId" TEXT,
    "executionTime" INTEGER,
    "resultCount" INTEGER,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_filter_usage_savedFilterId_fkey" FOREIGN KEY ("savedFilterId") REFERENCES "saved_filters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "saved_filter_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "saved_filters_entity_idx" ON "saved_filters"("entity");

-- CreateIndex
CREATE INDEX "saved_filters_ownerId_idx" ON "saved_filters"("ownerId");

-- CreateIndex
CREATE INDEX "saved_filters_isPublic_idx" ON "saved_filters"("isPublic");

-- CreateIndex
CREATE INDEX "saved_filters_isDefault_idx" ON "saved_filters"("isDefault");

-- CreateIndex
CREATE INDEX "saved_filters_name_idx" ON "saved_filters"("name");

-- CreateIndex
CREATE INDEX "saved_filter_usage_savedFilterId_idx" ON "saved_filter_usage"("savedFilterId");

-- CreateIndex
CREATE INDEX "saved_filter_usage_userId_idx" ON "saved_filter_usage"("userId");

-- CreateIndex
CREATE INDEX "saved_filter_usage_usedAt_idx" ON "saved_filter_usage"("usedAt");
