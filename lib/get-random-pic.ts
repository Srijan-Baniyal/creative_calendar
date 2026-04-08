interface CalendarArtwork {
  monthIndex: number;
  monthName: string;
  src: string;
  year: number;
}

export const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
] as const;

type MonthName = (typeof MONTH_NAMES)[number];

const ARTWORK_BY_MONTH_NAME: Record<MonthName, string> = {
  JANUARY: "/January.png",
  FEBRUARY: "/Febuary.png",
  MARCH: "/March.png",
  APRIL: "/April.png",
  MAY: "/May.png",
  JUNE: "/June.png",
  JULY: "/July.png",
  AUGUST: "/August.png",
  SEPTEMBER: "/September.png",
  OCTOBER: "/October.png",
  NOVEMBER: "/November.png",
  DECEMBER: "/December.png",
};

const DEFAULT_ARTWORK = "/January.png";

export function getArtworkSourceForMonth(monthIndex: number): string {
  const normalizedMonthIndex = ((monthIndex % 12) + 12) % 12;
  const monthName = MONTH_NAMES[normalizedMonthIndex] ?? MONTH_NAMES[0];
  return ARTWORK_BY_MONTH_NAME[monthName] ?? DEFAULT_ARTWORK;
}

export function GetRandomPic(): CalendarArtwork {
  const now = new Date();
  const monthIndex = now.getMonth();
  const monthName = MONTH_NAMES[monthIndex] ?? MONTH_NAMES[0];

  return {
    monthIndex,
    monthName,
    src: getArtworkSourceForMonth(monthIndex),
    year: now.getFullYear(),
  };
}

export const CALENDAR_ARTWORKS = MONTH_NAMES.map((monthName, monthIndex) => ({
  monthIndex,
  monthName,
  src: getArtworkSourceForMonth(monthIndex),
}));
