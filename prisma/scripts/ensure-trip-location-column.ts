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
	const hasColumn = await columnExists('Trip', 'recordBillLocation');

	if (!hasColumn) {
		await prisma.$executeRawUnsafe(`
      ALTER TABLE \`Trip\`
      ADD COLUMN \`recordBillLocation\` BOOLEAN NOT NULL DEFAULT true
    `);
		console.log('Added Trip.recordBillLocation');
	} else {
		console.log('Trip.recordBillLocation already exists');
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
