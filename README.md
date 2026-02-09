<div align="center">

```
    ____       ____    _ ____
   / __ \___  / / /_  (_) __ \____  _____
  / / / / _ \/ / __ \/ / / / / __ \/ ___/
 / /_/ /  __/ / / / / / /_/ / /_/ (__  )
/_____/\___/_/_/ /_/_/\____/ .___/____/
                          /_/
```

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=28&duration=3000&pause=1000&color=00FF41&center=true&vCenter=true&multiline=true&repeat=true&width=650&height=80&lines=%5BSYS%5D+DELHI+URBAN+OPS+DASHBOARD;%3E+REAL-TIME+CITY+INTELLIGENCE+SYSTEM" alt="Typing SVG" />

<br/>

![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-00ff41?style=for-the-badge&labelColor=0a0a0a)
![Build](https://img.shields.io/badge/BUILD-PASSING-00ff41?style=for-the-badge&labelColor=0a0a0a)
![License](https://img.shields.io/badge/LICENSE-MIT-00ff41?style=for-the-badge&labelColor=0a0a0a)

<img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white&labelColor=0a0a0a" /> <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=0a0a0a" /> <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=flat-square&logo=vite&logoColor=white&labelColor=0a0a0a" /> <img src="https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=0a0a0a" /> <img src="https://img.shields.io/badge/Express-5.2-90C53F?style=flat-square&logo=express&logoColor=white&labelColor=0a0a0a" /> <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white&labelColor=0a0a0a" /> <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white&labelColor=0a0a0a" /> <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socketdotio&logoColor=white&labelColor=0a0a0a" />

---

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=12&duration=2000&pause=500&color=3a5a3a&center=true&vCenter=true&repeat=true&width=400&height=20&lines=%3E+Initializing+system+modules...;%3E+Loading+threat+analysis+engine...;%3E+Connecting+to+sensor+network...;%3E+All+systems+nominal.+Welcome." alt="Loading" />

</div>

---

## `> SYSTEM_OVERVIEW`

**DelhiOps** is a full-stack, real-time urban operations dashboard for monitoring Delhi NCR's critical city infrastructure. Built with a cyberpunk-inspired command center UI, it aggregates data from multiple government APIs, IoT sensors, and intelligence feeds into a unified situational awareness platform.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OPERATIONAL MODULES                             │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│  AIR QUALITY │   TRAFFIC    │    CRIME     │     INCIDENTS         │
│  ██████████  │  ██████████  │  ██████████  │  ██████████           │
│  AQI Monitor │  Flow Ctrl   │  Intel Hub   │  Response Mgmt       │
│  6 Pollutants│  Google Maps │  Hotspot Map │  Live Timeline        │
│  Radar Chart │  Zone Anlys  │  Area Rank   │  Severity Grid        │
│  Human Viz   │  Signal Mon  │  Live Feed   │  Charts               │
├──────────────┴──────────────┴──────────────┴───────────────────────┤
│  CAMERAS: 200+ feeds  │  AI TERMINAL  │  REPORTS  │  ADMIN PANEL  │
└────────────────────────┴───────────────┴──────────┴───────────────┘
```

---

## `> FEATURE_MATRIX`

<table>
<tr>
<td width="50%">

### `// AIR QUALITY INTELLIGENCE`
- SVG Human Silhouette with breathing animation
- Pollutant Radar Chart (PM2.5, PM10, O3, NO2, SO2, CO)
- Real-time AQI Gauge with color-coded danger levels
- Live Feed terminal with scrollable readings
- Trend analysis with interactive charts
- CPCB + OpenWeatherMap API integration

</td>
<td width="50%">

### `// TRAFFIC COMMAND`
- Google Maps live traffic overlay
- Zone-wise congestion analysis
- Busy corridor identification
- Traffic signal monitoring
- Road network visualization
- Camera grid with live feeds

</td>
</tr>
<tr>
<td width="50%">

### `// CRIME DASHBOARD`
- Interactive hotspot heatmap
- Crime type & severity breakdown
- Area ranking by crime density
- Live incident feed
- Statistical overview cards
- Report filing system

</td>
<td width="50%">

### `// INCIDENT RESPONSE`
- Real-time incident timeline
- Severity-based grid display
- Status tracking (Open/Responding/Resolved)
- Statistical analysis charts
- Priority-based alert system
- WebSocket live updates

</td>
</tr>
</table>

---

## `> ARCHITECTURE`

```
                          ┌─────────────────────────┐
                          │      NGINX / TUNNEL      │
                          │   (ngrok / cloudflare)   │
                          └────────────┬────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                      │
          ┌─────────▼─────────┐              ┌─────────────▼──────────┐
          │   VITE DEV SERVER  │              │   EXPRESS 5 API        │
          │   React 19 + TS    │◄────────────►│   Node.js Backend      │
          │   Port: 5173       │   REST API   │   Port: 3000           │
          │                    │   WebSocket  │                        │
          │  ┌──────────────┐  │              │  ┌──────────────────┐  │
          │  │ 11 Pages     │  │              │  │ 7 Controllers    │  │
          │  │ 58 Components│  │              │  │ 8 Route Files    │  │
          │  │ 5 Hooks      │  │              │  │ 6 Middlewares    │  │
          │  │ 2 Contexts   │  │              │  │ 17 Services      │  │
          │  └──────────────┘  │              │  └──────────────────┘  │
          └────────────────────┘              └───────┬───────┬────────┘
                                                      │       │
                                          ┌───────────▼┐  ┌───▼──────────┐
                                          │ PostgreSQL  │  │    Redis     │
                                          │  + PostGIS  │  │  L1/L2 Cache │
                                          │  7 Tables   │  │  Smart TTLs  │
                                          └─────────────┘  └──────────────┘
                                                      │
                                          ┌───────────▼────────────┐
                                          │   EXTERNAL APIs        │
                                          │  ├─ CPCB (AQI)        │
                                          │  ├─ OpenWeatherMap     │
                                          │  ├─ Google Routes      │
                                          │  ├─ TomTom Traffic     │
                                          │  └─ Google Gemini AI   │
                                          └────────────────────────┘
```

---

## `> TECH_STACK`

<table>
<tr><td colspan="2" align="center"><b>

`FRONTEND ARSENAL`

</b></td></tr>
<tr>
<td><b>Core</b></td>
<td>React 19 &bull; TypeScript 5.9 &bull; Vite 7 &bull; React Router 7</td>
</tr>
<tr>
<td><b>Styling</b></td>
<td>Tailwind CSS 4 &bull; Glassmorphism &bull; CSS Animations &bull; Custom Theming</td>
</tr>
<tr>
<td><b>Data Viz</b></td>
<td>Recharts 3 &bull; SVG Gauges &bull; Radar Charts &bull; Sparklines</td>
</tr>
<tr>
<td><b>Maps</b></td>
<td>Google Maps API &bull; Custom SVG Maps &bull; Hotspot Heatmaps</td>
</tr>
<tr>
<td><b>Real-time</b></td>
<td>Socket.IO Client &bull; WebSocket Events &bull; Live Feeds</td>
</tr>
<tr>
<td><b>AI</b></td>
<td>Google Generative AI (Gemini) &bull; AI Terminal Interface</td>
</tr>
</table>

<table>
<tr><td colspan="2" align="center"><b>

`BACKEND ARSENAL`

</b></td></tr>
<tr>
<td><b>Runtime</b></td>
<td>Node.js 18+ &bull; Express 5 &bull; Nodemon</td>
</tr>
<tr>
<td><b>Database</b></td>
<td>PostgreSQL 16 + PostGIS &bull; 7 Tables &bull; Materialized Views</td>
</tr>
<tr>
<td><b>Cache</b></td>
<td>Redis 7 &bull; L1 In-Memory &bull; L2 Distributed &bull; Smart TTLs</td>
</tr>
<tr>
<td><b>Auth</b></td>
<td>JWT &bull; bcrypt &bull; Role-Based Access (Admin/Operator/Viewer)</td>
</tr>
<tr>
<td><b>Security</b></td>
<td>Helmet &bull; CORS &bull; Rate Limiting &bull; Request Validation (Joi)</td>
</tr>
<tr>
<td><b>Resilience</b></td>
<td>Circuit Breaker &bull; Retry Logic &bull; Graceful Degradation</td>
</tr>
<tr>
<td><b>Logging</b></td>
<td>Winston &bull; Request Correlation IDs &bull; Structured JSON Logs</td>
</tr>
<tr>
<td><b>Docs</b></td>
<td>OpenAPI/Swagger UI &bull; API Documentation</td>
</tr>
</table>

---

## `> QUICK_START`

### Prerequisites

```bash
# Required services
> node --version    # v18+
> psql --version    # PostgreSQL 13+
> redis-cli ping    # PONG
```

### Installation

```bash
# Clone the repository
git clone https://github.com/ayushap18/Delhiops.git
cd Delhiops

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your API keys and database credentials

# Initialize database
cd backend
npm run db:init      # Create tables
npm run db:seed      # Seed sample data
npm run db:migrate   # Run migrations
cd ..
```

### Launch

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

```
  ┌─────────────────────────────────────────────────┐
  │                                                   │
  │   > Frontend:  http://localhost:5173               │
  │   > Backend:   http://localhost:3000               │
  │   > API Docs:  http://localhost:3000/api/docs      │
  │                                                   │
  │   Default Login:                                   │
  │     Email:    admin@delhi-ops.gov.in               │
  │     Password: (check .env ADMIN_PASSWORD)          │
  │                                                   │
  └─────────────────────────────────────────────────┘
```

---

## `> EXTERNAL_API_SETUP`

To enable real data feeds, configure these API keys in `backend/.env`:

| API | Purpose | Get Key |
|-----|---------|---------|
| **CPCB** | Air Quality Index data | [data.gov.in](https://data.gov.in) |
| **OpenWeatherMap** | AQI fallback + Weather | [openweathermap.org](https://openweathermap.org/api) |
| **Google Routes** | Live traffic data | [Google Cloud Console](https://console.cloud.google.com) |
| **TomTom** | Traffic fallback | [developer.tomtom.com](https://developer.tomtom.com) |
| **Google Maps** | Frontend map rendering | [Google Cloud Console](https://console.cloud.google.com) |
| **Google Gemini** | AI Terminal assistant | [Google AI Studio](https://aistudio.google.com) |

> Without API keys, the system runs on mock data generators with realistic Delhi NCR patterns.

---

## `> CACHING_STRATEGY`

```
REQUEST → L1 (In-Memory) → L2 (Redis) → Database → External API
             2000 entries     TTL-based     PostGIS     Circuit Breaker
             instant          ~1ms          ~5-50ms     ~100-500ms

Cache TTLs:
  ├─ AQI Data ........... 5 min
  ├─ Traffic Data ....... 2 min  (rush-hour: 30s)
  ├─ Incidents .......... 1 min
  ├─ Crime Data ......... 15 min
  ├─ Camera Feeds ....... 30 min
  └─ System Metrics ..... 10 min

Special:
  ├─ Rush-hour preload .. 7:30 AM & 5:00 PM IST
  └─ Cache warming ...... On server startup
```

---

## `> DATABASE_SCHEMA`

```sql
-- Core Tables
air_quality_readings   -- AQI + 6 pollutants + geolocation
traffic_data           -- Congestion levels + speed + timestamps
crime_reports          -- Type, severity, status, location
cameras                -- Feed URLs, status, geolocation
incidents              -- Priority, status, assignments
users                  -- Auth + roles (Admin/Operator/Viewer)
system_metrics         -- CPU, memory, uptime tracking

-- Optimization
+ PostGIS spatial indexes
+ Time-based partitioning
+ Materialized views for aggregations
+ Data retention policies (Hot/Warm/Cold)
```

---

## `> PROJECT_STRUCTURE`

```
Delhiops/
├── frontend/                    # React 19 + TypeScript
│   ├── src/
│   │   ├── components/          # 58 reusable components
│   │   │   ├── aqi/             # AQI gauge, radar, human indicator
│   │   │   ├── traffic/         # Maps, signals, cameras
│   │   │   ├── crime/           # Hotspots, rankings, charts
│   │   │   ├── incidents/       # Timeline, severity grid
│   │   │   ├── dashboard/       # Stats grid, alerts feed
│   │   │   ├── layout/          # Sidebar, header, status bar
│   │   │   └── shared/          # Tables, dialogs, spinners
│   │   ├── pages/               # 11 route pages
│   │   ├── hooks/               # 5 custom hooks
│   │   ├── contexts/            # Auth + Socket providers
│   │   └── lib/                 # API client, utils
│   └── vite.config.ts
│
├── backend/                     # Node.js + Express 5
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/     # 7 resource controllers
│   │   │   ├── routes/          # 8 route definitions
│   │   │   ├── middlewares/     # Auth, logging, validation
│   │   │   └── validators/      # Joi request schemas
│   │   ├── services/            # 17 business logic services
│   │   ├── integrations/        # External API clients
│   │   ├── config/              # Environment configuration
│   │   └── utils/               # Logger, errors, pagination
│   ├── database/                # Migrations & scripts
│   ├── test/                    # 6 test suites
│   ├── docs/                    # OpenAPI specification
│   └── Dockerfile
│
└── .gitignore
```

---

## `> API_ENDPOINTS`

```
POST   /api/v1/auth/login          # Authenticate user
POST   /api/v1/auth/register       # Register new user
POST   /api/v1/auth/logout         # Invalidate session
POST   /api/v1/auth/refresh        # Refresh JWT token
GET    /api/v1/auth/me             # Current user profile

GET    /api/v1/aqi                 # List AQI readings
POST   /api/v1/aqi                 # Submit new reading

GET    /api/v1/traffic             # Traffic data feed
POST   /api/v1/traffic             # Submit traffic data

GET    /api/v1/crime               # Crime reports
POST   /api/v1/crime               # File crime report

GET    /api/v1/incidents           # Incident list
POST   /api/v1/incidents           # Create incident
PATCH  /api/v1/incidents/:id       # Update incident

GET    /api/v1/cameras             # Camera feeds
POST   /api/v1/cameras             # Register camera

GET    /api/v1/system/metrics      # System health
GET    /api/docs                   # Swagger UI
```

---

## `> REAL_TIME_EVENTS`

```javascript
// Socket.IO Events (WebSocket)
socket.on('incident:new')          // New incident reported
socket.on('incident:update')       // Status change
socket.on('aqi:reading')           // New AQI sensor data
socket.on('traffic:update')        // Traffic flow change
socket.on('camera:status')         // Camera online/offline
socket.on('alert:broadcast')       // System-wide alert

// Features
├── Redis-backed adapter for horizontal scaling
├── Per-message deflate compression
├── Event batching (500ms intervals)
├── Automatic reconnection (2min max)
└── Role-based event filtering
```

---

## `> SECURITY`

```
┌─────────────────────────────────────────┐
│           SECURITY LAYERS               │
├─────────────────────────────────────────┤
│  Helmet.js ............. HTTP headers   │
│  CORS .................. Origin control │
│  JWT + Blacklist ....... Auth tokens    │
│  bcrypt ................ Password hash  │
│  Rate Limiter .......... DDoS protect   │
│  Joi Validation ........ Input sanitize │
│  Request IDs ........... Audit trail    │
│  Role-Based Access ..... Permission mgmt│
│  Token Blacklist ....... Logout enforce │
│  Circuit Breaker ....... API resilience │
└─────────────────────────────────────────┘
```

---

## `> SCREENSHOTS`

> Screenshots of the dashboard will be added here.

<!-- Uncomment and replace with actual screenshot paths:
### Command Center Dashboard
![Dashboard](screenshots/dashboard.png)

### AQI Intelligence
![AQI](screenshots/aqi.png)

### Traffic Command
![Traffic](screenshots/traffic.png)

### Crime Dashboard
![Crime](screenshots/crime.png)
-->

---

<div align="center">

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   [SYS] DelhiOps v1.0.0                                     ║
║   [INF] All modules operational                              ║
║   [INF] Monitoring Delhi NCR: 1,484 sq km                    ║
║   [INF] Population coverage: 32M+                            ║
║   [INF] System ready.                                        ║
║                                                              ║
║         Built with purpose. Deployed with precision.         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=11&duration=4000&pause=2000&color=3a5a3a&center=true&vCenter=true&repeat=true&width=300&height=15&lines=%3E+END+OF+TRANSMISSION" alt="EOF" />

<br/>

![Made with](https://img.shields.io/badge/MADE_WITH-NODE.JS_+_REACT-00ff41?style=flat-square&labelColor=0a0a0a)
![City](https://img.shields.io/badge/FOR-DELHI_NCR-00ff41?style=flat-square&labelColor=0a0a0a)

</div>
