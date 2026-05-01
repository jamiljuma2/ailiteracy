import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import SessionForm from "./SessionForm";

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

  async function handleCreate(values: any) {
    setError("");
    const { error } = await supabase.from("sessions").insert([values]);
    if (error) setError(error.message);
    else setShowForm(false);
  }

  async function handleUpdate(values: any) {
    setError("");
    const { error } = await supabase
      .from("sessions")
      .update(values)
      .eq("id", editing.id);
    if (error) setError(error.message);
    else setEditing(null);
  }

  async function handleDelete(id: string) {
    setError("");
    if (!window.confirm("Delete this session?")) return;
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) setError(error.message);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Manage Sessions</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
            <div key={session.id} className="py-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{session.title}</div>
                <div className="text-gray-500 text-sm">
                  {new Date(session.date).toLocaleString()}
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
              <div className="flex gap-2">
                <button
                  className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                  onClick={() => setEditing(session)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
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
