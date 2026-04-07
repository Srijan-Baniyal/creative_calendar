"use client";

import {
  CalendarIcon,
  PlusIcon,
  RotateCcwIcon,
  StickyNoteIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  getArtworkSourceForMonth,
  MONTH_NAMES,
} from "@/lib/get-random-pic";

interface CalendarInteractivePanelProps {
  initialArtworkSrc: string;
  initialMonthIndex: number;
  initialMonthName: string;
  initialYear: number;
}

interface StoredNote {
  createdAt: string;
  id: string;
  text: string;
}

function formatDateCompact(date: Date | undefined): string {
  if (!date) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function parseStoredRange(
  rawValue: string | null
): DateRange | undefined {
  if (!rawValue) {
    return undefined;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as {
      from?: string;
      to?: string;
    };
    const from = parsedValue.from ? new Date(parsedValue.from) : undefined;
    const to = parsedValue.to ? new Date(parsedValue.to) : undefined;

    if (!(from || to)) {
      return undefined;
    }

    return { from, to };
  } catch {
    return undefined;
  }
}

function serializeRange(range: DateRange | undefined): string {
  return JSON.stringify({
    from: range?.from?.toISOString(),
    to: range?.to?.toISOString(),
  });
}

function loadNotes(storageKey: string): StoredNote[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as StoredNote[];
  } catch {
    return [];
  }
}

export default function CalendarInteractivePanel({
  initialArtworkSrc,
  initialMonthIndex,
  initialMonthName,
  initialYear,
}: CalendarInteractivePanelProps) {
  const initialMonth = useMemo(
    () => new Date(initialYear, initialMonthIndex, 1),
    [initialMonthIndex, initialYear]
  );

  const today = useMemo(() => new Date(), []);

  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<StoredNote | null>(null);

  // Derive synced month/year from the visible calendar month
  const displayMonthIndex = visibleMonth.getMonth();
  const displayYear = visibleMonth.getFullYear();
  const displayMonthName =
    MONTH_NAMES[displayMonthIndex] ?? initialMonthName;
  const displayArtworkSrc = useMemo(
    () => getArtworkSourceForMonth(displayMonthIndex),
    [displayMonthIndex]
  );

  const storagePrefix = useMemo(
    () => `creative-calendar:${displayYear}:${displayMonthIndex}`,
    [displayMonthIndex, displayYear]
  );

  // ─── Load persisted state ─────────────────────────────
  useEffect(() => {
    const storedRange = window.localStorage.getItem(
      `${storagePrefix}:range`
    );
    setSelectedRange(parseStoredRange(storedRange));
    setNotes(loadNotes(`${storagePrefix}:notes`));
  }, [storagePrefix]);

  // ─── Persist range changes ────────────────────────────
  useEffect(() => {
    window.localStorage.setItem(
      `${storagePrefix}:range`,
      serializeRange(selectedRange)
    );
  }, [selectedRange, storagePrefix]);

  // ─── Persist notes changes ────────────────────────────
  const persistNotes = useCallback(
    (updatedNotes: StoredNote[]) => {
      window.localStorage.setItem(
        `${storagePrefix}:notes`,
        JSON.stringify(updatedNotes)
      );
    },
    [storagePrefix]
  );

  // ─── Range day count ──────────────────────────────────
  const fromTime = selectedRange?.from?.getTime();
  const toTime = selectedRange?.to?.getTime();
  const selectedDayCount = useMemo(() => {
    if (!(fromTime && toTime)) {
      return 0;
    }

    const oneDayMs = 1000 * 60 * 60 * 24;
    return Math.floor(Math.abs(toTime - fromTime) / oneDayMs) + 1;
  }, [fromTime, toTime]);

  // ─── Add note ─────────────────────────────────────────
  const handleAddNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) {
      return;
    }

    const newNote: StoredNote = {
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      text: trimmed,
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    persistNotes(updatedNotes);
    setNoteText("");
    setAddDialogOpen(false);

    toast.success("Note added", {
      description: trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed,
    });
  };

  // ─── Delete note ──────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!noteToDelete) {
      return;
    }

    const updatedNotes = notes.filter((n) => n.id !== noteToDelete.id);
    setNotes(updatedNotes);
    persistNotes(updatedNotes);
    setDeleteDialogOpen(false);
    setNoteToDelete(null);

    toast.success("Note deleted");
  };

  const openDeleteDialog = (note: StoredNote) => {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-foreground/[0.06]">
      {/* ─── Hero Image with synced month/year ──────────── */}
      <div className="relative">
        <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
          <Image
            alt={`${displayMonthName} themed calendar artwork`}
            className="object-cover transition-opacity duration-500"
            fill
            key={displayArtworkSrc}
            priority={displayArtworkSrc === initialArtworkSrc}
            sizes="(max-width: 768px) 100vw, 860px"
            src={displayArtworkSrc}
          />
          {/* Bottom fade for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Year + Month — synced with calendar */}
        <div className="absolute right-6 bottom-5 text-right sm:right-8 sm:bottom-7">
          <p className="font-display text-4xl text-white/95 drop-shadow-sm sm:text-5xl lg:text-6xl">
            {displayYear}
          </p>
          <p className="mt-0.5 font-medium text-white/70 text-xs uppercase tracking-[0.3em] sm:text-sm">
            {displayMonthName}
          </p>
        </div>
      </div>

      {/* Clean separator */}
      <div className="calendar-divider" />

      {/* ─── Interactive area ──────────────────────────────── */}
      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="space-y-5">
          {/* Date range summary */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {formatDateCompact(selectedRange?.from)}
            </span>
            <span className="text-muted-foreground/40">→</span>
            <span className="text-muted-foreground">
              {formatDateCompact(selectedRange?.to)}
            </span>
            {selectedDayCount > 0 ? (
              <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs">
                {selectedDayCount} {selectedDayCount === 1 ? "day" : "days"}
              </span>
            ) : null}
          </div>

          {/* Calendar grid */}
          <Calendar
            className="w-full p-0 [--cell-size:--spacing(9)]"
            classNames={{
              caption_label:
                "text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground",
              day_button:
                "text-sm font-normal transition-colors duration-150 data-[outside=true]:text-muted-foreground/30",
              month: "w-full gap-3",
              months: "w-full",
              outside: "text-muted-foreground/25",
              today:
                "ring-1 ring-primary/30 bg-primary/[0.06] text-foreground data-[selected=true]:bg-primary data-[selected=true]:ring-0",
              weekday:
                "rounded-none text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/50 py-2",
            }}
            defaultMonth={today}
            fixedWeeks
            mode="range"
            modifiers={{ weekend: { dayOfWeek: [0, 6] } }}
            modifiersClassNames={{ weekend: "calendar-weekend" }}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            onSelect={setSelectedRange}
            selected={selectedRange}
            showOutsideDays
            today={today}
          />

          {/* Action row */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              className="gap-1.5 text-muted-foreground"
              onClick={() => setVisibleMonth(initialMonth)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <CalendarIcon className="size-3.5" />
              {initialMonthName}
            </Button>

            <Button
              className="gap-1.5 text-muted-foreground"
              onClick={() => setSelectedRange(undefined)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <RotateCcwIcon className="size-3.5" />
              Reset
            </Button>
          </div>
        </div>

        {/* ─── Notes section ─────────────────────────────── */}
        <div className="calendar-divider my-5" />

        <div className="space-y-4">
          {/* Notes header with counter + add button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNoteIcon className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm">
                Notes
              </span>
              {notes.length > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 font-medium text-primary text-[0.65rem] tabular-nums">
                  {notes.length}
                </span>
              ) : null}
            </div>

            {/* Add Note trigger */}
            <Dialog onOpenChange={setAddDialogOpen} open={addDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gap-1.5"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PlusIcon className="size-3.5" />
                  Add Note
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Note</DialogTitle>
                  <DialogDescription>
                    Add a note for{" "}
                    {displayMonthName.charAt(0)}
                    {displayMonthName.slice(1).toLowerCase()}{" "}
                    {displayYear}.
                  </DialogDescription>
                </DialogHeader>

                <Textarea
                  autoFocus
                  className="min-h-32 resize-none rounded-xl border-border/60 bg-transparent text-sm leading-7 transition-colors placeholder:text-muted-foreground/40 focus-visible:border-primary/40"
                  onChange={(event) => setNoteText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && event.metaKey) {
                      handleAddNote();
                    }
                  }}
                  placeholder="Write your note…"
                  value={noteText}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    disabled={noteText.trim().length === 0}
                    onClick={handleAddNote}
                    type="button"
                  >
                    Save Note
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground/50 text-sm">
              No notes yet. Click "Add Note" to start.
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li
                  className="group/note flex items-start gap-3 rounded-xl bg-muted/40 px-3.5 py-3 transition-colors hover:bg-muted/70"
                  key={note.id}
                >
                  <p className="flex-1 text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {note.text}
                  </p>
                  <button
                    aria-label="Delete note"
                    className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/note:text-muted-foreground/60"
                    onClick={() => openDeleteDialog(note)}
                    type="button"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ─── Delete confirmation dialog ────────────────── */}
        <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete note?</DialogTitle>
              <DialogDescription>
                This cannot be undone. The note will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                type="button"
                variant="destructive"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
