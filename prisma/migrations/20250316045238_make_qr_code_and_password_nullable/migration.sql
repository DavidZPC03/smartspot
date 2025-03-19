/*
  Warnings:

  - You are about to drop the column `city` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `totalSpots` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `ParkingSpot` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Reservation` table. All the data in the column will be lost.
  - The `status` column on the `Reservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[qrCode]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_reservationId_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_userId_fkey";

-- DropIndex
DROP INDEX "ParkingSpot_locationId_spotNumber_key";

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "state",
DROP COLUMN "totalSpots",
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ParkingSpot" DROP COLUMN "isActive",
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "userId",
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "licensePlate" DROP NOT NULL;

-- DropTable
DROP TABLE "Payment";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "ReservationStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_qrCode_key" ON "Reservation"("qrCode");
