'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Modal } from '@/src/components/Modal';
import AppShell from '@/src/components/layout/AppShell';
import FriendSelector from '@/src/components/FriendSelector';
import BillMap from '@/src/components/BillMap';
import HomeBillList from '@/src/components/HomeBillList';
import FriendIcon from '@/src/components/FriendIcon';
import AddFriendModal from '@/src/components/AddFriendModal';
import TripBillToastStack, { useTripBillToasts } from '@/src/components/TripBillToastStack';
import { getAuthHeaders } from '@/src/utils/auth';
import { useAuth } from '@/src/utils/auth-provider';
import { formatAmount } from '@/src/utils/currencies';
import { useTripRealtime } from '@/src/utils/use-trip-realtime';
import type { TripBillEvent } from '@/src/types/trip-realtime';
import { apiPath, withBasePath } from '@/src/config/paths';
import { Friend, TripMember, Trip, Bill } from '@/src/types';
import { usePreferences } from '@/src/utils/preferences-provider';
import { useRequireAuth } from '@/src/utils/use-require-auth';
import { ONBOARDING_TRIP_CREATED_EVENT } from '@/src/utils/onboarding/storage';
import type { Locale } from '@/src/utils/preferences/constants';

const DATE_LOCALE_MAP: Record<Locale, string> = {
	'zh-CN': 'zh-CN',
	en: 'en-US',
	ja: 'ja-JP',
};

export default function HomePage() {
	const router = useRouter();
	const { t, locale } = usePreferences();
	const { user } = useAuth();
	const { guardAuth, AuthRequiredModal } = useRequireAuth();
	const { toasts, pushToast, dismissToast } = useTripBillToasts();
	const dateLocale = DATE_LOCALE_MAP[locale];
	const [trips, setTrips] = useState<Trip[]>([]);
	const [friends, setFriends] = useState<Friend[]>([]);
	const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
	const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false);
	const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
	const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
	const [isMemberDetailModalOpen, setIsMemberDetailModalOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<TripMember | null>(null);
	const [newTripName, setNewTripName] = useState('');
	const [newTripStartDate, setNewTripStartDate] = useState(new Date().toISOString().split('T')[0]);
	const [newTripDescription, setNewTripDescription] = useState('');
	const [selectedFriendsForTrip, setSelectedFriendsForTrip] = useState<string[]>([]);
	const [isMapModalOpen, setIsMapModalOpen] = useState(false);
	const [mapTileLayer, setMapTileLayer] = useState<'osm' | 'satellite'>('osm');
	const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
	const [editTripName, setEditTripName] = useState('');
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [sharePassword, setSharePassword] = useState('');
	const [shareUrl, setShareUrl] = useState('');
	const [shareMessage, setShareMessage] = useState('');
	const [isSharing, setIsSharing] = useState(false);
	const [isDeleteTripModalOpen, setIsDeleteTripModalOpen] = useState(false);
	const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

	const searchParams = useSearchParams();

	const fetchTrips = useCallback(async () => {
		try {
			const response = await fetch(apiPath('/api/trips'), {
				headers: getAuthHeaders(),
			});
			if (response.ok) {
				const data = await response.json();
				setTrips(data);
			}
		} catch (error) {
			console.error('Failed to fetch trips:', error);
		}
	}, []);

	const fetchFriends = async () => {
		try {
			const response = await fetch(apiPath('/api/friends'), {
				headers: getAuthHeaders(),
			});
			if (response.ok) {
				const data = await response.json();
				setFriends(data);
			}
		} catch (error) {
			console.error('Failed to fetch friends:', error);
		}
	};

	useEffect(() => {
		fetchTrips();
		fetchFriends();
	}, [fetchTrips]);

	useEffect(() => {
		if (trips.length === 0) return;

		const queryTripId = searchParams.get('tripId');
		if (queryTripId && trips.some((trip) => trip.id === queryTripId)) {
			setSelectedTripId(queryTripId);
			return;
		}

		if (!selectedTripId) {
			setSelectedTripId(trips[0].id);
		}
	}, [trips, selectedTripId, searchParams]);

	const currentTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId) || null, [trips, selectedTripId]);

	const currentBills = useMemo(() => currentTrip?.bills || [], [currentTrip]);

	const mapBills = useMemo(() => {
		const members = currentTrip?.members || [];
		return currentBills.map((bill) => {
			const payer = members.find((member) => member.id === bill.payerId);
			return {
				id: bill.id,
				name: bill.name,
				amount: bill.amount,
				latitude: bill.latitude,
				longitude: bill.longitude,
				payerName: payer?.name,
				payerIsSelf: payer?.isSelf,
			};
		});
	}, [currentBills, currentTrip?.members]);

	const handleRemoteBillEvent = useCallback(
		(event: TripBillEvent) => {
			const detail = formatAmount(event.amount, event.currency);
			if (event.type === 'bill:created') {
				pushToast(t('realtime.billCreated', { name: event.actorName, bill: event.billName }), detail);
				return;
			}
			pushToast(t('realtime.billUpdated', { name: event.actorName, bill: event.billName }), detail);
		},
		[pushToast, t],
	);

	useTripRealtime({
		tripId: selectedTripId,
		userId: user?.id,
		enabled: !!user && !!selectedTripId,
		onRemoteEvent: handleRemoteBillEvent,
		onRefresh: fetchTrips,
	});

	const handleCreateTrip = async () => {
		if (!newTripName.trim()) return;

		try {
			const response = await fetch(apiPath('/api/trips'), {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: newTripName.trim(),
					startDate: newTripStartDate || null,
					description: newTripDescription,
				}),
			});

			if (response.ok) {
				const newTrip = await response.json();
				setTrips([newTrip, ...trips]);
				setSelectedTripId(newTrip.id);
				setNewTripName('');
				setNewTripStartDate('');
				setNewTripDescription('');
				setIsNewTripModalOpen(false);

				// Add selected friends to the trip
				for (const friendId of selectedFriendsForTrip) {
					await fetch(apiPath(`/api/trips/${newTrip.id}/members`), {
						method: 'POST',
						headers: {
							...getAuthHeaders(),
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ friendId }),
					});
				}
				setSelectedFriendsForTrip([]);
				await fetchTrips(); // Refresh to get updated members
				window.dispatchEvent(new Event(ONBOARDING_TRIP_CREATED_EVENT));
			}
		} catch (error) {
			console.error('Failed to create trip:', error);
		}
	};

	const handleAddMembers = async () => {
		if (!currentTrip || selectedFriendsForTrip.length === 0) return;

		try {
			for (const friendId of selectedFriendsForTrip) {
				await fetch(apiPath(`/api/trips/${currentTrip.id}/members`), {
					method: 'POST',
					headers: {
						...getAuthHeaders(),
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ friendId }),
				});
			}
			setSelectedFriendsForTrip([]);
			setIsAddMemberModalOpen(false);
			await fetchTrips();
		} catch (error) {
			console.error('Failed to add members:', error);
		}
	};

	const handleRemoveMember = async () => {
		if (!currentTrip || !selectedMember) return;

		try {
			await fetch(apiPath(`/api/trips/${currentTrip.id}/members`), {
				method: 'DELETE',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ friendId: selectedMember.id }),
			});
			setIsMemberDetailModalOpen(false);
			setSelectedMember(null);
			await fetchTrips();
		} catch (error) {
			console.error('Failed to remove member:', error);
		}
	};

	const handleBillClick = (bill: Bill) => {
		guardAuth(() => router.push(`/bills/${bill.id}/edit?tripId=${selectedTripId}`));
	};

	const handleEditTrip = async () => {
		if (!currentTrip || !editTripName.trim()) return;

		try {
			const response = await fetch(apiPath(`/api/trips/${currentTrip.id}`), {
				method: 'PATCH',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: editTripName.trim() }),
			});
			if (response.ok) {
				setIsEditTripModalOpen(false);
				setEditTripName('');
				await fetchTrips();
			}
		} catch (error) {
			console.error('Failed to update trip:', error);
		}
	};

	const fetchShareInfo = async (tripId: string) => {
		try {
			const response = await fetch(apiPath(`/api/trips/${tripId}/share`), {
				headers: getAuthHeaders(),
			});
			if (!response.ok) {
				setShareUrl('');
				return;
			}

			const data = await response.json();
			if (data.shareToken) {
				setShareUrl(`${window.location.origin}${withBasePath(`/share?token=${data.shareToken}`)}`);
			} else {
				setShareUrl('');
			}
		} catch (error) {
			console.error('Failed to fetch share info:', error);
		}
	};

	const openShareModal = () => {
		if (!currentTrip?.isOwner) return;
		guardAuth(() => {
			setSharePassword('');
			setShareMessage('');
			fetchShareInfo(currentTrip.id);
			setIsShareModalOpen(true);
		});
	};

	const handleCreateShare = async () => {
		if (!currentTrip) return;
		if (!sharePassword.trim()) {
			setShareMessage(t('home.share.enterPassword'));
			return;
		}

		setIsSharing(true);
		setShareMessage('');

		try {
			const response = await fetch(apiPath(`/api/trips/${currentTrip.id}/share`), {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ password: sharePassword.trim() }),
			});

			const data = await response.json();
			if (response.ok) {
				setShareUrl(`${window.location.origin}${withBasePath(`/share?token=${data.shareToken}`)}`);
				setShareMessage(t('home.share.generated'));
			} else {
				setShareMessage(data.error || t('home.share.generateFailed'));
			}
		} catch (error) {
			console.error('Failed to create share link:', error);
			setShareMessage(t('home.share.generateFailed'));
		} finally {
			setIsSharing(false);
		}
	};

	const handleCopyShareLink = async () => {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setShareMessage(t('home.share.copied'));
		} catch (error) {
			console.error('Copy failed:', error);
			setShareMessage(t('home.share.copyFailed'));
		}
	};

	const handleDeleteTrip = async () => {
		if (!currentTrip) return;

		try {
			const response = await fetch(apiPath(`/api/trips/${currentTrip.id}`), {
				method: 'DELETE',
				headers: getAuthHeaders(),
			});

			if (response.ok) {
				setIsDeleteTripModalOpen(false);
				const remainingTrips = trips.filter((trip) => trip.id !== currentTrip.id);
				setTrips(remainingTrips);
				setSelectedTripId(remainingTrips[0]?.id || null);
			}
		} catch (error) {
			console.error('Failed to delete trip:', error);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString(dateLocale);
	};

	if (trips.length === 0) {
		return (
			<AppShell>
				<div className="app-empty mt-8">
					<p className="settings-display text-xl">{t('home.noTripsTitle')}</p>
					<p className="mt-2 text-[12px]">{t('home.noTripsHint')}</p>
					<button type="button" onClick={() => guardAuth(() => setIsNewTripModalOpen(true))} className="settings-btn-primary mt-4" data-onboarding-target="new-trip">
						+ {t('home.newTrip')}
					</button>
				</div>

				{/* New Trip Modal */}
				<Modal isOpen={isNewTripModalOpen} onClose={() => setIsNewTripModalOpen(false)} title={t('home.modal.newTrip')} onOk={handleCreateTrip} okText={t('common.create')} showOkButton showCancelButton cancelText={t('common.cancel')}>
					<div className="modal-stack">
						<div className="modal-field">
							<label className="app-label">{t('home.modal.tripName')}</label>
							<input type="text" value={newTripName} onChange={(e) => setNewTripName(e.target.value)} placeholder={t('home.modal.tripNamePlaceholder')} className="settings-input py-2 text-sm" />
						</div>
						<div className="modal-field">
							<label className="app-label">{t('home.modal.startDate')}</label>
							<input type="date" value={newTripStartDate} onChange={(e) => setNewTripStartDate(e.target.value)} className="settings-input py-2 text-sm" />
						</div>
						<div className="modal-field">
							<label className="app-label">{t('home.modal.note')}</label>
							<textarea
								value={newTripDescription}
								onChange={(e) => setNewTripDescription(e.target.value)}
								placeholder={t('home.modal.notePlaceholder')}
								rows={3}
								className="settings-input resize-none py-2 text-sm"
							/>
						</div>
						<div className="modal-field">
							<label className="app-label">{t('home.modal.selectMembers')}</label>
							<FriendSelector
								friends={friends}
								selectedFriends={selectedFriendsForTrip}
								onToggleFriend={(friendId) => {
									setSelectedFriendsForTrip((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
								}}
							/>
						</div>
					</div>
				</Modal>
				{AuthRequiredModal}
				<TripBillToastStack toasts={toasts} onDismiss={dismissToast} />
			</AppShell>
		);
	}

	return (
		<AppShell tight>
			<TripBillToastStack toasts={toasts} onDismiss={dismissToast} />
			<header className="flex items-stretch gap-1.5">
				<div className="relative min-w-0 flex-1">
					<button type="button" onClick={() => setIsTripDropdownOpen(!isTripDropdownOpen)} className="app-trip-select">
						<div className="flex items-center justify-between gap-2">
							<div className="min-w-0 flex-1">
								<p className="app-label">{t('home.currentTrip')}</p>
								<p className="truncate text-sm font-semibold leading-tight">{currentTrip?.name}</p>
								{currentTrip ? <p className="settings-mono text-[10px] text-app-muted">{formatDate(currentTrip.createdAt)}</p> : null}
							</div>
							<span className="settings-mono text-xs">{isTripDropdownOpen ? '▲' : '▼'}</span>
						</div>
					</button>

					{isTripDropdownOpen ? (
						<div className="app-dropdown absolute top-full left-0 right-0 z-20 mt-0.5 max-h-48 overflow-y-auto">
							{trips.map((trip) => (
								<button
									key={trip.id}
									type="button"
									onClick={() => {
										setSelectedTripId(trip.id);
										setIsTripDropdownOpen(false);
									}}
									className="app-dropdown-item"
								>
									<p className="truncate text-xs font-semibold">{trip.name}</p>
									<p className="settings-mono text-[10px] text-app-muted">{formatDate(trip.createdAt)}</p>
								</button>
							))}
						</div>
					) : null}
				</div>

				<button type="button" onClick={() => guardAuth(() => setIsNewTripModalOpen(true))} className="app-header-add shrink-0" aria-label={t('home.newTrip')} data-onboarding-target="new-trip">
					+
				</button>
			</header>

			<div className="mt-1.5 flex flex-wrap items-center gap-1">
				{currentTrip && !currentTrip.isOwner ? <span className="app-tag app-tag-share">{t('home.shareFrom', { name: currentTrip.ownerName ?? '' })}</span> : null}
				<button
					type="button"
					onClick={() =>
						guardAuth(() => {
							setEditTripName(currentTrip?.name || '');
							setIsEditTripModalOpen(true);
						})
					}
					className="app-toolbar-chip"
				>
					{t('home.rename')}
				</button>
				<button type="button" onClick={() => guardAuth(() => setIsDeleteTripModalOpen(true))} className="app-toolbar-chip">
					{currentTrip?.isOwner === false ? t('common.remove') : t('common.delete')}
				</button>
				<span className="app-label ml-auto">{currentBills.length} {t('common.billsUnit')}</span>
			</div>

			<section className="mt-1.5">
				<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
					{(currentTrip?.members || []).map((member) => (
						<button
							key={member.id}
							type="button"
							onClick={() => {
								setSelectedMember(member);
								setIsMemberDetailModalOpen(true);
							}}
							className="flex min-w-11 flex-col items-center gap-0.5"
						>
							<FriendIcon name={member.name} size="md" isSelf={member.isSelf} />
							<p className="max-w-11 truncate text-[10px]">{member.name}</p>
						</button>
					))}
					<button
						type="button"
						onClick={() =>
							guardAuth(() => {
								setSelectedFriendsForTrip([]);
								setIsAddMemberModalOpen(true);
							})
						}
						className="app-toolbar-chip h-6 min-w-6 px-1"
						aria-label={t('home.addMember')}
					>
						+
					</button>
				</div>
			</section>

			<section className="mt-1.5">
				<div className="app-panel overflow-hidden">
					<div className="h-20 cursor-pointer" onClick={() => setIsMapModalOpen(true)}>
						<BillMap bills={currentBills} interactive={false} tileLayer="osm" />
					</div>
				</div>
			</section>

			<section className="mt-1.5">
				<div className="app-panel overflow-hidden">
					<div className="app-panel-head">
						<span className="app-label">{t('home.billList')}</span>
						<span className="settings-mono text-[10px] text-app-muted">{t('home.tapToEdit')}</span>
					</div>
					<HomeBillList bills={currentBills} members={currentTrip?.members || []} onBillClick={handleBillClick} dateLocale={dateLocale} />
				</div>
			</section>

			<div className="app-fab-bar">
				<button type="button" onClick={() => guardAuth(() => router.push(`/settle?tripId=${selectedTripId}`))} className="app-fab app-fab-settle" data-onboarding-target="settle">
					{t('home.settle')}
				</button>
				{currentTrip?.isOwner ? (
					<button type="button" onClick={openShareModal} className="app-fab app-fab-icon app-fab-share" aria-label={t('home.shareTrip')}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
							<path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5" />
						</svg>
					</button>
				) : null}
				<button type="button" onClick={() => guardAuth(() => router.push(`/bills/new?tripId=${selectedTripId}`))} className="app-fab app-fab-icon app-fab-add" aria-label={t('home.newBill')} data-onboarding-target="new-bill">
					+
				</button>
			</div>

			{/* New Trip Modal */}
			<Modal isOpen={isNewTripModalOpen} onClose={() => setIsNewTripModalOpen(false)} title={t('home.modal.newTrip')} onOk={handleCreateTrip} okText={t('common.create')} showOkButton showCancelButton cancelText={t('common.cancel')}>
				<div className="modal-stack">
					<div className="modal-field">
						<label className="app-label">{t('home.modal.tripName')}</label>
						<input type="text" value={newTripName} onChange={(e) => setNewTripName(e.target.value)} placeholder={t('home.modal.tripNamePlaceholder')} className="settings-input py-2 text-sm" />
					</div>
					<div className="modal-field">
						<label className="app-label">{t('home.modal.startDate')}</label>
						<input type="date" value={newTripStartDate} onChange={(e) => setNewTripStartDate(e.target.value)} className="settings-input py-2 text-sm" />
					</div>
					<div className="modal-field">
						<label className="app-label">{t('home.modal.note')}</label>
						<textarea
							value={newTripDescription}
							onChange={(e) => setNewTripDescription(e.target.value)}
							placeholder={t('home.modal.notePlaceholder')}
							rows={3}
							className="settings-input resize-none py-2 text-sm"
						/>
					</div>
					<div className="modal-field">
						<label className="app-label">{t('home.modal.selectMembers')}</label>
						<FriendSelector
							friends={friends}
							selectedFriends={selectedFriendsForTrip}
							onToggleFriend={(friendId) => {
								setSelectedFriendsForTrip((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
							}}
						/>
					</div>
				</div>
			</Modal>

			{/* Add Member Modal */}
			<Modal
				isOpen={isAddMemberModalOpen}
				onClose={() => setIsAddMemberModalOpen(false)}
				title={t('home.modal.addMembers')}
				onOk={handleAddMembers}
				okText={t('home.modal.addSelectedMembers')}
				showOkButton
				showCancelButton
				cancelText={t('common.cancel')}
			>
				<div className="modal-stack">
					<p className="modal-hint">{t('home.modal.addMembersHint')}</p>
					<button type="button" onClick={() => setIsAddFriendModalOpen(true)} className="settings-btn-ghost w-full py-2.5 text-sm">
						{t('home.modal.addNewCompanion')}
					</button>
					<FriendSelector
						friends={friends.filter((f) => !(currentTrip?.members || []).some((m) => m.id === f.id))}
						selectedFriends={selectedFriendsForTrip}
						onToggleFriend={(friendId) => {
							setSelectedFriendsForTrip((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
						}}
					/>
				</div>
			</Modal>

			<AddFriendModal
				isOpen={isAddFriendModalOpen}
				onClose={() => setIsAddFriendModalOpen(false)}
				onAdded={(newFriend) => {
					setFriends((prev) => [...prev, newFriend]);
					setSelectedFriendsForTrip((prev) => (prev.includes(newFriend.id) ? prev : [...prev, newFriend.id]));
				}}
			/>

			{/* Map Details Modal */}
			<Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} title={t('home.modal.mapTitle')} showOkButton={false} showCancelButton cancelText={t('common.close')} className="max-w-5xl">
				<div className="modal-stack">
					<div className="flex flex-wrap items-center gap-1.5">
						<button type="button" onClick={() => setMapTileLayer('osm')} className={`app-toolbar-chip ${mapTileLayer === 'osm' ? 'app-toolbar-chip-active' : ''}`}>
							{t('home.modal.mapOsm')}
						</button>
						<button type="button" onClick={() => setMapTileLayer('satellite')} className={`app-toolbar-chip ${mapTileLayer === 'satellite' ? 'app-toolbar-chip-active' : ''}`}>
							{t('home.modal.mapSatellite')}
						</button>
					</div>
					<div className="app-panel h-140 overflow-hidden">
						<BillMap bills={mapBills} interactive={true} tileLayer={mapTileLayer} showBillMarkers />
					</div>
				</div>
			</Modal>

			{/* Member Detail Modal */}
			<Modal isOpen={isMemberDetailModalOpen} onClose={() => setIsMemberDetailModalOpen(false)} title={t('home.modal.memberDetail')} showCloseButton={false} className="max-w-md">
				{selectedMember && (
					<div className="modal-stack">
						<div className="modal-member-row">
							<FriendIcon name={selectedMember.name} size="lg" isSelf={selectedMember.isSelf} />
							<div className="modal-member-meta">
								<h3 className="modal-member-name">{selectedMember.name}</h3>
								<p className="modal-hint">{selectedMember.description || t('common.noDescription')}</p>
							</div>
						</div>

						<div className="modal-panel">
							<p className="modal-panel-title">{t('home.modal.tripsJoined')}</p>
							<p className="modal-hint">{t('home.modal.tripsJoinedCount', { count: selectedMember.participationCount })}</p>
						</div>

						<div className="modal-actions">
							<button type="button" onClick={handleRemoveMember} className="app-btn-compact app-btn-compact-danger">
								{t('home.modal.removeMember')}
							</button>
							<button type="button" onClick={() => setIsMemberDetailModalOpen(false)} className="app-btn-compact">
								{t('common.close')}
							</button>
						</div>
					</div>
				)}
			</Modal>

			{/* Edit Trip Modal */}
			<Modal isOpen={isEditTripModalOpen} onClose={() => setIsEditTripModalOpen(false)} title={t('home.modal.editTripName')} onOk={handleEditTrip} okText={t('common.save')} showOkButton showCancelButton cancelText={t('common.cancel')}>
				<div className="modal-field">
					<label className="app-label">{t('home.modal.tripName')}</label>
					<input type="text" value={editTripName} onChange={(e) => setEditTripName(e.target.value)} placeholder={t('home.modal.editTripNamePlaceholder')} className="settings-input py-2 text-sm" />
				</div>
			</Modal>

			<Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title={t('home.modal.shareTitle')} showOkButton={false} showCancelButton cancelText={t('common.close')}>
				<div className="modal-stack">
					<p className="modal-hint">{t('home.modal.shareHint')}</p>
					<div className="modal-field">
						<label className="app-label">{t('home.modal.sharePassword')}</label>
						<input type="text" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} placeholder={t('home.modal.sharePasswordPlaceholder')} className="settings-input py-2 text-sm" />
					</div>
					<button type="button" onClick={handleCreateShare} disabled={isSharing} className="settings-btn-primary w-full py-2.5 text-sm disabled:opacity-60">
						{isSharing ? t('home.modal.generating') : shareUrl ? t('home.modal.updateSharePassword') : t('home.modal.generateShareLink')}
					</button>
					{shareUrl ? (
						<div className="modal-field">
							<label className="app-label">{t('home.modal.shareLink')}</label>
							<div className="flex gap-2">
								<input type="text" readOnly value={shareUrl} className="settings-input min-w-0 flex-1 py-2 text-xs" />
								<button type="button" onClick={handleCopyShareLink} className="app-btn-compact app-btn-compact-primary shrink-0 px-3 py-2">
									{t('common.copy')}
								</button>
							</div>
						</div>
					) : null}
					{shareMessage ? <p className="modal-message modal-message-info">{shareMessage}</p> : null}
				</div>
			</Modal>

			<Modal
				isOpen={isDeleteTripModalOpen}
				onClose={() => setIsDeleteTripModalOpen(false)}
				title={currentTrip?.isOwner === false ? t('home.modal.removeTripTitle') : t('home.modal.deleteTripTitle')}
				onOk={handleDeleteTrip}
				okText={currentTrip?.isOwner === false ? t('home.modal.confirmRemove') : t('home.modal.confirmDelete')}
				showOkButton
				showCancelButton
				cancelText={t('common.cancel')}
			>
				<p className="modal-hint">{currentTrip?.isOwner === false ? t('home.modal.removeTripHint') : t('home.modal.deleteTripHint')}</p>
			</Modal>
			{AuthRequiredModal}
		</AppShell>
	);
}
