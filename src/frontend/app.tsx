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
} from "react-bootstrap";
import { apiBaseUrl } from "./config";
import { Status, Priority, Item } from "../ports/itemRepository";

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

  return (
    <Container>
      <Row>
        <Col md={{ offset: 3, span: 6 }}>
          <div className="d-flex justify-content-end mb-3 mt-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleLogout}
            >
              Déconnexion
            </Button>
          </div>
          <TodoListCard onAuthRequired={handleAuthRequired} />
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
