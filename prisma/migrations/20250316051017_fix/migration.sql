/*
  Warnings:

  - Made the column `qrCode` on table `Reservation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "qrCode" SET NOT NULL;
