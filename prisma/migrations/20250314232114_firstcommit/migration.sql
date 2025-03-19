/*
  Warnings:

  - You are about to drop the `ReminderLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReminderLog" DROP CONSTRAINT "ReminderLog_reservationId_fkey";

-- DropTable
DROP TABLE "ReminderLog";
