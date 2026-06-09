'use client';

import { useCallback, useState } from 'react';
import AuthRequiredModal from '@/src/components/AuthRequiredModal';
import { useAuth } from '@/src/utils/auth-provider';

export function useRequireAuth() {
	const { user, loading } = useAuth();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

	const guardAuth = useCallback(
		(action?: () => void) => {
			if (loading) return false;
			if (!user) {
				setIsAuthModalOpen(true);
				return false;
			}
			action?.();
			return true;
		},
		[loading, user],
	);

	const AuthRequiredModalElement = <AuthRequiredModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />;

	return {
		user,
		loading,
		isAuthenticated: !!user,
		guardAuth,
		AuthRequiredModal: AuthRequiredModalElement,
	};
}
