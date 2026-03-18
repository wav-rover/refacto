import React from "react";
import { Alert, Button, Form, InputGroup, Table } from "react-bootstrap";
import { apiBaseUrl } from "./config";

interface TasksViewProps {
  onAuthRequired: () => void;
  initialProjectId?: string;
}

interface Task {
  id: string;
  title: string;
  projectId: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assignedTo: string | null;
  dueDate: string | null;
}

function TasksView({ onAuthRequired, initialProjectId }: TasksViewProps) {
  const [projectId, setProjectId] = React.useState(initialProjectId ?? "");
  const [tasks, setTasks] = React.useState<Task[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadTasks = React.useCallback(
    (projectIdOverride?: string) => {
      const id = (projectIdOverride ?? projectId).trim();
      if (!id) {
        setError("Saisir un projectId pour charger les tâches.");
        return;
      }
      setError(null);
      setLoading(true);
      setTasks(null);
      fetch(`${apiBaseUrl}/api/tasks/project/${encodeURIComponent(id)}`, {
        credentials: "include",
      })
        .then((r) => {
          if (r.status === 401) {
            onAuthRequired();
            throw new Error("401");
          }
          if (!r.ok) {
            return r
              .json()
              .then((b) => Promise.reject({ status: r.status, body: b }));
          }
          return r.json();
        })
        .then((data: Task[]) => {
          setTasks(data);
          setLoading(false);
        })
        .catch((err) => {
          setLoading(false);
          if (err.status) {
            setError(
              `Erreur ${err.status}: ${err.body?.message ?? err.body?.error ?? "Impossible de charger les tâches."}`
            );
          } else {
            setError("Impossible de charger les tâches.");
          }
        });
    },
    [projectId, onAuthRequired]
  );

  React.useEffect(() => {
    const nextProjectId = (initialProjectId ?? "").trim();
    setProjectId(nextProjectId);
    setTasks(null);
    setError(null);
    setLoading(false);
    if (nextProjectId) loadTasks(nextProjectId);
  }, [initialProjectId, loadTasks]);

  const hasLockedProject = Boolean((initialProjectId ?? "").trim());

  const loadCurrentProjectTasks = () => {
    const id = projectId.trim();
    if (!id) {
      setError("Saisir un projectId pour charger les tâches.");
      return;
    }
    loadTasks(id);
  };

  const callTaskAction = (
    method: string,
    path: string,
    body?: object,
    query?: Record<string, string>
  ) => {
    setError(null);
    const url = query
      ? `${apiBaseUrl}${path}?${new URLSearchParams(query).toString()}`
      : `${apiBaseUrl}${path}`;
    return fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    }).then((r) => {
      if (r.status === 401) {
        onAuthRequired();
        return Promise.reject(new Error("401"));
      }
      if (!r.ok) {
        return r.json().then((b) => {
          setError(`${r.status}: ${b?.message ?? b?.error ?? "Erreur"}`);
          return Promise.reject(new Error(String(r.status)));
        });
      }
      return r.json();
    });
  };

  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (
      form.elements.namedItem("task-title") as HTMLInputElement
    )?.value?.trim();
    const id = projectId.trim();
    if (!title || !id) {
      setError("Titre et projectId obligatoires.");
      return;
    }
    const dueDateRaw = (
      form.elements.namedItem("task-dueDate") as HTMLInputElement
    )?.value?.trim();
    const priority =
      (form.elements.namedItem("task-priority") as HTMLSelectElement)?.value ??
      "medium";
    const status =
      (form.elements.namedItem("task-status") as HTMLSelectElement)?.value ??
      "todo";
    setError(null);
    callTaskAction("POST", "/api/tasks", {
      title,
      projectId: id,
      priority,
      status,
      dueDate: dueDateRaw ? dueDateRaw : null,
    })
      .then(() => loadTasks())
      .catch(() => {});
  };

  const handleAssign = (taskId: string, userId: string) => {
    if (!userId.trim()) {
      setError("Saisir un userId pour assigner.");
      return;
    }
    callTaskAction("POST", `/api/tasks/${taskId}/assign`, { userId })
      .then(() => loadTasks())
      .catch(() => {});
  };

  const handleUnassign = (taskId: string) => {
    callTaskAction("POST", `/api/tasks/${taskId}/unassign`, {})
      .then(() => loadTasks())
      .catch(() => {});
  };

  const handleUpdate = (
    taskId: string,
    updates: {
      title: string;
      status: Task["status"];
      priority: Task["priority"];
      dueDate: string | null;
    }
  ) => {
    callTaskAction("PATCH", `/api/tasks/${taskId}`, updates)
      .then(() => loadTasks())
      .catch(() => {});
  };

  const handleComplete = (taskId: string) => {
    callTaskAction("POST", `/api/tasks/${taskId}/complete`, {})
      .then(() => loadTasks())
      .catch(() => {});
  };

  const handleReopen = (taskId: string) => {
    callTaskAction("POST", `/api/tasks/${taskId}/reopen`, {})
      .then(() => loadTasks())
      .catch(() => {});
  };

  const handleDelete = (taskId: string) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    callTaskAction("DELETE", `/api/tasks/${taskId}`)
      .then(() => loadTasks())
      .catch(() => {});
  };

  return (
    <>
      <h5 className="mb-3">Tâches du projet</h5>
      {hasLockedProject ? (
        <p className="text-muted small mb-3">ProjectId: {projectId || "—"}</p>
      ) : (
        <div className="mb-3 d-flex gap-2 align-items-center flex-wrap">
          <Form.Control
            type="text"
            placeholder="ProjectId"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={loadCurrentProjectTasks}
            disabled={loading}
          >
            {loading ? "Chargement…" : "Afficher"}
          </Button>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleCreateTask} className="mb-4">
        <Form.Label className="small">
          Nouvelle tâche (projectId = {projectId || "—"})
        </Form.Label>
        <InputGroup className="mb-2">
          <Form.Control
            name="task-title"
            type="text"
            placeholder="Titre de la tâche"
            required
          />
          <Form.Control
            name="task-dueDate"
            type="date"
            aria-label="Date d'échéance"
            style={{ maxWidth: 170 }}
          />
          <Form.Select
            name="task-priority"
            aria-label="Priorité"
            style={{ maxWidth: 120 }}
          >
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </Form.Select>
          <Form.Select
            name="task-status"
            aria-label="Statut"
            style={{ maxWidth: 130 }}
          >
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
          </Form.Select>
          <Button type="submit" variant="success">
            Créer
          </Button>
        </InputGroup>
      </Form>

      {tasks === null && !loading && projectId.trim() && !hasLockedProject && (
        <p className="text-muted small">Cliquez sur « Afficher ».</p>
      )}
      {tasks && tasks.length === 0 && (
        <p className="text-muted">Aucune tâche.</p>
      )}
      {tasks && tasks.length > 0 && (
        <Table size="sm" bordered responsive>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Échéance</th>
              <th>Assigné à</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                onUpdate={handleUpdate}
                onComplete={handleComplete}
                onReopen={handleReopen}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

interface TaskRowProps {
  task: Task;
  onAssign: (taskId: string, userId: string) => void;
  onUnassign: (taskId: string) => void;
  onUpdate: (
    taskId: string,
    updates: {
      title: string;
      status: Task["status"];
      priority: Task["priority"];
      dueDate: string | null;
    }
  ) => void;
  onComplete: (taskId: string) => void;
  onReopen: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function TaskRow({
  task,
  onAssign,
  onUnassign,
  onUpdate,
  onComplete,
  onReopen,
  onDelete,
}: TaskRowProps) {
  const [assignUserId, setAssignUserId] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(task.title);
  const [draftStatus, setDraftStatus] = React.useState<Task["status"]>(
    task.status
  );
  const [draftPriority, setDraftPriority] = React.useState<Task["priority"]>(
    task.priority
  );
  const [draftDueDate, setDraftDueDate] = React.useState(task.dueDate ?? "");

  React.useEffect(() => {
    setIsEditing(false);
    setDraftTitle(task.title);
    setDraftStatus(task.status);
    setDraftPriority(task.priority);
    setDraftDueDate(task.dueDate ?? "");
  }, [task.id, task.title, task.status, task.priority, task.dueDate]);

  const statusLabel =
    task.status === "todo"
      ? "À faire"
      : task.status === "in_progress"
        ? "En cours"
        : "Terminé";
  const priorityLabel =
    task.priority === "low"
      ? "Basse"
      : task.priority === "medium"
        ? "Moyenne"
        : "Haute";

  return (
    <tr>
      <td>
        {isEditing ? (
          <Form.Control
            size="sm"
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            aria-label="Titre"
          />
        ) : (
          task.title
        )}
      </td>
      <td>
        {isEditing ? (
          <Form.Select
            size="sm"
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value as Task["status"])}
            aria-label="Statut"
          >
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
          </Form.Select>
        ) : (
          statusLabel
        )}
      </td>
      <td>
        {isEditing ? (
          <Form.Select
            size="sm"
            value={draftPriority}
            onChange={(e) =>
              setDraftPriority(e.target.value as Task["priority"])
            }
            aria-label="Priorité"
          >
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </Form.Select>
        ) : (
          priorityLabel
        )}
      </td>
      <td>
        {isEditing ? (
          <Form.Control
            size="sm"
            type="date"
            value={draftDueDate}
            onChange={(e) => setDraftDueDate(e.target.value)}
            aria-label="Date d'échéance"
          />
        ) : task.dueDate ? (
          new Date(task.dueDate).toLocaleDateString("fr-FR")
        ) : (
          "—"
        )}
      </td>
      <td>{task.assignedTo ?? "—"}</td>
      <td>
        <div className="d-flex flex-wrap gap-1 align-items-center">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="success"
                disabled={!draftTitle.trim()}
                onClick={() => {
                  const title = draftTitle.trim();
                  if (!title) return;
                  onUpdate(task.id, {
                    title,
                    status: draftStatus,
                    priority: draftPriority,
                    dueDate: draftDueDate.trim() ? draftDueDate.trim() : null,
                  });
                }}
              >
                Enregistrer
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setIsEditing(false)}
              >
                Annuler
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline-secondary"
              disabled={task.status === "done"}
              onClick={() => setIsEditing(true)}
            >
              Éditer
            </Button>
          )}
          <InputGroup size="sm" style={{ width: 120 }}>
            <Form.Control
              type="text"
              placeholder="userId"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
            />
          </InputGroup>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => onAssign(task.id, assignUserId)}
          >
            Assigner
          </Button>
          {task.assignedTo && (
            <Button
              size="sm"
              variant="outline-primary"
              disabled={task.status === "done"}
              onClick={() => onUnassign(task.id)}
            >
              Désassigner
            </Button>
          )}
          {task.status !== "done" && (
            <Button
              size="sm"
              variant="outline-success"
              onClick={() => onComplete(task.id)}
            >
              Terminer
            </Button>
          )}
          {task.status === "done" && (
            <Button
              size="sm"
              variant="outline-warning"
              onClick={() => onReopen(task.id)}
            >
              Réouvrir
            </Button>
          )}
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => onDelete(task.id)}
          >
            Supprimer
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default TasksView;
