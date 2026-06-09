export type TripBillEventType = 'bill:created' | 'bill:updated';

export type TripBillEvent = {
	type: TripBillEventType;
	tripId: string;
	billId: string;
	actorUserId: string;
	actorName: string;
	billName: string;
	amount: number;
	currency: string;
};
