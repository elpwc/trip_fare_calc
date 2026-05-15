'use client';

import { Modal } from '@/src/components/Modal';
import { getAuthHeaders } from '@/src/utils/auth';
import FriendList from '@/src/components/FriendList';
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
				}),
			});
			if (response.ok) {
				const newFriend = await response.json();
				setFriends([...friends, { ...newFriend, trips: [] }]);
				setNewFriendName('');
				setNewFriendDescription('');
				setIsAddingFriend(false);
			}
		} catch (error) {
			console.error('Failed to add friend:', error);
		}
	};

	const maxParticipation = Math.max(...friends.map((f) => f.participationCount), 0);

	return (
		<div className="relative w-full min-h-screen bg-gray-100 flex justify-center px-4 py-2">
			<div className="w-full">
				<div>
					<p className="text-4xl px-2 pt-4">旅伴一览</p>
					<p className="text-[12px] px-2 py-2 text-gray-500">在这里提前设置好所有旅伴，方便在新建旅行和记账时快速选择</p>
				</div>
				<div className="relative w-full max-w-4xl h-[calc(100vh-250px)] rounded-3xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
					<FriendList friends={friends} onFriendClick={handleFriendClick} />
				</div>
			</div>

			<button
				type="button"
				onClick={() => setIsAddingFriend(true)}
				className="fixed z-50 bottom-26 right-6 h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-300/60"
				aria-label="添加旅伴"
			>
				<span className="text-3xl font-bold leading-none">+</span>
			</button>
			{/* Friend Modal */}
			<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="" showCloseButton={false} className="max-w-md">
				{selectedFriend && (
					<div className="space-y-4">
						{/* Row 1: Icon, Name, Edit Name Button */}
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">{selectedFriend.name.charAt(0).toUpperCase()}</div>
							{isEditingName ? (
								<div className="flex-1 flex space-x-2">
									<input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 px-2 py-1 border rounded" />
									<button onClick={handleUpdateName} className="px-3 py-1 bg-blue-500 text-white rounded">
										保存
									</button>
									<button onClick={() => setIsEditingName(false)} className="px-3 py-1 bg-gray-500 text-white rounded">
										取消
									</button>
								</div>
							) : (
								<>
									<span className="flex-1 font-semibold">{selectedFriend.name}</span>
									<button onClick={() => setIsEditingName(true)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
										修改
									</button>
								</>
							)}
						</div>

						{/* Row 2: Description */}
						<div className="flex items-start space-x-2">
							{isEditingDescription ? (
								<div className="flex-1 flex space-x-2">
									<input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="flex-1 px-2 py-1 border rounded" placeholder="描述" />
									<button onClick={handleUpdateDescription} className="px-3 py-1 bg-blue-500 text-white rounded">
										保存
									</button>
									<button onClick={() => setIsEditingDescription(false)} className="px-3 py-1 bg-gray-500 text-white rounded">
										取消
									</button>
								</div>
							) : (
								<>
									<p className="flex-1">{selectedFriend.description || '无描述'}</p>
									<button onClick={() => setIsEditingDescription(true)} className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm">
										编辑
									</button>
								</>
							)}
						</div>

						{/* Row 3: Trips */}
						<div>
							<h3 className="font-semibold mb-2">参加过的旅行 ({selectedFriend.trips.length} 次)</h3>
							<ul className="space-y-1">
								{selectedFriend.trips.map((trip) => (
									<li key={trip.id} className="text-sm">
										{trip.name} - {trip.date}
									</li>
								))}
							</ul>
						</div>

						{/* Row 4: Set as Self, Delete and Close Buttons */}
						<div className="flex justify-between">
							<div className="flex space-x-2">
								<button
									onClick={handleSetAsSelf}
									className={`px-4 py-2 rounded ${selectedFriend.isSelf ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
								>
									{selectedFriend.isSelf ? '取消本人' : '设为本人'}
								</button>
								<button onClick={handleDeleteFriend} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
									删除
								</button>
							</div>
							<button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
								关闭
							</button>
						</div>
					</div>
				)}
			</Modal>

			{/* Add Friend Modal */}
			<Modal isOpen={isAddingFriend} onClose={() => setIsAddingFriend(false)} title="添加朋友" onOk={handleAddFriend} okText="添加" showOkButton showCancelButton cancelText="取消">
				<div className="space-y-4">
					<input type="text" placeholder="朋友姓名" value={newFriendName} onChange={(e) => setNewFriendName(e.target.value)} className="w-full px-3 py-2 border rounded" />
					<input type="text" placeholder="描述（可选）" value={newFriendDescription} onChange={(e) => setNewFriendDescription(e.target.value)} className="w-full px-3 py-2 border rounded" />
				</div>
			</Modal>
		</div>
	);
};

export default FriendsPage;
