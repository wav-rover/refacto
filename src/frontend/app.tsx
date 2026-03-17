import React from "react";
import { createRoot } from "react-dom/client";
import {
  Container,
  Row,
  Col,
  Button,
  Alert,
  Form,
  InputGroup,
  Table,
} from "react-bootstrap";
import { apiBaseUrl } from "./config";
import { Status, Priority, Item } from "../ports/itemRepository";

/** Type Task aligné sur la réponse du task-service via le Gateway */
interface Task {
  id: string;
  title: string;
  projectId: string;
  createdBy: string;
  assignedTo: string | null;
  completed: boolean;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
}

type ChangeEvent<T> = React.ChangeEvent<T>;

type AuthState = "checking" | "logged_out" | "logged_in";

function App() {
  const [authState, setAuthState] = React.useState<AuthState>("checking");
  const [authError, setAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${apiBaseUrl}/api/auth/me`, { credentials: "include" })
      .then((r) => {
        if (r.status === 401) {
          setAuthState("logged_out");
        } else if (r.ok) {
          setAuthState("logged_in");
        } else {
          setAuthState("logged_out");
        }
      })
      .catch(() => setAuthState("logged_out"));
  }, []);

  const handleLogin = (email: string, password: string) => {
    setAuthError(null);
    fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((r) => {
        if (r.ok) {
          setAuthState("logged_in");
        } else {
          setAuthError("Identifiants incorrects");
        }
      })
      .catch(() => setAuthError("Erreur de connexion"));
  };

  const handleRegister = (email: string, password: string) => {
    setAuthError(null);
    fetch(`${apiBaseUrl}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((r) => {
        if (r.ok) {
          // Après inscription, on enchaîne un login pour garder le flux simple.
          handleLogin(email, password);
        } else if (r.status === 409) {
          setAuthError("Email déjà utilisé");
        } else {
          setAuthError("Erreur lors de la création du compte");
        }
      })
      .catch(() => setAuthError("Erreur lors de la création du compte"));
  };

  const handleLogout = () => {
    fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(() => setAuthState("logged_out"))
      .catch(() => setAuthState("logged_out"));
  };

  const handleAuthRequired = () => {
    setAuthState("logged_out");
  };

  if (authState === "checking") {
    return (
      <Container>
        <Row>
          <Col md={{ offset: 3, span: 6 }} className="text-center mt-5">
            <p>Chargement...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  if (authState === "logged_out") {
    return (
      <Container>
        <Row>
          <Col md={{ offset: 3, span: 6 }}>
            <h2 className="text-center mt-4 mb-4">Connexion</h2>
            {authError && <Alert variant="danger">{authError}</Alert>}
            <LoginForm onLogin={handleLogin} onRegister={handleRegister} />
          </Col>
        </Row>
      </Container>
    );
  }

  const [activeView, setActiveView] = React.useState<"items" | "tasks">("tasks");

  return (
    <Container>
      <Row>
        <Col md={{ offset: 3, span: 6 }}>
          <div className="d-flex justify-content-between align-items-center mb-3 mt-3 flex-wrap gap-2">
            <div className="d-flex gap-2">
              <Button
                variant={activeView === "tasks" ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setActiveView("tasks")}
              >
                Tâches
              </Button>
              <Button
                variant={activeView === "items" ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setActiveView("items")}
              >
                Items (ancien)
              </Button>
            </div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleLogout}
            >
              Déconnexion
            </Button>
          </div>
          {activeView === "tasks" ? (
            <TasksView onAuthRequired={handleAuthRequired} />
          ) : (
            <TodoListCard onAuthRequired={handleAuthRequired} />
          )}
        </Col>
      </Row>
    </Container>
  );
}

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
}

function LoginForm({ onLogin, onRegister }: LoginFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    onLogin(email, password);
    setTimeout(() => setSubmitting(false), 1000);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="login-email">Email</Form.Label>
        <Form.Control
          id="login-email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          required
          aria-label="Email"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="login-password">Mot de passe</Form.Label>
        <Form.Control
          id="login-password"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          required
          aria-label="Mot de passe"
        />
      </Form.Group>
      <Button
        type="submit"
        variant="primary"
        disabled={!email || !password || submitting}
        className="w-100"
      >
        {submitting ? "Connexion..." : "Se connecter"}
      </Button>
      <Button
        type="button"
        variant="outline-secondary"
        disabled={!email || !password || submitting}
        className="w-100 mt-2"
        onClick={() => onRegister(email, password)}
      >
        Créer un compte
      </Button>
    </Form>
  );
}

/** Vue minimale « Tâches » : appelle uniquement le Gateway /api/tasks/... */
interface TasksViewProps {
  onAuthRequired: () => void;
}

function TasksView({ onAuthRequired }: TasksViewProps) {
  const [projectId, setProjectId] = React.useState("");
  const [tasks, setTasks] = React.useState<Task[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadTasks = React.useCallback(() => {
    const id = projectId.trim();
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
          return r.json().then((b) => Promise.reject({ status: r.status, body: b }));
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
          setError(`Erreur ${err.status}: ${err.body?.message ?? err.body?.error ?? "Impossible de charger les tâches."}`);
        } else {
          setError("Impossible de charger les tâches.");
        }
      });
  }, [projectId, onAuthRequired]);

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
    const title = (form.elements.namedItem("task-title") as HTMLInputElement)?.value?.trim();
    const id = projectId.trim();
    if (!title || !id) {
      setError("Titre et projectId obligatoires.");
      return;
    }
    const priority = (form.elements.namedItem("task-priority") as HTMLSelectElement)?.value ?? "medium";
    const status = (form.elements.namedItem("task-status") as HTMLSelectElement)?.value ?? "todo";
    setError(null);
    callTaskAction("POST", "/api/tasks", {
      title,
      projectId: id,
      priority,
      status,
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
      <div className="mb-3 d-flex gap-2 align-items-center flex-wrap">
        <Form.Control
          type="text"
          placeholder="ProjectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <Button variant="primary" size="sm" onClick={loadTasks} disabled={loading}>
          {loading ? "Chargement…" : "Charger les tâches"}
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleCreateTask} className="mb-4">
        <Form.Label className="small">Nouvelle tâche (projectId = {projectId || "—"})</Form.Label>
        <InputGroup className="mb-2">
          <Form.Control
            name="task-title"
            type="text"
            placeholder="Titre de la tâche"
            required
          />
          <Form.Select name="task-priority" aria-label="Priorité" style={{ maxWidth: 120 }}>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </Form.Select>
          <Form.Select name="task-status" aria-label="Statut" style={{ maxWidth: 130 }}>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
          </Form.Select>
          <Button type="submit" variant="success">
            Créer
          </Button>
        </InputGroup>
      </Form>

      {tasks === null && !loading && projectId.trim() && (
        <p className="text-muted small">Cliquez sur « Charger les tâches ».</p>
      )}
      {tasks && tasks.length === 0 && <p className="text-muted">Aucune tâche.</p>}
      {tasks && tasks.length > 0 && (
        <Table size="sm" bordered responsive>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Statut</th>
              <th>Priorité</th>
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
  onComplete: (taskId: string) => void;
  onReopen: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function TaskRow({
  task,
  onAssign,
  onComplete,
  onReopen,
  onDelete,
}: TaskRowProps) {
  const [assignUserId, setAssignUserId] = React.useState("");

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
      <td>{task.title}</td>
      <td>{statusLabel}</td>
      <td>{priorityLabel}</td>
      <td>{task.assignedTo ?? "—"}</td>
      <td>
        <div className="d-flex flex-wrap gap-1 align-items-center">
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
          {task.status !== "done" && (
            <Button size="sm" variant="outline-success" onClick={() => onComplete(task.id)}>
              Terminer
            </Button>
          )}
          {task.status === "done" && (
            <Button size="sm" variant="outline-warning" onClick={() => onReopen(task.id)}>
              Réouvrir
            </Button>
          )}
          <Button size="sm" variant="outline-danger" onClick={() => onDelete(task.id)}>
            Supprimer
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface TodoListCardProps {
  onAuthRequired: () => void;
}

function TodoListCard({ onAuthRequired }: TodoListCardProps) {
  const [items, setItems] = React.useState<Item[] | null>(null);

  const handleResponse = React.useCallback(
    (r: Response) => {
      if (r.status === 401) {
        onAuthRequired();
        return Promise.reject(new Error("401"));
      }
      return r.ok ? r.json() : Promise.reject(new Error(String(r.status)));
    },
    [onAuthRequired]
  );

  React.useEffect(() => {
    fetch("/items")
      .then(handleResponse)
      .then((data: Item[]) => setItems(data))
      .catch(() => setItems([]));
  }, [handleResponse]);

  const onNewItem = React.useCallback((newItem: Item) => {
    setItems((prev) => (prev ? [...prev, newItem] : [newItem]));
  }, []);

  const onItemUpdate = React.useCallback((item: Item) => {
    setItems((prev) => {
      if (!prev) return prev;
      const index = prev.findIndex((i) => i.id === item.id);
      return [...prev.slice(0, index), item, ...prev.slice(index + 1)];
    });
  }, []);

  const onItemRemoval = React.useCallback((item: Item) => {
    setItems((prev) => {
      if (!prev) return prev;
      const index = prev.findIndex((i) => i.id === item.id);
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  }, []);

  if (items === null) return "Loading...";

  return (
    <React.Fragment>
      <AddItemForm onNewItem={onNewItem} onAuthRequired={onAuthRequired} />
      {items.length === 0 && (
        <p className="text-center">No items yet! Add one above!</p>
      )}
      {items.map((item) => (
        <ItemDisplay
          item={item}
          key={item.id}
          onItemUpdate={onItemUpdate}
          onItemRemoval={onItemRemoval}
          onAuthRequired={onAuthRequired}
        />
      ))}
    </React.Fragment>
  );
}

interface AddItemFormProps {
  onNewItem: (item: Item) => void;
  onAuthRequired: () => void;
}

function AddItemForm({ onNewItem, onAuthRequired }: AddItemFormProps) {
  const [newItem, setNewItem] = React.useState<string>("");
  const [status, setStatus] = React.useState<Status>(Status.Todo);
  const [priority, setPriority] = React.useState<Priority>(Priority.Medium);
  const [dueDate, setDueDate] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const submitNewItem = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    fetch("/items", {
      method: "POST",
      body: JSON.stringify({
        name: newItem.trim(),
        status,
        priority,
        dueDate: dueDate.trim() || null,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => {
        if (r.status === 401) {
          onAuthRequired();
          return Promise.reject(new Error("401"));
        }
        return r.json();
      })
      .then((item: Item) => {
        onNewItem(item);
        setSubmitting(false);
        setNewItem("");
        setStatus(Status.Todo as Status);
        setPriority(Priority.Medium as Priority);
        setDueDate("");
      })
      .catch(() => setSubmitting(false));
  };

  return (
    <Form onSubmit={submitNewItem}>
      <InputGroup className="mb-3">
        <Form.Control
          value={newItem}
          onChange={(e: React.ChangeEvent<{ value: string }>) => setNewItem(e.target.value)}
          type="text"
          placeholder="New Item"
          aria-describedby="basic-addon1"
        />
        <Button
          type="submit"
          variant="success"
          disabled={!newItem.length}
          className={submitting ? "disabled" : ""}
        >
          {submitting ? "Adding..." : "Add Item"}
        </Button>
      </InputGroup>
      <Row className="mb-3">
        <Col xs={4}>
          <Form.Group>
            <Form.Label htmlFor="add-status">Statut</Form.Label>
            <Form.Control
              id="add-status"
              as="select"
              value={status}
              onChange={(e: React.ChangeEvent<{ value: string }>) =>
                setStatus(e.target.value as Status)
              }
              aria-label="Statut"
            >
              <option value={Status.Todo}>À faire</option>
              <option value={Status.InProgress}>En cours</option>
              <option value={Status.Done}>Terminé</option>
            </Form.Control>
          </Form.Group>
        </Col>
        <Col xs={4}>
          <Form.Group>
            <Form.Label htmlFor="add-priority">Priorité</Form.Label>
            <Form.Control
              id="add-priority"
              as="select"
              value={priority}
              onChange={(e: React.ChangeEvent<{ value: string }>) =>
                setPriority(e.target.value as Priority)
              }
              aria-label="Priorité"
            >
              <option value={Priority.Low}>Basse</option>
              <option value={Priority.Medium}>Moyenne</option>
              <option value={Priority.High}>Haute</option>
            </Form.Control>
          </Form.Group>
        </Col>
        <Col xs={4}>
          <Form.Group>
            <Form.Label htmlFor="add-dueDate">Date d&apos;échéance</Form.Label>
            <Form.Control
              id="add-dueDate"
              type="date"
              value={dueDate}
              onChange={(e: React.ChangeEvent<{ value: string }>) => setDueDate(e.target.value)}
              aria-label="Date d'échéance"
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
}

interface ItemDisplayProps {
  item: Item;
  key?: string;
  onItemUpdate: (item: Item) => void;
  onItemRemoval: (item: Item) => void;
  onAuthRequired: () => void;
}

function ItemDisplay({
  item,
  onItemUpdate,
  onItemRemoval,
  onAuthRequired,
}: ItemDisplayProps) {
  const status = item.status ?? Status.Todo;
  const priority = item.priority ?? Priority.Medium;
  const dueDate = item.dueDate ?? "";

  const sendUpdate = (updates: {
    name?: string;
    completed?: boolean;
    status?: Status;
    priority?: Priority;
    dueDate?: string | null;
  }) => {
    const body = {
      name: updates.name ?? item.name,
      completed: updates.completed ?? item.completed,
      status: updates.status ?? status,
      priority: updates.priority ?? priority,
      dueDate:
        updates.dueDate !== undefined
          ? updates.dueDate
          : (item.dueDate ?? null),
    };
    return fetch(`/items/${item.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => {
        if (r.status === 401) {
          onAuthRequired();
          return Promise.reject(new Error("401"));
        }
        return r.json();
      })
      .then((data: Item) => onItemUpdate(data))
      .catch(() => {});
  };

  const toggleCompletion = () => {
    sendUpdate({ completed: !item.completed });
  };

  const removeItem = () => {
    fetch(`/items/${item.id}`, { method: "DELETE" })
      .then((r) => {
        if (r.status === 401) {
          onAuthRequired();
          return;
        }
        onItemRemoval(item);
      })
      .catch(() => {});
  };

  const onStatusChange = (e: React.ChangeEvent<{ value: string }>) => {
    sendUpdate({ status: e.target.value as Status });
  };

  const onPriorityChange = (e: React.ChangeEvent<{ value: string }>) => {
    sendUpdate({ priority: e.target.value as Priority });
  };

  const onDueDateChange = (e: React.ChangeEvent<{ value: string }>) => {
    const value = e.target.value.trim();
    sendUpdate({ dueDate: value || null });
  };

  return (
    <Container fluid className={`item ${item.completed ? "completed" : ""}`}>
      <Row>
        <Col xs={1} className="text-center">
          <Button
            className="toggles"
            size="sm"
            variant="link"
            onClick={toggleCompletion}
            aria-label={
              item.completed
                ? "Mark item as incomplete"
                : "Mark item as complete"
            }
          >
            <i
              className={`far ${
                item.completed ? "fa-check-square" : "fa-square"
              }`}
            />
          </Button>
        </Col>
        <Col xs={10} className="name">
          {item.name}
          <span className="text-muted small ms-2">
            ·{" "}
            {status === Status.Todo
              ? "À faire"
              : status === Status.InProgress
                ? "En cours"
                : "Terminé"}
            ·{" "}
            {priority === Priority.Low
              ? "Basse"
              : priority === Priority.Medium
                ? "Moyenne"
                : "Haute"}
            {dueDate
              ? ` · Échéance ${new Date(dueDate).toLocaleDateString("fr-FR")}`
              : ""}
          </span>
        </Col>
        <Col xs={1} className="text-center remove">
          <Button
            size="sm"
            variant="link"
            onClick={removeItem}
            aria-label="Remove Item"
          >
            <i className="fa fa-trash text-danger" />
          </Button>
        </Col>
      </Row>
      <Row className="mb-2">
        <Col xs={1} />
        <Col xs={10}>
          <Form className="d-flex flex-wrap gap-2 align-items-center">
            <Form.Group className="mb-0">
              <Form.Label htmlFor={`status-${item.id}`} className="me-1 small">
                Statut
              </Form.Label>
              <Form.Control
                id={`status-${item.id}`}
                as="select"
                size="sm"
                value={status}
                onChange={onStatusChange}
                aria-label="Statut"
                style={{ width: "auto" }}
              >
                <option value={Status.Todo}>À faire</option>
                <option value={Status.InProgress}>En cours</option>
                <option value={Status.Done}>Terminé</option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label
                htmlFor={`priority-${item.id}`}
                className="me-1 small"
              >
                Priorité
              </Form.Label>
              <Form.Control
                id={`priority-${item.id}`}
                as="select"
                size="sm"
                value={priority}
                onChange={onPriorityChange}
                aria-label="Priorité"
                style={{ width: "auto" }}
              >
                <option value={Priority.Low}>Basse</option>
                <option value={Priority.Medium}>Moyenne</option>
                <option value={Priority.High}>Haute</option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label htmlFor={`dueDate-${item.id}`} className="me-1 small">
                Échéance
              </Form.Label>
              <Form.Control
                id={`dueDate-${item.id}`}
                type="date"
                size="sm"
                value={dueDate}
                onChange={onDueDateChange}
                aria-label="Date d'échéance"
                style={{ width: "auto" }}
              />
            </Form.Group>
          </Form>
        </Col>
        <Col xs={1} />
      </Row>
    </Container>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
