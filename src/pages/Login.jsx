import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (login(user, pass)) {
      navigate("/");
    } else {
      setError("Usuário ou senha incorretos.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm bg-white border border-line rounded-card p-8 shadow-sm">
        <h1 className="font-display text-2xl mb-1 text-ink">Molduras</h1>
        <p className="text-sm text-ink/60 mb-6">Painel administrativo</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-ink/70 block mb-1">Usuário</label>
            <input
              className="w-full border border-line rounded-lg px-3 py-2 outline-none focus:border-clay"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-ink/70 block mb-1">Senha</label>
            <input
              type="password"
              className="w-full border border-line rounded-lg px-3 py-2 outline-none focus:border-clay"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full bg-ink text-paper rounded-lg py-2.5 font-medium hover:bg-clay transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
