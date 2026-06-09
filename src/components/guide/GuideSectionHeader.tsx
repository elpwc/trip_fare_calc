'use client';

type GuideSectionHeaderProps = {
	serial: string;
	title: string;
	subtitle?: string;
};

export default function GuideSectionHeader({ serial, title, subtitle }: GuideSectionHeaderProps) {
	return (
		<div className="border-b border-dashed border-[#1a1814]/20 px-4 py-4 dark:border-[#f4efe4]/15">
			<div className="flex items-center justify-between gap-3">
				<span className="settings-mono rounded-sm bg-[#1a1814] px-2 py-0.5 text-[10px] font-bold tracking-[0.24em] text-[#f4efe4] dark:bg-[#f4efe4] dark:text-[#1a1814]">
					§{serial}
				</span>
			</div>
			<h2 className="settings-display mt-3 text-[1.35rem] leading-tight tracking-tight">{title}</h2>
			{subtitle ? <p className="mt-1.5 text-[13px] leading-snug text-[#6b6458] dark:text-[#a89f8f]">{subtitle}</p> : null}
		</div>
	);
}
