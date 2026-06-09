'use client';

import Link from 'next/link';
import SettingsShell from '@/src/components/settings/SettingsShell';
import ReceiptPanel from '@/src/components/settings/ReceiptPanel';
import Perforation from '@/src/components/settings/Perforation';

const milestones = [
	{ step: '01', title: '新建旅行', desc: '添加一次出行，拉上所有旅伴' },
	{ step: '02', title: '记录每个账单', desc: '谁付的、谁欠的、多少钱路上随时记' },
	{ step: '03', title: '地图展示', desc: '账单落点自动钉在地图上，回忆路线' },
	{ step: '04', title: '一键算钱', desc: '旅行结束进结算，最少转账方案自动生成' },
];

export default function AboutPage() {
	return (
		<SettingsShell title="关于" subtitle="" stamp="ABOUT" backHref="/user">
			<ReceiptPanel label="TRIP FARE CALC" serial="v0.1.0">
				<div className="space-y-4">
					<p className="settings-display text-2xl leading-tight"></p>
					<p className="text-[14px] leading-relaxed text-[#6b6458] dark:text-[#a89f8f]">
						Vibe Coding by UNI<br/>
						个人用的旅行结算App
					</p>
				</div>
			</ReceiptPanel>

			<Perforation />

			<ReceiptPanel label="HOW IT WORKS" serial="GUIDE">
				<div className="space-y-0">
					{milestones.map((item, index) => (
						<div key={item.step} className={`flex gap-4 py-4 ${index !== milestones.length - 1 ? 'border-b border-dashed border-[#1a1814]/15 dark:border-[#f4efe4]/10' : ''}`}>
							<div className="settings-mono flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#1a1814] bg-[#2a9d8f] text-[11px] font-bold text-[#fffdf8] dark:border-[#f4efe4] dark:bg-[#5fd3c4] dark:text-[#1a1814]">
								{item.step}
							</div>
							<div>
								<p className="font-semibold">{item.title}</p>
								<p className="mt-1 text-[13px] leading-relaxed text-[#6b6458] dark:text-[#a89f8f]">{item.desc}</p>
							</div>
						</div>
					))}
				</div>
			</ReceiptPanel>
		</SettingsShell>
	);
}
