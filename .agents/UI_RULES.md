# UI / UX Rules & Design Standards

## 1. Visual Design Philosophy

The **Hostel Food Delivery Tracking System** UI balances modern aesthetics with functional simplicity. Because students will overwhelmingly access this application from smartphones while waiting in their hostel rooms, the design is strictly **mobile-first, clean, and instant to parse**.

### Key Attributes:
- **Clarity over Clutter:** Essential delivery data (current status, ETA, delay banner) must be visible above the fold.
- **Modern Minimalist Aesthetics:** Soft neutral backgrounds (`slate-50` / `zinc-900`), crisp card borders, gentle elevations, and high-contrast typography.
- **No Over-Decorated Fluff:** Avoid distracting animations or heavy 3D graphics that slow down page loading on weak hostel Wi-Fi/cellular networks.

---

## 2. Status Color Palette & Visual Semantics

Food status must be instantly recognizable from across a room or on a small screen:

| Status | Badge / Text Style | Background Pill | Icon Representation | Meaning |
| --- | --- | --- | --- | --- |
| `PREPARING` | Text: `amber-700`<br>Border: `amber-300` | `bg-amber-50` | 🍳 / Utensils | Kitchen is preparing or packaging meals |
| `DISPATCHED` | Text: `blue-700`<br>Border: `blue-300` | `bg-blue-50` | 📦 / Clipboard | Meals loaded onto vehicle and left kitchen |
| `ON_THE_WAY` | Text: `indigo-700`<br>Border: `indigo-300` | `bg-indigo-50` | 🚚 / Truck | Delivery vehicle en route to hostel |
| `ARRIVED` | Text: `emerald-700`<br>Border: `emerald-300` | `bg-emerald-50` | ✅ / CheckCircle | Food arrived at hostel gate/mess counter |
| `DELAYED` | Text: `rose-700`<br>Border: `rose-300` | `bg-rose-50` | ⚠️ / AlertTriangle | Delivery delayed (reason clearly displayed) |

---

## 3. Core Reusable UI Component Catalog

All user interfaces must be composed using standardized components located in `components/`:

```text
components/
├── ui/
│   ├── Button.tsx           # Primary, secondary, outline, destructive, ghost variants
│   ├── Card.tsx             # Card, CardHeader, CardTitle, CardContent, CardFooter
│   ├── Badge.tsx            # Status badges with size & variant options
│   ├── Modal.tsx            # Accessible dialog for actions (e.g. Set Delay Reason)
│   ├── Input.tsx            # Form inputs with error states and helper labels
│   ├── Select.tsx           # Dropdown selects (meal type, status)
│   ├── Table.tsx            # Responsive data tables with mobile scroll support
│   ├── StatusIndicator.tsx  # Pulsing/static visual status dots
│   └── Timeline.tsx         # Step-by-step delivery progress tracker
├── layout/
│   ├── Navbar.tsx           # Brand, user greeting, role badge, sign-out button
│   ├── MobileNav.tsx        # Bottom bar navigation for smartphone users
│   └── Sidebar.tsx          # Collapsible desktop navigation for warden/admin portal
└── feedback/
    ├── LoadingState.tsx     # Skeleton cards and subtle spinner indicators
    ├── EmptyState.tsx       # Illustrated or clean icon banner for empty lists
    └── ErrorState.tsx       # Friendly failure alerts with retry buttons
```

---

## 4. Mobile Responsiveness Guidelines

1. **Touch Targets:** Buttons, inputs, and clickable list items must have a minimum touch target of `44x44px`.
2. **Typography Scale:**
   - Heading 1 (`h1`): `text-2xl sm:text-3xl font-bold`
   - Heading 2 (`h2`): `text-xl sm:text-2xl font-semibold`
   - Body: `text-sm sm:text-base`
   - Timestamps & Badges: `text-xs sm:text-sm`
3. **Delivery Timeline Component:** Must render horizontally on desktop and vertically on mobile displays without clipping text or dates.
4. **Spacing:** Standardize on Tailwind's 4px grid (`gap-4`, `p-4`, `space-y-4` on mobile, scaling to `gap-6`, `p-6` on desktop).
