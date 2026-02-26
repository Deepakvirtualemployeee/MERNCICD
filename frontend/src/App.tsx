import React, { useMemo, useState } from "react";

type UserResponse = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setFile(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUser(null);

    if (!file) {
      setError("Please choose an avatar image.");
      return;
    }

    const form = new FormData();
    form.append("name", name);
    form.append("email", email);
    form.append("password", password);
    form.append("avatar", file);

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/register`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Registration failed");
      }

      setUser(data.user);
      reset();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <header>
        <div className="pill">Fullstack Demo</div>
        <h1>Register with Avatar</h1>
        <p>Submit your details; image uploads go straight to the backend.</p>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <label>
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Doe"
          />
        </label>

        <label>
          <span>Email Address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="jane@example.com"
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        <label className="file-label">
          <span>Avatar (image)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>

        {previewUrl && (
          <div className="preview">
            <span>Preview</span>
            <img src={previewUrl} alt="avatar preview" />
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Register"}
        </button>

        {error && <div className="error">{error}</div>}
        {user && (
          <div className="success">
            <p>Registered as {user.name}</p>
            <a href={`${apiBase}${user.avatarUrl}`} target="_blank" rel="noreferrer">
              View stored avatar
            </a>
          </div>
        )}
      </form>

      <footer>
        <code>API: {apiBase}</code>
      </footer>
    </div>
  );
}

export default App;
