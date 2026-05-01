import { useState } from "react";

export default function SessionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; meet_link: string; date: string; duration_minutes?: number | null };
  onSubmit: (values: { title: string; meet_link: string; date: string; duration_minutes: number }) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [meetLink, setMeetLink] = useState(initial?.meet_link || "");
  const [date, setDate] = useState(initial?.date || "");
  const [durationMinutes, setDurationMinutes] = useState(
    Number.isFinite(initial?.duration_minutes as number) && (initial?.duration_minutes as number) > 0
      ? String(initial?.duration_minutes)
      : "60",
  );
  const [error, setError] = useState("");

  function validateUrl(url: string) {
    try {
      const u = new URL(url);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !meetLink.trim() || !date) {
      setError("All fields are required.");
      return;
    }
    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration < 5 || duration > 1440) {
      setError("Duration must be between 5 and 1440 minutes.");
      return;
    }
    if (!validateUrl(meetLink)) {
      setError("Please enter a valid Meet link URL.");
      return;
    }
    setError("");
    onSubmit({ title, meet_link: meetLink, date, duration_minutes: duration });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Title</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Meet Link</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={meetLink}
          onChange={(e) => setMeetLink(e.target.value)}
          required
          placeholder="https://meet.google.com/..."
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Date & Time</label>
        <input
          type="datetime-local"
          className="w-full border rounded px-3 py-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Duration (minutes)</label>
        <input
          type="number"
          min={5}
          max={1440}
          step={5}
          className="w-full border rounded px-3 py-2"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          required
          placeholder="60"
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
