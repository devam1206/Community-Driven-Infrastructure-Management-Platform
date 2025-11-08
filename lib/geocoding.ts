export interface ReverseGeocodeOptions {
  provider?: 'platform' | 'nominatim' | 'auto';
  timeoutMs?: number;
}

export const reverseGeocodeNominatim = async (
  latitude: number,
  longitude: number,
  timeoutMs: number = 6000
): Promise<string | null> => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      latitude
    )}&lon=${encodeURIComponent(longitude)}&addressdetails=1&zoom=18`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CDMP-App/1.0 (reverse geocoding)'
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const name: string | undefined = data.display_name;
    return name || null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
};
