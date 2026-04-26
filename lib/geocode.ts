export interface BBox {
  south: number;
  north: number;
  west: number;
  east: number;
}

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  state: string;
  country: string;
  bbox: BBox;
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "HeatShield/1.0 (hackathon project)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.length) return null;

  const r = data[0];
  const addr = r.address ?? {};

  // Nominatim boundingbox: [south, north, west, east]
  const bb: string[] = r.boundingbox ?? [];
  const rawBbox: BBox = {
    south: parseFloat(bb[0] ?? (r.lat - 0.1)),
    north: parseFloat(bb[1] ?? (r.lat + 0.1)),
    west:  parseFloat(bb[2] ?? (r.lon - 0.1)),
    east:  parseFloat(bb[3] ?? (r.lon + 0.1)),
  };

  // Cap bbox to ~0.4° per side (~40 km) so we don't query an entire state
  const lat = parseFloat(r.lat);
  const lng = parseFloat(r.lon);
  const maxDelta = 0.4;
  const bbox: BBox = {
    south: Math.max(rawBbox.south, lat - maxDelta),
    north: Math.min(rawBbox.north, lat + maxDelta),
    west:  Math.max(rawBbox.west,  lng - maxDelta),
    east:  Math.min(rawBbox.east,  lng + maxDelta),
  };

  return {
    lat,
    lng: parseFloat(r.lon),
    displayName: r.display_name,
    city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? "",
    state: addr.state ?? "",
    country: addr.country ?? "",
    bbox,
  };
}

// Four rural reference points ~25 km in each cardinal direction.
// Averaging all four cancels out directional weather gradients (fronts, wind, cloud cover)
// that would bias a single-point comparison.
export function ruralReferencePoints(lat: number, lng: number): { lat: number; lng: number }[] {
  const d = 0.225; // ~25 km in latitude degrees
  return [
    { lat: lat + d, lng },
    { lat: lat - d, lng },
    { lat, lng: lng + d },
    { lat, lng: lng - d },
  ];
}
