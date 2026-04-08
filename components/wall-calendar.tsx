"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { type ReactElement, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DateRange {
  end: Date | null;
  start: Date | null;
}

interface Note {
  date?: string;
  dateRange?: { start: string; end: string };
  id: string;
  text: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SPIRAL_BINDING_KEYS = Array.from(
  { length: 20 },
  (_, value) => `spiral-${value + 1}`
);

// Sample holidays (US federal holidays for demo)
const HOLIDAYS: Record<string, string> = {
  "2024-01-01": "New Year",
  "2024-07-04": "Independence Day",
  "2024-12-25": "Christmas",
  "2025-01-01": "New Year",
  "2025-07-04": "Independence Day",
  "2025-12-25": "Christmas",
};

export function WallCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("calendar-notes");
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem("calendar-notes", JSON.stringify(notes));
  }, [notes]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const previousMonthDays = new Date(year, month, 0).getDate();
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(
      new Date(year, direction === "prev" ? month - 1 : month + 1, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      // Start new selection
      setSelectedRange({ start: date, end: null });
    } else if (date < selectedRange.start) {
      // Complete the range
      setSelectedRange({ start: date, end: selectedRange.start });
    } else {
      setSelectedRange({ start: selectedRange.start, end: date });
    }
  };

  const clearSelection = () => {
    setSelectedRange({ start: null, end: null });
    setCurrentNote("");
  };

  const addNote = () => {
    if (!currentNote.trim()) {
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      text: currentNote,
    };

    if (selectedRange.start && selectedRange.end) {
      newNote.dateRange = {
        start: selectedRange.start.toISOString(),
        end: selectedRange.end.toISOString(),
      };
    } else if (selectedRange.start) {
      newNote.date = selectedRange.start.toISOString();
    }

    setNotes([...notes, newNote]);
    setCurrentNote("");
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedRange.start) {
      return false;
    }
    if (!selectedRange.end) {
      // Show preview when hovering
      if (hoveredDate && hoveredDate > selectedRange.start) {
        return date >= selectedRange.start && date <= hoveredDate;
      }
      return date.toDateString() === selectedRange.start.toDateString();
    }
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const isStartDate = (date: Date): boolean => {
    return selectedRange.start?.toDateString() === date.toDateString();
  };

  const isEndDate = (date: Date): boolean => {
    return selectedRange.end?.toDateString() === date.toDateString();
  };

  const getDateKey = (date: Date): string => {
    const yearPart = date.getFullYear();
    const monthPart = `${date.getMonth() + 1}`.padStart(2, "0");
    const dayPart = `${date.getDate()}`.padStart(2, "0");

    return `${yearPart}-${monthPart}-${dayPart}`;
  };

  const getHoliday = (date: Date): string | undefined => {
    return HOLIDAYS[getDateKey(date)];
  };

  const getNoteDateLabel = (note: Note): string => {
    if (note.dateRange) {
      return `${new Date(note.dateRange.start).toLocaleDateString()} - ${new Date(note.dateRange.end).toLocaleDateString()}`;
    }
    if (note.date) {
      return new Date(note.date).toLocaleDateString();
    }
    return "General note";
  };

  const renderCalendarDays = () => {
    const days: ReactElement[] = [];

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = previousMonthDays - i;
      days.push(
        <button
          className="aspect-square min-h-11 rounded-md p-1 text-center text-muted-foreground/40 transition-colors hover:bg-muted/30 sm:rounded-lg sm:p-2"
          disabled
          key={`prev-${day}`}
          type="button"
        >
          <span className="text-xs sm:text-sm">{day}</span>
        </button>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const inRange = isDateInRange(date);
      const isStart = isStartDate(date);
      const isEnd = isEndDate(date);
      const holiday = getHoliday(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      days.push(
        <button
          aria-label={`${MONTHS[month]} ${day}, ${year}`}
          className={cn(
            "group relative aspect-square min-h-11 rounded-md p-1 text-center transition-colors duration-200 sm:rounded-lg sm:p-2 sm:transition-all",
            "sm:hover:scale-[1.03] sm:hover:shadow-md",
            isToday && "ring-1 ring-primary sm:ring-2",
            inRange && !isStart && !isEnd && "bg-primary/10",
            (isStart || isEnd) &&
              "bg-primary font-semibold text-primary-foreground",
            !(inRange || isStart || isEnd) && "hover:bg-muted",
            isWeekend && !inRange && "text-primary/70"
          )}
          key={`current-${day}`}
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
          type="button"
        >
          <span className="block text-xs sm:text-sm">{day}</span>
          {holiday && (
            <>
              <span className="absolute right-1.5 bottom-1.5 h-1.5 w-1.5 rounded-full bg-accent sm:hidden" />
              <span className="absolute bottom-0.5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-accent px-1 text-[8px] text-accent-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                {holiday}
              </span>
            </>
          )}
        </button>
      );
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <button
          className="aspect-square min-h-11 rounded-md p-1 text-center text-muted-foreground/40 transition-colors hover:bg-muted/30 sm:rounded-lg sm:p-2"
          disabled
          key={`next-${day}`}
          type="button"
        >
          <span className="text-xs sm:text-sm">{day}</span>
        </button>
      );
    }

    return days;
  };

  const formatDateRange = () => {
    if (!selectedRange.start) {
      return "No date selected";
    }
    if (!selectedRange.end) {
      return `${selectedRange.start.toLocaleDateString()}`;
    }
    return `${selectedRange.start.toLocaleDateString()} - ${selectedRange.end.toLocaleDateString()}`;
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,hsl(var(--muted))_0%,hsl(var(--background))_45%,hsl(var(--background))_100%)] p-2 sm:p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <Card className="overflow-hidden border shadow-xl md:shadow-2xl">
          {/* Spiral binding decoration */}
          <div className="flex h-7 items-center justify-center gap-1.5 border-b bg-linear-to-b from-muted to-card sm:h-8 sm:gap-3">
            {SPIRAL_BINDING_KEYS.map((bindingKey, index) => (
              <div
                className={cn(
                  "h-4 w-2.5 rounded-full border-2 border-muted-foreground/30 bg-card sm:h-5 sm:w-3",
                  index >= 12 && "hidden sm:block"
                )}
                key={bindingKey}
              />
            ))}
          </div>

          {/* Hero Image Section */}
          <div className="relative h-44 overflow-hidden sm:h-56 md:h-80 lg:h-96">
            <Image
              alt="Calendar hero"
              className="h-full w-full object-cover"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              src="/calendar-hero.jpg"
            />
            {/* Geometric overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-primary/85 via-primary/30 to-transparent" />
            <svg
              className="absolute bottom-0 left-0 h-24 w-full sm:h-28 md:h-32"
              preserveAspectRatio="none"
              viewBox="0 0 1200 200"
            >
              <title>Decorative calendar curve</title>
              <path
                d="M0,100 Q300,0 600,80 T1200,60 L1200,200 L0,200 Z"
                fill="hsl(var(--primary))"
                opacity="0.9"
              />
            </svg>

            {/* Month and Year */}
            <div className="absolute right-4 bottom-4 text-right sm:right-8 sm:bottom-8">
              <h2 className="font-bold text-3xl text-primary-foreground tracking-tight sm:text-5xl md:text-6xl">
                {year}
              </h2>
              <h3 className="font-semibold text-lg text-primary-foreground/90 uppercase tracking-wide sm:text-3xl md:text-4xl">
                {MONTHS[month]}
              </h3>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="grid gap-0 lg:grid-cols-[minmax(260px,320px),1fr]">
            {/* Notes Section */}
            <div className="order-2 space-y-4 border-t bg-card/95 p-4 sm:p-6 lg:order-1 lg:border-t-0 lg:border-r">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">
                    Notes
                  </h4>
                  {(selectedRange.start || selectedRange.end) && (
                    <Button
                      className="h-8 px-2 sm:h-6"
                      onClick={clearSelection}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {formatDateRange()}
                </p>
              </div>

              <div className="space-y-2">
                <Textarea
                  className="min-h-20 resize-none text-sm sm:min-h-24"
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Add a note..."
                  value={currentNote}
                />
                <Button className="h-10 w-full" onClick={addNote} size="sm">
                  Add Note
                </Button>
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto pr-1 sm:max-h-72 lg:max-h-120">
                {notes.map((note) => (
                  <Card className="group relative p-3" key={note.id}>
                    <button
                      aria-label="Delete note"
                      className="absolute top-2 right-2 opacity-70 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                      onClick={() => deleteNote(note.id)}
                      type="button"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                    <p className="mb-1 text-muted-foreground text-xs">
                      {getNoteDateLabel(note)}
                    </p>
                    <p className="pr-6 text-sm leading-relaxed">{note.text}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="order-1 p-3 sm:p-5 md:p-8 lg:order-2">
              {/* Month Navigation */}
              <div className="mb-4 flex items-center gap-2 sm:mb-6">
                <Button
                  className="h-10 w-10 rounded-full p-0 hover:bg-muted"
                  onClick={() => navigateMonth("prev")}
                  size="sm"
                  variant="ghost"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h3 className="flex-1 text-center font-semibold text-base tracking-wide sm:text-lg">
                  {MONTHS[month]} {year}
                </h3>
                <Button
                  className="h-10 w-10 rounded-full p-0 hover:bg-muted"
                  onClick={() => navigateMonth("next")}
                  size="sm"
                  variant="ghost"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Days of week */}
              <div className="mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
                {DAYS.map((day) => (
                  <div
                    className="py-1.5 text-center font-semibold text-[10px] text-muted-foreground uppercase sm:py-2 sm:text-xs"
                    key={day}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {renderCalendarDays()}
              </div>

              {/* Legend */}
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground sm:mt-6 sm:text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-primary sm:h-4 sm:w-4" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded border border-primary/20 bg-primary/10 sm:h-4 sm:w-4" />
                  <span>In Range</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded ring-2 ring-primary sm:h-4 sm:w-4" />
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
