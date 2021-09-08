-- CreateTable
CREATE TABLE `card` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rfid` VARCHAR(24) NOT NULL,
    `licence_plate` VARCHAR(24),
    `owner` VARCHAR(50),
    `createAt` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PENDING', 'DRIVING_IN', 'PARKING', 'PAYING', 'OUT') NOT NULL DEFAULT 'PENDING',
    `type` ENUM('MONTH', 'DATE') NOT NULL DEFAULT 'DATE',

    UNIQUE INDEX `card.rfid_unique`(`rfid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('FREE', 'BUSY') NOT NULL DEFAULT 'BUSY',
    `name` VARCHAR(24) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_card` INTEGER NOT NULL,
    `id_parking` INTEGER NOT NULL,
    `time_in` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `time_out` DATETIME(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `history` ADD FOREIGN KEY (`id_card`) REFERENCES `card`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `history` ADD FOREIGN KEY (`id_parking`) REFERENCES `parking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
