'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/src/components/Modal';
import FriendSelector from '@/src/components/FriendSelector';
import BillMap from '@/src/components/BillMap';
import FriendIcon from '@/src/components/FriendIcon';
import { getAuthHeaders } from '@/src/utils/auth';
import { Friend, TripMember, Trip, Bill } from '@/src/types';

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

	useEffect(() => {
		fetchTrips();
		fetchFriends();
	}, []);

	useEffect(() => {
		if (trips.length > 0 && !selectedTripId) {
			setSelectedTripId(trips[0].id);
		}
	}, [trips, selectedTripId]);

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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('zh-CN');
	};

	if (trips.length === 0) {
		return (
			<div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center">
				<div className="text-center">
					<div className="text-6xl mb-4">✈️</div>
					<h1 className="text-2xl font-semibold mb-2">还没有旅行</h1>
					<p className="text-slate-600 mb-6">创建你的第一个旅行，开始记录账单</p>
					<button
						onClick={() => setIsNewTripModalOpen(true)}
						className="inline-flex items-center gap-2 rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500"
					>
						<span className="text-lg">+</span>
						新建旅行
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
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
			<div className="max-w-245 mx-auto px-4 pb-28 pt-5">
				<header className="flex flex-wrap items-center justify-between gap-3">
					<div className="relative min-w-0 flex-1">
						<button
							type="button"
							onClick={() => setIsTripDropdownOpen(!isTripDropdownOpen)}
							className="w-full rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 text-left shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
						>
							<div className="flex items-center justify-between gap-3">
								<div className="flex-1 min-w-0">
									<p className="truncate text-base font-semibold">{currentTrip?.name}</p>
									{currentTrip && <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(currentTrip.createdAt)}</p>}
								</div>
								<span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
									{isTripDropdownOpen ? '△' : '▾'}
								</span>
							</div>
						</button>

						{isTripDropdownOpen && (
							<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-3xl shadow-lg z-10 dark:bg-slate-900 dark:border-slate-700">
								{trips.map((trip) => (
									<button
										key={trip.id}
										onClick={() => {
											setSelectedTripId(trip.id);
											setIsTripDropdownOpen(false);
										}}
										className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 first:rounded-t-3xl last:rounded-b-3xl"
									>
										<p className="truncate text-sm font-semibold">{trip.name}</p>
										<p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(trip.createdAt)}</p>
									</button>
								))}
							</div>
						)}
					</div>

					<button
						type="button"
						onClick={() => setIsNewTripModalOpen(true)}
						className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-lg transition hover:bg-sky-500"
						aria-label="新建旅行"
					>
						<span className="text-2xl font-bold leading-none">+</span>
					</button>
				</header>

				<section className="mt-2">
					<div className="flex items-center justify-between gap-3">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">参与者</p>
					</div>

					<div className="mt-2 flex gap-3 overflow-x-auto pb-2">
						{(currentTrip?.members || []).map((member) => (
							<div key={member.id} className="flex min-w-16 flex-col items-center gap-2 text-center">
								<button
									onClick={() => {
										setSelectedMember(member);
										setIsMemberDetailModalOpen(true);
									}}
									className="cursor-pointer"
								>
									<FriendIcon name={member.name} size="lg" isSelf={member.isSelf} />
								</button>
								<p className="max-w-18 truncate text-xs text-slate-700 dark:text-slate-300">{member.name}</p>
							</div>
						))}

						<button
							type="button"
							onClick={() => setIsAddMemberModalOpen(true)}
							className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-lg font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
							aria-label="添加成员"
						>
							+
						</button>
					</div>
				</section>

				<section className="mt-4">
					<div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900">
						<div className="h-32 cursor-pointer" onClick={() => setIsMapModalOpen(true)}>
							<BillMap bills={currentBills} interactive={false} tileLayer="osm" />
						</div>
					</div>
				</section>

				<section className="mt-4">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">账单列表</p>
				</section>

				<section className="mt-2 pb-24">
					<div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900">
						<div className="overflow-x-auto">
							<table className="min-w-full text-xs">
								<thead className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
									<tr>
										<th className="px-3 py-3">付钱人</th>
										<th className="px-3 py-3">金额</th>
										<th className="px-3 py-3">欠钱人</th>
										<th className="px-3 py-3">名称</th>
										<th className="px-3 py-3">类型</th>
										<th className="px-3 py-3">状态</th>
									</tr>
								</thead>
								<tbody>
									{currentBills.map((bill, index) => (
										<tr key={bill.id} className={`border-b ${index === currentBills.length - 1 ? '' : 'border-slate-200'} dark:border-slate-800`}>
											<td className="px-3 py-1">
												<FriendIcon
													name={(currentTrip?.members || []).find((m) => m.id === bill.payerId)?.name || '?'}
													size="md"
													isSelf={(currentTrip?.members || []).find((m) => m.id === bill.payerId)?.isSelf}
												/>
											</td>
											<td className="px-3 py-1 font-semibold text-slate-900 dark:text-slate-100">¥{bill.amount}</td>
											<td className="px-3 py-1">
												<div className="flex flex-wrap items-center gap-1">
													{bill.owedFriends.slice(0, 4).map((owed: any) => {
														const member = (currentTrip?.members || []).find((m) => m.id === owed.friendId);
														return <FriendIcon key={owed.id} name={member?.name || '?'} size="sm" isSelf={member?.isSelf} />;
													})}
													{bill.owedFriends.length > 4 ? (
														<span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
															+{bill.owedFriends.length - 4}
														</span>
													) : null}
												</div>
											</td>
											<td className="px-3 py-1 text-slate-700 dark:text-slate-300">{bill.name}</td>
											<td className="px-3 py-1">
												<span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
													{bill.category}
												</span>
											</td>
											<td className="px-3 py-1">
												<span
													className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
														bill.status === 'SETTLED'
															? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
															: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
													}`}
												>
													{bill.status === 'SETTLED' ? '已结算' : '待结算'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</section>
			</div>

			<div className="fixed bottom-26 right-5 z-50 flex items-center gap-3">
				<button
					type="button"
					onClick={() => router.push(`/settle?tripId=${selectedTripId}`)}
					className="inline-flex h-16 items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-lg font-semibold text-white shadow-2xl shadow-slate-900/30 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300/60"
				>
					结算
				</button>
				<button
					type="button"
					onClick={() => router.push(`/bills/new?tripId=${selectedTripId}`)}
					className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-300/60"
					aria-label="新建账单"
				>
					<span className="text-3xl font-bold leading-none">+</span>
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
		</div>
	);
}
