"use client";

import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Edit2,
  GripVertical,
  MapPin,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getArtworkSourceForMonth } from "@/lib/get-random-pic";
import { cn } from "@/lib/utils";

type NoteStatus = "todo" | "in-progress" | "done";
type NotePriority = "low" | "medium" | "high";
type CalendarView = "month" | "kanban";

interface Note {
  color: string;
  description: string;
  endDate: string;
  id: string;
  location?: string;
  priority: NotePriority;
  startDate: string;
  status: NoteStatus;
  tags: string[];
  title: string;
}

interface NormalizedDateRange {
  from: Date;
  to: Date;
}

interface FormErrors {
  color?: string;
  description?: string;
  location?: string;
  priority?: string;
  status?: string;
  tags?: string;
  title?: string;
}

const CALENDAR_VIEWS = ["month", "kanban"] as const;
const NOTE_PRIORITIES = ["low", "medium", "high"] as const;
const NOTE_STATUSES = ["todo", "in-progress", "done"] as const;
const SPIRAL_RING_MARKERS = Array.from({ length: 20 }, (_, i) => i + 1);
const DATE_KEY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const isCalendarView = (value: string): value is CalendarView =>
  CALENDAR_VIEWS.includes(value as CalendarView);

const isNotePriority = (value: unknown): value is NotePriority =>
  typeof value === "string" && NOTE_PRIORITIES.includes(value as NotePriority);

const isNoteStatus = (value: unknown): value is NoteStatus =>
  typeof value === "string" && NOTE_STATUSES.includes(value as NoteStatus);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getStringOrEmpty = (value: unknown): string =>
  typeof value === "string" ? value : "";

const getStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const tags: string[] = [];
  for (const tag of value) {
    if (typeof tag === "string") {
      tags.push(tag);
    }
  }
  return tags;
};

const parseTagsInput = (value: string): string[] =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string): Date | null => {
  const match = value.match(DATE_KEY_REGEX);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);

  const parsed = new Date(year, monthIndex, day);
  parsed.setHours(0, 0, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== monthIndex ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const normalizeDateRange = (from: Date, to?: Date): NormalizedDateRange => {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  const end = new Date(to ?? from);
  end.setHours(0, 0, 0, 0);

  if (start.getTime() <= end.getTime()) {
    return { from: start, to: end };
  }

  return { from: end, to: start };
};

const formatDialogDateLabel = (value: string): string => {
  const parsed = parseDateKey(value);
  if (!parsed) {
    return "dd/mm/yyyy";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Circle,
  },
  medium: {
    label: "Medium",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: AlertCircle,
  },
  high: {
    label: "High",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: Sparkles,
  },
};

const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    color: "bg-slate-100 dark:bg-slate-900/40",
    headerColor: "bg-slate-50 dark:bg-slate-900/40",
    borderColor: "border-slate-200 dark:border-slate-800",
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-blue-100 dark:bg-blue-900/40",
    headerColor: "bg-blue-50 dark:bg-blue-900/40",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  done: {
    label: "Done",
    color: "bg-emerald-100 dark:bg-emerald-900/40",
    headerColor: "bg-emerald-50 dark:bg-emerald-900/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
};

const NOTE_COLORS = [
  {
    name: "Slate",
    value: "slate",
    bg: "bg-slate-500",
    light:
      "bg-slate-50 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
  },
  {
    name: "Blue",
    value: "blue",
    bg: "bg-blue-500",
    light: "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    name: "Emerald",
    value: "emerald",
    bg: "bg-emerald-500",
    light:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  {
    name: "Amber",
    value: "amber",
    bg: "bg-amber-500",
    light:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  {
    name: "Rose",
    value: "rose",
    bg: "bg-rose-500",
    light: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  {
    name: "Violet",
    value: "violet",
    bg: "bg-violet-500",
    light:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800",
  },
  {
    name: "Cyan",
    value: "cyan",
    bg: "bg-cyan-500",
    light: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  {
    name: "Orange",
    value: "orange",
    bg: "bg-orange-500",
    light:
      "bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  {
    name: "Pink",
    value: "pink",
    bg: "bg-pink-500",
    light: "bg-pink-50 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
  },
  {
    name: "Indigo",
    value: "indigo",
    bg: "bg-indigo-500",
    light:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  {
    name: "Teal",
    value: "teal",
    bg: "bg-teal-500",
    light: "bg-teal-50 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
  },
];

const HOLIDAYS: Record<string, { name: string; emoji: string }> = {
  "2026-01-01": { name: "New Year", emoji: "🎉" },
  "2026-02-14": { name: "Valentine's Day", emoji: "💕" },
  "2026-04-12": { name: "Easter", emoji: "🐰" },
  "2026-07-04": { name: "Independence Day", emoji: "🎆" },
  "2026-10-31": { name: "Halloween", emoji: "🎃" },
  "2026-11-26": { name: "Thanksgiving", emoji: "🦃" },
  "2026-12-25": { name: "Christmas", emoji: "🎄" },
};

const MONTH_QUOTES = [
  "New beginnings await.",
  "Love is in the air.",
  "Spring forward.",
  "April showers bring May flowers.",
  "Bloom where you are planted.",
  "Summer dreams.",
  "Freedom and joy.",
  "Endless summer.",
  "New chapter begins.",
  "Harvest the good.",
  "Grateful hearts.",
  "Peace and wonder.",
];

// Get a stable date for SSR - this ensures server and client render the same initial date
const getInitialDate = () => {
  // Use a fixed date string format that will be the same on server and client
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export function PremiumCalendar() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => getInitialDate());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  const { theme, setTheme } = useTheme();

  // Form state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[1].value);
  const [notePriority, setNotePriority] = useState<NotePriority>("low");
  const [noteTags, setNoteTags] = useState("");
  const [noteLocation, setNoteLocation] = useState("");
  const [noteStatus, setNoteStatus] = useState<NoteStatus>("todo");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [dateFieldError, setDateFieldError] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Calendar date selection state
  const [calendarDateRange, setCalendarDateRange] = useState<
    DateRange | undefined
  >();

  // Today's date - only accurate after mount
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("premium-calendar-notes");
    if (savedNotes) {
      try {
        const parsed: unknown = JSON.parse(savedNotes);
        if (!Array.isArray(parsed)) {
          return;
        }

        const normalized: Note[] = [];
        for (const storedNote of parsed) {
          if (!isRecord(storedNote)) {
            continue;
          }

          const id = getStringOrEmpty(storedNote.id);
          const title = getStringOrEmpty(storedNote.title);
          const startDate = getStringOrEmpty(storedNote.startDate);
          const endDate = getStringOrEmpty(storedNote.endDate) || startDate;
          if (!(id && title && startDate && endDate)) {
            continue;
          }

          normalized.push({
            id,
            title,
            description: getStringOrEmpty(storedNote.description),
            startDate,
            endDate,
            color: getStringOrEmpty(storedNote.color) || "blue",
            priority: isNotePriority(storedNote.priority)
              ? storedNote.priority
              : "low",
            tags: getStringArray(storedNote.tags),
            location: getStringOrEmpty(storedNote.location),
            status: isNoteStatus(storedNote.status)
              ? storedNote.status
              : "todo",
          });
        }
        setNotes(normalized);
      } catch {
        setNotes([]);
      }
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem("premium-calendar-notes", JSON.stringify(notes));
  }, [notes]);

  // Check if date is in the past - only after client mount to avoid hydration mismatch
  const isPastDate = (date: Date) => {
    if (!mounted) {
      return false; // During SSR, don't mark anything as past
    }
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const syncDialogDateFields = (from: Date, to?: Date) => {
    const normalized = normalizeDateRange(from, to);
    const endDate = normalized.to;

    setCalendarDateRange(normalized);
    setFormStartDate(formatDateKey(normalized.from));
    setFormEndDate(formatDateKey(endDate));
    if (normalized.from.getTime() === endDate.getTime()) {
      setSelectedDates([normalized.from]);
    } else {
      setSelectedDates([normalized.from, endDate]);
    }
    setDateFieldError("");
  };

  const clearFormError = (field: keyof FormErrors) => {
    setFormErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const nextErrors = { ...previous };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleStartDatePick = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDateFieldError("Pick a valid first date.");
      return;
    }

    if (isPastDate(selectedDate)) {
      setDateFieldError("First date cannot be in the past.");
      return;
    }

    const parsedEnd = parseDateKey(formEndDate);
    const endCandidate =
      parsedEnd && !isPastDate(parsedEnd) ? parsedEnd : selectedDate;

    syncDialogDateFields(selectedDate, endCandidate);
  };

  const handleEndDatePick = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDateFieldError("Pick a valid last date.");
      return;
    }

    if (isPastDate(selectedDate)) {
      setDateFieldError("Last date cannot be in the past.");
      return;
    }

    const parsedStart = parseDateKey(formStartDate);
    if (!parsedStart) {
      syncDialogDateFields(selectedDate, selectedDate);
      return;
    }

    syncDialogDateFields(parsedStart, selectedDate);
  };

  // Smart date click - auto range detection
  const handleDateClick = (date: Date) => {
    if (isPastDate(date)) {
      return;
    }

    if (selectedDates.length === 0) {
      setSelectedDates([date]);
    } else if (selectedDates.length === 1) {
      const first = selectedDates[0];
      if (date.getTime() === first.getTime()) {
        // Same date clicked - open dialog for single date
        syncDialogDateFields(date, date);
        setIsDialogOpen(true);
      } else {
        // Different date - create range
        const start = first < date ? first : date;
        const end = first < date ? date : first;
        syncDialogDateFields(start, end);
        setIsDialogOpen(true);
      }
    } else {
      // Reset and start new selection
      setSelectedDates([date]);
    }
  };

  const openNoteDialog = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setNoteTitle(note.title);
      setNoteDescription(note.description);
      setNoteColor(note.color);
      setNotePriority(note.priority);
      setNoteTags((note.tags || []).join(", "));
      setNoteLocation(note.location || "");
      setNoteStatus(note.status || "todo");
      const start = parseDateKey(note.startDate) ?? today;
      const end = parseDateKey(note.endDate) ?? start;
      syncDialogDateFields(start, end);
    } else if (selectedDates.length === 2) {
      // Use selected dates if available
      syncDialogDateFields(selectedDates[0], selectedDates[1]);
    } else if (selectedDates.length === 1) {
      syncDialogDateFields(selectedDates[0], selectedDates[0]);
    } else {
      syncDialogDateFields(today, today);
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setNoteTitle("");
    setNoteDescription("");
    setNoteColor(NOTE_COLORS[1].value);
    setNotePriority("low");
    setNoteTags("");
    setNoteLocation("");
    setNoteStatus("todo");
    setFormStartDate("");
    setFormEndDate("");
    setDateFieldError("");
    setFormErrors({});
    setEditingNote(null);
    setCalendarDateRange(undefined);
    setSelectedDates([]);
  };

  const handleSaveNote = () => {
    const trimmedTitle = noteTitle.trim();
    const trimmedDescription = noteDescription.trim();
    const trimmedLocation = noteLocation.trim();
    const parsedTags = parseTagsInput(noteTags);

    if (!(calendarDateRange?.from && formStartDate && formEndDate)) {
      setDateFieldError("First and last dates are required.");
      return;
    }

    const normalizedRange = normalizeDateRange(
      calendarDateRange.from,
      calendarDateRange.to
    );
    const normalizedEnd = normalizedRange.to ?? normalizedRange.from;

    const nextFormErrors: FormErrors = {};
    if (!trimmedTitle) {
      nextFormErrors.title = "Title is required.";
    }
    if (!trimmedDescription) {
      nextFormErrors.description = "Description is required.";
    }
    if (!notePriority) {
      nextFormErrors.priority = "Priority is required.";
    }
    if (!noteStatus) {
      nextFormErrors.status = "Status is required.";
    }
    if (!noteColor) {
      nextFormErrors.color = "Color selection is required.";
    }
    if (!trimmedLocation) {
      nextFormErrors.location = "Location is required.";
    }
    if (parsedTags.length === 0) {
      nextFormErrors.tags = "At least one tag is required.";
    }

    if (Object.keys(nextFormErrors).length > 0) {
      setFormErrors(nextFormErrors);
      return;
    }

    setFormErrors({});

    if (isPastDate(normalizedRange.from) || isPastDate(normalizedEnd)) {
      setDateFieldError("Dates cannot be in the past.");
      return;
    }

    const startDate = formatDateKey(normalizedRange.from);
    const endDate = formatDateKey(normalizedEnd);

    const newNote: Note = {
      id: editingNote?.id || Date.now().toString(),
      title: trimmedTitle,
      description: trimmedDescription,
      startDate,
      endDate,
      color: noteColor,
      priority: notePriority,
      tags: parsedTags,
      location: trimmedLocation,
      status: noteStatus,
    };

    if (editingNote) {
      setNotes(notes.map((n) => (n.id === editingNote.id ? newNote : n)));
    } else {
      setNotes([...notes, newNote]);
      toast.success("Note created", {
        description:
          startDate === endDate
            ? `${trimmedTitle} scheduled for ${startDate}.`
            : `${trimmedTitle} scheduled from ${startDate} to ${endDate}.`,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const handleStatusChange = (noteId: string, newStatus: NoteStatus) => {
    setNotes(
      notes.map((n) => (n.id === noteId ? { ...n, status: newStatus } : n))
    );
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDates([]);
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDates([]);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDates([]);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    const days: Date[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push(prevDate);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getNotesForDate = (date: Date) => {
    const dateStr = formatDateKey(date);
    return notes.filter(
      (note) =>
        dateStr >= note.startDate &&
        dateStr <= note.endDate &&
        note.status !== "done"
    );
  };

  const getDateKey = (date: Date) => formatDateKey(date);
  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const isCurrentMonth = (date: Date) =>
    date.getMonth() === currentDate.getMonth() &&
    date.getFullYear() === currentDate.getFullYear();
  const getHoliday = (date: Date) => HOLIDAYS[getDateKey(date)];

  const isInSelectedRange = (date: Date) => {
    if (selectedDates.length === 0) {
      return false;
    }
    if (selectedDates.length === 1) {
      return date.getTime() === selectedDates[0].getTime();
    }
    const [start, end] = selectedDates;
    return date >= start && date <= end;
  };

  const isRangeStart = (date: Date) =>
    selectedDates.length > 0 && date.getTime() === selectedDates[0].getTime();
  const isRangeEnd = (date: Date) =>
    selectedDates.length === 2 && date.getTime() === selectedDates[1].getTime();

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const yearNum = currentDate.getFullYear();
  const monthQuote = MONTH_QUOTES[currentDate.getMonth()];
  const heroArtworkSource = useMemo(
    () => getArtworkSourceForMonth(currentDate.getMonth()),
    [currentDate]
  );

  // Kanban grouping
  const notesByStatus = useMemo(() => {
    const grouped: Record<NoteStatus, Note[]> = {
      todo: [],
      "in-progress": [],
      done: [],
    };
    const sorted = [...notes].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    for (const note of sorted) {
      grouped[note.status].push(note);
    }
    return grouped;
  }, [notes]);

  const getNoteColorConfig = (color: string) =>
    NOTE_COLORS.find((c) => c.value === color) || NOTE_COLORS[1];

  const isSaveDisabled =
    !(noteTitle.trim() && noteDescription.trim() && noteLocation.trim()) ||
    parseTagsInput(noteTags).length === 0 ||
    !calendarDateRange?.from ||
    !formStartDate ||
    !formEndDate ||
    Boolean(dateFieldError);

  const getDayContent = (isPast: boolean, dayNotes: Note[]) => {
    if (isPast && dayNotes.length === 0) {
      return (
        <p className="py-4 text-center text-sm text-stone-400 italic">
          Past date - no notes
        </p>
      );
    }

    if (dayNotes.length > 0) {
      return (
        <div className="space-y-2">
          {dayNotes.map((note) => {
            const colorConfig = getNoteColorConfig(note.color);
            const PriorityIcon = PRIORITY_CONFIG[note.priority].icon;
            return (
              <div
                className={cn(
                  "group/note rounded-lg p-3 transition-all",
                  colorConfig.light,
                  colorConfig.border,
                  "border"
                )}
                key={note.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <PriorityIcon
                        className={cn(
                          "h-3 w-3",
                          note.priority === "low" && "text-emerald-500",
                          note.priority === "medium" && "text-amber-500",
                          note.priority === "high" && "text-rose-500"
                        )}
                      />
                      <span className="truncate font-medium text-sm">
                        {note.title}
                      </span>
                    </div>
                    {note.description && (
                      <p className="mt-1 line-clamp-2 text-stone-500 text-xs">
                        {note.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className="py-0 text-[10px]" variant="outline">
                        {STATUS_CONFIG[note.status].label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover/note:opacity-100">
                    <Button
                      className="h-7 w-7"
                      onClick={() => openNoteDialog(note)}
                      size="icon"
                      variant="ghost"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => handleDeleteNote(note.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <p className="py-4 text-center text-sm text-stone-400">
        No notes scheduled
      </p>
    );
  };

  const handleDropOnStatus = (status: NoteStatus) => {
    if (!draggedNote) {
      return;
    }
    handleStatusChange(draggedNote.id, status);
    setDraggedNote(null);
  };

  return (
    <TooltipProvider>
      <div className="calendar-wall min-h-screen p-4 sm:p-8 lg:p-12">
        <div className="mx-auto max-w-4xl">
          {/* Calendar Container */}
          <div className="calendar-enter relative pt-16 sm:pt-20">
            {/* ── Wall Nail ── */}
            <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2">
              <div className="relative flex flex-col items-center">
                {/* Nail head */}
                <div className="relative h-3.5 w-3.5 rounded-full bg-linear-to-br from-stone-400 via-stone-500 to-stone-600 shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
                  <div className="absolute inset-0.5 rounded-full bg-linear-to-br from-stone-300 to-stone-400" />
                  <div className="absolute top-0.5 left-1 h-1 w-1 rounded-full bg-white/40" />
                </div>
                {/* Nail shadow on wall */}
                <div className="absolute top-1 h-3 w-7 rounded-full bg-stone-900/10 blur-sm" />
              </div>
            </div>

            {/* ── Hanging String ── */}
            <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2">
              <svg
                aria-hidden="true"
                className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                fill="none"
                height="68"
                viewBox="0 0 60 68"
                width="60"
              >
                <title>Hanging string</title>
                {/* String shadow */}
                <path
                  d="M30 0 C28 0, 12 10, 12 30 C12 48, 20 55, 30 65 C40 55, 48 48, 48 30 C48 10, 32 0, 30 0Z"
                  fill="rgba(0,0,0,0.04)"
                  transform="translate(0, 2)"
                />
                {/* Left string */}
                <path
                  d="M30 0 C28 2, 16 12, 14 30 C12 44, 20 54, 30 64"
                  stroke="oklch(0.50 0.02 55)"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
                {/* Right string */}
                <path
                  d="M30 0 C32 2, 44 12, 46 30 C48 44, 40 54, 30 64"
                  stroke="oklch(0.50 0.02 55)"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
                {/* String highlight */}
                <path
                  d="M30 0 C28 2, 17 12, 15 30"
                  stroke="oklch(0.70 0.01 55 / 0.4)"
                  strokeLinecap="round"
                  strokeWidth="0.5"
                />
              </svg>
            </div>

            <Card className="calendar-paper relative overflow-hidden border-0 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12),0_25px_55px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)]">
              {/* ── Spiral Binding ── */}
              <div className="relative z-10 flex h-10 items-center justify-center gap-5 overflow-visible border-stone-200/60 border-b bg-linear-to-b from-stone-100 via-stone-50 to-transparent dark:border-stone-800/60 dark:from-stone-800/60 dark:via-stone-800/30">
                {/* Top shadow for depth */}
                <div className="absolute inset-x-0 top-0 h-px bg-stone-300/30 dark:bg-black/20" />
                {SPIRAL_RING_MARKERS.map((ring) => (
                  <div
                    className="relative flex flex-col items-center"
                    key={ring}
                  >
                    {/* Wire loop protruding above */}
                    <div className="absolute -top-3.5 h-4 w-3 overflow-visible">
                      <div className="absolute inset-0 rounded-t-full border-[1.5px] border-stone-400/80 border-b-0 bg-linear-to-b from-stone-300/20 to-transparent" />
                      <div className="spiral-wire-shine absolute top-px left-px h-2.5 w-0.5 rounded-full bg-white/30" />
                    </div>
                    {/* Punch hole with depth */}
                    <div className="relative h-3.5 w-3.5 rounded-full bg-linear-to-br from-stone-300 to-stone-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.25),0_0.5px_0_rgba(255,255,255,0.5)] dark:from-stone-800 dark:to-stone-950 dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),0_0.5px_0_rgba(255,255,255,0.1)]">
                      <div className="absolute inset-0.75 rounded-full bg-linear-to-br from-stone-100 to-stone-200 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.1)] dark:from-stone-700 dark:to-stone-800 dark:shadow-[inset_0_-1px_2px_rgba(0,0,0,0.5)]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Hero Section ── */}
              <div className="relative h-40 overflow-hidden border-stone-200/40 border-b bg-linear-to-br from-stone-800 via-stone-700 to-stone-900 sm:h-52 lg:h-60">
                <Image
                  alt={`${monthName} calendar artwork`}
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                  src={heroArtworkSource}
                />
                {/* Layered overlays for depth */}
                <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/20" />
                <div className="absolute inset-0 bg-linear-to-r from-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-white/40" />

                {/* Quote */}
                <div className="absolute top-6 left-6 sm:top-8 sm:left-10">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-6 bg-white/40" />
                    <p className="font-medium text-[11px] text-white/55 uppercase tracking-[0.35em]">
                      {monthQuote}
                    </p>
                  </div>
                </div>

                {/* Month + Year display */}
                <div className="absolute right-6 bottom-8 text-right sm:right-10 sm:bottom-10">
                  <div className="font-light text-base text-white/60 tracking-[0.2em] sm:text-lg">
                    {yearNum}
                  </div>
                  <div
                    className="font-bold font-display text-4xl text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)] sm:text-6xl lg:text-7xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {monthName}
                  </div>
                </div>
              </div>

              {/* ── Main Content ── */}
              <div className="p-5 sm:p-8 lg:p-10">
                {/* Controls */}
                <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full bg-stone-100 p-1 dark:bg-stone-800/80">
                      <Button
                        className="h-9 w-9 rounded-full hover:bg-white dark:hover:bg-stone-700"
                        onClick={previousMonth}
                        size="icon"
                        variant="ghost"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        className="rounded-full px-3 font-medium text-sm hover:bg-white dark:hover:bg-stone-700"
                        onClick={goToToday}
                        size="sm"
                        variant="ghost"
                      >
                        Today
                      </Button>
                      <Button
                        className="h-9 w-9 rounded-full hover:bg-white dark:hover:bg-stone-700"
                        onClick={nextMonth}
                        size="icon"
                        variant="ghost"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    <Tabs
                      className="flex-1 sm:flex-none"
                      onValueChange={(nextView) => {
                        if (isCalendarView(nextView)) {
                          setView(nextView);
                        }
                      }}
                      value={view}
                    >
                      <TabsList className="rounded-full bg-stone-100 p-1 dark:bg-stone-800/80">
                        <TabsTrigger
                          className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-stone-700"
                          value="month"
                        >
                          Calendar
                        </TabsTrigger>
                        <TabsTrigger
                          className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-stone-700"
                          value="kanban"
                        >
                          Kanban
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <Button
                      className="rounded-full shadow-lg shadow-stone-900/10 dark:shadow-black/50"
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                      size="icon"
                      variant="ghost"
                    >
                      {mounted && theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </Button>

                    <Dialog
                      onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                          resetForm();
                        }
                      }}
                      open={isDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="rounded-full shadow-lg shadow-stone-900/10"
                          onClick={() => openNoteDialog()}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          New Note
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl">
                            {editingNote ? "Edit Note" : "Create Note"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingNote
                              ? "Update your note details below."
                              : "Select dates and fill in the details for your new note."}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 py-4">
                          {/* Calendar Picker */}
                          <div className="space-y-3">
                            <Label className="font-medium text-sm">
                              Select Date(s)
                            </Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="dialog-start-date">
                                  First date
                                </Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      className="w-full justify-between rounded-lg border border-input bg-transparent px-3 font-normal"
                                      id="dialog-start-date"
                                      variant="outline"
                                    >
                                      <span
                                        className={cn(
                                          !formStartDate &&
                                            "text-muted-foreground"
                                        )}
                                      >
                                        {formatDialogDateLabel(formStartDate)}
                                      </span>
                                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    align="start"
                                    className="w-auto p-0"
                                  >
                                    <Calendar
                                      autoFocus
                                      disabled={(date) => isPastDate(date)}
                                      mode="single"
                                      onSelect={handleStartDatePick}
                                      selected={
                                        parseDateKey(formStartDate) ?? undefined
                                      }
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="dialog-end-date">
                                  Last date
                                </Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      className="w-full justify-between rounded-lg border border-input bg-transparent px-3 font-normal"
                                      id="dialog-end-date"
                                      variant="outline"
                                    >
                                      <span
                                        className={cn(
                                          !formEndDate &&
                                            "text-muted-foreground"
                                        )}
                                      >
                                        {formatDialogDateLabel(formEndDate)}
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    align="start"
                                    className="w-auto p-0"
                                  >
                                    <Calendar
                                      autoFocus
                                      disabled={(date) => {
                                        if (isPastDate(date)) {
                                          return true;
                                        }

                                        const parsedStart =
                                          parseDateKey(formStartDate);
                                        if (!parsedStart) {
                                          return false;
                                        }

                                        return date < parsedStart;
                                      }}
                                      mode="single"
                                      onSelect={handleEndDatePick}
                                      selected={
                                        parseDateKey(formEndDate) ?? undefined
                                      }
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            {dateFieldError && (
                              <p className="font-medium text-rose-600 text-xs">
                                {dateFieldError}
                              </p>
                            )}
                          </div>

                          {/* Form Fields */}
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="title">Title</Label>
                              <Input
                                className="rounded-lg"
                                id="title"
                                onChange={(event) => {
                                  setNoteTitle(event.target.value);
                                  clearFormError("title");
                                }}
                                placeholder="What needs to be done?"
                                required
                                value={noteTitle}
                              />
                              {formErrors.title && (
                                <p className="font-medium text-rose-600 text-xs">
                                  {formErrors.title}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                className="resize-none rounded-lg"
                                id="description"
                                onChange={(event) => {
                                  setNoteDescription(event.target.value);
                                  clearFormError("description");
                                }}
                                placeholder="Add more details..."
                                required
                                rows={3}
                                value={noteDescription}
                              />
                              {formErrors.description && (
                                <p className="font-medium text-rose-600 text-xs">
                                  {formErrors.description}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                  onValueChange={(priority) => {
                                    if (isNotePriority(priority)) {
                                      setNotePriority(priority);
                                      clearFormError("priority");
                                    }
                                  }}
                                  value={notePriority}
                                >
                                  <SelectTrigger className="rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">
                                      <span className="flex items-center gap-2">
                                        <Circle className="h-3 w-3 text-emerald-500" />
                                        Low
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                      <span className="flex items-center gap-2">
                                        <AlertCircle className="h-3 w-3 text-amber-500" />
                                        Medium
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="high">
                                      <span className="flex items-center gap-2">
                                        <Sparkles className="h-3 w-3 text-rose-500" />
                                        High
                                      </span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {formErrors.priority && (
                                  <p className="font-medium text-rose-600 text-xs">
                                    {formErrors.priority}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                  onValueChange={(value) => {
                                    setNoteStatus(value as NoteStatus);
                                    clearFormError("status");
                                  }}
                                  value={noteStatus}
                                >
                                  <SelectTrigger className="rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in-progress">
                                      In Progress
                                    </SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                  </SelectContent>
                                </Select>
                                {formErrors.status && (
                                  <p className="font-medium text-rose-600 text-xs">
                                    {formErrors.status}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Color</Label>
                              <div className="flex gap-2">
                                {NOTE_COLORS.map((color) => (
                                  <button
                                    className={cn(
                                      "h-8 w-8 rounded-full transition-all duration-200",
                                      color.bg,
                                      noteColor === color.value
                                        ? "scale-110 ring-2 ring-stone-900 ring-offset-2"
                                        : "hover:scale-105"
                                    )}
                                    key={color.value}
                                    onClick={() => {
                                      setNoteColor(color.value);
                                      clearFormError("color");
                                    }}
                                    title={color.name}
                                    type="button"
                                  />
                                ))}
                              </div>
                              {formErrors.color && (
                                <p className="font-medium text-rose-600 text-xs">
                                  {formErrors.color}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="location">Location</Label>
                              <div className="relative">
                                <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  className="rounded-lg pl-10"
                                  id="location"
                                  onChange={(event) => {
                                    setNoteLocation(event.target.value);
                                    clearFormError("location");
                                  }}
                                  placeholder="Add location"
                                  required
                                  value={noteLocation}
                                />
                              </div>
                              {formErrors.location && (
                                <p className="font-medium text-rose-600 text-xs">
                                  {formErrors.location}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="tags">Tags</Label>
                              <div className="relative">
                                <TagIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  className="rounded-lg pl-10"
                                  id="tags"
                                  onChange={(event) => {
                                    setNoteTags(event.target.value);
                                    clearFormError("tags");
                                  }}
                                  placeholder="work, personal, urgent"
                                  required
                                  value={noteTags}
                                />
                              </div>
                              {formErrors.tags && (
                                <p className="font-medium text-rose-600 text-xs">
                                  {formErrors.tags}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 border-t pt-4">
                            <Button
                              className="rounded-lg"
                              onClick={() => {
                                setIsDialogOpen(false);
                                resetForm();
                              }}
                              variant="ghost"
                            >
                              Cancel
                            </Button>
                            <Button
                              className="rounded-lg"
                              disabled={isSaveDisabled}
                              onClick={handleSaveNote}
                            >
                              {editingNote ? "Save Changes" : "Create Note"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Selection Helper */}
                {selectedDates.length > 0 && view === "month" && (
                  <div className="mb-6 flex items-center justify-between rounded-xl border border-transparent bg-linear-to-r from-stone-100 to-stone-50 p-4 dark:border-stone-800/50 dark:from-stone-800/80 dark:to-stone-900/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-stone-700">
                        <CalendarIcon className="h-5 w-5 text-stone-600 dark:text-stone-300" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-stone-900 dark:text-stone-100">
                          {selectedDates.length === 1
                            ? "Click same date again to create note, or select end date for range"
                            : "Date range selected"}
                        </p>
                        <p className="text-stone-500 text-xs dark:text-stone-400">
                          {selectedDates[0].toLocaleDateString("default", {
                            month: "short",
                            day: "numeric",
                          })}
                          {selectedDates.length === 2 &&
                            ` — ${selectedDates[1].toLocaleDateString("default", { month: "short", day: "numeric" })}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="text-stone-500 dark:text-stone-400 dark:hover:bg-stone-800"
                      onClick={() => setSelectedDates([])}
                      size="sm"
                      variant="ghost"
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {/* Views */}
                {view === "month" ? (
                  <div className="space-y-4">
                    {/* Day Headers */}
                    <div className="mb-1 grid grid-cols-7 gap-px">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day, i) => (
                          <div
                            className={cn(
                              "py-2.5 text-center font-semibold text-[11px] uppercase tracking-[0.12em]",
                              i === 5 || i === 6
                                ? "text-(--cal-weekend)"
                                : "text-(--cal-ink-light)"
                            )}
                            key={day}
                          >
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-stone-200/50 bg-stone-200/40 dark:border-stone-800 dark:bg-stone-900">
                      {days.map((date) => {
                        const dateKey = getDateKey(date);
                        const dayNotes = getNotesForDate(date);
                        const holiday = getHoliday(date);
                        const isTodayDate = isToday(date);
                        const isCurrentMonthDate = isCurrentMonth(date);
                        const isWeekend =
                          date.getDay() === 0 || date.getDay() === 6;
                        const isPast = isPastDate(date);
                        const inRange = isInSelectedRange(date);
                        const isStart = isRangeStart(date);
                        const isEnd = isRangeEnd(date);

                        return (
                          <Popover key={dateKey}>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  "relative aspect-square p-1.5 transition-all duration-200 sm:aspect-4/3 sm:p-2",
                                  "group hover:z-10",
                                  !isCurrentMonthDate &&
                                    "bg-stone-100/60 opacity-20 dark:bg-stone-900/60",
                                  isPast && isCurrentMonthDate && "opacity-45",
                                  isCurrentMonthDate &&
                                    !isPast &&
                                    !isTodayDate &&
                                    !inRange &&
                                    !isStart &&
                                    !isEnd &&
                                    "bg-(--cal-paper) hover:bg-stone-50 dark:hover:bg-white/5",
                                  isTodayDate &&
                                    !isStart &&
                                    !isEnd &&
                                    "today-pulse bg-(--cal-today-bg) shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
                                  inRange &&
                                    !isTodayDate &&
                                    !isStart &&
                                    !isEnd &&
                                    "bg-(--cal-accent-soft) hover:bg-blue-100 dark:hover:bg-(--cal-accent-soft)/80",
                                  (isStart || isEnd) &&
                                    !isTodayDate &&
                                    "bg-(--cal-accent) text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-110"
                                )}
                                disabled={isPast && !isCurrentMonthDate}
                                onClick={() => handleDateClick(date)}
                                type="button"
                              >
                                <div className="flex h-full flex-col">
                                  <div
                                    className={cn(
                                      "font-semibold text-sm tabular-nums sm:text-base",
                                      isTodayDate &&
                                        !isStart &&
                                        !isEnd &&
                                        "text-white",
                                      isWeekend &&
                                        !isTodayDate &&
                                        !isStart &&
                                        !isEnd &&
                                        "text-(--cal-weekend)",
                                      (isStart || isEnd) &&
                                        !isTodayDate &&
                                        "text-white"
                                    )}
                                  >
                                    {date.getDate()}
                                  </div>

                                  {/* Holiday indicator */}
                                  {holiday && (
                                    <span
                                      className="absolute top-1 right-1 text-xs"
                                      title={holiday.name}
                                    >
                                      {holiday.emoji}
                                    </span>
                                  )}

                                  {/* Notes indicator */}
                                  <div className="mt-1 flex flex-1 flex-col justify-end gap-0.5">
                                    {dayNotes.slice(0, 2).map((note) => {
                                      const colorConfig = getNoteColorConfig(
                                        note.color
                                      );
                                      return (
                                        <div
                                          className={cn(
                                            "truncate rounded px-1 py-0.5 font-medium text-[9px] sm:text-[10px]",
                                            isTodayDate
                                              ? "bg-white/20 text-white"
                                              : colorConfig.light,
                                            (isStart || isEnd) &&
                                              !isTodayDate &&
                                              "bg-white/30 text-white"
                                          )}
                                          key={note.id}
                                        >
                                          {note.title}
                                        </div>
                                      );
                                    })}
                                    {dayNotes.length > 2 && (
                                      <div
                                        className={cn(
                                          "font-medium text-[9px]",
                                          isTodayDate
                                            ? "text-white/70"
                                            : "text-stone-400"
                                        )}
                                      >
                                        +{dayNotes.length - 2}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-80 overflow-hidden rounded-xl p-0 dark:border-stone-800"
                            >
                              <div className="border-b bg-linear-to-br from-stone-100 to-stone-50 p-4 dark:border-stone-800/60 dark:from-stone-800/80 dark:to-stone-900/80">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-lg dark:text-stone-100">
                                      {date.toLocaleDateString("default", {
                                        weekday: "long",
                                      })}
                                    </h4>
                                    <p className="text-sm text-stone-500 dark:text-stone-400">
                                      {date.toLocaleDateString("default", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                  {!isPast && (
                                    <Button
                                      className="rounded-full"
                                      onClick={() => {
                                        syncDialogDateFields(date, date);
                                        setIsDialogOpen(true);
                                      }}
                                      size="sm"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                {holiday && (
                                  <Badge className="mt-2" variant="secondary">
                                    {holiday.emoji} {holiday.name}
                                  </Badge>
                                )}
                              </div>
                              <div className="max-h-64 overflow-y-auto p-4">
                                {getDayContent(isPast, dayNotes)}
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Kanban View */
                  <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
                    {(Object.keys(STATUS_CONFIG) as NoteStatus[]).map(
                      (status) => {
                        const config = STATUS_CONFIG[status];
                        const statusNotes = notesByStatus[status];

                        return (
                          <div
                            className={cn(
                              "min-h-100 rounded-xl border p-5 shadow-inner",
                              config.color,
                              config.borderColor
                            )}
                            key={status}
                          >
                            <div className="mb-5 flex items-center justify-between border-stone-200/60 border-b pb-3 dark:border-stone-800/60">
                              <div className="flex items-center gap-2">
                                {status === "todo" && (
                                  <Circle className="h-4 w-4 text-stone-500" />
                                )}
                                {status === "in-progress" && (
                                  <Clock className="h-4 w-4 text-blue-500" />
                                )}
                                {status === "done" && (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                )}
                                <h3 className="font-semibold text-(--cal-ink) text-sm uppercase tracking-wider">
                                  {config.label}
                                </h3>
                              </div>
                              <Badge
                                className="rounded-full bg-stone-200/50 text-(--cal-ink-light) dark:bg-stone-800"
                                variant="secondary"
                              >
                                {statusNotes.length}
                              </Badge>
                            </div>

                            <Button
                              className="mb-4 h-10 w-full justify-center rounded-lg border-2 border-stone-300/40 border-dashed bg-transparent text-(--cal-ink-light) text-xs hover:bg-white/50"
                              disabled={!draggedNote}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={() => handleDropOnStatus(status)}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              Drop task here
                            </Button>

                            <div className="space-y-4">
                              {statusNotes.length === 0 ? (
                                <div className="py-12 text-center text-(--cal-ink-light) text-sm opacity-70">
                                  <p>No tasks</p>
                                </div>
                              ) : (
                                statusNotes.map((note) => {
                                  const colorConfig = getNoteColorConfig(
                                    note.color
                                  );
                                  const PriorityIcon =
                                    PRIORITY_CONFIG[note.priority].icon;
                                  const startDate = new Date(note.startDate);
                                  const endDate = new Date(note.endDate);
                                  const isMultiDay =
                                    note.startDate !== note.endDate;

                                  return (
                                    <div
                                      className={cn(
                                        "group relative cursor-grab transition-all hover:z-10 hover:-translate-y-1 hover:shadow-xl active:cursor-grabbing"
                                      )}
                                      key={note.id}
                                    >
                                      {/* Sticky note drop shadow */}
                                      <div className="absolute inset-0 translate-y-1 rotate-1 rounded-sm bg-black/10 blur-sm" />
                                      {/* Sticky note body */}
                                      <Card
                                        className={cn(
                                          "relative h-full w-full rounded-none border border-black/5 p-4 shadow-sm dark:border-white/5",
                                          colorConfig.light
                                        )}
                                        draggable
                                        onDragEnd={() => setDraggedNote(null)}
                                        onDragStart={() => setDraggedNote(note)}
                                      >
                                        <div className="flex items-start gap-3 pl-1">
                                          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-current opacity-20 transition-opacity hover:opacity-50" />
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                              <h4 className="font-medium text-inherit text-sm leading-snug">
                                                {note.title}
                                              </h4>
                                              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Button
                                                  className="h-6 w-6 hover:bg-black/5 dark:hover:bg-white/10"
                                                  onClick={() =>
                                                    openNoteDialog(note)
                                                  }
                                                  size="icon"
                                                  variant="ghost"
                                                >
                                                  <Edit2 className="h-3 w-3 text-current opacity-70" />
                                                </Button>
                                                <Button
                                                  className="h-6 w-6 hover:bg-rose-500/10"
                                                  onClick={() =>
                                                    handleDeleteNote(note.id)
                                                  }
                                                  size="icon"
                                                  variant="ghost"
                                                >
                                                  <Trash2 className="h-3 w-3 text-rose-600" />
                                                </Button>
                                              </div>
                                            </div>

                                            {note.description && (
                                              <p className="mt-2 line-clamp-2 text-xs italic opacity-80">
                                                {note.description}
                                              </p>
                                            )}

                                            <div className="mt-3 flex items-center gap-2 text-xs opacity-70">
                                              <CalendarIcon className="h-3 w-3" />
                                              <span>
                                                {startDate.toLocaleDateString(
                                                  "default",
                                                  {
                                                    month: "short",
                                                    day: "numeric",
                                                  }
                                                )}
                                                {isMultiDay &&
                                                  ` - ${endDate.toLocaleDateString("default", { month: "short", day: "numeric" })}`}
                                              </span>
                                            </div>

                                            {note.location && (
                                              <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate">
                                                  {note.location}
                                                </span>
                                              </div>
                                            )}

                                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                              <Badge
                                                className={cn(
                                                  "border-black/5 bg-white/40 px-1.5 py-0 text-[10px] dark:border-white/5 dark:bg-black/20",
                                                  PRIORITY_CONFIG[note.priority]
                                                    .color
                                                )}
                                                variant="outline"
                                              >
                                                <PriorityIcon className="mr-1 h-2.5 w-2.5" />
                                                {note.priority}
                                              </Badge>
                                              {(note.tags || [])
                                                .slice(0, 2)
                                                .map((tag) => (
                                                  <Badge
                                                    className="border-black/5 bg-white/40 px-1.5 py-0 text-[10px] text-current opacity-80 dark:border-white/5 dark:bg-black/20"
                                                    key={tag}
                                                    variant="secondary"
                                                  >
                                                    {tag}
                                                  </Badge>
                                                ))}
                                              {(note.tags || []).length > 2 && (
                                                <span className="text-[10px] opacity-60">
                                                  +{note.tags.length - 2}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </Card>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-stone-200/60 border-t pt-5 text-(--cal-ink-light) text-[11px]">
                  <div className="flex items-center gap-5">
                    <span className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-(--cal-today-bg)" />
                      Today
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-(--cal-accent)" />
                      Selected
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-(--cal-weekend)" />
                      Weekend
                    </span>
                  </div>
                  <p className="tracking-wide">
                    Click a date to select · click again for note · or pick a
                    range
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
