import React from "react";
import { createRoot } from "react-dom/client";
import { Container, Row, Col, Button, Alert, Form } from "react-bootstrap";
import { apiBaseUrl } from "./config";
import { registerUser } from "./apiClient";
import ProjectsView from "./ProjectsView";
import TasksView from "./TasksView";
import NotificationsView from "./NotificationsView";

type ChangeEvent<T> = React.ChangeEvent<T>;

type AuthState = "checking" | "logged_out" | "logged_in";
type AppView = "projects" | "tasks" | "notifications";

function App() {
  const [authState, setAuthState] = React.useState<AuthState>("checking");
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [view, setView] = React.useState<AppView>("projects");
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    fetch(`${apiBaseUrl}/api/v1/auth/me`, { credentials: "include" })
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
    fetch(`${apiBaseUrl}/api/v1/auth/login`, {
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

  const handleRegister = (email: string, password: string, birthDate: string) => {
    setAuthError(null);
    registerUser({ email, password, birthDate })
      .then((r) => {
        if (r.status === 201) {
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
    fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setAuthState("logged_out");
        setView("projects");
        setSelectedProjectId(null);
      })
      .catch(() => setAuthState("logged_out"));
  };

  const handleAuthRequired = () => {
    setAuthState("logged_out");
  };

  const handleViewProjectTasks = (projectId: string) => {
    setSelectedProjectId(projectId);
    setView("tasks");
  };

  if (authState === "checking") {
    return (
      <Container>
        <Row>
          <Col md={{ offset: 2, span: 8 }} className="text-center mt-5">
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
          <Col md={{ offset: 2, span: 8 }}>
            <h2 className="text-center mt-4 mb-4">Connexion / Inscription</h2>
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
        <Col md={{ offset: 2, span: 8 }}>
          <div className="d-flex justify-content-end mb-3 mt-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleLogout}
            >
              Déconnexion
            </Button>
          </div>
          <div className="d-flex gap-2 mb-3">
            <Button
              type="button"
              variant={view === "projects" ? "primary" : "outline-primary"}
              size="sm"
              onClick={() => setView("projects")}
            >
              Projets
            </Button>
            <Button
              type="button"
              variant={view === "notifications" ? "primary" : "outline-primary"}
              size="sm"
              onClick={() => setView("notifications")}
            >
              Notifications
            </Button>
          </div>
          {view === "projects" ? (
            <ProjectsView
              onAuthRequired={handleAuthRequired}
              onViewTasks={handleViewProjectTasks}
            />
          ) : view === "tasks" ? (
            <>
              <Button
                type="button"
                variant="outline-primary"
                size="sm"
                className="mb-3"
                onClick={() => setView("projects")}
              >
                Retour aux projets
              </Button>
              <TasksView
                onAuthRequired={handleAuthRequired}
                initialProjectId={selectedProjectId ?? ""}
              />
            </>
          ) : (
            <NotificationsView onAuthRequired={handleAuthRequired} />
          )}
        </Col>
      </Row>
    </Container>
  );
}

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, birthDate: string) => void;
}

function LoginForm({ onLogin, onRegister }: LoginFormProps) {
  return (
    <Row className="g-3">
      <Col md={6}>
        <LoginPanel onLogin={onLogin} />
      </Col>
      <Col md={6}>
        <RegisterPanel onRegister={onRegister} />
      </Col>
    </Row>
  );
}

interface LoginPanelProps {
  onLogin: (email: string, password: string) => void;
}

function LoginPanel({ onLogin }: LoginPanelProps) {
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
    <>
      <h3 className="text-center mb-3">Connexion</h3>
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
      </Form>
    </>
  );
}

interface RegisterPanelProps {
  onRegister: (email: string, password: string, birthDate: string) => void;
}

function RegisterPanel({ onRegister }: RegisterPanelProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    onRegister(email, password, birthDate);
    setTimeout(() => setSubmitting(false), 1000);
  };

  const isFormValid = !!email && !!password && !!birthDate;

  return (
    <>
      <h3 className="text-center mb-3">Inscription</h3>
      <Form onSubmit={handleSubmit}>
        {localError && (
          <Alert variant="danger" className="py-2 mb-3">
            {localError}
          </Alert>
        )}
        <Form.Group className="mb-3">
          <Form.Label htmlFor="register-email">Email</Form.Label>
          <Form.Control
            id="register-email"
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
          <Form.Label htmlFor="register-password">Mot de passe</Form.Label>
          <Form.Control
            id="register-password"
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
        <Form.Group className="mb-3">
          <Form.Label htmlFor="register-birthdate">Date de naissance</Form.Label>
          <Form.Control
            id="register-birthdate"
            type="date"
            value={birthDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setBirthDate(e.target.value)
            }
            required
            aria-label="Date de naissance"
          />
        </Form.Group>
        <Button
          type="submit"
          variant="success"
          disabled={!isFormValid || submitting}
          className="w-100"
        >
          {submitting ? "Inscription..." : "Créer un compte"}
        </Button>
      </Form>
    </>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
