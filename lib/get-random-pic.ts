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

const ARTWORK_BY_MONTH: Partial<Record<number, string>> = {
  0: "/January.png",
  1: "/Febuary.png",
  3: "/April.png",
  5: "/June.png",
  7: "/August.png",
};

const DEFAULT_ARTWORK = "/January.png";

export function getArtworkSourceForMonth(monthIndex: number): string {
  for (const offset of Array.from({ length: 12 }, (_, value) => value)) {
    const candidateMonth = (monthIndex - offset + 12) % 12;
    const source = ARTWORK_BY_MONTH[candidateMonth];
    if (source) {
      return source;
    }
  }

  return DEFAULT_ARTWORK;
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
