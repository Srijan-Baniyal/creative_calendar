# Creative Calendar Frontend Challenge

Polished, interactive wall-calendar experience built in Next.js and React, with a hero-led composition, date-range planning, integrated notes, and a full design-system driven UI surface.

## Project Status

Completed.

## What Is Implemented

- Wall calendar aesthetic:
  - Large hero image panel with tonal overlays and context actions
  - Physical-board inspired spacing, framing, and texture treatment
- Day range selector:
  - Start date, end date, in-range states, and single-day state
  - Keyboard/mouse/touch friendly interactions
  - Month navigation and quick reset actions
- Integrated notes:
  - Main monthly notes editor
  - Quick capture flows (sheet and drawer)
  - Character count and validation feedback
  - Responsive time composer with `No time`, `12h` (`HH:MM AM/PM`), and `24h` (`HH:MM`) modes
- Fully responsive:
  - Desktop uses segmented composition with side navigation and resizable workspace
  - Mobile preserves all core interactions via drawer/sheet + stacked flow
  - Calendar dialog controls adapt to available width (time and recurrence remain aligned at all breakpoints)
- Colorful UX feedback:
  - Action toasts for create/update/delete/status/navigation/view/theme/selection interactions
  - Toast palette remains consistent across light and dark theme switches
- Frontend-only persistence:
  - Local storage state schema with versioning
  - Restores month, range, notes, reminders, and view settings

## Design-System Integration

All primitives in components/ui are actively integrated into the product experience:

- Avatar, Badge, Breadcrumb, Button, Calendar, Card
- Checkbox, Collapsible, Combobox, Command, Context Menu
- Dialog, Direction, Drawer, Dropdown Menu, Empty
- Field, Input Group, Input, Label, Menubar, Radio Group
- Resizable, Scroll Area, Select, Separator, Sheet, Sidebar
- Skeleton, Slider, Sonner Toaster, Spinner, Tabs, Textarea, Toggle, Tooltip

The implementation uses the tokenized design system defined in app/globals.css for color, radius, spacing, typography, and surface behavior.

## Architecture Notes

- App Router + RSC-first composition
- Interactive calendar shell isolated in a client component
- Shared UI primitives from local shadcn layer
- Theme-aware notifications through design-system toaster
- Fixed-light colorful toaster presentation for stable cross-theme feedback styling

## Run Locally

```bash
bun install
bun run dev
```

Open: <http://localhost:3000>

## Quality Gates

```bash
bun run check
bun run fix
bun run lint
bun run format
```

Current status: bun run check passes.

## Submission Links

- Source repository: https://github.com/Srijan-Baniyal/creative_calendar
- Video demo (required): Pending final upload
- Live demo (optional): Pending optional deployment

## Recommended Video Walkthrough

1. Show hero + wall calendar composition on desktop.
2. Demonstrate date range selection (start, end, in-between).
3. Demonstrate notes editing, quick capture, and persistence.
4. Demonstrate mobile viewport usability.
5. Demonstrate advanced controls (command palette, menu actions, sheet/drawer)
