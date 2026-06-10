import prisma from '../../lib/prisma';

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
	const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND LOWER(table_name) = LOWER(${tableName})
      AND LOWER(column_name) = LOWER(${columnName})
  `;
	return Number(rows[0]?.count ?? 0) > 0;
}

async function main() {
	const hasShareAmount = await columnExists('BillOwed', 'shareAmount');
	const hasCustomShare = await columnExists('BillOwed', 'isCustomShare');

	if (!hasShareAmount) {
		await prisma.$executeRawUnsafe(`
      ALTER TABLE \`BillOwed\`
      ADD COLUMN \`shareAmount\` DOUBLE NOT NULL DEFAULT 0
    `);
		console.log('Added BillOwed.shareAmount');
	}

	if (!hasCustomShare) {
		await prisma.$executeRawUnsafe(`
      ALTER TABLE \`BillOwed\`
      ADD COLUMN \`isCustomShare\` BOOLEAN NOT NULL DEFAULT false
    `);
		console.log('Added BillOwed.isCustomShare');
	}

	await prisma.$executeRawUnsafe(`
    UPDATE \`BillOwed\` bo
    JOIN \`Bill\` b ON b.id = bo.billId
    JOIN (
      SELECT billId, COUNT(*) AS cnt
      FROM \`BillOwed\`
      WHERE isDeleted = false
      GROUP BY billId
    ) counts ON counts.billId = bo.billId
    SET bo.shareAmount = ROUND(b.amount / counts.cnt, 2)
    WHERE bo.isDeleted = false
      AND (bo.shareAmount = 0 OR bo.shareAmount IS NULL)
  `);

	console.log('Backfilled BillOwed.shareAmount for existing rows');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
