import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

import "./App.css";

const columns = [
  { id: "todo", title: "To Do", color: "#6366f1" },
  { id: "progress", title: "In Progress", color: "#f59e0b" },
  { id: "done", title: "Done", color: "#22c55e" },
];

function TaskCard({ task, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  const saveTask = () => {
    if (newTitle.trim()) {
      onEdit(task.id, newTitle);
      setEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card priority-${task.priority}`}
    >
      <div className="task-top">
        <span className="priority-label">
          {task.priority} Priority
        </span>

        <button
          className="delete-btn"
          onClick={() => onDelete(task.id)}
        >
          ✕
        </button>
      </div>

      {editing ? (
        <div className="edit-box">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />

          <button onClick={saveTask}>Save</button>
        </div>
      ) : (
        <h3
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {task.title}
        </h3>
      )}

      <div className="task-bottom">
        <span>Click title to edit</span>

        <button
          className="drag-btn"
          {...listeners}
          {...attributes}
        >
          ⠿ Drag
        </button>
      </div>
    </div>
  );
}

function Column({
  column,
  tasks,
  onDelete,
  onEdit,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`column ${isOver ? "column-active" : ""}`}
    >
      <div className="column-header">
        <div>
          <span
            className="column-dot"
            style={{ background: column.color }}
          ></span>

          <h2>{column.title}</h2>
        </div>

        <span className="task-count">{tasks.length}</span>
      </div>

      <div className="task-list">
        {tasks.length === 0 && (
          <div className="empty-state">
            Drop tasks here
          </div>
        )}

        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("kanbanTasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!title.trim()) {
      alert("Please enter a task!");
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      priority,
      status: "todo",
    };

    setTasks((prev) => [...prev, newTask]);
    setTitle("");
    setPriority("Medium");
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const editTask = (id, newTitle) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, title: newTitle }
          : task
      )
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    if (!columns.some((column) => column.id === newStatus)) {
      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    );
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">✓</span>
          TaskFlow
        </div>

        <span className="nav-text">
          Prodesk IT | Task Management
        </span>
      </header>

      <main className="main-content">
        <section className="welcome-section">
          <div>
            <p className="subtitle">WORKSPACE</p>
            <h1>My Kanban Board</h1>
            <p className="description">
              Organize your work and manage your tasks efficiently.
            </p>
          </div>

          <div className="total-tasks">
            <span>Total Tasks</span>
            <h2>{tasks.length}</h2>
          </div>
        </section>

        <section className="controls">
          <div className="add-task">
            <input
              type="text"
              placeholder="Enter your task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
            />

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button onClick={addTask}>
              + Add Task
            </button>
          </div>

          <input
            className="search-input"
            type="text"
            placeholder="⌕ Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>

        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          <section className="board">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={filteredTasks.filter(
                  (task) => task.status === column.id
                )}
                onDelete={deleteTask}
                onEdit={editTask}
              />
            ))}
          </section>
        </DndContext>

        <footer>
          TaskFlow © 2026 | Built with React
        </footer>
      </main>
    </div>
  );
}

export default App;