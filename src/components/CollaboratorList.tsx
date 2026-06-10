'use client';

import { TripCollaborator, TripShareHistoryUser } from '@/src/types';
import { usePreferences } from '@/src/utils/preferences-provider';

type CollaboratorListProps = {
	collaborators: TripCollaborator[];
	shareHistory: TripShareHistoryUser[];
	isOwner: boolean;
	isBusy: boolean;
	onRevoke: (userId: string) => void;
	onInvite: (userId: string) => void;
	onRemoveHistory: (userId: string) => void;
	showHistory?: boolean;
	alwaysShowHistory?: boolean;
};

export default function CollaboratorList({
	collaborators,
	shareHistory,
	isOwner,
	isBusy,
	onRevoke,
	onInvite,
	onRemoveHistory,
	showHistory = true,
	alwaysShowHistory = false,
}: CollaboratorListProps) {
	const { t } = usePreferences();
	const showHistorySection = showHistory && isOwner && (alwaysShowHistory || shareHistory.length > 0);

	return (
		<div className="modal-stack">
			{collaborators.length > 0 ? (
				<div className="modal-panel">
					<p className="app-collaborator-section-title">{t('home.modal.collaboratorsTitle')}</p>
					<p className="modal-hint mb-2.5">{t('home.modal.collaboratorsHint')}</p>
					<div className="space-y-1">
						{collaborators.map((collaborator) => (
							<div key={collaborator.id} className="app-collaborator-row">
								<div className="min-w-0">
									<p className="app-collaborator-name truncate">{collaborator.name}</p>
									<p className="app-collaborator-meta">{t('home.modal.collaboratorActive')}</p>
								</div>
								{isOwner ? (
									<button type="button" disabled={isBusy} onClick={() => onRevoke(collaborator.id)} className="app-btn-compact app-btn-compact-danger shrink-0 px-2.5 py-1.5 text-[11px]">
										{t('home.modal.revokeAccess')}
									</button>
								) : null}
							</div>
						))}
					</div>
				</div>
			) : null}

			{showHistorySection ? (
				<div className="modal-panel">
					<p className="app-collaborator-section-title">{t('home.modal.shareHistoryTitle')}</p>
					<p className="modal-hint mb-2.5">{t('home.modal.shareHistoryHint')}</p>
					{shareHistory.length === 0 ? (
						<p className="text-[12px] leading-relaxed text-app-muted">{t('home.modal.shareHistoryEmpty')}</p>
					) : (
						<div className="space-y-1">
							{shareHistory.map((entry) => (
								<div key={entry.id} className="app-collaborator-row">
									{isOwner && !entry.isActive ? (
										<button type="button" disabled={isBusy} onClick={() => onInvite(entry.id)} className="app-collaborator-row-button min-w-0 flex-1 text-left">
											<p className="app-collaborator-name truncate">{entry.name}</p>
											<p className="app-collaborator-meta">{t('home.modal.collaboratorInactive')}</p>
										</button>
									) : (
										<div className="min-w-0 flex-1">
											<p className="app-collaborator-name truncate">{entry.name}</p>
											<p className="app-collaborator-meta">{entry.isActive ? t('home.modal.collaboratorActive') : t('home.modal.collaboratorInactive')}</p>
										</div>
									)}
									{isOwner ? (
										<div className="flex shrink-0 items-center gap-1">
											{!entry.isActive ? (
												<button type="button" disabled={isBusy} onClick={() => onInvite(entry.id)} className="app-btn-compact app-btn-compact-primary px-2.5 py-1.5 text-[11px]">
													{t('home.modal.inviteEdit')}
												</button>
											) : null}
											<button type="button" disabled={isBusy} onClick={() => onRemoveHistory(entry.id)} className="app-btn-compact px-2.5 py-1.5 text-[11px]" aria-label={t('home.modal.removeHistory')}>
												×
											</button>
										</div>
									) : null}
								</div>
							))}
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}
