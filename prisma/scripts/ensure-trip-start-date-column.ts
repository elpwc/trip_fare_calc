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
	const hasColumn = await columnExists('Trip', 'startDate');

	if (!hasColumn) {
		await prisma.$executeRawUnsafe(`
      ALTER TABLE \`Trip\`
      ADD COLUMN \`startDate\` DATE NULL
    `);
		console.log('Added Trip.startDate');
	} else {
		console.log('Trip.startDate already exists');
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
