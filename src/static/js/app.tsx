declare const React: typeof import("react");
declare const ReactDOM: typeof import("react-dom");
declare const ReactBootstrap: typeof import("react-bootstrap");

interface Item {
  id: string;
  name: string;
  completed: boolean;
}

function App() {
  const { Container, Row, Col } = ReactBootstrap;
  return (
    <Container>
      <Row>
        <Col md={{ offset: 3, span: 6 }}>
          <TodoListCard />
        </Col>
      </Row>
    </Container>
  );
}

function TodoListCard() {
  const [items, setItems] = React.useState<Item[] | null>(null);

  React.useEffect(() => {
    fetch("/items")
      .then((r) => r.json())
      .then((data: Item[]) => setItems(data));
  }, []);

  const onNewItem = React.useCallback(
    (newItem: Item) => {
      setItems((prev) => (prev ? [...prev, newItem] : [newItem]));
    },
    [],
  );

  const onItemUpdate = React.useCallback(
    (item: Item) => {
      setItems((prev) => {
        if (!prev) return prev;
        const index = prev.findIndex((i) => i.id === item.id);
        return [...prev.slice(0, index), item, ...prev.slice(index + 1)];
      });
    },
    [],
  );

  const onItemRemoval = React.useCallback(
    (item: Item) => {
      setItems((prev) => {
        if (!prev) return prev;
        const index = prev.findIndex((i) => i.id === item.id);
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });
    },
    [],
  );

  if (items === null) return "Loading...";

  return (
    <React.Fragment>
      <AddItemForm onNewItem={onNewItem} />
      {items.length === 0 && (
        <p className="text-center">No items yet! Add one above!</p>
      )}
      {items.map((item) => (
        <ItemDisplay
          item={item}
          key={item.id}
          onItemUpdate={onItemUpdate}
          onItemRemoval={onItemRemoval}
        />
      ))}
    </React.Fragment>
  );
}

interface AddItemFormProps {
  onNewItem: (item: Item) => void;
}

function AddItemForm({ onNewItem }: AddItemFormProps) {
  const { Form, InputGroup, Button } = ReactBootstrap;

  const [newItem, setNewItem] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const submitNewItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    fetch("/items", {
      method: "POST",
      body: JSON.stringify({ name: newItem }),
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((item: Item) => {
        onNewItem(item);
        setSubmitting(false);
        setNewItem("");
      });
  };

  return (
    <Form onSubmit={submitNewItem}>
      <InputGroup className="mb-3">
        <Form.Control
          value={newItem}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
    </Form>
  );
}

interface ItemDisplayProps {
  item: Item;
  onItemUpdate: (item: Item) => void;
  onItemRemoval: (item: Item) => void;
}

function ItemDisplay({
  item,
  onItemUpdate,
  onItemRemoval,
}: ItemDisplayProps) {
  const { Container, Row, Col, Button } = ReactBootstrap;

  const toggleCompletion = () => {
    fetch(`/items/${item.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: item.name,
        completed: !item.completed,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data: Item) => onItemUpdate(data));
  };

  const removeItem = () => {
    fetch(`/items/${item.id}`, { method: "DELETE" }).then(() =>
      onItemRemoval(item),
    );
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
    </Container>
  );
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.render(<App />, root);
}