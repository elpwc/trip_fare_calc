'use client';

import { useParams } from 'next/navigation';
import AppShell from '@/src/components/layout/AppShell';
import { usePreferences } from '@/src/utils/preferences-provider';
import NewBillPage from '../../new/page';

export default function EditBillPage() {
	const { t } = usePreferences();
	const params = useParams();
	const billId = Array.isArray(params?.id) ? params.id[0] : params?.id;

	if (!billId) {
		return (
			<AppShell tight>
				<div className="app-empty mt-8 text-app-danger">{t('settle.invalidBillId')}</div>
			</AppShell>
		);
	}

	return <NewBillPage billId={billId} />;
}
