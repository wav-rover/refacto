(() => {
  // src/frontend/app.tsx
  function App() {
    const { Container, Row, Col, Button, Alert } = ReactBootstrap;
    const [authState, setAuthState] = React.useState("checking");
    const [authError, setAuthError] = React.useState(null);
    React.useEffect(() => {
      fetch("/items").then((r) => {
        if (r.status === 401) {
          setAuthState("logged_out");
        } else if (r.ok) {
          setAuthState("logged_in");
        } else {
          setAuthState("logged_out");
        }
      }).catch(() => setAuthState("logged_out"));
    }, []);
    const handleLogin = (username, password) => {
      setAuthError(null);
      fetch("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" }
      }).then((r) => {
        if (r.ok) {
          setAuthState("logged_in");
        } else {
          setAuthError("Identifiants incorrects");
        }
      }).catch(() => setAuthError("Erreur de connexion"));
    };
    const handleLogout = () => {
      fetch("/logout", { method: "POST" }).then(() => setAuthState("logged_out")).catch(() => setAuthState("logged_out"));
    };
    const handleAuthRequired = () => {
      setAuthState("logged_out");
    };
    if (authState === "checking") {
      return /* @__PURE__ */ React.createElement(Container, null, /* @__PURE__ */ React.createElement(Row, null, /* @__PURE__ */ React.createElement(Col, { md: { offset: 3, span: 6 }, className: "text-center mt-5" }, /* @__PURE__ */ React.createElement("p", null, "Chargement..."))));
    }
    if (authState === "logged_out") {
      return /* @__PURE__ */ React.createElement(Container, null, /* @__PURE__ */ React.createElement(Row, null, /* @__PURE__ */ React.createElement(Col, { md: { offset: 3, span: 6 } }, /* @__PURE__ */ React.createElement("h2", { className: "text-center mt-4 mb-4" }, "Connexion"), authError && /* @__PURE__ */ React.createElement(Alert, { variant: "danger" }, authError), /* @__PURE__ */ React.createElement(LoginForm, { onLogin: handleLogin }))));
    }
    return /* @__PURE__ */ React.createElement(Container, null, /* @__PURE__ */ React.createElement(Row, null, /* @__PURE__ */ React.createElement(Col, { md: { offset: 3, span: 6 } }, /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-end mb-3 mt-3" }, /* @__PURE__ */ React.createElement(Button, { variant: "outline-secondary", size: "sm", onClick: handleLogout }, "D\xE9connexion")), /* @__PURE__ */ React.createElement(TodoListCard, { onAuthRequired: handleAuthRequired }))));
  }
  function LoginForm({ onLogin }) {
    const { Form, Button } = ReactBootstrap;
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const handleSubmit = (e) => {
      e.preventDefault();
      setSubmitting(true);
      onLogin(username, password);
      setTimeout(() => setSubmitting(false), 1e3);
    };
    return /* @__PURE__ */ React.createElement(Form, { onSubmit: handleSubmit }, /* @__PURE__ */ React.createElement(Form.Group, { className: "mb-3" }, /* @__PURE__ */ React.createElement(Form.Label, { htmlFor: "login-username" }, "Nom d'utilisateur"), /* @__PURE__ */ React.createElement(
      Form.Control,
      {
        id: "login-username",
        type: "text",
        placeholder: "Nom d'utilisateur",
        value: username,
        onChange: (e) => setUsername(e.target.value),
        required: true,
        "aria-label": "Nom d'utilisateur"
      }
    )), /* @__PURE__ */ React.createElement(Form.Group, { className: "mb-3" }, /* @__PURE__ */ React.createElement(Form.Label, { htmlFor: "login-password" }, "Mot de passe"), /* @__PURE__ */ React.createElement(
      Form.Control,
      {
        id: "login-password",
        type: "password",
        placeholder: "Mot de passe",
        value: password,
        onChange: (e) => setPassword(e.target.value),
        required: true,
        "aria-label": "Mot de passe"
      }
    )), /* @__PURE__ */ React.createElement(
      Button,
      {
        type: "submit",
        variant: "primary",
        disabled: !username || !password || submitting,
        className: "w-100"
      },
      submitting ? "Connexion..." : "Se connecter"
    ));
  }
  function TodoListCard({ onAuthRequired }) {
    const [items, setItems] = React.useState(null);
    const handleResponse = React.useCallback(
      (r) => {
        if (r.status === 401) {
          onAuthRequired();
          return Promise.reject(new Error("401"));
        }
        return r.ok ? r.json() : Promise.reject(new Error(String(r.status)));
      },
      [onAuthRequired]
    );
    React.useEffect(() => {
      fetch("/items").then(handleResponse).then((data) => setItems(data)).catch(() => setItems([]));
    }, [handleResponse]);
    const onNewItem = React.useCallback((newItem) => {
      setItems((prev) => prev ? [...prev, newItem] : [newItem]);
    }, []);
    const onItemUpdate = React.useCallback((item) => {
      setItems((prev) => {
        if (!prev) return prev;
        const index = prev.findIndex((i) => i.id === item.id);
        return [...prev.slice(0, index), item, ...prev.slice(index + 1)];
      });
    }, []);
    const onItemRemoval = React.useCallback((item) => {
      setItems((prev) => {
        if (!prev) return prev;
        const index = prev.findIndex((i) => i.id === item.id);
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });
    }, []);
    if (items === null) return "Loading...";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AddItemForm, { onNewItem, onAuthRequired }), items.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-center" }, "No items yet! Add one above!"), items.map((item) => /* @__PURE__ */ React.createElement(
      ItemDisplay,
      {
        item,
        key: item.id,
        onItemUpdate,
        onItemRemoval,
        onAuthRequired
      }
    )));
  }
  function AddItemForm({ onNewItem, onAuthRequired }) {
    const { Form, InputGroup, Button, Row, Col } = ReactBootstrap;
    const [newItem, setNewItem] = React.useState("");
    const [status, setStatus] = React.useState("todo");
    const [priority, setPriority] = React.useState("medium");
    const [dueDate, setDueDate] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const submitNewItem = (e) => {
      e.preventDefault();
      setSubmitting(true);
      fetch("/items", {
        method: "POST",
        body: JSON.stringify({
          name: newItem.trim(),
          status,
          priority,
          dueDate: dueDate.trim() || null
        }),
        headers: { "Content-Type": "application/json" }
      }).then((r) => {
        if (r.status === 401) {
          onAuthRequired();
          return Promise.reject(new Error("401"));
        }
        return r.json();
      }).then((item) => {
        onNewItem(item);
        setSubmitting(false);
        setNewItem("");
        setStatus("todo");
        setPriority("medium");
        setDueDate("");
      }).catch(() => setSubmitting(false));
    };
    return /* @__PURE__ */ React.createElement(Form, { onSubmit: submitNewItem }, /* @__PURE__ */ React.createElement(InputGroup, { className: "mb-3" }, /* @__PURE__ */ React.createElement(
      Form.Control,
      {
        value: newItem,
        onChange: (e) => setNewItem(e.target.value),
        type: "text",
        placeholder: "New Item",
        "aria-describedby": "basic-addon1"
      }
    ), /* @__PURE__ */ React.createElement(InputGroup.Append, null, /* @__PURE__ */ React.createElement(
      Button,
      {
        type: "submit",
        variant: "success",
        disabled: !newItem.length,
        className: submitting ? "disabled" : ""
      },
      submitting ? "Adding..." : "Add Item"
    ))), /* @__PURE__ */ React.createElement(Row, { className: "mb-3" }, /* @__PURE__ */ React.createElement(Col, { xs: 4 }, /* @__PURE__ */ React.createElement(Form.Group, null, /* @__PURE__ */ React.createElement(Form.Label, { htmlFor: "add-status" }, "Statut"), /* @__PURE__ */ React.createElement(
      Form.Control,
      {
        id: "add-status",
        as: "select",
        value: status,
        onChange: (e) => setStatus(e.target.value),
        "aria-label": "Statut"
      },
      /* @__PURE__ */ React.createElement("option", { value: "todo" }, "\xC0 faire"),
      /* @__PURE__ */ React.createElement("option", { value: "in_progress" }, "En cours"),
      /* @__PURE__ */ React.createElement("option", { value: "done" }, "Termin\xE9")
    ))), /* @__PURE__ */ React.createElement(Col, { xs: 4 }, /* @__PURE__ */ React.createElement(Form.Group, null, /* @__PURE__ */ React.createElement(Form.Label, { htmlFor: "add-priority" }, "Priorit\xE9"), /* @__PURE__ */ React.createElement(
      Form.Control,
      {
        id: "add-priority",
        as: "select",
        value: priority,
        onChange: (e) => setPriority(e.target.value),
        "aria-label": "Priorit\xE9"
      },
      /* @__PURE__ */ React.createElement("option", { value: "low" }, "Basse"),
      /* @__PURE__ */ React.createElement("option", { value: "medium" }, "Moyenne"),
      /* @__PURE__ */ React.createElement("option", { value: "high" }, "Haute")
    ))), /* @__PURE__ */ React.createElement(Col, { xs: 4 }, /* @__PURE__ */ React.createElement(Form.Group, null, /* @__PURE__ */ React.createElement(Form.Label, { htmlFor: "add-dueDate" }, "Date d'\xE9ch\xE9ance"), /* @__PURE__ */ React.createElement(
      Form.Control,
      {
        id: "add-dueDate",
        type: "date",
        value: dueDate,
        onChange: (e) => setDueDate(e.target.value),
        "aria-label": "Date d'\xE9ch\xE9ance"
      }
    )))));
  }
  function ItemDisplay({ item, onItemUpdate, onItemRemoval, onAuthRequired }) {
    const { Container, Row, Col, Button, Form } = ReactBootstrap;
    const status = item.status ?? "todo";
    const priority = item.priority ?? "medium";
    const dueDate = item.dueDate ?? "";
    const sendUpdate = (updates) => {
      const body = {
        name: updates.name ?? item.name,
        completed: updates.completed ?? item.completed,
        status: updates.status ?? status,
        priority: updates.priority ?? priority,
        dueDate: updates.dueDate !== void 0 ? updates.dueDate : item.dueDate ?? null
      };
      return fetch(`/items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
      }).then((r) => {
        if (r.status === 401) {
          onAuthRequired();
          return Promise.reject(new Error("401"));
        }
        return r.json();
      }).then((data) => onItemUpdate(data)).catch(() => {
      });
    };
    const toggleCompletion = () => {
      sendUpdate({ completed: !item.completed });
    };
    const removeItem = () => {
      fetch(`/items/${item.id}`, { method: "DELETE" }).then((r) => {
        if (r.status === 401) {
          onAuthRequired();
          return;
        }
        onItemRemoval(item);
      }).catch(() => {
      });
    };
    const onStatusChange = (e) => {
      sendUpdate({ status: e.target.value });
    };
    const onPriorityChange = (e) => {
      sendUpdate({ priority: e.target.value });
    };
    const onDueDateChange = (e) => {
      const value = e.target.value.trim();
      sendUpdate({ dueDate: value || null });
    };
    return /* @__PURE__ */ React.createElement(Container, { fluid: true, className: `item ${item.completed ? "completed" : ""}` }, /* @__PURE__ */ React.createElement(Row, null, /* @__PURE__ */ React.createElement(Col, { xs: 1, className: "text-center" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        className: "toggles",
        size: "sm",
        variant: "link",
        onClick: toggleCompletion,
        "aria-label": item.completed ? "Mark item as incomplete" : "Mark item as complete"
      },
      /* @__PURE__ */ React.createElement(
        "i",
        {
          className: `far ${item.completed ? "fa-check-square" : "fa-square"}`
        }
      )
    )), /* @__PURE__ */ React.createElement(Col, { xs: 10, className: "name" }, item.name, /* @__PURE__ */ React.createElement("span", { className: "text-muted small ms-2" }, "\xB7 ", status === "todo" ? "\xC0 faire" : status === "in_progress" ? "En cours" : "Termin\xE9", "\xB7 ", priority === "low" ? "Basse" : priority === "medium" ? "Moyenne" : "Haute", dueDate ? ` \xB7 \xC9ch\xE9ance ${new Date(dueDate).toLocaleDateString("fr-FR")}` : "")), /* @__PURE__ */ React.createElement(Col, { xs: 1, className: "text-center remove" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        size: "sm",
        variant: "link",
        onClick: removeItem,
        "aria-label": "Remove Item"
      },
      /* @__PURE__ */ React.createElement("i", { className: "fa fa-trash text-danger" })
    ))), /* @__PURE__ */ React.createElement(Row, { className: "mb-2" }, /* @__PURE__ */ React.createElement(Col, { xs: 1 }), /* @__PURE__ */ React.createElement(Col, { xs: 10 }, /* @__PURE__ */ React.createElement(Form, { className: "d-flex flex-wrap gap-2 align-items-center" }, /* @__PURE__ */ React.createElement(Form.Group, { className: "mb-0" }, /* @__PURE__ */ React.createElement(Form.Label, { htmlFor: `status-${item.id}`, className: "me-1 small" }, "Statut"), /* @__PURE__ */ React.createElement(
      Form.Control,
      {
        id: `status-${item.id}`,
        as: "select",
        size: "sm",
        value: status,
        onChange: onStatusChange,
        "aria-label": "Statut",
        style: { width: "auto" }
      },
      /* @__PURE__ */ React.createElement("option", { value: "todo" }, "\xC0 faire"),
      /* @__PURE__ */ React.createElement("option", { value: "in_progress" }, "En cours"),
      /* @__PURE__ */ React.createElement("option", { value: "done" }, "Termin\xE9")
    )), /* @__PURE__ */ React.createElement(Form.Group, { className: "mb-0" }, /* @__PURE__ */ React.createElement(Form.Label, { htmlFor: `priority-${item.id}`, className: "me-1 small" }, "Priorit\xE9"), /* @__PURE__ */ React.createElement(
      Form.Control,
      {
        id: `priority-${item.id}`,
        as: "select",
        size: "sm",
        value: priority,
        onChange: onPriorityChange,
        "aria-label": "Priorit\xE9",
        style: { width: "auto" }
      },
      /* @__PURE__ */ React.createElement("option", { value: "low" }, "Basse"),
      /* @__PURE__ */ React.createElement("option", { value: "medium" }, "Moyenne"),
      /* @__PURE__ */ React.createElement("option", { value: "high" }, "Haute")
    )), /* @__PURE__ */ React.createElement(Form.Group, { className: "mb-0" }, /* @__PURE__ */ React.createElement(Form.Label, { htmlFor: `dueDate-${item.id}`, className: "me-1 small" }, "\xC9ch\xE9ance"), /* @__PURE__ */ React.createElement(
      Form.Control,
      {
        id: `dueDate-${item.id}`,
        type: "date",
        size: "sm",
        value: dueDate,
        onChange: onDueDateChange,
        "aria-label": "Date d'\xE9ch\xE9ance",
        style: { width: "auto" }
      }
    )))), /* @__PURE__ */ React.createElement(Col, { xs: 1 })));
  }
  var root = document.getElementById("root");
  if (root) {
    ReactDOM.render(/* @__PURE__ */ React.createElement(App, null), root);
  }
})();
