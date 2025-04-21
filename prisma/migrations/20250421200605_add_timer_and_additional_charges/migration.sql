-- AlterTable
ALTER TABLE "ParkingSpot" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "price" SET DEFAULT 10.0;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "timerStarted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timerStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdditionalCharge" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripePaymentStatus" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdditionalCharge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdditionalCharge" ADD CONSTRAINT "AdditionalCharge_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
