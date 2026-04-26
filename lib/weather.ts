export interface WeatherPoint {
  temp_c: number;
  temp_f: number;
  feels_like_c: number;
  humidity: number;
  description: string;
}

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherPoint> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weathercode` +
    `&temperature_unit=celsius&wind_speed_unit=mph&timezone=auto`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("Open-Meteo fetch failed");
  const json = await res.json();
  const c = json.current;
  const temp_c = c.temperature_2m ?? 0;
  return {
    temp_c,
    temp_f: (temp_c * 9) / 5 + 32,
    feels_like_c: c.apparent_temperature ?? temp_c,
    humidity: c.relative_humidity_2m ?? 0,
    description: wmoDescription(c.weathercode ?? 0),
  };
}

// Fetches urban + N rural points in parallel, returns the averaged rural temp as uhiDelta.
export async function getUrbanAndRuralTemps(
  urbanLat: number,
  urbanLng: number,
  ruralPoints: { lat: number; lng: number }[]
) {
  const [urban, ...ruralResults] = await Promise.all([
    fetchOpenMeteo(urbanLat, urbanLng),
    ...ruralPoints.map((p) => fetchOpenMeteo(p.lat, p.lng)),
  ]);
  const ruralAvgC =
    ruralResults.reduce((sum, r) => sum + r.temp_c, 0) / ruralResults.length;
  const uhiDelta = parseFloat((urban.temp_c - ruralAvgC).toFixed(1));
  return { urban, uhiDelta };
}

export interface ForecastDay {
  date: string;
  label: string;
  urban_max_f: number;
  rural_max_f: number;
  urban_min_f: number;
}

export async function getWeeklyForecast(
  urbanLat: number,
  urbanLng: number,
  ruralPoints: { lat: number; lng: number }[]
): Promise<ForecastDay[]> {
  const params =
    "daily=temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=auto&forecast_days=7";

  const [urbanRes, ...ruralResponses] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${urbanLat}&longitude=${urbanLng}&${params}`),
    ...ruralPoints.map((p) =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&${params}`)
    ),
  ]);

  if (!urbanRes.ok) return [];
  const [u, ...ruralJsons] = await Promise.all([
    urbanRes.json(),
    ...ruralResponses.map((r) => (r.ok ? r.json() : Promise.resolve(null))),
  ]);
  const validRurals = ruralJsons.filter(Boolean);

  const days: ForecastDay[] = (u.daily?.time ?? []).map((date: string, i: number) => {
    const urbanMax = u.daily.temperature_2m_max[i] ?? 0;
    const urbanMin = u.daily.temperature_2m_min[i] ?? 0;

    const ruralMaxes = validRurals.map(
      (r) => r.daily?.temperature_2m_max?.[i] ?? urbanMax
    );
    const ruralAvgMax =
      ruralMaxes.reduce((s, v) => s + v, 0) / (ruralMaxes.length || 1);

    const d = new Date(date);
    return {
      date,
      label: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      urban_max_f: parseFloat(((urbanMax * 9) / 5 + 32).toFixed(1)),
      rural_max_f: parseFloat(((ruralAvgMax * 9) / 5 + 32).toFixed(1)),
      urban_min_f: parseFloat(((urbanMin * 9) / 5 + 32).toFixed(1)),
    };
  });
  return days;
}

function wmoDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 9) return "Fog";
  if (code <= 19) return "Drizzle";
  if (code <= 29) return "Rain";
  if (code <= 39) return "Snow";
  if (code <= 49) return "Fog";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 84) return "Rain showers";
  if (code <= 94) return "Thunderstorm";
  return "Thunderstorm with hail";
}
