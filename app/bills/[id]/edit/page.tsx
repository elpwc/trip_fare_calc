'use client';

import { useParams } from 'next/navigation';
import NewBillPage from '../../new/page';

export default function EditBillPage() {
	const params = useParams();
	const billId = Array.isArray(params?.id) ? params.id[0] : params?.id;

	if (!billId) {
		return (
			<div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
				<div className="max-w-2xl mx-auto px-4 py-12 text-center text-red-600 dark:text-red-400">无效的账单ID</div>
			</div>
		);
	}

	return <NewBillPage billId={billId} />;
}
