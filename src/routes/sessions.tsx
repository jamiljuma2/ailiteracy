import { createFileRoute } from "@tanstack/react-router";
import SessionList from "../components/SessionList";

export const Route = createFileRoute("/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Upcoming Sessions</h1>
      <SessionList />
    </div>
  );
}
