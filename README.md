# 🌾 KrishiVayu (कृषिवायु)

> **From Smoke to Solution:** Real-Time Satellite Telemetry, Atmospheric Airshed Risk Modeling, and Hyperlocal Biomass Marketplace for Stubble-Free Airsheds.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![NASA FIRMS](https://img.shields.io/badge/NASA-FIRMS_VIIRS_375m-red?logo=nasa)](https://firms.modaps.eosdis.nasa.gov/)
[![Open-Meteo](https://img.shields.io/badge/Weather-Open--Meteo_ECMWF-007ACC)](https://open-meteo.com/)
[![Tests](https://img.shields.io/badge/Tests-15%20Suites%20Passing-success)](https://github.com/Sanjna07/KrishiVayu)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**🌐 Live Production Platform:** [https://krishi-vaayu.vercel.app/](https://krishi-vaayu.vercel.app/)

---

## 📌 Executive Summary

Every year between **October 15 and November 15**, over **20 million metric tonnes** of paddy straw are burned across Punjab and Haryana. Within 48 hours, prevailing north-westerly wind plumes transport dense particulate matter ($\text{PM}_{2.5}$) into the Indo-Gangetic Plains, pushing the Air Quality Index (AQI) in Delhi-NCR past hazardous levels ($450+$).

Farmers do not burn out of disregard for the environment; they face an acute **15-to-20-day race against the calendar** to sow winter wheat. A delay in wheat planting reduces crop yields by **1% to 1.5% per day**, while clearing fields with baling machinery costs ₹1,500–₹2,500 per acre.

Meanwhile, nearby **bio-CNG (CBG) plants, biomass pellet units, and thermal power stations** are legally mandated to co-fire green biomass, yet struggle with fragmented supply chains and zero visibility into available stubble.

**KrishiVayu solves the connection and information gap:**
We integrate **NASA VIIRS 375m thermal infrared fire telemetry** with **Open-Meteo 10m atmospheric wind vectors** to calculate a calibrated Delhi Airshed Risk Score ($0-100$). Instead of merely highlighting fires on a map, KrishiVayu connects farmers directly to nearby certified clean buyers through a **privacy-first, trilingual (EN / हिन्दी / ਪੰਜਾਬੀ) marketplace** with an automated **Fast2SMS notification pipeline**.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             THE KRISHIVAYU PIPELINE                              │
│                                                                                  │
│  [NASA VIIRS Satellites] + [10m Wind Trajectory]                                 │
│                           │                                                      │
│                           ▼                                                      │
│              [Delhi Airshed Risk Engine (0-100)]                                 │
│                           │                                                      │
│                           ▼                                                      │
│        [Trilingual WhatsApp & Fast2SMS Farmer Alerts]                            │
│                           │                                                      │
│                           ▼                                                      │
│        [Residue Marketplace (/market & /market/sell)]                            │
│           • Farmer lists stubble for free (CPCB Benchmark: ₹180-₹220/Qtl)        │
│           • Bio-CNG / Pellet units submit purchase bids                          │
│                           │                                                      │
│                           ▼                                                      │
│        [Private Farmer Dashboard (/market/manage/[token])]                       │
│           • 100% PII Masked (Numbers revealed only on mutual accept)             │
│           • Cryptographic SHA-256 tokens                                         │
│           • Real-time SMS dispatches for bids, acceptance, & pickup              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Capabilities

### 1. 🛰️ Satellite Detection & Atmospheric Risk Modeling
- **High-Resolution NASA VIIRS Integration**: Dual-satellite ingestion from Suomi-NPP and NOAA-20 VIIRS at 375m thermal spatial resolution, detecting small 1-to-2 acre active crop burns in near-real-time.
- **Aerodynamic Wind Alignment**: Real-time 10m wind direction and velocity from the European ECMWF model. Calculates the cosine alignment of smoke plumes heading toward Delhi-NCR.
- **Calibrated Delhi Airshed Risk Score ($0–100$)**:
  $$\text{Risk Score} = 0.40 \cdot S_{\text{fire}} + 0.30 \cdot S_{\text{dist}} + 0.30 \cdot S_{\text{wind}}$$
  - **Fire Volume (40%)**: Normalized active fire count and radiative power (FRP).
  - **Proximity to NCR (30%)**: Geodesic Haversine distance scaled between 50 km and 450 km.
  - **Wind Trajectory (30%)**: Normalized plume heading toward Central Delhi ($28.6129^\circ\text{ N}, 77.2295^\circ\text{ E}$).
- **Interactive Map Canvas**: Built on MapLibre GL v5 and CARTO Positron vector tiles, rendering dynamic district risk heat polygons (`#C62828` Critical, `#E65100` High, `#F9A825` Moderate, `#2E7D32` Low).

### 2. 🌐 Site-Wide Trilingual Architecture (`EN` | `हिन्दी` | `ਪੰਜਾਬੀ`)
- Native vernacular localization designed for grassroots farmers, village panchayats, and industrial operators.
- Centrally managed via a reactive `LanguageContext` persisted in `localStorage`.
- Real-time language switching across all pages, navigation bar, dashboards, modals, drawers, and charts without reloading.

### 3. 🌾 Farmer Residue Marketplace (`/market` & `/market/sell`)
- **Centered 3-Step Wizard**: Zero-friction listing flow (1. Location & District $\rightarrow$ 2. Quantity & Baled/Loose Form $\rightarrow$ 3. Timing, Asking Price, & Alert Mobile).
- **CPCB Benchmark Guidance**: Transparently highlights the Central Pollution Control Board (CPCB) ex-situ rate (₹180–₹220 per quintal) while allowing custom farmer asking prices.
- **Synced Map & Split Feed**: Filter by district, straw form (baled bundles vs. loose straw), and availability status.
- **Verified Clean Alternatives**: Hyperlocal directory of 29+ certified Compressed Bio-Gas (CBG) facilities, pellet plants, and Custom Hiring Centres (CHCs).

### 4. 📲 Fast2SMS Automated Notification Pipeline
Integrated with Fast2SMS developer gateway to keep farmers informed on basic feature phones without requiring internet access:
- **Event 1 (Listing Created)**: SMS sent to farmer with their private recovery dashboard link.
- **Event 2 (New Offer Received)**: Instant SMS alert with buyer name, rate offered, and review link.
- **Event 3 (Offer Accepted)**: SMS sent to buyer with the farmer's contact number to coordinate farmgate collection.
- **Event 4 (Offer Declined)**: Notification sent to buyer to browse other available listings.
- **Event 5 (Residue Collected)**: Confirmation SMS sent to both parties acknowledging clean off-take and emission prevention.

### 5. 🔐 Privacy-First Architecture & Security
- **Zero Public Phone Numbers**: Farmer and buyer phone numbers are never exposed on public pages or browse APIs.
- **Gated Mutual Contact Reveal**: Phone numbers are unlocked **only** after the farmer officially accepts an offer.
- **Cryptographic Access Tokens**: Farmers access their management dashboard via an unguessable 32-character random access token (`token=...`). The backend stores only a one-way SHA-256 hash (`editTokenHash`).
- **Two-Way Community Anti-Spam Reporting**: Built-in reporting system (`/api/market/reports`). Any listing or offer receiving $>3$ reports is automatically quarantined (`isFlagged: true`) for administrative review.
- **Formula-Injection Safe CSV Export**: All district risk and historical trends exports sanitize RFC 4180 spreadsheet injection characters (`=`, `+`, `-`, `@`, `\t`, `\r`).

### 6. 📊 Historical Trends & Seasonal Analytics (`/trends`)
- Multi-year satellite data archive (2020–2025) from **ICAR-IARI CREAMS** (Consortium for Research on Agroecosystem Monitoring and Modeling from Space).
- Visualizes the chronic 5-district concentration (Sangrur, Bathinda, Ferozepur, Muktsar, Patiala) where $>50\%$ of fires occur.
- Seasonal comparison toggle: **Paddy (Kharif, Oct–Nov)** vs. **Wheat (Rabi, Apr–May)**.
- Dynamic Recharts visualizations: Responsive `AreaChart` for multi-year trends and `BarChart` for single-year views.

### 7. 🎙️ Sarvam AI Vernacular Voice Fill (`saaras:v4`)
- **Zero-Typing Listing Wizard**: Farmers speak naturally in **Hindi, Punjabi, or conversational Hinglish** to list their stubble.
- **Context-Aware Extraction**: Powered by Sarvam AI's latest `saaras:v4` Speech-to-Text model, extracting crop variety, acreage, quintal conversion, baled/loose status, asking rate, and location entities.
- **Vernacular Audio Guidance**: Pre-recorded trilingual audio instructions, interactive countdown recording timer, live voice playback, and explicit green tags (`✓ Voice Updated`) marking auto-filled fields.

### 8. 📍 One-Click GPS Geolocation & Smart District Scoping
- **Universal Navbar GPS Action**: One-click geolocation button embedded beside the trilingual switcher across the entire application.
- **Reverse Geocoding**: Automatically resolves GPS coordinates into canonical Village, Tehsil, and District via OpenStreetMap Nominatim with offline centroid fallbacks.
- **Automated Feed & Map Scoping**: Dynamically filters `/market` listing feed and synchronized MapLibre view to the user's localized home district.

### 9. 🚚 Dynamic Transport Cost Estimator & Landed Buyer Price
- **True Delivered Landed Cost**: Real-time economic transparency in the buyer offer modal:
  $$\text{Buyer Landed Cost (₹/Qtl)} = \text{Farmer Rate} + \left(\frac{\text{Distance (km)} \times \text{Transport Cost per km}}{\text{Quantity (Qtl)}}\right)$$
- **Interactive Controls**: Auto-estimated highway distances between buyer and farm districts, editable distance chips (`15 km`, `35 km`, `60 km`, `95 km`), and vehicle freight rates (`🚜 Tractor ₹35/km`, `🚛 10-Tyre ₹45/km`, `🚚 Heavy Truck ₹55/km`).
- **Policy Threshold Verification**: Instant visual validation against the CPCB/PEDA economic procurement ceiling (₹180–₹230 / Quintal).

---

## 🎨 Design System: Government-Portal Light Theme

KrishiVayu is styled according to authentic Indian Government Digital Service standards:
- **Page Background:** `#F5F7FA` (Calm government-portal light gray)
- **Cards & Surfaces:** `#FFFFFF` with `1px solid #D9DEE5` borders and rounded corners
- **Brand Navy:** `#1F3A5F` (Headers, branding, active navigation)
- **Action Green:** `#2E7D32` (Primary CTAs, positive status badges)
- **Indian Tricolor Accent:** Saffron (`#FF9933`), White (`#FFFFFF`), India Green (`#138808`)
- **Contrast & Accessibility:** WCAG 2.1 AA compliant high-contrast text (`#1B2430` Slate / `#5B6675` Muted Gray).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.2.4 (App Router), React 19.2.4, TypeScript 5 |
| **Styling & Icons** | Tailwind CSS v4, Lucide React Icons |
| **Interactive Maps** | MapLibre GL v5.24.0, CARTO Positron vector tiles |
| **Data Visualization** | Recharts v3.8.1 |
| **Voice AI (STT)** | Sarvam AI API (`saaras:v4` Hindi/Punjabi Speech-to-Text & Entity Parsing) |
| **Fire Telemetry API** | NASA EOSDIS FIRMS API (VIIRS 375m SNPP & NOAA-20) |
| **Atmospheric Wind API**| Open-Meteo European ECMWF 10m atmospheric model |
| **Geolocation Engine** | HTML5 Geolocation API, OpenStreetMap Nominatim Reverse Geocoder |
| **SMS Gateway** | Fast2SMS Developer API (`bulkV2` quick transaction route) |
| **Security & Auth** | Node.js `crypto` (SHA-256 token hashing), RFC 4180 CSV sanitization |
| **Testing** | Node.js Test Runner, TSX, Comprehensive 15-suite automated matrix |

---

## 📐 Mathematical Models & Formulas

### 1. Geodesic Distance & Bearing (Haversine Formula)
Calculates the distance from any farm fire $(lat_1, lon_1)$ to Central Delhi $(28.6129^\circ\text{ N}, 77.2295^\circ\text{ E})$:
$$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
$$d = R \cdot \Delta\sigma \quad (\text{where } R = 6371\text{ km})$$

The forward bearing $\theta_{\text{NCR}}$ is calculated using spherical trigonometry:
$$\theta_{\text{NCR}} = \text{atan2}\left(\sin\Delta\lambda \cos\phi_2, \; \cos\phi_1 \sin\phi_2 - \sin\phi_1 \cos\phi_2 \cos\Delta\lambda\right)$$

### 2. Aerodynamic Plume Alignment Model
Calculates how directly the prevailing 10m wind direction ($\theta_{\text{wind}}$) blows toward Delhi:
$$\Delta\theta = |\theta_{\text{wind}} - \theta_{\text{NCR}}|$$
$$\text{Alignment} = \max\left(0, \cos(\Delta\theta)\right)$$
- **$\text{Alignment} = 1.0$**: Wind blows straight toward Delhi (Maximum threat).
- **$\text{Alignment} = 0.5$**: Crosswind.
- **$\text{Alignment} = 0.0$**: Wind blows away from Delhi (Zero transport threat).

### 3. Buyer Effective Landed Cost Model
Determines the true delivered cost of crop residue per quintal for industrial buyers:
$$\text{Effective Cost (₹/Qtl)} = P_{\text{farmer}} + \frac{D \cdot C_{\text{km}}}{Q}$$
- $P_{\text{farmer}}$: Farmer offer / asking price (₹ / Quintal)
- $D$: Road haul distance from farm to plant (km)
- $C_{\text{km}}$: Freight vehicle rate (₹ / km) — e.g. Tractor Trolley (₹35/km), 10-Tyre Truck (₹45/km)
- $Q$: Total residue quantity in lot (Quintals)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (tested on Node v20 LTS and v24 LTS)
- npm 10+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Sanjna07/KrishiVayu.git
cd krishivayu
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# NASA FIRMS API Key (Optional: system automatically fails over to bundled calibrated snapshot if unset)
FIRMS_MAP_KEY=your_nasa_firms_key_here

# Fast2SMS API Key (Optional: system logs mock dispatches if unset)
FAST2SMS_API_KEY=your_fast2sms_api_key_here

# Base URL for constructing WhatsApp share and SMS dashboard links
NEXT_PUBLIC_SITE_URL=https://krishi-vaayu.vercel.app
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Comprehensive Test Suite

KrishiVayu includes **15 automated test suites** covering domain math, API contracts, full lifecycle state machines, SMS delivery, voice AI parsing, and security:

```bash
npm test
```

### Test Coverage Matrix:
1. `tests/domain.test.ts`: Geodesic distance, bearing benchmarks, and aerodynamic wind alignment models.
2. `tests/weather.test.ts`: Live Open-Meteo ingestion, cardinal conversions, and error fallback paths.
3. `tests/alternatives.test.ts`: Schema verification and nearest clean buyer spatial matching.
4. `tests/resilience.test.ts`: Bundled offline snapshot integrity and risk scoring stability.
5. `tests/market.test.ts`: Marketplace input sanitization, phone normalization, and 11 invalid lifecycle transition guards.
6. `tests/repo.test.ts`: Idempotent seed data verification, token lookup round-trips, and demo flag integrity.
7. `tests/api-matrix.test.ts`: API route security, PII redaction, token authorization, and rate limiting.
8. `tests/lifecycle.test.ts`: End-to-end 10-step lifecycle (create $\rightarrow$ offer $\rightarrow$ accept $\rightarrow$ unlock $\rightarrow$ schedule $\rightarrow$ collect).
9. `tests/whatsapp-integration.test.ts`: Trilingual advisory templates (EN/HI/PA) and URL encoding.
10. `tests/demand-signal.test.ts`: District-level demand signal aggregation without PII leaks.
11. `tests/csv.test.ts`: Formula injection protection (`=`, `+`, `-`, `@`) on CSV exports.
12. `tests/reports.test.ts`: Two-way community reporting and auto-quarantine threshold at $>3$ flags.
13. `tests/sms.test.ts`: Fast2SMS mock fallback and event-driven SMS dispatch pipeline across all 5 events.
14. `tests/gps.test.ts`: GPS boundary checks, coordinate validation, and reverse geocode district resolution.
15. `tests/sarvam.test.ts`: Sarvam AI `saaras:v4` STT pipeline, audio MIME cleaning, acreage conversion, and Hinglish entity extraction.

---

## 📂 Project Directory Structure (3-Tier Full-Stack Architecture)

KrishiVayu follows the official Next.js 16 App Router architecture, cleanly decoupled into **Frontend UI**, **Backend Microservices**, and **Shared Domain Contracts**:

```
krishivayu/
├── 🖥️ [FRONTEND UI & CLIENT STATE]
│   ├── src/app/                          # Page Views & Layouts
│   │   ├── page.tsx                      # 🏠 Home: Interactive Risk Map & Hotspots
│   │   ├── market/page.tsx               # 🛒 Stubble Marketplace Feed & Map
│   │   ├── market/sell/page.tsx          # 🌾 3-Step Listing Wizard (Voice + GPS)
│   │   ├── market/manage/[token]/        # 👨‍🌾 Private Farmer Management Dashboard
│   │   ├── trends/page.tsx               # 📊 Historical Satellite Trends (2020-2025)
│   │   └── layout.tsx                    # Root Layout with Trilingual & Location Contexts
│   ├── src/components/                   # 🎨 Reusable UI Components
│   │   ├── ListingModal.tsx              # Transport Cost Estimator & Bidding Modal
│   │   ├── VoiceFillModal.tsx            # Sarvam AI Vernacular Voice Fill Modal
│   │   ├── MainMap.tsx / MarketMap.tsx   # MapLibre GL Interactive Maps
│   │   ├── GpsButton.tsx                 # Auto-Detect Location Button
│   │   └── Navbar.tsx / Footer.tsx       # Trilingual Navigation & Footers
│   └── src/context/                      # 🔄 React Client State Providers
│       ├── LanguageContext.tsx           # Trilingual Switcher (EN / HI / PA)
│       └── LocationContext.tsx           # Global GPS Geolocation State
│
├── ⚙️ [BACKEND APIS & DOMAIN ENGINES]
│   ├── src/app/api/                      # 🌐 REST Serverless Microservices
│   │   ├── ai/sarvam/voice-fill/         # Sarvam AI STT & Entity Extraction API
│   │   ├── geo/reverse/                  # GPS Reverse Geocoding API (OSM Nominatim)
│   │   ├── market/listings/              # Stubble Listing CRUD & Scoping API
│   │   ├── market/offers/                # Buyer Bidding & Landed Cost Offer API
│   │   ├── market/reports/               # Two-Way Anti-Spam Reporting API
│   │   ├── firms/                        # NASA VIIRS Telemetry Proxy & Caching
│   │   ├── matches/                      # Airshed Composite Risk Calculation Engine
│   │   └── weather/                      # Open-Meteo Wind Vector Engine
│   └── src/lib/                          # 🧠 Backend Logic, Services & Repositories
│       ├── services/
│       │   ├── sarvamService.ts          # Sarvam AI STT Client (`saaras:v4`)
│       │   └── smsService.ts             # Fast2SMS Notification Client
│       ├── repo/
│       │   ├── marketRepo.ts             # Thread-Safe In-Memory / File Repository
│       │   └── mongoMarketRepo.ts        # Production MongoDB Repository
│       ├── geo.ts                        # Haversine Distance & Bearing Spherical Math
│       ├── risk.ts                       # Calibrated Delhi Airshed Risk Engine
│       ├── weather.ts                    # Wind Trajectory & Smoke Alignment Math
│       └── sarvamEntityExtractor.ts      # Multi-dialect Regex & Hinglish Entity Parser
│
├── 📐 [SHARED DOMAIN CONTRACTS]
│   └── src/types/                        # TypeScript Interfaces (Market, Buyer, Offer, Weather)
│
├── 🧪 [TESTING MATRIX]
│   └── tests/                            # 15 Automated Unit, Integration, & Security Test Suites
│
└── 📦 [STATIC DATA & ASSETS]
    ├── public/data/                      # Alternatives, GeoJSON, Historical CREAMS archives
    └── public/audio/                     # Sarvam AI Hindi & Punjabi Audio Instruction Guides
```

---

## 📜 Full Forms & Technical Glossary

- **VIIRS:** Visible Infrared Imaging Radiometer Suite
- **FIRMS:** Fire Information for Resource Management System (NASA EOSDIS)
- **CPCB:** Central Pollution Control Board (Government of India)
- **PEDA:** Punjab Energy Development Agency
- **CREAMS:** Centre for Resource Economics, Agriculture and Management Studies (ICAR-IARI)
- **CBG:** Compressed Bio-Gas (under the Government of India SATAT initiative)
- **CHC:** Custom Hiring Centre (Village-level cooperative machinery hubs)
- **FRP:** Fire Radiative Power (in Megawatts, measuring fire combustion intensity)
- **AQI:** Air Quality Index
- **$\text{PM}_{2.5}$:** Fine Particulate Matter ($<2.5$ micrometers in aerodynamic diameter)
- **NCR:** National Capital Region (Delhi and surrounding districts)

---

## ⚖️ Disclaimers & Independent Project Notice

KrishiVayu is an independent civic-tech open-data initiative created to mitigate seasonal air pollution and support rural biomass valorization. It is **not an official government service** and does not represent the Government of India, the State Government of Punjab, or the State Government of Haryana. KrishiVayu does not handle banking transactions or escrow payments; all financial off-take arrangements are executed directly between farmers and certified buyers.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
