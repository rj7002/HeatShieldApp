import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HeatShield: Urban Heat Island Assistant",
    short_name: "HeatShield",
    description: "Know your heat risk. Find cooling near you. Take action.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#f97316",
    orientation: "portrait",
    categories: ["health", "weather", "utilities"],
    icons: [
      { src: "/icon.svg",     sizes: "any",     type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png",     purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png",     purpose: "maskable" },
    ],
  };
}
