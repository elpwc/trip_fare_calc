/**
 * 统一的成员/朋友类型定义
 * 包含所有可能的字段，根据上下文可选使用
 */
export type Member = {
	id: string;
	name: string;
	description: string;
	participationCount: number;
	isSelf?: boolean;
	trips?: { id: string; name: string; date: string }[];
};

/**
 * 朋友类型 - 包含完整信息，包括参加过的旅行
 */
export type Friend = Member & {
	trips: { id: string; name: string; date: string }[];
};

/**
 * 旅行成员类型 - 旅行中的参与者
 */
export type TripMember = Member & {
	isSelf: boolean;
};

/**
 * 账单中的欠款信息
 */
export type BillOwed = {
	id: string;
	friendId: string;
};

/**
 * 账单类型
 */
export type Bill = {
	id: string;
	payerId: string;
	amount: number;
	currency?: string;
	owedFriends: BillOwed[];
	name: string;
	category: string;
	status: string;
	paymentMethod?: string;
	description?: string;
	latitude: number | null;
	longitude: number | null;
	createdAt: string;
	createdById?: string;
};

/**
 * 旅行类型
 */
export type Trip = {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	startDate?: string;
	members: TripMember[];
	bills: Bill[];
	isOwner?: boolean;
	ownerName?: string;
	ownerUserId?: string;
};

/**
 * 结算流水类型
 */
export type FlowItem = {
	id: string;
	fromId: string;
	toId: string;
	fromName: string;
	toName: string;
	amount: number;
	currency: string;
	originalTotals: { currency: string; amount: number }[];
	createdAt: string;
};
