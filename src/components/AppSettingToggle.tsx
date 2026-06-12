'use client';

import clsx from 'clsx';

type SettingSwitchProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	'aria-label'?: string;
};

export function SettingSwitch({ checked, onChange, disabled = false, 'aria-label': ariaLabel }: SettingSwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={ariaLabel}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={clsx(
				'relative inline-flex h-[1.375rem] w-[2.5rem] shrink-0 border-2 border-[#1a1814] shadow-[2px_2px_0_rgba(26,24,20,0.1)] transition-colors dark:border-[#f4efe4] dark:shadow-[2px_2px_0_rgba(244,239,228,0.06)]',
				checked ? 'bg-[#2a9d8f] dark:bg-[#5fd3c4]' : 'bg-[#fffdf8] dark:bg-[#1c1a18]',
				disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
			)}
		>
			<span
				aria-hidden
				className={clsx(
					'pointer-events-none absolute top-[1px] left-[1px] h-4 w-4 border-2 border-[#1a1814] bg-[#fffdf8] transition-transform dark:border-[#f4efe4] dark:bg-[#1c1a18]',
					checked && 'translate-x-[1.125rem]',
				)}
			/>
		</button>
	);
}

type LocationSettingFieldProps = {
	label: string;
	description: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	privacyHint?: string;
};

export default function LocationSettingField({ label, description, checked, onChange, disabled = false, privacyHint }: LocationSettingFieldProps) {
	return (
		<>
			<div className="flex items-center justify-between gap-3">
				<label className="app-label">{label}</label>
				<SettingSwitch checked={checked} onChange={onChange} disabled={disabled} aria-label={label} />
			</div>
			<p className="modal-hint">{description}</p>
			{privacyHint ? <p className="app-privacy-tip">{privacyHint}</p> : null}
		</>
	);
}
