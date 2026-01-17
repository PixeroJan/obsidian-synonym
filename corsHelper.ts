// Helper functions for CORS issues

/**
 * Formats an error message for user display
 */
export function formatCorsError(error: unknown): string {
    if (error instanceof Error) {
        if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
            return 'CORS-fel: Kunde inte nå tjänsten. Försöker med lokal ordlista istället.';
        }
        return error.message;
    }
    return 'Okänt fel vid hämtning av synonymer';
}

/**
 * Tests if the provided proxies are working
 */
export async function testProxies(proxies: string[]): Promise<string[]> {
    const workingProxies: string[] = [];
    const testUrl = 'https://svenska.se';
    
    for (const proxy of proxies) {
        try {
            // Create the proxied URL based on the proxy format
            const proxyUrl = proxy.includes('?url=') ? 
                `${proxy}${encodeURIComponent(testUrl)}` : 
                `${proxy}${testUrl}`;
            
            // Simple fetch to test if the proxy works
            const response = await fetch(proxyUrl, {
                method: 'HEAD',
                mode: 'no-cors' // This will succeed but return an opaque response
            });
            
            workingProxies.push(proxy);
            console.log(`Proxy ${proxy} seems to be working`);
        } catch (error) {
            console.log(`Proxy ${proxy} failed test: ${error}`);
        }
    }
    
    return workingProxies;
}
