'use client';

import { FormEvent, useState } from 'react';
import SettingsShell from '@/src/components/settings/SettingsShell';
import ReceiptPanel from '@/src/components/settings/ReceiptPanel';
import Perforation from '@/src/components/settings/Perforation';

const faqItems = [
	{
		q: '账单是谁付的、谁欠的，怎么区分？',
		a: '每笔账单需要指定「付钱人」和「欠钱人」。付钱人是实际掏钱的旅伴，欠钱人是事后需要分摊偿还的人。可以一次选多人分摊。',
	},
	{
		q: '旅行分享后，旅伴能改我的账单吗？',
		a: '能。输入正确密码加入旅行后，所有参与者都可以新增、编辑账单，方便旅途中多人同时记账。',
	},
	{
		q: '结算页的数字是怎么算的？',
		a: '结算会汇总当前旅行里所有未结清账单，计算每个人净应付/应收，并给出最少转账次数的建议方案。',
	},
	{
		q: '删除旅行和「从列表移除」有什么区别？',
		a: '旅行创建者删除旅行后，所有数据对该旅行隐藏；通过分享加入的旅伴选择「从列表移除」，只是不再在自己的列表里看到，不影响其他人。',
	},
	{
		q: '定位信息会公开吗？',
		a: '定位仅用于在地图中标记账单发生地点，目前不会单独对外分享。你可以在账单编辑页重新获取或忽略定位。',
	},
];

export default function FeedbackPage() {
	const [openIndex, setOpenIndex] = useState<number | null>(0);
	const [feedback, setFeedback] = useState('');
	const [contact, setContact] = useState('');
	const [sent, setSent] = useState(false);

	return (
		<SettingsShell title="疑问与反馈" subtitle="" stamp="HELP" backHref="/user">
			<ReceiptPanel label="FAQ / 常见问题" serial="NO.001">
				<div className="space-y-3">
					{faqItems.map((item, index) => {
						const open = openIndex === index;
						return (
							<div key={item.q} className="settings-faq-item overflow-hidden">
								<button type="button" onClick={() => setOpenIndex(open ? null : index)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left">
									<div>
										<span className="settings-mono text-[10px] text-[#2a9d8f] dark:text-[#5fd3c4]">Q{String(index + 1).padStart(2, '0')}</span>
										<p className="mt-1 font-semibold leading-snug">{item.q}</p>
									</div>
									<span className="settings-mono shrink-0 text-[#e85d4c] dark:text-[#ff7a68]">{open ? '−' : '+'}</span>
								</button>
								{open ? (
									<div className="border-t border-dashed border-[#1a1814]/15 px-4 py-3 text-[13px] leading-relaxed text-[#6b6458] dark:border-[#f4efe4]/10 dark:text-[#a89f8f]">
										{item.a}
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</ReceiptPanel>

			<Perforation />

			<ReceiptPanel label="FEEDBACK / 意见反馈" serial="NO.002">
				<p className="text-[13px] leading-relaxed text-[#6b6458] dark:text-[#a89f8f]">遇到任何问题，请發送至 elpwc@hotmail.com</p>
			</ReceiptPanel>
		</SettingsShell>
	);
}
