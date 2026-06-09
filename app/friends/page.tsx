'use client';

import { Modal } from '@/src/components/Modal';
import AppShell from '@/src/components/layout/AppShell';
import { getAuthHeaders } from '@/src/utils/auth';
import FriendList from '@/src/components/FriendList';
import FriendIcon from '@/src/components/FriendIcon';
import React, { useState, useEffect } from 'react';
import { Friend } from '@/src/types';

const FriendsPage: React.FC = () => {
	const [friends, setFriends] = useState<Friend[]>([]);
	const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isEditingName, setIsEditingName] = useState(false);
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [newName, setNewName] = useState('');
	const [newDescription, setNewDescription] = useState('');
	const [isAddingFriend, setIsAddingFriend] = useState(false);
	const [newFriendName, setNewFriendName] = useState('');
	const [newFriendDescription, setNewFriendDescription] = useState('');
	const [newFriendIsMe, setNewFriendIsMe] = useState(false);

	useEffect(() => {
		fetchFriends();
	}, []);

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

	const handleFriendClick = (friend: Friend) => {
		setSelectedFriend(friend);
		setNewName(friend.name);
		setNewDescription(friend.description);
		setIsModalOpen(true);
	};

	const handleUpdateName = async () => {
		if (!selectedFriend || !newName.trim()) return;
		try {
			const response = await fetch(`/api/friends/${selectedFriend.id}`, {
				method: 'PATCH',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: newName.trim() }),
			});
			if (response.ok) {
				setSelectedFriend({ ...selectedFriend, name: newName.trim() });
				setFriends(friends.map((f) => (f.id === selectedFriend.id ? { ...f, name: newName.trim() } : f)));
				setIsEditingName(false);
			}
		} catch (error) {
			console.error('Failed to update name:', error);
		}
	};

	const handleUpdateDescription = async () => {
		if (!selectedFriend) return;
		try {
			const response = await fetch(`/api/friends/${selectedFriend.id}`, {
				method: 'PATCH',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ description: newDescription }),
			});
			if (response.ok) {
				setSelectedFriend({ ...selectedFriend, description: newDescription });
				setFriends(friends.map((f) => (f.id === selectedFriend.id ? { ...f, description: newDescription } : f)));
				setIsEditingDescription(false);
			}
		} catch (error) {
			console.error('Failed to update description:', error);
		}
	};

	const handleSetAsSelf = async () => {
		if (!selectedFriend) return;

		// 如果已经是本人，则取消设置
		if (selectedFriend.isSelf) {
			try {
				const response = await fetch(`/api/friends/${selectedFriend.id}`, {
					method: 'PATCH',
					headers: {
						...getAuthHeaders(),
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ isSelf: false }),
				});
				if (response.ok) {
					setSelectedFriend({ ...selectedFriend, isSelf: false });
					setFriends(friends.map((f) => (f.id === selectedFriend.id ? { ...f, isSelf: false } : f)));
				}
			} catch (error) {
				console.error('Failed to unset as self:', error);
			}
		} else {
			// 设置为本人前，先取消其他人的本人状态
			try {
				// 找到当前是本人的朋友
				const currentSelfFriend = friends.find((f) => f.isSelf);
				if (currentSelfFriend) {
					await fetch(`/api/friends/${currentSelfFriend.id}`, {
						method: 'PATCH',
						headers: {
							...getAuthHeaders(),
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ isSelf: false }),
					});
					setFriends(friends.map((f) => (f.id === currentSelfFriend.id ? { ...f, isSelf: false } : f)));
				}

				// 设置当前朋友为本人
				const response = await fetch(`/api/friends/${selectedFriend.id}`, {
					method: 'PATCH',
					headers: {
						...getAuthHeaders(),
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ isSelf: true }),
				});
				if (response.ok) {
					setSelectedFriend({ ...selectedFriend, isSelf: true });
					setFriends(friends.map((f) => (f.id === selectedFriend.id ? { ...f, isSelf: true } : f)));
				}
			} catch (error) {
				console.error('Failed to set as self:', error);
			}
		}
	};

	const handleDeleteFriend = async () => {
		if (!selectedFriend) return;
		try {
			const response = await fetch(`/api/friends/${selectedFriend.id}`, {
				method: 'DELETE',
				headers: getAuthHeaders(),
			});
			if (response.ok) {
				setFriends(friends.filter((f) => f.id !== selectedFriend.id));
				setIsModalOpen(false);
			}
		} catch (error) {
			console.error('Failed to delete friend:', error);
		}
	};

	const handleAddFriend = async () => {
		if (!newFriendName.trim()) return;
		try {
			const response = await fetch('/api/friends', {
				method: 'POST',
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: newFriendName.trim(),
					description: newFriendDescription,
					isSelf: newFriendIsMe,
				}),
			});
			if (response.ok) {
				const newFriend = await response.json();
				setFriends([...friends, { ...newFriend, trips: [] }]);
				setNewFriendName('');
				setNewFriendDescription('');
				setNewFriendIsMe(false);
				setIsAddingFriend(false);
			}
		} catch (error) {
			console.error('Failed to add friend:', error);
		}
	};

	const maxParticipation = Math.max(...friends.map((f) => f.participationCount), 0);

	return (
		<AppShell tight>
			<header className="mb-2">
				<p className="app-label">Companions</p>
				<h1 className="settings-display text-2xl leading-none">旅伴一览</h1>
				<p className="mt-1 text-[11px] leading-snug text-[#6b6458]">提前录入旅伴，新建旅行和记账时快速选择</p>
			</header>

			<div className="app-panel h-[calc(100vh-220px)] min-h-72 overflow-hidden">
				<div className="app-panel-head">
					<span className="app-label">{friends.length} 人</span>
					<span className="settings-mono text-[9px] text-[#6b6458]">点击头像编辑</span>
				</div>
				<FriendList friends={friends} onFriendClick={handleFriendClick} />
			</div>

			<div className="app-fab-bar">
				<button type="button" onClick={() => setIsAddingFriend(true)} className="app-fab app-fab-icon app-fab-add" aria-label="添加旅伴">
					+
				</button>
			</div>
			{/* Friend Modal */}
			<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="旅伴详情" showCloseButton={false} className="max-w-md">
				{selectedFriend && (
					<div className="modal-stack">
						<div className="modal-member-row">
							<FriendIcon name={selectedFriend.name} size="lg" isSelf={selectedFriend.isSelf} />
							{isEditingName ? (
								<div className="modal-member-meta flex items-center gap-2">
									<input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="settings-input min-w-0 flex-1 py-1.5 text-sm" />
									<button type="button" onClick={handleUpdateName} className="app-btn-compact app-btn-compact-primary">
										保存
									</button>
									<button type="button" onClick={() => setIsEditingName(false)} className="app-btn-compact">
										取消
									</button>
								</div>
							) : (
								<div className="modal-member-meta flex items-center gap-2">
									<span className="modal-member-name flex-1">{selectedFriend.name}</span>
									<button type="button" onClick={() => setIsEditingName(true)} className="app-btn-compact">
										修改
									</button>
								</div>
							)}
						</div>

						<div className="modal-field">
							{isEditingDescription ? (
								<div className="flex items-center gap-2">
									<input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="settings-input min-w-0 flex-1 py-1.5 text-sm" placeholder="描述" />
									<button type="button" onClick={handleUpdateDescription} className="app-btn-compact app-btn-compact-primary">
										保存
									</button>
									<button type="button" onClick={() => setIsEditingDescription(false)} className="app-btn-compact">
										取消
									</button>
								</div>
							) : (
								<div className="flex items-start gap-2">
									<p className="modal-hint flex-1">{selectedFriend.description || '无描述'}</p>
									<button type="button" onClick={() => setIsEditingDescription(true)} className="app-btn-compact shrink-0">
										编辑
									</button>
								</div>
							)}
						</div>

						<div className="modal-panel">
							<p className="modal-panel-title">参加过的旅行 ({selectedFriend.trips.length} 次)</p>
							<ul className="modal-trip-list">
								{selectedFriend.trips.map((trip) => (
									<li key={trip.id}>
										{trip.name} · {trip.date}
									</li>
								))}
							</ul>
						</div>

						<div className="modal-actions">
							<div className="modal-actions-start">
								<button
									type="button"
									onClick={handleSetAsSelf}
									className={`app-btn-compact ${selectedFriend.isSelf ? 'app-btn-compact-danger' : 'app-btn-compact-primary'}`}
								>
									{selectedFriend.isSelf ? '这不是我本人' : '这是我本人'}
								</button>
								<button type="button" onClick={handleDeleteFriend} className="app-btn-compact app-btn-compact-danger">
									删除
								</button>
							</div>
							<button type="button" onClick={() => setIsModalOpen(false)} className="app-btn-compact">
								关闭
							</button>
						</div>
					</div>
				)}
			</Modal>

			{/* Add Friend Modal */}
			<Modal isOpen={isAddingFriend} onClose={() => setIsAddingFriend(false)} title="添加朋友" onOk={handleAddFriend} okText="添加" showOkButton showCancelButton cancelText="取消">
				<div className="modal-stack">
					<div className="modal-field">
						<label className="app-label">朋友姓名</label>
						<input type="text" placeholder="朋友姓名" value={newFriendName} onChange={(e) => setNewFriendName(e.target.value)} className="settings-input py-2 text-sm" />
					</div>
					<div className="modal-field">
						<label className="app-label">描述（可选）</label>
						<input type="text" placeholder="描述（可选）" value={newFriendDescription} onChange={(e) => setNewFriendDescription(e.target.value)} className="settings-input py-2 text-sm" />
					</div>
					<button
						type="button"
						onClick={() => setNewFriendIsMe(!newFriendIsMe)}
						className={`settings-chip w-full ${newFriendIsMe ? 'settings-chip-active' : ''}`}
					>
						{newFriendIsMe ? '这是我本人（已选择）' : '这是我本人'}
					</button>
				</div>
			</Modal>
		</AppShell>
	);
};

export default FriendsPage;
