-- CreateTable
CREATE TABLE `TripShare` (
    `id` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NOT NULL,
    `shareToken` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TripShare_tripId_key`(`tripId`),
    UNIQUE INDEX `TripShare_shareToken_key`(`shareToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TripAccess` (
    `id` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TripAccess_userId_idx`(`userId`),
    INDEX `TripAccess_tripId_idx`(`tripId`),
    UNIQUE INDEX `TripAccess_tripId_userId_key`(`tripId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TripShare` ADD CONSTRAINT `TripShare_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TripAccess` ADD CONSTRAINT `TripAccess_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TripAccess` ADD CONSTRAINT `TripAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
