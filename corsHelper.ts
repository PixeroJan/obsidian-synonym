import { requestUrl } from 'obsidian';

/**
 * Formats an error message for user display.
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
 * Tests which proxies can reach the synonym service.
 */
export async function testProxies(proxies: string[]): Promise<string[]> {
	const workingProxies: string[] = [];
	const testUrl = 'https://svenska.se';

	for (const proxy of proxies) {
		try {
			const proxyUrl = proxy.includes('?url=')
				? `${proxy}${encodeURIComponent(testUrl)}`
				: `${proxy}${testUrl}`;

			await requestUrl({
				url: proxyUrl,
				method: 'HEAD'
			});

			workingProxies.push(proxy);
		} catch {
			// Ignore unavailable proxies and continue testing the remaining entries.
		}
	}

	return workingProxies;
}
