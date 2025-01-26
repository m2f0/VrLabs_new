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
      console.log("[Login] Iniciando processo de autenticação...");
      console.log("[Login] URL de login:", process.env.REACT_APP_API_LOGIN_URL);
  
      if (!process.env.REACT_APP_API_LOGIN_URL || !process.env.REACT_APP_USER_REALM) {
        console.error("[Login] Variáveis de ambiente ausentes.");
        setError("Erro interno: Configuração inválida.");
        return;
      }
  
      const response = await fetch(process.env.REACT_APP_API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: `${username}${process.env.REACT_APP_USER_REALM}`,
          password: password,
        }),
        credentials: "include",
      });
  
      if (!response.ok) {
        const responseText = await response.text();
        console.error("[Login] Erro na resposta do servidor:", responseText);
        setError("[Login] Usuário ou senha inválidos. Por favor, tente novamente.");
        return;
      }
  
      const responseData = await response.json();
      console.log("[Login] Resposta do servidor:", responseData);
  
      if (responseData.data) {
        const { ticket, CSRFPreventionToken } = responseData.data;
  
        if (ticket && CSRFPreventionToken) {
          console.log("[Login] Login bem-sucedido.");
          console.log("[Login] Ticket recebido:", ticket);
          console.log("[Login] CSRFPreventionToken recebido:", CSRFPreventionToken);
  
          // Configurar o cookie PVEAuthCookie
          const domain = "prox.nnovup.com.br";
          document.cookie = `PVEAuthCookie=${ticket}; Path=/; Secure; SameSite=None; Domain=${domain}`;
          console.log("[Login] Cookie PVEAuthCookie configurado para o domínio:", domain);
  
          // Verifica se o cookie foi configurado corretamente
          console.log("[Login] Cookies disponíveis no documento:", document.cookie);
  
          // Salvar o CSRF token no localStorage
          localStorage.setItem("proxmoxCSRF", CSRFPreventionToken);
  
          // Redirecionar para o dashboard
          navigate("/");
        } else {
          setError("[Login] Erro: Ticket ou CSRF token não foram recebidos.");
          console.error("[Login] Erro: Ticket ou CSRFPreventionToken ausente na resposta.");
        }
      } else {
        setError("[Login] Erro: Resposta do servidor inválida.");
        console.error("[Login] Resposta inválida:", responseData);
      }
    } catch (err) {
      setError("[Login] Um erro ocorreu. Por favor, tente novamente mais tarde.");
      console.error("[Login] Erro ao realizar o login:", err);
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
