// Clover Hosted Payment Links
// Maps package IDs (or exact names) to their respective Clover payment URLs

export const CLOVER_PAYMENT_LINKS: Record<string, string> = {
    // Adult Packages
    'Adult-Refresher': 'https://link.clover.com/urlshortener/VKj3sX',
    'Adult-Basic': 'https://link.clover.com/urlshortener/mzdq7w',
    'Adult-Intermediate': 'https://link.clover.com/urlshortener/7QXD4q',
    'Adult-Advanced': 'https://link.clover.com/urlshortener/TX4wg3', // Mapped from "Standard Package"
    'First-Time-Driver': 'https://link.clover.com/urlshortener/YrWV65',
    'Evaluation': 'https://link.clover.com/urlshortener/VQ5PWz',

    // Teen Packages
    'Teen-Basic': 'https://link.clover.com/urlshortener/XtxH3h',
    'Teen-Standard': 'https://link.clover.com/urlshortener/mM3gmL', // Mapped from "Essential Package"
    'Teen-Premium': 'https://link.clover.com/urlshortener/L7SFQj',
    'Teen-Advanced': 'https://link.clover.com/urlshortener/SQZ8Gp',

    // Knowledge Tests
    'KnowledgeTest-1Attempt': 'https://link.clover.com/urlshortener/TWvpp3',
    'KnowledgeTest-2Attempts': 'https://link.clover.com/urlshortener/5znzbV',

    // Driving Tests
    'DrivingTest-SchoolCar': 'https://link.clover.com/urlshortener/hsxtVJ',
    'DrivingTest-PersonalCar': 'https://link.clover.com/urlshortener/4J4knw',
    'DrivingTest-Plus30m': 'https://link.clover.com/urlshortener/6dRYz6',
    'DrivingTest-Plus1h': 'https://link.clover.com/urlshortener/TLpzyW',

    // Bundle Packages
    'KnowledgeDriving-Bundle': 'https://link.clover.com/urlshortener/LcSqdC',
    'BothTests-Plus30m': 'https://link.clover.com/urlshortener/TfrJfb',
    'BothTests-Plus1h': 'https://link.clover.com/urlshortener/2JZzn5',
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
