-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('VIDEO_CALL', 'PHONE_CALL', 'TEXT_CHAT', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "human_companions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "tags" JSONB,
    "specialties" JSONB,
    "languages" JSONB,
    "timezone" TEXT NOT NULL,
    "availabilitySchedule" JSONB,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "minimumDuration" INTEGER NOT NULL DEFAULT 30,
    "googleCalendarId" TEXT,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiry" TIMESTAMP(3),
    "calendarSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "human_companions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL,
    "googleEventId" TEXT,
    "googleCalendarId" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "stripePaymentId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "meetingType" "MeetingType" NOT NULL DEFAULT 'VIDEO_CALL',
    "meetingLink" TEXT,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "refundAmount" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "userRating" INTEGER,
    "userReview" TEXT,
    "companionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_reviews" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_earnings" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "platformFee" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "stripeTransferId" TEXT,
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "human_companions_userId_key" ON "human_companions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "human_companions_googleCalendarId_key" ON "human_companions"("googleCalendarId");

-- CreateIndex
CREATE INDEX "human_companions_isActive_isVerified_idx" ON "human_companions"("isActive", "isVerified");

-- CreateIndex
CREATE INDEX "human_companions_userId_idx" ON "human_companions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_googleEventId_key" ON "appointments"("googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_stripePaymentId_key" ON "appointments"("stripePaymentId");

-- CreateIndex
CREATE INDEX "appointments_userId_startTime_idx" ON "appointments"("userId", "startTime");

-- CreateIndex
CREATE INDEX "appointments_companionId_startTime_idx" ON "appointments"("companionId", "startTime");

-- CreateIndex
CREATE INDEX "appointments_status_startTime_idx" ON "appointments"("status", "startTime");

-- CreateIndex
CREATE INDEX "appointments_googleEventId_idx" ON "appointments"("googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_reviews_appointmentId_key" ON "companion_reviews"("appointmentId");

-- CreateIndex
CREATE INDEX "companion_reviews_companionId_createdAt_idx" ON "companion_reviews"("companionId", "createdAt");

-- CreateIndex
CREATE INDEX "companion_reviews_userId_idx" ON "companion_reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_earnings_appointmentId_key" ON "companion_earnings"("appointmentId");

-- CreateIndex
CREATE INDEX "companion_earnings_companionId_createdAt_idx" ON "companion_earnings"("companionId", "createdAt");

-- CreateIndex
CREATE INDEX "companion_earnings_status_idx" ON "companion_earnings"("status");

-- AddForeignKey
ALTER TABLE "human_companions" ADD CONSTRAINT "human_companions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "human_companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_reviews" ADD CONSTRAINT "companion_reviews_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_reviews" ADD CONSTRAINT "companion_reviews_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "human_companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_reviews" ADD CONSTRAINT "companion_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_earnings" ADD CONSTRAINT "companion_earnings_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "human_companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_earnings" ADD CONSTRAINT "companion_earnings_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

