const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnlyString(value: string): boolean {
	return DATE_ONLY_PATTERN.test(value);
}

/** Today's calendar date as YYYY-MM-DD in the local timezone. */
export function getLocalDateInputValue(date = new Date()): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/** Parse YYYY-MM-DD as a local calendar date (noon avoids DST edge cases). */
export function parseDateOnlyLocal(value: string): Date {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/** Format YYYY-MM-DD for display in the user's locale. */
export function formatDateOnly(value: string, locale: string, options?: Intl.DateTimeFormatOptions): string {
	if (!isDateOnlyString(value)) return value;
	return parseDateOnlyLocal(value).toLocaleDateString(locale, options);
}

/** Format an ISO timestamp as a local calendar date. */
export function formatTimestampAsLocalDate(value: string | Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
	const date = typeof value === 'string' ? new Date(value) : value;
	if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
	return date.toLocaleDateString(locale, options);
}

/** Format either YYYY-MM-DD or an ISO timestamp for display. */
export function formatDisplayDate(value: string, locale: string, options?: Intl.DateTimeFormatOptions): string {
	if (isDateOnlyString(value)) return formatDateOnly(value, locale, options);
	return formatTimestampAsLocalDate(value, locale, options);
}

/** Convert YYYY-MM-DD to a UTC Date suitable for Prisma @db.Date storage. */
export function dateOnlyStringToUtcDate(value: string): Date {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

/** Serialize Prisma @db.Date values to YYYY-MM-DD. */
export function formatPrismaDateOnly(date: Date | null | undefined): string | undefined {
	if (!date) return undefined;
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function formatTripDisplayDate(
	trip: { startDate?: string | null; createdAt: string },
	locale: string,
	options?: Intl.DateTimeFormatOptions,
): string {
	if (trip.startDate) return formatDateOnly(trip.startDate, locale, options);
	return formatTimestampAsLocalDate(trip.createdAt, locale, options);
}

export function getTripSortDate(trip: { startDate?: string | null; createdAt: string }): Date {
	if (trip.startDate) return parseDateOnlyLocal(trip.startDate);
	return new Date(trip.createdAt);
}
