import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import SessionForm from "./SessionForm";

type SessionPayload = {
  title: string;
  meet_link: string;
  date: string;
  duration_minutes: number;
};

export default function AdminSessionDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSessions();
    const channel = supabase
      .channel("sessions-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        fetchSessions
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, []);

  async function fetchSessions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("date", { ascending: true });
    if (!error) setSessions(data || []);
    setLoading(false);
  }

  async function handleCreate(values: SessionPayload) {
    setError("");
    let result = await supabase.from("sessions").insert([values]);

    // Backward compatibility for environments that don't yet have duration_minutes column.
    if (result.error?.message?.includes("duration_minutes")) {
      const { duration_minutes, ...legacyValues } = values;
      result = await supabase.from("sessions").insert([legacyValues]);
    }

    if (result.error) setError(result.error.message);
    else setShowForm(false);
  }

  async function handleUpdate(values: SessionPayload) {
    setError("");
    let result = await supabase
      .from("sessions")
      .update(values)
      .eq("id", editing.id);

    // Backward compatibility for environments that don't yet have duration_minutes column.
    if (result.error?.message?.includes("duration_minutes")) {
      const { duration_minutes, ...legacyValues } = values;
      result = await supabase
        .from("sessions")
        .update(legacyValues)
        .eq("id", editing.id);
    }

    if (result.error) setError(result.error.message);
    else setEditing(null);
  }

  async function handleDelete(id: string) {
    setError("");
    if (!window.confirm("Delete this session?")) return;
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) setError(error.message);
  }

  return (
    <div className="mx-auto max-w-2xl p-2 sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Manage Sessions</h2>
        <button
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + New Session
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {showForm && (
        <SessionForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}
      {editing && (
        <SessionForm
          initial={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}
      <div className="divide-y">
        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : !sessions.length ? (
          <div className="py-8 text-center text-gray-500">No sessions found.</div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-medium">{session.title}</div>
                <div className="text-gray-500 text-sm">
                  {new Date(session.date).toLocaleString()}
                </div>
                <div className="text-gray-500 text-sm">
                  Duration: {session.duration_minutes ? `${session.duration_minutes} min` : "Not set"}
                </div>
                <a
                  href={session.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Join Link
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                  onClick={() => setEditing(session)}
                >
                  Edit
                </button>
                <button
                  className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                  onClick={() => handleDelete(session.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
