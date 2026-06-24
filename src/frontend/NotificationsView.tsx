import React from "react";
import { Alert, Button, Table } from "react-bootstrap";
import { apiBaseUrl } from "./config";

interface Notification {
  id: string;
  userId: string;
  message: string;
  type:
    | "TaskAssigned"
    | "TaskCompleted"
    | "TaskReopened"
    | "TaskDeleted"
    | "ProjectClosed"
    | "MemberAddedToProject";
  createdAt: string;
}

interface NotificationsViewProps {
  onAuthRequired: () => void;
}

function NotificationsView({ onAuthRequired }: NotificationsViewProps) {
  const [notifications, setNotifications] = React.useState<Notification[] | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadNotifications = React.useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${apiBaseUrl}/api/v1/notifications`, { credentials: "include" })
      .then((r) => {
        if (r.status === 401) {
          onAuthRequired();
          throw new Error("401");
        }
        if (!r.ok) return r.json().then((b) => Promise.reject({ status: r.status, body: b }));
        return r.json();
      })
      .then((data: Notification[]) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        if (err?.status) {
          setError(
            `Erreur ${err.status}: ${err.body?.message ?? err.body?.error ?? "Impossible de charger les notifications."}`
          );
          return;
        }
        setError("Impossible de charger les notifications.");
      });
  }, [onAuthRequired]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Notifications</h5>
        <Button
          type="button"
          size="sm"
          variant="outline-primary"
          onClick={loadNotifications}
          disabled={loading}
        >
          {loading ? "Rafraîchissement…" : "Rafraîchir"}
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {notifications === null && !error && <p>Chargement des notifications...</p>}
      {notifications && notifications.length === 0 && (
        <p className="text-muted">Aucune notification.</p>
      )}

      {notifications && notifications.length > 0 && (
        <Table size="sm" bordered responsive>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id}>
                <td style={{ whiteSpace: "nowrap" }}>
                  {new Date(n.createdAt).toLocaleString("fr-FR")}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{n.type}</td>
                <td>{n.message}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

export default NotificationsView;
