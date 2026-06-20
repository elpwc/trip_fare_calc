export type FriendLayoutMode = 'ring' | 'layered' | 'grid';

export const FRIEND_LAYOUT_MODES: FriendLayoutMode[] = ['ring', 'layered', 'grid'];

const RING_STEP = 72;
const GRID_CELL_WIDTH = 76;
const GRID_CELL_HEIGHT = 88;
const GRID_CELL_HEIGHT_WITH_META = 116;

function getLayerCapacity(layer: number): number {
	return layer === 0 ? 1 : 6 * layer;
}

function findLayer(index: number, total: number) {
	let layerStart = 0;
	let layer = 0;

	while (true) {
		const capacity = getLayerCapacity(layer);
		const itemsInLayer = Math.min(capacity, total - layerStart);
		if (index < layerStart + itemsInLayer) {
			return { layer, indexInLayer: index - layerStart, itemsInLayer };
		}
		layerStart += capacity;
		layer++;
	}
}

export function getRingFriendPosition(index: number, total: number, radius: number): { x: number; y: number } {
	if (total <= 0) return { x: 0, y: 0 };
	const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
	return {
		x: Math.cos(angle) * radius,
		y: Math.sin(angle) * radius,
	};
}

export function getLayeredFriendPosition(index: number, total: number): { x: number; y: number } {
	if (total <= 0 || index < 0 || index >= total) {
		return { x: 0, y: 0 };
	}

	const { layer, indexInLayer, itemsInLayer } = findLayer(index, total);

	if (layer === 0) {
		return { x: 0, y: 0 };
	}

	const radius = RING_STEP * layer;
	const angle = (indexInLayer / itemsInLayer) * 2 * Math.PI - Math.PI / 2;

	return {
		x: Math.cos(angle) * radius,
		y: Math.sin(angle) * radius,
	};
}

export function getLayeredLayoutRadius(total: number): number {
	if (total <= 1) return 0;

	let layerStart = 0;
	let layer = 0;

	while (layerStart < total) {
		const capacity = getLayerCapacity(layer);
		const itemsInLayer = Math.min(capacity, total - layerStart);
		if (layerStart + itemsInLayer >= total) {
			return layer === 0 ? 0 : RING_STEP * layer;
		}
		layerStart += capacity;
		layer++;
	}

	return 0;
}

export function getGridColumns(total: number): number {
	if (total <= 1) return 1;
	if (total <= 4) return 2;
	if (total <= 9) return 3;
	if (total <= 16) return 4;
	return 5;
}

export function getGridFriendPosition(
	index: number,
	total: number,
	options?: { withMeta?: boolean },
): { x: number; y: number } {
	const cols = getGridColumns(total);
	const row = Math.floor(index / cols);
	const col = index % cols;
	const rows = Math.ceil(total / cols);
	const cellW = GRID_CELL_WIDTH;
	const cellH = options?.withMeta ? GRID_CELL_HEIGHT_WITH_META : GRID_CELL_HEIGHT;
	const gridW = cols * cellW;
	const gridH = rows * cellH;

	return {
		x: col * cellW - gridW / 2 + cellW / 2,
		y: row * cellH - gridH / 2 + cellH / 2,
	};
}

export function getFriendLayoutPosition(
	mode: FriendLayoutMode,
	index: number,
	total: number,
	options?: { ringRadius?: number; withMeta?: boolean },
): { x: number; y: number } {
	switch (mode) {
		case 'ring':
			return getRingFriendPosition(index, total, options?.ringRadius ?? 120);
		case 'layered':
			return getLayeredFriendPosition(index, total);
		case 'grid':
			return getGridFriendPosition(index, total, options);
	}
}

export function getFriendLayoutCanvasSize(
	mode: FriendLayoutMode,
	total: number,
	maxIconSize: number,
	options?: { withMeta?: boolean; ringRadius?: number },
): { width: number; height: number } {
	if (total === 0) return { width: 0, height: 0 };

	const labelSpace = options?.withMeta ? 56 : 28;

	switch (mode) {
		case 'ring': {
			const radius = options?.ringRadius ?? 120;
			const size = radius * 2 + maxIconSize + labelSpace;
			return { width: size, height: size };
		}
		case 'layered': {
			const radius = getLayeredLayoutRadius(total);
			const size = radius * 2 + maxIconSize + labelSpace;
			return { width: size, height: size };
		}
		case 'grid': {
			const cols = getGridColumns(total);
			const rows = Math.ceil(total / cols);
			const cellH = options?.withMeta ? GRID_CELL_HEIGHT_WITH_META : GRID_CELL_HEIGHT;
			return { width: cols * GRID_CELL_WIDTH, height: rows * cellH };
		}
	}
}

export function getNextFriendLayoutMode(mode: FriendLayoutMode): FriendLayoutMode {
	const index = FRIEND_LAYOUT_MODES.indexOf(mode);
	return FRIEND_LAYOUT_MODES[(index + 1) % FRIEND_LAYOUT_MODES.length];
}
