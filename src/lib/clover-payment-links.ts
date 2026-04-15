// TODO: Replace with Kent Clover payment links
// Clover Hosted Payment Links
// Maps package IDs (or exact names) to their respective Clover payment URLs

export const CLOVER_PAYMENT_LINKS: Record<string, string> = {
    // Adult Packages
    'Adult-Refresher': 'https://link.clover.com/urlshortener/hskHC4',
    'Adult-Basic': 'https://link.clover.com/urlshortener/R5KgND',
    'Adult-Intermediate': 'https://link.clover.com/urlshortener/52n259',
    'Adult-Advanced': 'https://link.clover.com/urlshortener/7MBVgS',
    'First-Time-Driver': 'https://link.clover.com/urlshortener/yZxnWG',
    'Evaluation': 'https://link.clover.com/urlshortener/vJ8MkF',

    // Teen Packages
    'Teen-Basic': 'https://link.clover.com/urlshortener/PPKmKB',
    'Teen-Standard': 'https://link.clover.com/urlshortener/6QnDkc',
    'Teen-Premium': 'https://link.clover.com/urlshortener/Xh9nKn',
    'Teen-Advanced': 'https://link.clover.com/urlshortener/Gh3TR3',

    // Knowledge Tests
    'KnowledgeTest-1Attempt': 'https://link.clover.com/urlshortener/SCw5BB',
    'KnowledgeTest-2Attempts': 'https://link.clover.com/urlshortener/vTfGwX',

    // Driving Tests
    'DrivingTest-SchoolCar': 'https://link.clover.com/urlshortener/vM7QKF',
    'DrivingTest-PersonalCar': 'https://link.clover.com/urlshortener/dTyN9X',
    'DrivingTest-Plus30m': 'https://link.clover.com/urlshortener/mS2m27',
    'DrivingTest-Plus1h': 'https://link.clover.com/urlshortener/5qK6qz',

    // Bundle Packages
    'KnowledgeDriving-Bundle': 'https://link.clover.com/urlshortener/cDFLn6',
    'BothTests-Plus30m': 'https://link.clover.com/urlshortener/QzS8sH',
    'BothTests-Plus1h': 'https://link.clover.com/urlshortener/vzrW6J',
};

/**
 * Get the Clover payment link for a package
 * @param packageId - The package ID or package name
 * @returns The Clover payment URL or default pay link
 */
export function getPaymentLink(packageId: string | null | undefined): string {
    if (!packageId) return 'https://www.clover.com/pay';
    
    // First try direct match
    if (CLOVER_PAYMENT_LINKS[packageId]) {
        return CLOVER_PAYMENT_LINKS[packageId];
    }
    
    // Fallback: try to match by name by removing spaces/hyphens
    const normalizedAttempt = packageId.replace(/\s+/g, '-');
    for (const [key, url] of Object.entries(CLOVER_PAYMENT_LINKS)) {
        if (key.toLowerCase() === normalizedAttempt.toLowerCase() || 
            key.toLowerCase().replace(/-/g, '') === packageId.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            return url;
        }
    }

    return 'https://www.clover.com/pay';
}
