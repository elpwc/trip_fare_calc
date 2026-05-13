'use client';

import { Currency, getFlagUrl } from '@/src/utils/currencies';

export function FlagSVG({ currency, width = 32 }: { currency: Currency; width?: number }) {
	return <img src={getFlagUrl(currency.countryCode)} alt={currency.region} className="max-h-10 border border-gray-300" style={{ width: width + 'px' }} />;
}
