import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";

export default function SessionList() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    // Real-time updates
    const channel = supabase
      .channel("sessions")
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

  if (loading) return <div className="text-center py-8">Loading sessions...</div>;
  if (!sessions.length)
    return <div className="text-center py-8 text-gray-500">No sessions available.</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="bg-white rounded-lg shadow p-6 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-semibold mb-2">{session.title}</h3>
            <p className="text-gray-500 mb-2">
              {new Date(session.date).toLocaleString()}
            </p>
          </div>
          <a
            href={session.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
          >
            Join Session
          </a>
        </div>
      ))}
    </div>
  );
}
