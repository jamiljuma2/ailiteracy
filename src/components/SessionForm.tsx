import { useState } from "react";

export default function SessionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; meet_link: string; date: string };
  onSubmit: (values: { title: string; meet_link: string; date: string }) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [meetLink, setMeetLink] = useState(initial?.meet_link || "");
  const [date, setDate] = useState(initial?.date || "");
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
    if (!validateUrl(meetLink)) {
      setError("Please enter a valid Meet link URL.");
      return;
    }
    setError("");
    onSubmit({ title, meet_link: meetLink, date });
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
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
