'use client';

import { HintProvider } from '@/src/components/HintProvider';
import { Suspense } from 'react';
import HomePage from './Homepage';

export default function Home() {
	return (
		<Suspense>
			<HintProvider>
				<HomePage />
			</HintProvider>
		</Suspense>
	);
}
