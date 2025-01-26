import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Grid,
} from "@mui/material";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    console.log("[Login] Iniciando processo de login...");

    try {
      // Enviar a requisição para autenticação
      const response = await fetch(process.env.REACT_APP_API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: `${username}${process.env.REACT_APP_USER_REALM}`,
          password,
        }),
        credentials: "include", // Inclui cookies na requisição
      });

      if (!response.ok) {
        console.error("[Login] Falha na autenticação:", response.status);
        setError("Usuário ou senha inválidos.");
        return;
      }

      // Processar a resposta da API
      const data = await response.json();
      console.log("[Login] Resposta recebida:", data);

      const { ticket, CSRFPreventionToken } = data.data;

      if (ticket && CSRFPreventionToken) {
        console.log("[Login] Autenticação bem-sucedida.");
        console.log("[Login] Ticket:", ticket);
        console.log("[Login] CSRFPreventionToken:", CSRFPreventionToken);

        // Configurar o cookie de autenticação
        const domain = new URL(process.env.REACT_APP_API_BASE_URL).hostname;
        document.cookie = `PVEAuthCookie=${ticket}; Path=/; Secure; SameSite=None; Domain=${domain}`;
        console.log("[Login] Cookie configurado para o domínio:", domain);

        // Armazenar CSRFPreventionToken no localStorage
        localStorage.setItem("proxmoxCSRF", CSRFPreventionToken);

        // Redirecionar para o dashboard
        navigate("/");
      } else {
        console.error("[Login] Ticket ou CSRFPreventionToken ausente.");
        setError("Erro interno. Tente novamente mais tarde.");
      }
    } catch (error) {
      console.error("[Login] Erro:", error);
      setError("Erro ao realizar o login. Verifique o console para mais detalhes.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" gutterBottom>
          Entre com seus dados para acessar o sistema.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Usuário"
                variant="outlined"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Senha"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Login
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;
