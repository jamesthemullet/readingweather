export const READING_LAT = 51.4543;
export const READING_LON = -0.9781;

const OPEN_METEO_ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

export function openMeteoArchiveUrl(params: URLSearchParams): string {
	return `${OPEN_METEO_ARCHIVE_URL}?${params}`;
}

export function assertOpenMeteoOk(response: Response): void {
	if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
}
