/*
  Warnings:

  - You are about to alter the column `status` on the `parking` table. The data in that column could be lost. The data in that column will be cast from `Enum("parking_status")` to `Enum("parking_status")`.

*/
-- AlterTable
ALTER TABLE `card` MODIFY `status` ENUM('PENDING', 'DRIVING_IN', 'DRIVING_OUT', 'PARKING', 'PAYING', 'OUT') NOT NULL DEFAULT 'PENDING',
    MODIFY `type` ENUM('MONTH', 'DATE', 'MASTER') NOT NULL DEFAULT 'DATE';

-- AlterTable
ALTER TABLE `parking` MODIFY `status` ENUM('FREE', 'SERVING', 'INSERVING') NOT NULL DEFAULT 'FREE';
