'use client';

type PageLoadingSkeletonProps = {
	variant: 'home' | 'friends' | 'billMembers';
};

function Block({ className }: { className?: string }) {
	return <div className={`app-skeleton ${className ?? ''}`} aria-hidden />;
}

export default function PageLoadingSkeleton({ variant }: PageLoadingSkeletonProps) {
	if (variant === 'friends') {
		return (
			<div className="app-skeleton-stack" aria-busy="true">
				<div className="mb-2 space-y-2">
					<Block className="h-3 w-16" />
					<Block className="h-7 w-40" />
					<Block className="h-3 w-56" />
				</div>
				<div className="app-panel h-[calc(100vh-220px)] min-h-72 overflow-hidden p-2">
					<div className="app-panel-head mb-3">
						<Block className="h-3 w-20" />
						<Block className="h-3 w-24" />
					</div>
					<div className="flex flex-wrap justify-center gap-4 pt-6">
						{Array.from({ length: 6 }).map((_, index) => (
							<div key={index} className="flex flex-col items-center gap-2">
								<Block className="h-12 w-12 rounded-full" />
								<Block className="h-2 w-10" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (variant === 'billMembers') {
		return (
			<div className="space-y-2" aria-busy="true">
				<Block className="h-14 w-full" />
				<Block className="h-24 w-full" />
				<div className="app-panel p-2">
					<Block className="mb-3 h-3 w-24" />
					<div className="flex flex-wrap justify-center gap-2">
						{Array.from({ length: 4 }).map((_, index) => (
							<div key={index} className="flex w-[4.75rem] flex-col items-center gap-1">
								<Block className="h-10 w-10 rounded-full" />
								<Block className="h-2 w-12" />
							</div>
						))}
					</div>
				</div>
				<div className="app-panel p-2">
					<Block className="mb-3 h-3 w-24" />
					<div className="flex flex-wrap justify-center gap-2">
						{Array.from({ length: 4 }).map((_, index) => (
							<div key={index} className="flex w-[4.75rem] flex-col items-center gap-1">
								<Block className="h-10 w-10 rounded-full" />
								<Block className="h-2 w-12" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="app-skeleton-stack mt-2 space-y-2" aria-busy="true">
			<div className="app-panel p-2">
				<div className="flex items-center justify-between gap-2">
					<Block className="h-6 w-36" />
					<Block className="h-6 w-20" />
				</div>
			</div>
			<div className="app-panel p-2">
				<Block className="mb-2 h-3 w-20" />
				<div className="flex gap-2">
					{Array.from({ length: 4 }).map((_, index) => (
						<div key={index} className="flex flex-col items-center gap-1">
							<Block className="h-10 w-10 rounded-full" />
							<Block className="h-2 w-10" />
						</div>
					))}
				</div>
			</div>
			<Block className="h-20 w-full" />
			<div className="app-panel overflow-hidden">
				<div className="app-panel-head">
					<Block className="h-3 w-16" />
					<Block className="h-3 w-20" />
				</div>
				<div className="space-y-2 p-2">
					{Array.from({ length: 3 }).map((_, index) => (
						<Block key={index} className="h-10 w-full" />
					))}
				</div>
			</div>
		</div>
	);
}
