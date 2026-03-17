import React from "react";
import { createRoot } from "react-dom/client";
import { Container, Row, Col, Button, Alert, Form } from "react-bootstrap";
import { apiBaseUrl } from "./config";
import ProjectsView from "./ProjectsView";

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
          <ProjectsView onAuthRequired={handleAuthRequired} />
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

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
