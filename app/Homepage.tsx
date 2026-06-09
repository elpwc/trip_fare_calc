'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Modal } from '@/src/components/Modal';
import AppShell from '@/src/components/layout/AppShell';
import FriendSelector from '@/src/components/FriendSelector';
import BillMap from '@/src/components/BillMap';
import FriendIcon from '@/src/components/FriendIcon';
import { getAuthHeaders } from '@/src/utils/auth';
import { Friend, TripMember, Trip, Bill, BillOwed } from '@/src/types';
import { CURRENCY_DEFINITIONS } from '@/src/utils/currencies';

export default function HomePage() {
	const router = useRouter();
	const [trips, setTrips] = useState<Trip[]>([]);
	const [friends, setFriends] = useState<Friend[]>([]);
	const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
	const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false);
	const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
	const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
	const [isMemberDetailModalOpen, setIsMemberDetailModalOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<TripMember | null>(null);
	const [newTripName, setNewTripName] = useState('');
	const [newTripStartDate, setNewTripStartDate] = useState('');
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

	useEffect(() => {
		fetchTrips();
		fetchFriends();
	}, []);

	const searchParams = useSearchParams();

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

	const fetchTrips = async () => {
		try {
			const response = await fetch('/api/trips', {
				headers: getAuthHeaders(),
			});
			if (response.ok) {
				const data = await response.json();
				setTrips(data);
			}
		} catch (error) {
			console.error('Failed to fetch trips:', error);
		}
	};

	const fetchFriends = async () => {
		try {
			const response = await fetch('/api/friends', {
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

	const currentTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId) || null, [trips, selectedTripId]);

	const currentUserMemberId = useMemo(() => currentTrip?.members.find((member) => member.isSelf)?.id || null, [currentTrip]);

	const currentBills = useMemo(() => currentTrip?.bills || [], [currentTrip]);

	const handleCreateTrip = async () => {
		if (!newTripName.trim()) return;

		try {
			const response = await fetch('/api/trips', {
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
					await fetch(`/api/trips/${newTrip.id}/members`, {
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
			}
		} catch (error) {
			console.error('Failed to create trip:', error);
		}
	};

	const handleAddMembers = async () => {
		if (!currentTrip) return;

		try {
			for (const friendId of selectedFriendsForTrip) {
				await fetch(`/api/trips/${currentTrip.id}/members`, {
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
			await fetch(`/api/trips/${currentTrip.id}/members`, {
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
		router.push(`/bills/${bill.id}/edit?tripId=${selectedTripId}`);
	};

	const handleEditTrip = async () => {
		if (!currentTrip || !editTripName.trim()) return;

		try {
			const response = await fetch(`/api/trips/${currentTrip.id}`, {
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
			const response = await fetch(`/api/trips/${tripId}/share`, {
				headers: getAuthHeaders(),
			});
			if (!response.ok) {
				setShareUrl('');
				return;
			}

			const data = await response.json();
			if (data.shareToken) {
				setShareUrl(`${window.location.origin}/share?token=${data.shareToken}`);
			} else {
				setShareUrl('');
			}
		} catch (error) {
			console.error('Failed to fetch share info:', error);
		}
	};

	const openShareModal = () => {
		if (!currentTrip?.isOwner) return;
		setSharePassword('');
		setShareMessage('');
		fetchShareInfo(currentTrip.id);
		setIsShareModalOpen(true);
	};

	const handleCreateShare = async () => {
		if (!currentTrip) return;
		if (!sharePassword.trim()) {
			setShareMessage('请输入分享密码');
			return;
		}

		setIsSharing(true);
		setShareMessage('');

		try {
			const response = await fetch(`/api/trips/${currentTrip.id}/share`, {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ password: sharePassword.trim() }),
			});

			const data = await response.json();
			if (response.ok) {
				setShareUrl(`${window.location.origin}/share?token=${data.shareToken}`);
				setShareMessage('分享链接已生成，可发送给旅伴');
			} else {
				setShareMessage(data.error || '生成分享链接失败');
			}
		} catch (error) {
			console.error('Failed to create share link:', error);
			setShareMessage('生成分享链接失败');
		} finally {
			setIsSharing(false);
		}
	};

	const handleCopyShareLink = async () => {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setShareMessage('分享链接已复制');
		} catch (error) {
			console.error('Copy failed:', error);
			setShareMessage('复制失败，请手动复制链接');
		}
	};

	const handleDeleteTrip = async () => {
		if (!currentTrip) return;

		try {
			const response = await fetch(`/api/trips/${currentTrip.id}`, {
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
		return new Date(dateString).toLocaleDateString('zh-CN');
	};

	if (trips.length === 0) {
		return (
			<AppShell>
				<div className="app-empty mt-8">
					<p className="settings-display text-xl">还没有旅行</p>
					<p className="mt-2 text-[12px]">创建第一个旅行，开始记录账单</p>
					<button type="button" onClick={() => setIsNewTripModalOpen(true)} className="settings-btn-primary mt-4">
						+ 新建旅行
					</button>
				</div>

				{/* New Trip Modal */}
				<Modal isOpen={isNewTripModalOpen} onClose={() => setIsNewTripModalOpen(false)} title="新建旅行" onOk={handleCreateTrip} okText="创建" showOkButton showCancelButton cancelText="取消">
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-2">旅行名称</label>
							<input type="text" value={newTripName} onChange={(e) => setNewTripName(e.target.value)} placeholder="例如：上海美食周" className="w-full px-3 py-2 border rounded" />
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">开始时间</label>
							<input type="date" value={newTripStartDate} onChange={(e) => setNewTripStartDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">备注</label>
							<textarea
								value={newTripDescription}
								onChange={(e) => setNewTripDescription(e.target.value)}
								placeholder="可选的旅行备注"
								rows={3}
								className="w-full px-3 py-2 border rounded"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">选择参与者</label>
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
			</AppShell>
		);
	}

	return (
		<AppShell tight>
			<header className="flex items-stretch gap-1.5">
				<div className="relative min-w-0 flex-1">
					<button type="button" onClick={() => setIsTripDropdownOpen(!isTripDropdownOpen)} className="app-trip-select">
						<div className="flex items-center justify-between gap-2">
							<div className="min-w-0 flex-1">
								<p className="app-label">当前旅行</p>
								<p className="truncate text-sm font-semibold leading-tight">{currentTrip?.name}</p>
								{currentTrip ? <p className="settings-mono text-[10px] text-[#6b6458]">{formatDate(currentTrip.createdAt)}</p> : null}
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
									<p className="settings-mono text-[10px] text-[#6b6458]">{formatDate(trip.createdAt)}</p>
								</button>
							))}
						</div>
					) : null}
				</div>

				<button type="button" onClick={() => setIsNewTripModalOpen(true)} className="app-header-add shrink-0" aria-label="新建旅行">
					+
				</button>
			</header>

			<div className="mt-1.5 flex flex-wrap items-center gap-1">
				{currentTrip && !currentTrip.isOwner ? <span className="app-tag app-tag-share">分享·{currentTrip.ownerName}</span> : null}
				<button type="button" onClick={() => { setEditTripName(currentTrip?.name || ''); setIsEditTripModalOpen(true); }} className="app-toolbar-chip">
					改名
				</button>
				<button type="button" onClick={() => setIsDeleteTripModalOpen(true)} className="app-toolbar-chip">
					{currentTrip?.isOwner === false ? '移除' : '删除'}
				</button>
				<span className="app-label ml-auto">{currentBills.length} 笔</span>
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
							<FriendIcon name={member.name} size="sm" isSelf={member.isSelf} />
							<p className="max-w-11 truncate text-[10px]">{member.name}</p>
						</button>
					))}
					<button type="button" onClick={() => setIsAddMemberModalOpen(true)} className="app-toolbar-chip h-6 min-w-6 px-1" aria-label="添加成员">
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
						<span className="app-label">账单列表</span>
						<span className="settings-mono text-[10px] text-[#6b6458]">点击编辑</span>
					</div>
					<div className="overflow-x-auto">
						<table className="app-data-table">
							<thead>
								<tr>
									<th>付</th>
									<th>金额/分摊</th>
									<th>项目</th>
									<th>时间</th>
									<th>态</th>
								</tr>
							</thead>
							<tbody>
								{currentBills.map((bill) => (
									<tr key={bill.id} onClick={() => handleBillClick(bill)}>
										<td>
											<FriendIcon
												name={(currentTrip?.members || []).find((m) => m.id === bill.payerId)?.name || '?'}
												size="sm"
												isSelf={(currentTrip?.members || []).find((m) => m.id === bill.payerId)?.isSelf}
											/>
										</td>
										<td>
											<p className="app-amount">
												{bill.amount}
												{CURRENCY_DEFINITIONS[bill.currency || 'CNY']?.suffix || '¥'}
											</p>
											<div className="mt-0.5 flex flex-wrap items-center gap-0.5">
												{bill.owedFriends.slice(0, 5).map((owed: BillOwed) => {
													const member = (currentTrip?.members || []).find((m) => m.id === owed.friendId);
													return <FriendIcon key={owed.id} name={member?.name || '?'} size="sm" isSelf={member?.isSelf} />;
												})}
												{bill.owedFriends.length > 5 ? <span className="settings-mono text-[9px]">+{bill.owedFriends.length - 5}</span> : null}
											</div>
										</td>
										<td>
											<span className="app-tag">{bill.category}</span>
											<p className="mt-0.5 max-w-28 truncate text-[11px] leading-tight">{bill.name}</p>
										</td>
										<td>
											{bill.createdById && bill.createdById !== currentUserMemberId ? (
												<p className="text-[10px] leading-tight text-[#6b6458]">{(currentTrip?.members || []).find((m) => m.id === bill.createdById)?.name}</p>
											) : null}
											<p className="settings-mono text-[10px] leading-tight text-[#6b6458]">
												{new Date(bill.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
											</p>
										</td>
										<td>
											<span className={`app-tag ${bill.status === 'SETTLED' ? 'app-tag-settled' : 'app-tag-open'}`}>{bill.status === 'SETTLED' ? '清' : '未'}</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{currentBills.length === 0 ? <p className="px-2 py-3 text-center text-[12px] text-[#6b6458]">暂无账单</p> : null}
					</div>
				</div>
			</section>

			<div className="app-fab-bar">
				<button type="button" onClick={() => router.push(`/settle?tripId=${selectedTripId}`)} className="app-fab app-fab-settle">
					结算
				</button>
				{currentTrip?.isOwner ? (
					<button type="button" onClick={openShareModal} className="app-fab app-fab-icon app-fab-share" aria-label="分享旅行">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
							<path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5" />
						</svg>
					</button>
				) : null}
				<button type="button" onClick={() => router.push(`/bills/new?tripId=${selectedTripId}`)} className="app-fab app-fab-icon app-fab-add" aria-label="新建账单">
					+
				</button>
			</div>

			{/* New Trip Modal */}
			<Modal isOpen={isNewTripModalOpen} onClose={() => setIsNewTripModalOpen(false)} title="新建旅行" onOk={handleCreateTrip} okText="创建" showOkButton showCancelButton cancelText="取消">
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-2">旅行名称</label>
						<input type="text" value={newTripName} onChange={(e) => setNewTripName(e.target.value)} placeholder="例如：上海美食周" className="w-full px-3 py-2 border rounded" />
					</div>
					<div>
						<label className="block text-sm font-medium mb-2">开始时间</label>
						<input type="date" value={newTripStartDate} onChange={(e) => setNewTripStartDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
					</div>
					<div>
						<label className="block text-sm font-medium mb-2">备注</label>
						<textarea
							value={newTripDescription}
							onChange={(e) => setNewTripDescription(e.target.value)}
							placeholder="可选的旅行备注"
							rows={3}
							className="w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-2">选择参与者</label>
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
				title="添加参与者"
				onOk={handleAddMembers}
				okText="添加"
				showOkButton
				showCancelButton
				cancelText="取消"
			>
				<div className="space-y-4">
					<p className="text-sm text-slate-600">点击选择要添加到这个旅行的好友</p>
					<FriendSelector
						friends={friends.filter((f) => !(currentTrip?.members || []).some((m) => m.id === f.id))}
						selectedFriends={selectedFriendsForTrip}
						onToggleFriend={(friendId) => {
							setSelectedFriendsForTrip((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
						}}
					/>
				</div>
			</Modal>

			{/* Map Details Modal */}
			<Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} title="账单地图详情" showOkButton={false} showCancelButton cancelText="关闭" className="max-w-5xl">
				<div className="space-y-4">
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={() => setMapTileLayer('osm')}
							className={`rounded-3xl px-4 py-2 text-sm font-semibold ${mapTileLayer === 'osm' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
						>
							OSM 地图
						</button>
						<button
							type="button"
							onClick={() => setMapTileLayer('satellite')}
							className={`rounded-3xl px-4 py-2 text-sm font-semibold ${mapTileLayer === 'satellite' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
						>
							卫星影像
						</button>
					</div>
					<div className="h-140 rounded-3xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900">
						<BillMap bills={currentBills} interactive={true} tileLayer={mapTileLayer} />
					</div>
				</div>
			</Modal>

			{/* Member Detail Modal */}
			<Modal isOpen={isMemberDetailModalOpen} onClose={() => setIsMemberDetailModalOpen(false)} title="" showCloseButton={false} className="max-w-md">
				{selectedMember && (
					<div className="space-y-4">
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">{selectedMember.name.charAt(0).toUpperCase()}</div>
							<div className="flex-1">
								<h3 className="font-semibold">{selectedMember.name}</h3>
								<p className="text-sm text-slate-600">{selectedMember.description || '无描述'}</p>
							</div>
						</div>

						<div>
							<h4 className="font-semibold mb-2">参加过的旅行</h4>
							<p className="text-sm text-slate-600">共参加过 {selectedMember.participationCount} 次旅行</p>
						</div>

						<div className="flex justify-between">
							<button onClick={handleRemoveMember} className="px-4 py-2 bg-red-500 text-white rounded">
								从这个旅行中移除
							</button>
							<button onClick={() => setIsMemberDetailModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">
								关闭
							</button>
						</div>
					</div>
				)}
			</Modal>

			{/* Edit Trip Modal */}
			<Modal isOpen={isEditTripModalOpen} onClose={() => setIsEditTripModalOpen(false)} title="编辑旅行名称" onOk={handleEditTrip} okText="保存" showOkButton showCancelButton cancelText="取消">
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-2">旅行名称</label>
						<input
							type="text"
							value={editTripName}
							onChange={(e) => setEditTripName(e.target.value)}
							placeholder="输入新的旅行名称"
							className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
						/>
					</div>
				</div>
			</Modal>

			<Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="分享旅行" showOkButton={false} showCancelButton cancelText="关闭">
				<div className="space-y-4">
					<p className="text-sm text-slate-600 dark:text-slate-400">设置分享密码后，将链接发送给旅伴，对方输入密码即可加入并共同编辑。</p>
					<div>
						<label className="block text-sm font-medium mb-2">分享密码</label>
						<input
							type="text"
							value={sharePassword}
							onChange={(e) => setSharePassword(e.target.value)}
							placeholder="设置一个便于记忆的密码"
							className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
						/>
					</div>
					<button
						type="button"
						onClick={handleCreateShare}
						disabled={isSharing}
						className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
					>
						{isSharing ? '生成中...' : shareUrl ? '更新分享密码' : '生成分享链接'}
					</button>
					{shareUrl ? (
						<div className="space-y-2">
							<label className="block text-sm font-medium">分享链接</label>
							<div className="flex gap-2">
								<input type="text" readOnly value={shareUrl} className="flex-1 min-w-0 px-3 py-2 border rounded text-xs dark:bg-slate-800 dark:border-slate-700" />
								<button
									type="button"
									onClick={handleCopyShareLink}
									className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
								>
									复制
								</button>
							</div>
						</div>
					) : null}
					{shareMessage ? <p className="text-sm text-sky-600 dark:text-sky-400">{shareMessage}</p> : null}
				</div>
			</Modal>

			<Modal
				isOpen={isDeleteTripModalOpen}
				onClose={() => setIsDeleteTripModalOpen(false)}
				title={currentTrip?.isOwner === false ? '从列表移除旅行' : '删除旅行'}
				onOk={handleDeleteTrip}
				okText={currentTrip?.isOwner === false ? '确认移除' : '确认删除'}
				showOkButton
				showCancelButton
				cancelText="取消"
			>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					{currentTrip?.isOwner === false ? '移除后该旅行将从你的列表中消失，但不会影响其他参与者。' : '删除后该旅行及其所有账单将被隐藏，分享链接也会失效。'}
				</p>
			</Modal>
		</AppShell>
	);
}
