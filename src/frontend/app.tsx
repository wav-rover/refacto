/// <reference types="react" />
type FormEvent<T> = React.FormEvent<T>;
type ChangeEvent<T> = React.ChangeEvent<T>;

type ItemStatus = "todo" | "in_progress" | "done";
type ItemPriority = "low" | "medium" | "high";

interface Item {
  id: string;
  name: string;
  completed: boolean;
  status: ItemStatus;
  priority: ItemPriority;
  dueDate: string | null;
}

type AuthState = "checking" | "logged_out" | "logged_in";

function App() {
  const { Container, Row, Col, Button, Alert } = ReactBootstrap;
  const [authState, setAuthState] = React.useState<AuthState>("checking");
  const [authError, setAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/items")
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

  const handleLogin = (username: string, password: string) => {
    setAuthError(null);
    fetch("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
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

  const handleLogout = () => {
    fetch("/logout", { method: "POST" })
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
            <LoginForm onLogin={handleLogin} />
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
            <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
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
  onLogin: (username: string, password: string) => void;
}

function LoginForm({ onLogin }: LoginFormProps) {
  const { Form, Button } = ReactBootstrap;
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    onLogin(username, password);
    setTimeout(() => setSubmitting(false), 1000);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="login-username">Nom d&apos;utilisateur</Form.Label>
        <Form.Control
          id="login-username"
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          required
          aria-label="Nom d'utilisateur"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="login-password">Mot de passe</Form.Label>
        <Form.Control
          id="login-password"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          aria-label="Mot de passe"
        />
      </Form.Group>
      <Button
        type="submit"
        variant="primary"
        disabled={!username || !password || submitting}
        className="w-100"
      >
        {submitting ? "Connexion..." : "Se connecter"}
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
  const { Form, InputGroup, Button, Row, Col } = ReactBootstrap;

  const [newItem, setNewItem] = React.useState<string>("");
  const [status, setStatus] = React.useState<ItemStatus>("todo");
  const [priority, setPriority] = React.useState<ItemPriority>("medium");
  const [dueDate, setDueDate] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const submitNewItem = (e: FormEvent<HTMLFormElement>) => {
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
        setStatus("todo");
        setPriority("medium");
        setDueDate("");
      })
      .catch(() => setSubmitting(false));
  };

  return (
    <Form onSubmit={submitNewItem}>
      <InputGroup className="mb-3">
        <Form.Control
          value={newItem}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNewItem(e.target.value)
          }
          type="text"
          placeholder="New Item"
          aria-describedby="basic-addon1"
        />
        <InputGroup.Append>
          <Button
            type="submit"
            variant="success"
            disabled={!newItem.length}
            className={submitting ? "disabled" : ""}
          >
            {submitting ? "Adding..." : "Add Item"}
          </Button>
        </InputGroup.Append>
      </InputGroup>
      <Row className="mb-3">
        <Col xs={4}>
          <Form.Group>
            <Form.Label htmlFor="add-status">Statut</Form.Label>
            <Form.Control
              id="add-status"
              as="select"
              value={status}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setStatus(e.target.value as ItemStatus)
              }
              aria-label="Statut"
            >
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="done">Terminé</option>
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
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setPriority(e.target.value as ItemPriority)
              }
              aria-label="Priorité"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDueDate(e.target.value)
              }
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

function ItemDisplay({ item, onItemUpdate, onItemRemoval, onAuthRequired }: ItemDisplayProps) {
  const { Container, Row, Col, Button, Form } = ReactBootstrap;

  const status = item.status ?? "todo";
  const priority = item.priority ?? "medium";
  const dueDate = item.dueDate ?? "";

  const sendUpdate = (updates: {
    name?: string;
    completed?: boolean;
    status?: ItemStatus;
    priority?: ItemPriority;
    dueDate?: string | null;
  }) => {
    const body = {
      name: updates.name ?? item.name,
      completed: updates.completed ?? item.completed,
      status: updates.status ?? status,
      priority: updates.priority ?? priority,
      dueDate: updates.dueDate !== undefined ? updates.dueDate : (item.dueDate ?? null),
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

  const onStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    sendUpdate({ status: e.target.value as ItemStatus });
  };

  const onPriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    sendUpdate({ priority: e.target.value as ItemPriority });
  };

  const onDueDateChange = (e: ChangeEvent<HTMLInputElement>) => {
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
            · {status === "todo" ? "À faire" : status === "in_progress" ? "En cours" : "Terminé"}
            · {priority === "low" ? "Basse" : priority === "medium" ? "Moyenne" : "Haute"}
            {dueDate ? ` · Échéance ${new Date(dueDate).toLocaleDateString("fr-FR")}` : ""}
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
              <Form.Label htmlFor={`status-${item.id}`} className="me-1 small">Statut</Form.Label>
              <Form.Control
                id={`status-${item.id}`}
                as="select"
                size="sm"
                value={status}
                onChange={onStatusChange}
                aria-label="Statut"
                style={{ width: "auto" }}
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label htmlFor={`priority-${item.id}`} className="me-1 small">Priorité</Form.Label>
              <Form.Control
                id={`priority-${item.id}`}
                as="select"
                size="sm"
                value={priority}
                onChange={onPriorityChange}
                aria-label="Priorité"
                style={{ width: "auto" }}
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label htmlFor={`dueDate-${item.id}`} className="me-1 small">Échéance</Form.Label>
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

const root = document.getElementById("root");
if (root) {
  (
    ReactDOM as unknown as { render: (el: unknown, container: Element) => void }
  ).render(<App />, root);
}
