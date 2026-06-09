export type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type PwaInstallResult = 'accepted' | 'dismissed' | 'unavailable';
