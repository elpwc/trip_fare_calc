-- CreateTable
CREATE TABLE IF NOT EXISTS `TripCollaboratorHistory` (
    `id` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TripCollaboratorHistory_tripId_idx`(`tripId`),
    INDEX `TripCollaboratorHistory_userId_idx`(`userId`),
    UNIQUE INDEX `TripCollaboratorHistory_tripId_userId_key`(`tripId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `UserCoeditHistory` (
    `id` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `coeditorUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserCoeditHistory_ownerUserId_idx`(`ownerUserId`),
    INDEX `UserCoeditHistory_coeditorUserId_idx`(`coeditorUserId`),
    UNIQUE INDEX `UserCoeditHistory_ownerUserId_coeditorUserId_key`(`ownerUserId`, `coeditorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TripCollaboratorHistory` ADD CONSTRAINT `TripCollaboratorHistory_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TripCollaboratorHistory` ADD CONSTRAINT `TripCollaboratorHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCoeditHistory` ADD CONSTRAINT `UserCoeditHistory_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCoeditHistory` ADD CONSTRAINT `UserCoeditHistory_coeditorUserId_fkey` FOREIGN KEY (`coeditorUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
