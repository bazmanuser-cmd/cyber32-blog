import { createFileRoute, Navigate } from "@tanstack/react-router";

// Profile edit is inside /admin
export const Route = createFileRoute("/profile")({
  component: () => <Navigate to="/admin" />,
});
