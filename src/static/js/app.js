(() => {
  // src/frontend/app.tsx
  function App() {
    const { Container, Row, Col } = ReactBootstrap;
    return /* @__PURE__ */ React.createElement(Container, null, /* @__PURE__ */ React.createElement(Row, null, /* @__PURE__ */ React.createElement(Col, { md: { offset: 3, span: 6 } }, /* @__PURE__ */ React.createElement(TodoListCard, null))));
  }
  function TodoListCard() {
    const [items, setItems] = React.useState(null);
    React.useEffect(() => {
      fetch("/items").then((r) => r.ok ? r.json() : Promise.reject(new Error(String(r.status)))).then((data) => setItems(data)).catch(() => setItems([]));
    }, []);
    const onNewItem = React.useCallback(
      (newItem) => {
        setItems((prev) => prev ? [...prev, newItem] : [newItem]);
      },
      []
    );
    const onItemUpdate = React.useCallback(
      (item) => {
        setItems((prev) => {
          if (!prev) return prev;
          const index = prev.findIndex((i) => i.id === item.id);
          return [...prev.slice(0, index), item, ...prev.slice(index + 1)];
        });
      },
      []
    );
    const onItemRemoval = React.useCallback(
      (item) => {
        setItems((prev) => {
          if (!prev) return prev;
          const index = prev.findIndex((i) => i.id === item.id);
          return [...prev.slice(0, index), ...prev.slice(index + 1)];
        });
      },
      []
    );
    if (items === null) return "Loading...";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AddItemForm, { onNewItem }), items.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-center" }, "No items yet! Add one above!"), items.map((item) => /* @__PURE__ */ React.createElement(
      ItemDisplay,
      {
        item,
        key: item.id,
        onItemUpdate,
        onItemRemoval
      }
    )));
  }
  function AddItemForm({ onNewItem }) {
    const { Form, InputGroup, Button } = ReactBootstrap;
    const [newItem, setNewItem] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const submitNewItem = (e) => {
      e.preventDefault();
      setSubmitting(true);
      fetch("/items", {
        method: "POST",
        body: JSON.stringify({ name: newItem }),
        headers: { "Content-Type": "application/json" }
      }).then((r) => r.json()).then((item) => {
        onNewItem(item);
        setSubmitting(false);
        setNewItem("");
      });
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
    ))));
  }
  function ItemDisplay({
    item,
    onItemUpdate,
    onItemRemoval
  }) {
    const { Container, Row, Col, Button } = ReactBootstrap;
    const toggleCompletion = () => {
      fetch(`/items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: item.name,
          completed: !item.completed
        }),
        headers: { "Content-Type": "application/json" }
      }).then((r) => r.json()).then((data) => onItemUpdate(data));
    };
    const removeItem = () => {
      fetch(`/items/${item.id}`, { method: "DELETE" }).then(
        () => onItemRemoval(item)
      );
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
    )), /* @__PURE__ */ React.createElement(Col, { xs: 10, className: "name" }, item.name), /* @__PURE__ */ React.createElement(Col, { xs: 1, className: "text-center remove" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        size: "sm",
        variant: "link",
        onClick: removeItem,
        "aria-label": "Remove Item"
      },
      /* @__PURE__ */ React.createElement("i", { className: "fa fa-trash text-danger" })
    ))));
  }
  var root = document.getElementById("root");
  if (root) {
    ReactDOM.render(/* @__PURE__ */ React.createElement(App, null), root);
  }
})();
