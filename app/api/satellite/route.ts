import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");
  if (!lat || !lng) return new Response("lat/lng required", { status: 400 });

  // ~500 m bounding box — enough context to see block-level heat patterns
  const d = 0.0045;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;

  const url =
    `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export` +
    `?bbox=${bbox}&bboxSR=4326&size=640,640&format=png32&transparent=false&f=image`;

  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return new Response("Satellite fetch failed", { status: 502 });

  const buffer = await res.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
