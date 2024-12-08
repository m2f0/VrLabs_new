import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://prox.nnovup.com.br/api2/json/access/ticket",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ username, password }).toString(),
          credentials: "include", // Certifique-se de incluir os cookies
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Armazene o ticket e o cookie
        localStorage.setItem("proxmoxToken", data.data.ticket); // Salva o ticket
        localStorage.setItem("proxmoxCSRF", data.data.CSRFPreventionToken); // Salva o token CSRF
        document.cookie = `PVEAuthCookie=${data.data.ticket}; Path=/; Secure; SameSite=Strict;`;

        navigate("/"); // Redirecione para o dashboard
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
        {/* Link para a página de registro */}
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
