"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type AuthUser = { id: string; name: string; email: string };

type Todo = {
  id: string;
  title: string;
  notes?: string | null;
  completed: boolean;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editFlagged, setEditFlagged] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("todo.user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthUser;
      setUser(parsed);
    } catch {
      localStorage.removeItem("todo.user");
      router.push("/login");
    }
  }, [router]);

  const userId = user?.id ?? "";

  const headers = useMemo(() => {
    return {
      "Content-Type": "application/json",
      "x-user-id": userId,
    };
  }, [userId]);

  const fetchTodos = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/todos", { headers });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Unable to load todos.");
      }
      const data = (await response.json()) as Todo[];
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load todos.");
    } finally {
      setLoading(false);
    }
  }, [headers, userId]);

  useEffect(() => {
    if (userId) {
      fetchTodos();
    }
  }, [fetchTodos, userId]);

  const handleCreateTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, notes, flagged }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Unable to create todo.");
      }

      const todo = (await response.json()) as Todo;
      setTodos((prev) => [todo, ...prev]);
      setTitle("");
      setNotes("");
      setFlagged(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create todo.");
    } finally {
      setSaving(false);
    }
  };

  const updateTodo = async (id: string, data: Partial<Todo>) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Unable to update todo.");
      }

      const updated = (await response.json()) as Todo;
      setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update todo.");
    }
  };

  const handleDelete = async (id: string) => {
    setError("");
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Unable to delete todo.");
      }
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete todo.");
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditNotes(todo.notes ?? "");
    setEditFlagged(todo.flagged);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    await updateTodo(id, {
      title: editTitle,
      notes: editNotes || null,
      flagged: editFlagged,
    });
    setEditingId(null);
  };

  const logout = () => {
    localStorage.removeItem("todo.user");
    router.push("/login");
  };

  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;
  const flaggedCount = todos.filter((todo) => todo.flagged).length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Todo dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Stay on top of your priorities and flags.
            </p>
            {user ? (
              <p className="mt-3 text-xs text-zinc-500">
                Signed in as {user.name} · {user.email}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-1 text-xs font-semibold text-zinc-700">
              {total} total
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-700">
              {completed} done
            </div>
            <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs font-semibold text-amber-700">
              {flaggedCount} flagged
            </div>
            <button
              onClick={logout}
              className="rounded-full border border-zinc-200 px-4 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Log out
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_2fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Create a new todo</h2>
            <form onSubmit={handleCreateTodo} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">Title</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                  placeholder="Finish the product deck"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                  placeholder="Optional details to keep you focused"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={flagged}
                  onChange={(event) => setFlagged(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Mark as flagged
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
              >
                {saving ? "Saving..." : "Add todo"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your todos</h2>
              <button
                onClick={fetchTodos}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900"
              >
                Refresh
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {loading ? (
              <p className="mt-6 text-sm text-zinc-500">Loading todos...</p>
            ) : todos.length === 0 ? (
              <p className="mt-6 text-sm text-zinc-500">
                Nothing here yet. Add your first todo on the left.
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className="rounded-xl border border-zinc-200 p-4"
                  >
                    {editingId === todo.id ? (
                      <div className="space-y-3">
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                        />
                        <textarea
                          value={editNotes}
                          onChange={(event) => setEditNotes(event.target.value)}
                          className="h-24 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                        />
                        <label className="flex items-center gap-2 text-sm text-zinc-600">
                          <input
                            type="checkbox"
                            checked={editFlagged}
                            onChange={(event) => setEditFlagged(event.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300"
                          />
                          Flagged
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => saveEdit(todo.id)}
                            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3
                              className={`text-sm font-semibold ${
                                todo.completed
                                  ? "text-zinc-400 line-through"
                                  : "text-zinc-900"
                              }`}
                            >
                              {todo.title}
                            </h3>
                            {todo.notes ? (
                              <p className="mt-1 text-xs text-zinc-500">
                                {todo.notes}
                              </p>
                            ) : null}
                          </div>
                          {todo.flagged ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              Flagged
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() =>
                              updateTodo(todo.id, {
                                completed: !todo.completed,
                              })
                            }
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                          >
                            {todo.completed ? "Mark active" : "Mark done"}
                          </button>
                          <button
                            onClick={() =>
                              updateTodo(todo.id, { flagged: !todo.flagged })
                            }
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                          >
                            {todo.flagged ? "Unflag" : "Flag"}
                          </button>
                          <button
                            onClick={() => startEdit(todo)}
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(todo.id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
