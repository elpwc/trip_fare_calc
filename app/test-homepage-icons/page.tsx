'use client';

import React from 'react';
import AppShell from '@/src/components/layout/AppShell';
import { getBackgroundColor, getDisplayText } from '@/src/components/FriendIcon';
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
							<div
								className={`relative h-12 w-12 ${getBackgroundColor(member.name)} flex items-center justify-center rounded-full font-bold text-white`}
							>
								{getDisplayText(member.name)}
								{member.isSelf && (
									<div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-md">
										{t('common.self')}
									</div>
								)}
							</div>
							<p className="max-w-18 truncate text-xs text-app-muted">{member.name}</p>
						</div>
					))}
				</div>
			</section>

			<section className="mb-8">
				<h2 className="mb-4 text-lg font-semibold">{t('test.homepage.bills')}</h2>
				<div className="rounded-lg border-2 border-[#1a1814] bg-[#fffdf8] p-4 dark:border-[#f4efe4] dark:bg-[#1c1a18]">
					<table className="min-w-full text-xs">
						<thead className="border-b border-[#1a1814]/20 bg-[#1a1814]/4 text-left text-[10px] uppercase tracking-[0.24em] text-app-muted dark:border-[#f4efe4]/20 dark:bg-[#121110]">
							<tr>
								<th className="px-3 py-3">{t('test.homepage.payer')}</th>
								<th className="px-3 py-3">{t('test.homepage.amount')}</th>
								<th className="px-3 py-3">{t('test.homepage.debtors')}</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-b border-[#1a1814]/14 dark:border-[#f4efe4]/12">
								<td className="px-3 py-1">
									<div
										className={`h-8 w-8 ${getBackgroundColor(testMembers[0].name)} flex items-center justify-center rounded-full text-xs font-bold text-white`}
									>
										{getDisplayText(testMembers[0].name)}
									</div>
								</td>
								<td className="px-3 py-1 font-semibold">¥100</td>
								<td className="px-3 py-1">
									<div className="flex flex-wrap items-center gap-1">
										{testMembers.slice(1, 4).map((member: TripMember) => (
											<div
												key={member.id}
												className={`relative h-6 w-6 ${getBackgroundColor(member.name)} flex items-center justify-center rounded-full text-xs font-bold text-white`}
											>
												{getDisplayText(member.name)}
												{member.isSelf && (
													<div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white">
														{t('common.self')}
													</div>
												)}
											</div>
										))}
									</div>
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
