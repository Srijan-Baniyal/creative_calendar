# Creative Calendar Frontend Challenge

Interactive wall-calendar style component built with Next.js App Router and React, focused on frontend engineering quality, responsive UX, and polished interaction design.

## Challenge Summary

The component is expected to deliver:

- A wall calendar aesthetic with a hero image as the visual anchor
- Day range selection with clear start, in-range, and end visual states
- An integrated notes area (monthly notes and/or range-attached notes)
- Fully responsive behavior across desktop and mobile layouts

This repository is intentionally frontend-only.

## Scope and Constraints

- Frontend only: no backend, no API, no database
- Persistence (if used): client-side only (`localStorage`, `sessionStorage`, or static data)
- Architecture preference: React Server Component first
- Keep client components minimal and isolated to interactive concerns

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Ultracite/Biome for formatting and linting

## Development

Install dependencies and run locally:

```bash
bun install
bun run dev
```

Then open `http://localhost:3000`.

### Quality Commands

```bash
bun run check
bun run fix
bun run lint
bun run format
```

## Expected UX Behaviors

- Smooth and obvious date-range interaction
- Accessible focus and keyboard navigation states
- Touch-friendly controls on small screens
- Responsive layout:
- Desktop: segmented or side-by-side composition
- Mobile: stacked layout without feature loss

## Submission Checklist

Fill these before submission:

- Source repository: `ADD_PUBLIC_REPO_LINK`
- Video demo (required): `ADD_VIDEO_LINK`
- Live demo (optional): `ADD_DEPLOYED_LINK`

Video demo must show:

- Date range selection (start, end, and in-between states)
- Notes feature in action
- Responsive behavior on desktop and mobile viewport sizes

## Project Structure

```text
app/
  globals.css
  layout.tsx
  page.tsx
public/
AGENTS.md
README.md
```

## Notes for Reviewers

- Prioritize evaluation of component architecture, UI execution quality, and interaction design
- Review state handling, responsiveness, accessibility, and code clarity
- No backend behavior is expected for this challenge
