import React, { useState } from "react";

const Register = () => {
  const [username, setUsername] = useState(""); // Variável de estado para o nome de usuário
  const [password, setPassword] = useState(""); // Variável de estado para a senha
  const [confirmPassword, setConfirmPassword] = useState(""); // Variável de estado para confirmação da senha
  const [error, setError] = useState(""); // Variável de estado para erros
  const [success, setSuccess] = useState(""); // Variável de estado para sucesso

  const handleRegister = async (e) => {
    e.preventDefault();
  
    try {
      // Etapa 1: Login para obter o ticket e CSRF token
      const loginResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api2/json/access/ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: process.env.REACT_APP_API_USERNAME,
          password: process.env.REACT_APP_API_PASSWORD,
        }),
      });
  
      if (!loginResponse.ok) {
        throw new Error("Failed to authenticate");
      }
  
      const loginData = await loginResponse.json();
      const { ticket, CSRFPreventionToken } = loginData.data;
  
      // Etapa 2: Criar o usuário
      const response = await fetch(process.env.REACT_APP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `PVEAuthCookie=${ticket}`,
          CSRFPreventionToken: CSRFPreventionToken,
        },
        body: JSON.stringify({
          userid: `${username}${process.env.REACT_APP_USER_REALM}`,
          password: password,
          comment: "New user registered via app",
          enable: 1,
        }),
      });
  
      if (response.ok) {
        setSuccess("User registered successfully!");
        setError("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        setError(data.errors || "Failed to register user");
        setSuccess("");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
      setSuccess("");
    }
  };
  
  

  return (
    <div className="register-page">
      <form onSubmit={handleRegister}>
        <h2>Register</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
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
        <div>
          <label>Confirm Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
