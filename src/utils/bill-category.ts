import type { MessageKey } from '@/src/utils/i18n/types';

const CATEGORY_I18N_KEYS: Record<string, MessageKey> = {
	吃饭: 'bills.category.meal',
	住宿: 'bills.category.hotel',
	门票: 'bills.category.ticket',
	KTV: 'bills.category.ktv',
	购物: 'bills.category.shop',
	租车: 'bills.category.car',
	高速费: 'bills.category.toll',
	加油费: 'bills.category.gas',
	停车费: 'bills.category.park',
	打车: 'bills.category.taxi',
	公交: 'bills.category.bus',
	火车: 'bills.category.train',
	机票: 'bills.category.flight',
	交通: 'bills.category.traffic',
	其他: 'bills.category.other',
};

export function getBillCategoryLabelKey(category: string): MessageKey {
	return CATEGORY_I18N_KEYS[category] ?? 'bills.category.other';
}
