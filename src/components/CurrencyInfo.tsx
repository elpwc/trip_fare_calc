'use client';

import { CURRENCY_DEFINITIONS, CURRENCIES, getCurrencyName, getFlagUrl, getFlagText } from '@/src/utils/currencies';

export function CurrencyInfo() {
	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold">可用币种</h2>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{CURRENCIES.map((code) => {
					const currency = CURRENCY_DEFINITIONS[code];
					if (!currency) return null;

					return (
						<div key={code} className="rounded-lg border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
							<div className="flex items-center gap-3">
								<img src={getFlagUrl(currency.countryCode)} alt={currency.region} className="h-10 w-auto" />
								<div>
									<p className="text-sm font-semibold text-slate-500">{code}</p>
									<p className="text-lg font-bold text-slate-900 dark:text-slate-100">{currency.name}</p>
									<p className="text-sm text-slate-600 dark:text-slate-400">{currency.region}</p>
								</div>
							</div>
							<p className="mt-3 text-xs text-slate-500">
								符号: <span className="font-mono font-bold">{currency.symbol}</span>
							</p>
						</div>
					);
				})}
			</div>
		</div>
	);
}
