import type { BBox } from "@/lib/geocode";

export interface CoolingCenter {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string;
  postcode?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  email?: string;
  wheelchair?: "yes" | "no" | "limited";
  operator?: string;
  distance_km?: number;
}

export async function findCoolingCenters(
  centerLat: number,
  centerLng: number,
  bbox: BBox
): Promise<CoolingCenter[]> {
  const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const query = `
[out:json][timeout:30][bbox:${b}];
(
  node["amenity"="library"];
  node["amenity"="community_centre"];
  node["amenity"="social_facility"];
  node["leisure"="swimming_pool"]["access"!="private"];
  node["amenity"="public_bath"];
  node["leisure"="park"]["name"];
  node["amenity"="rec_centre"];
  node["amenity"="cinema"];
  node["shop"="mall"];
  node["amenity"="place_of_worship"]["name"];
);
out body;
`;

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: query,
        headers: {
          "Content-Type": "text/plain",
          "Accept": "*/*",
          "User-Agent": "HeatShield/1.0 (hackathon project)",
        },
      });
      if (!res.ok) continue;
      const json = await res.json();

      const centers: CoolingCenter[] = (json.elements ?? [])
        .map((el: Record<string, unknown>) => {
          const tags = (el.tags ?? {}) as Record<string, string>;
          const elLat = el.lat as number;
          const elLng = el.lon as number;
          if (!elLat || !elLng) return null;
          const rawType = tags.amenity ?? tags.leisure ?? tags.shop ?? "facility";

          // Normalize phone
          let phone = tags.phone ?? tags["contact:phone"] ?? tags.telephone;
          if (phone) {
            // Strip OSM formatting quirks (e.g. "+1 555-555-5555")
            phone = phone.replace(/\s+/g, " ").trim();
          }

          // Normalize website
          let website = tags.website ?? tags["contact:website"] ?? tags.url;
          if (website && !website.startsWith("http")) website = `https://${website}`;

          const wheelchair = tags.wheelchair as CoolingCenter["wheelchair"];

          return {
            id: el.id as number,
            name: tags.name ?? friendlyType(rawType),
            type: friendlyType(rawType),
            lat: elLat,
            lng: elLng,
            address: buildAddress(tags),
            postcode: tags["addr:postcode"],
            openingHours: tags.opening_hours,
            phone,
            website,
            email: tags.email ?? tags["contact:email"],
            wheelchair: wheelchair && ["yes", "no", "limited"].includes(wheelchair) ? wheelchair : undefined,
            operator: tags.operator,
            distance_km: haversine(centerLat, centerLng, elLat, elLng),
          };
        })
        .filter(Boolean)
        .sort((a: CoolingCenter, b: CoolingCenter) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
        .slice(0, 20);

      return centers;
    } catch {
      continue;
    }
  }
  return [];
}

function friendlyType(raw: string): string {
  const map: Record<string, string> = {
    library: "Library",
    community_centre: "Community Center",
    social_facility: "Social Services",
    swimming_pool: "Pool",
    public_bath: "Public Bath",
    park: "Park / Shade",
    rec_centre: "Recreation Center",
    cinema: "Cinema",
    mall: "Shopping Mall",
    place_of_worship: "House of Worship",
  };
  return map[raw] ?? raw.replace(/_/g, " ");
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}
