-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('SITE_MOBILIZATION', 'SCANNING', 'OCULAR', 'DEMO', 'MEETING', 'AIRPORT_PICKUP', 'AIRPORT_DROPOFF', 'EQUIPMENT_PICKUP', 'EQUIPMENT_DELIVERY', 'ERRAND', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('REQUESTED', 'ASSIGNED', 'EN_ROUTE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isDriver" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "driverToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "plate" TEXT,
    "type" TEXT,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchRequest" (
    "id" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "timeNeeded" TEXT NOT NULL,
    "type" "RequestType" NOT NULL DEFAULT 'OTHER',
    "pickupLocation" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "passengers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "purpose" TEXT,
    "equipment" TEXT,
    "notes" TEXT,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "scheduledTime" TEXT,
    "sequence" INTEGER,
    "estDurationMin" INTEGER NOT NULL DEFAULT 60,
    "status" "RequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templateId" TEXT,

    CONSTRAINT "DispatchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTemplate" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "defaultTime" TEXT NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "passengers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "type" "RequestType" NOT NULL DEFAULT 'OTHER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultDriverId" TEXT,
    "defaultVehicleId" TEXT,

    CONSTRAINT "RecurringTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Person_driverToken_key" ON "Person"("driverToken");

-- CreateIndex
CREATE INDEX "DispatchRequest_serviceDate_idx" ON "DispatchRequest"("serviceDate");

-- CreateIndex
CREATE INDEX "DispatchRequest_driverId_serviceDate_idx" ON "DispatchRequest"("driverId", "serviceDate");

-- CreateIndex
CREATE INDEX "DispatchRequest_status_idx" ON "DispatchRequest"("status");

-- AddForeignKey
ALTER TABLE "DispatchRequest" ADD CONSTRAINT "DispatchRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRequest" ADD CONSTRAINT "DispatchRequest_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRequest" ADD CONSTRAINT "DispatchRequest_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RecurringTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTemplate" ADD CONSTRAINT "RecurringTemplate_defaultDriverId_fkey" FOREIGN KEY ("defaultDriverId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTemplate" ADD CONSTRAINT "RecurringTemplate_defaultVehicleId_fkey" FOREIGN KEY ("defaultVehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
