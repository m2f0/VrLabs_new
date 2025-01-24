import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      console.log("Iniciando login...");
      console.log("URL de login:", process.env.REACT_APP_API_LOGIN_URL);

      // Verifica se as variáveis de ambiente necessárias estão definidas
      if (!process.env.REACT_APP_API_LOGIN_URL || !process.env.REACT_APP_USER_REALM) {
        console.error("Erro: Variáveis de ambiente ausentes.");
        setError("Erro interno: Configuração inválida.");
        return;
      }

      // Adiciona o realm (@pve) ao usuário
      const userWithRealm = `${username}${process.env.REACT_APP_USER_REALM}`;
      console.log("Usuário com realm:", userWithRealm);

      const response = await fetch(process.env.REACT_APP_API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: userWithRealm,
          password: password,
        }).toString(),
        credentials: "include", // Inclui cookies nas requisições
      });

      // Captura a resposta completa para depuração
      const responseData = await response.json();
      console.log("Resposta do servidor:", responseData);

      if (response.ok) {
        // Valida se o ticket e o CSRFPreventionToken foram recebidos
        if (responseData.data.ticket && responseData.data.CSRFPreventionToken) {
          console.log("Login bem-sucedido.");
          console.log("Ticket recebido:", responseData.data.ticket);
          console.log("CSRFPreventionToken recebido:", responseData.data.CSRFPreventionToken);

          // Armazenar o ticket e o CSRF token no localStorage
          localStorage.setItem("proxmoxToken", responseData.data.ticket);
          localStorage.setItem("proxmoxCSRF", responseData.data.CSRFPreventionToken);

          // Configurar o cookie PVEAuthCookie
          const domain = new URL(process.env.REACT_APP_API_BASE_URL).hostname;
          document.cookie = `PVEAuthCookie=${responseData.data.ticket}; Path=/; Secure; SameSite=None; Domain=${domain}`;
          console.log("Cookie PVEAuthCookie configurado para o domínio:", domain);

          // Redirecionar para o dashboard
          navigate("/");
        } else {
          setError("Erro: Ticket ou CSRF token não foram recebidos.");
          console.error("Erro: Ticket ou CSRFPreventionToken ausente na resposta.");
        }
      } else {
        setError("Usuário ou senha inválidos. Por favor, tente novamente.");
        console.error("Erro no login:", response.status, response.statusText, responseData);
      }
    } catch (err) {
      setError("Um erro ocorreu. Por favor, tente novamente mais tarde.");
      console.error("Erro ao realizar o login:", err);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 2 }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Login
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="textSecondary"
          gutterBottom
        >
          Entre com seus dados para acessar o sistema.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleLogin}>
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
                sx={{ py: 1.5 }}
              >
                Login
              </Button>
            </Grid>
            <Grid item xs={12} textAlign="center">
              <Typography variant="body2">
                Não tem uma conta? <Link to="/register">Registre-se aqui</Link>
              </Typography>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;
