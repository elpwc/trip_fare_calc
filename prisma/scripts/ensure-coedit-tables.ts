/**
 * One-off script: create coedit history tables if missing.
 * Run: npx tsx prisma/scripts/ensure-coedit-tables.ts
 */
import prisma from '../../lib/prisma';

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND LOWER(table_name) = LOWER(${tableName})
  `;
  return Number(rows[0]?.count ?? 0) > 0;
}

async function main() {
  const hasTripHistory = await tableExists('TripCollaboratorHistory');
  const hasUserHistory = await tableExists('UserCoeditHistory');

  if (!hasTripHistory) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`TripCollaboratorHistory\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`tripId\` VARCHAR(191) NOT NULL,
        \`userId\` VARCHAR(191) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        INDEX \`TripCollaboratorHistory_tripId_idx\`(\`tripId\`),
        INDEX \`TripCollaboratorHistory_userId_idx\`(\`userId\`),
        UNIQUE INDEX \`TripCollaboratorHistory_tripId_userId_key\`(\`tripId\`, \`userId\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`TripCollaboratorHistory\`
      ADD CONSTRAINT \`TripCollaboratorHistory_tripId_fkey\`
      FOREIGN KEY (\`tripId\`) REFERENCES \`Trip\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`TripCollaboratorHistory\`
      ADD CONSTRAINT \`TripCollaboratorHistory_userId_fkey\`
      FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    `);
    console.log('Created TripCollaboratorHistory');
  }

  if (!hasUserHistory) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`UserCoeditHistory\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`ownerUserId\` VARCHAR(191) NOT NULL,
        \`coeditorUserId\` VARCHAR(191) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        INDEX \`UserCoeditHistory_ownerUserId_idx\`(\`ownerUserId\`),
        INDEX \`UserCoeditHistory_coeditorUserId_idx\`(\`coeditorUserId\`),
        UNIQUE INDEX \`UserCoeditHistory_ownerUserId_coeditorUserId_key\`(\`ownerUserId\`, \`coeditorUserId\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`UserCoeditHistory\`
      ADD CONSTRAINT \`UserCoeditHistory_ownerUserId_fkey\`
      FOREIGN KEY (\`ownerUserId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`UserCoeditHistory\`
      ADD CONSTRAINT \`UserCoeditHistory_coeditorUserId_fkey\`
      FOREIGN KEY (\`coeditorUserId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    `);
    console.log('Created UserCoeditHistory');
  }

  if (hasTripHistory && hasUserHistory) {
    console.log('Coedit history tables already exist');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
