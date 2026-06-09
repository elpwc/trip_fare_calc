'use client';

import React from 'react';
import AppShell from '@/src/components/layout/AppShell';
import FriendIcon from '@/src/components/FriendIcon';
import { usePreferences } from '@/src/utils/preferences-provider';
import { TripMember } from '@/src/types';

const testMembers = [
	{ id: '1', name: '张三', participationCount: 5, description: '', isSelf: false },
	{ id: '2', name: '李四', participationCount: 3, description: '', isSelf: true },
	{ id: '3', name: '王五', participationCount: 8, description: '', isSelf: false },
	{ id: '4', name: '赵六', participationCount: 2, description: '', isSelf: false },
	{ id: '5', name: 'Alice', participationCount: 4, description: '', isSelf: false },
	{ id: '6', name: 'Bob', participationCount: 6, description: '', isSelf: false },
];

const HomepageIconTest: React.FC = () => {
	const { t } = usePreferences();

	return (
		<AppShell>
			<h1 className="mb-4 text-2xl font-bold">{t('page.testHomepageIcons')}</h1>

			<section className="mb-8">
				<h2 className="mb-4 text-lg font-semibold">{t('test.homepage.participants')}</h2>
				<div className="flex gap-3 overflow-x-auto pb-2">
					{testMembers.map((member) => (
						<div key={member.id} className="flex min-w-16 flex-col items-center gap-2 text-center">
							<FriendIcon name={member.name} size="lg" isSelf={member.isSelf} />
							<p className="max-w-18 truncate text-xs text-app-muted">{member.name}</p>
						</div>
					))}
				</div>
			</section>

			<section className="mb-8">
				<h2 className="mb-4 text-lg font-semibold">{t('test.homepage.bills')}</h2>
				<div className="app-panel overflow-hidden">
					<table className="app-bill-table">
						<thead>
							<tr>
								<th>{t('table.payer')}</th>
								<th>{t('table.amountSplit')}</th>
								<th>{t('table.item')}</th>
								<th>{t('table.status')}</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td className="app-bill-cell-icon">
									<FriendIcon name={testMembers[0].name} size="sm" />
								</td>
								<td>
									<p className="app-amount text-[13px]">100¥</p>
									<div className="mt-0.5 flex flex-wrap gap-px">
										{testMembers.slice(1, 4).map((member: TripMember) => (
											<FriendIcon key={member.id} name={member.name} size="sm" isSelf={member.isSelf} />
										))}
									</div>
								</td>
								<td>
									<p className="max-w-[7.5rem] truncate text-[12px] font-semibold">Sample lunch</p>
									<span className="app-bill-cat-muted">{t('bills.category.meal')}</span>
								</td>
								<td>
									<span className="app-tag app-tag-open">{t('table.unsettledShort')}</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</AppShell>
	);
};

export default HomepageIconTest;
