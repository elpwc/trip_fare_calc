export type Currency = {
	code: string;
	name: string;
	symbol: string;
	region: string;
	countryCode: string;
	suffix: string;
};

export const CURRENCY_DEFINITIONS: Record<string, Currency> = {
	CNY: {
		code: 'CNY',
		name: '人民币',
		symbol: '¥',
		region: '中国',
		countryCode: 'CN',
		suffix: '元',
	},
	USD: {
		code: 'USD',
		name: '美元',
		symbol: '$',
		region: '美国',
		countryCode: 'US',
		suffix: '美元',
	},
	EUR: {
		code: 'EUR',
		name: '欧元',
		symbol: '€',
		region: '欧洲',
		countryCode: 'EU',
		suffix: '欧元',
	},
	GBP: {
		code: 'GBP',
		name: '英镑',
		symbol: '￡',
		region: '英国',
		countryCode: 'GB',
		suffix: '镑',
	},
	JPY: {
		code: 'JPY',
		name: '日元',
		symbol: '¥',
		region: '日本',
		countryCode: 'JP',
		suffix: '円',
	},
	TWD: {
		code: 'TWD',
		name: '新台币',
		symbol: 'NT$',
		region: '台湾',
		countryCode: 'TW',
		suffix: '台币',
	},
	HKD: {
		code: 'HKD',
		name: '港元',
		symbol: 'HK$',
		region: '香港',
		countryCode: 'HK',
		suffix: '港币',
	},
	MOP: {
		code: 'MOP',
		name: '澳门元',
		symbol: 'MOP$',
		region: '澳门',
		countryCode: 'MO',
		suffix: 'MOP',
	},
	VND: {
		code: 'VND',
		name: '越南盾',
		symbol: '₫',
		region: '越南',
		countryCode: 'VN',
		suffix: '盾',
	},
	KRW: {
		code: 'KRW',
		name: '韩元',
		symbol: '₩',
		region: '韩国',
		countryCode: 'KR',
		suffix: '원',
	},
	THB: {
		code: 'THB',
		name: '泰铢',
		symbol: '฿',
		region: '泰国',
		countryCode: 'TH',
		suffix: '泰铢',
	},
};

export const CURRENCIES = Object.keys(CURRENCY_DEFINITIONS) as string[];

export function getCurrency(code: string): Currency | undefined {
	return CURRENCY_DEFINITIONS[code];
}

export function formatAmount(value: number, currencyCode: string): string {
	const currency = getCurrency(currencyCode);
	if (!currency) {
		return `${currencyCode} ${value.toFixed(2)}`;
	}

	// // 对于同名符号（¥）的币种，使用国家代码区分
	// if (currency.symbol === '¥') {
	// 	return `${currency.region}${currency.symbol}${value.toFixed(2)}`;
	// }

	return `${value.toFixed(2)}${currency.suffix}`;
}

/**
 * 获取国旗图标 URL
 * 使用 Flagcdn CDN 提供的 PNG 国旗
 * 返回一个可靠的 CDN URL
 */
export function getFlagUrl(countryCode: string): string {
	// 使用 flagcdn.com 的国旗 PNG
	return `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
}

/**
 * 获取国家代码标签作为备用显示
 */
export function getFlagText(countryCode: string): string {
	return countryCode.toUpperCase();
}

export function getCurrencyName(currencyCode: string): string {
	const currency = getCurrency(currencyCode);
	return currency ? `${currency.name} (${currency.code})` : currencyCode;
}

export function getCurrencyRegion(currencyCode: string): string {
	const currency = getCurrency(currencyCode);
	return currency?.region || '未知地区';
}
