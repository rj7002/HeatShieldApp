# HeatShield

> **Urban Heat Island Resident Assistant** — Know your risk. Find cooling near you. Take action.

---

## The Problem

Urban heat islands make city neighborhoods up to **20°F hotter** than surrounding rural areas. This isn't random — it follows the lines of historical disinvestment. Low-income neighborhoods have less tree cover, more pavement, older buildings, and fewer resources to cope. The result: thousands of heat-related deaths every year, overwhelmingly in communities that can least afford AC.

**Residents have almost no tools built for them.** HeatShield changes that.

---

## What It Does

Enter any address and HeatShield instantly provides:

### Heat Risk Profile
- **Live UHI delta**: Real temperature comparison between your urban location and a rural reference point 25 km away (Open-Meteo, no API key required)
- **AI-powered risk score** (1–10): Gemini analyzes temperature, humidity, and urban conditions
- **Risk factors, vulnerable groups, and health risks** specific to your location

### Cooling Centers Finder
- Real data from OpenStreetMap via Overpass API — libraries, community centers, pools, parks within 3 km
- Shows distance, address, and opening hours

### AI Action Plan (Streaming)
- Tell HeatShield your housing type and renter/owner status
- Gemini streams a personalized plan in three tiers: immediate, short-term, and community-level
- Renter-specific options that don't require landlord permission

### Community Impact Calculator
- Sliders for trees planted, cool roof coverage, and green space
- Estimates temperature reduction and CO2 savings from community interventions

### Emergency Resources
- Direct links to 211, LIHEAP, DOE Weatherization, EPA Heat Island resources, and Tree Equity Score

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Google Gemini 2.5 Flash |
| Weather | Open-Meteo (free, no key) |
| Geocoding | Nominatim / OpenStreetMap (free, no key) |
| Places | Overpass API / OpenStreetMap (free, no key) |

**The only API key required is Google AI (Gemini).**

---

## Getting Started

```bash
# Install dependencies
cd heatshield
npm install

# Add your Google AI key to .env.local
echo "GOOGLE_AI_API_KEY=..." > .env.local

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
app/
  page.tsx                  # Landing page
  results/page.tsx          # Results dashboard
  api/
    heat-profile/route.ts   # UHI analysis (geocode + weather + Gemini)
    cooling/route.ts        # OSM cooling centers
    action-plan/route.ts    # Streaming Gemini action plan
lib/
  geocode.ts                # Nominatim geocoding
  weather.ts                # Open-Meteo weather
  overpass.ts               # OSM Overpass + haversine distance
```

---
