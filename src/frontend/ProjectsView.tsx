import React from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { apiBaseUrl } from "./config";

type ChangeEvent<T> = React.ChangeEvent<T>;

interface Project {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  status: "open" | "closed";
  createdAt: string;
}

interface ProjectsViewProps {
  onAuthRequired: () => void;
  onViewTasks: (projectId: string) => void;
}

async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const payload = await response.json().catch(() => null);
  return payload?.message ?? fallbackMessage;
}

function ProjectsView({ onAuthRequired, onViewTasks }: ProjectsViewProps) {
  const [projects, setProjects] = React.useState<Project[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [newProjectName, setNewProjectName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [closingProjectId, setClosingProjectId] = React.useState<string | null>(
    null
  );
  const [memberInputs, setMemberInputs] = React.useState<
    Record<string, string>
  >({});
  const [updatingMembersProjectId, setUpdatingMembersProjectId] =
    React.useState<string | null>(null);

  const fetchProjects = React.useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/projects`, {
        credentials: "include",
      });

      if (response.status === 401) {
        throw new Error("401");
      }
      if (!response.ok) {
        throw new Error(String(response.status));
      }

      const data: Project[] = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message === "401") {
        onAuthRequired();
        return;
      }
      setError("Impossible de charger les projets.");
      setProjects([]);
    }
  }, [onAuthRequired]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = (
    event: React.SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!newProjectName.trim() || creating) return;

    setCreating(true);
    setError(null);

    fetch(`${apiBaseUrl}/api/v1/projects`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProjectName.trim(),
      }),
    })
      .then(async (response) => {
        if (response.status === 401) {
          throw new Error("401");
        }
        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, "Impossible de créer le projet.")
          );
        }
        return fetchProjects();
      })
      .then(() => {
        setNewProjectName("");
      })
      .catch((err: Error) => {
        if (err.message === "401") {
          onAuthRequired();
          return;
        }
        setError(err.message || "Impossible de créer le projet.");
      })
      .finally(() => {
        setCreating(false);
      });
  };

  const handleCloseProject = (projectId: string) => {
    if (closingProjectId === projectId) return;

    setClosingProjectId(projectId);
    setError(null);

    fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/close`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (response.status === 401) {
          throw new Error("401");
        }
        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, "Impossible de clore le projet.")
          );
        }
        return fetchProjects();
      })
      .catch((err: Error) => {
        if (err.message === "401") {
          onAuthRequired();
          return;
        }
        setError(err.message || "Impossible de clore le projet.");
      })
      .finally(() => {
        setClosingProjectId(null);
      });
  };

  const handleMemberInputChange = (projectId: string, value: string) => {
    setMemberInputs((current) => ({
      ...current,
      [projectId]: value,
    }));
  };

  const handleAddMember = (projectId: string) => {
    const memberIdentifier = memberInputs[projectId]?.trim();
    if (!memberIdentifier || updatingMembersProjectId === projectId) {
      return;
    }

    setUpdatingMembersProjectId(projectId);
    setError(null);

    fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/members`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberIdentifier }),
    })
      .then(async (response) => {
        if (response.status === 401) {
          throw new Error("401");
        }
        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(
              response,
              "Impossible de mettre à jour les membres du projet."
            )
          );
        }
        return fetchProjects();
      })
      .then(() => {
        setMemberInputs((current) => ({
          ...current,
          [projectId]: "",
        }));
      })
      .catch((err: Error) => {
        if (err.message === "401") {
          onAuthRequired();
          return;
        }
        setError(
          err.message || "Impossible de mettre à jour les membres du projet."
        );
      })
      .finally(() => {
        setUpdatingMembersProjectId(null);
      });
  };

  const handleRemoveMember = (projectId: string) => {
    const memberIdentifier = memberInputs[projectId]?.trim();
    if (!memberIdentifier || updatingMembersProjectId === projectId) {
      return;
    }

    setUpdatingMembersProjectId(projectId);
    setError(null);

    const encodedMemberIdentifier = encodeURIComponent(memberIdentifier);
    fetch(
      `${apiBaseUrl}/api/v1/projects/${projectId}/members/${encodedMemberIdentifier}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    )
      .then(async (response) => {
        if (response.status === 401) {
          throw new Error("401");
        }
        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(
              response,
              "Impossible de mettre à jour les membres du projet."
            )
          );
        }
        return fetchProjects();
      })
      .then(() => {
        setMemberInputs((current) => ({
          ...current,
          [projectId]: "",
        }));
      })
      .catch((err: Error) => {
        if (err.message === "401") {
          onAuthRequired();
          return;
        }
        setError(
          err.message || "Impossible de mettre à jour les membres du projet."
        );
      })
      .finally(() => {
        setUpdatingMembersProjectId(null);
      });
  };

  return (
    <React.Fragment>
      <h2 className="mb-3">Projets</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleCreateProject} className="mb-3">
        <Form.Group className="mb-2 d-flex align-items-center">
          <Form.Control
            id="project-name"
            type="text"
            value={newProjectName}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setNewProjectName(event.target.value)
            }
            required
            placeholder="Nom du projet"
            className="me-2"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!newProjectName.trim() || creating}
          >
            {creating ? "Création..." : "Créer"}
          </Button>
        </Form.Group>
      </Form>

      {projects === null && <p>Chargement des projets...</p>}
      {projects && projects.length === 0 && <p>Aucun projet pour le moment.</p>}
      {projects && projects.length > 0 && (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <strong>{project.name}</strong>{" "}
              <span className="text-muted">
                · {project.status === "open" ? "Ouvert" : "Clos"} ·{" "}
                {project.memberIds.length} membre
                {project.memberIds.length > 1 ? "s" : ""} · Créé le{" "}
                {new Date(project.createdAt).toLocaleDateString("fr-FR")}
              </span>
              <div className="mt-1">
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => onViewTasks(project.id)}
                  className="me-2"
                >
                  Voir les tâches
                </Button>
                {project.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={closingProjectId === project.id}
                    onClick={() => handleCloseProject(project.id)}
                    className="me-2"
                  >
                    {closingProjectId === project.id ? "Clôture..." : "Clore"}
                  </Button>
                )}
                <Form
                  className="d-inline-flex align-items-center mt-1"
                  onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    handleAddMember(project.id);
                  }}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="ID membre"
                    className="me-2"
                    value={memberInputs[project.id] ?? ""}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleMemberInputChange(project.id, event.target.value)
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={
                      updatingMembersProjectId === project.id ||
                      !(memberInputs[project.id] ?? "").trim()
                    }
                    type="submit"
                    className="me-1"
                  >
                    {updatingMembersProjectId === project.id
                      ? "Mise à jour..."
                      : "Ajouter"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={
                      updatingMembersProjectId === project.id ||
                      !(memberInputs[project.id] ?? "").trim()
                    }
                    type="button"
                    onClick={() => handleRemoveMember(project.id)}
                  >
                    Retirer
                  </Button>
                </Form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </React.Fragment>
  );
}

export default ProjectsView;
