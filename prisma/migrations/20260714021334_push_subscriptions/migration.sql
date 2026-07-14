-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PushSubscription_role_personName_idx" ON "PushSubscription"("role", "personName");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_role_key" ON "PushSubscription"("endpoint", "role");
