export type VisualViewportFrame = {
	top: number;
	left: number;
	width: number;
	height: number;
};

export function getVisualViewportFrame(): VisualViewportFrame {
	if (typeof window === 'undefined') {
		return { top: 0, left: 0, width: 0, height: 0 };
	}

	const viewport = window.visualViewport;
	return {
		top: viewport?.offsetTop ?? 0,
		left: viewport?.offsetLeft ?? 0,
		width: viewport?.width ?? window.innerWidth,
		height: viewport?.height ?? window.innerHeight,
	};
}

export function subscribeVisualViewport(onChange: () => void) {
	if (typeof window === 'undefined') return () => {};

	const viewport = window.visualViewport;
	const handleChange = () => {
		window.requestAnimationFrame(onChange);
	};

	window.addEventListener('resize', handleChange);
	window.addEventListener('scroll', handleChange, true);
	viewport?.addEventListener('resize', handleChange);
	viewport?.addEventListener('scroll', handleChange);

	return () => {
		window.removeEventListener('resize', handleChange);
		window.removeEventListener('scroll', handleChange, true);
		viewport?.removeEventListener('resize', handleChange);
		viewport?.removeEventListener('scroll', handleChange);
	};
}
