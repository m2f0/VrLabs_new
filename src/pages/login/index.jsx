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

      // Verifica se as variáveis de ambiente estão configuradas
      if (!process.env.REACT_APP_API_LOGIN_URL || !process.env.REACT_APP_USER_REALM) {
        console.error("[Login] Variáveis de ambiente ausentes.");
        setError("Erro interno: Configuração inválida.");
        return;
      }

      // Adiciona o realm (@pve) ao usuário, garantindo o valor correto
      const userWithRealm = username.includes(process.env.REACT_APP_USER_REALM)
        ? username
        : `${username}${process.env.REACT_APP_USER_REALM}`;
      console.log("[Login] Usuário com realm:", userWithRealm);

      const response = await fetch(process.env.REACT_APP_API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: userWithRealm,
          password: password,
        }).toString(),
        credentials: "include", // Inclui cookies na requisição
      });

      if (!response.ok) {
        const responseData = await response.json();
        console.error("[Login] Erro no login:", response.status, responseData);
        setError("Usuário ou senha inválidos. Por favor, tente novamente.");
        return;
      }

      const responseData = await response.json();
      const { ticket, CSRFPreventionToken } = responseData.data;

      if (ticket && CSRFPreventionToken) {
        console.log("[Login] Login bem-sucedido.");
        console.log("[Login] Ticket recebido:", ticket);
        console.log("[Login] CSRFPreventionToken recebido:", CSRFPreventionToken);

        // Configurar o cookie PVEAuthCookie
        const domain = new URL(process.env.REACT_APP_API_BASE_URL).hostname;
        document.cookie = `PVEAuthCookie=${ticket}; Path=/; Secure; SameSite=None; Domain=${domain}`;
        console.log("[Login] Cookie PVEAuthCookie configurado para o domínio:", domain);

        // Salvar CSRF e token no localStorage
        localStorage.setItem(`${domain}_proxmoxToken`, ticket);
        localStorage.setItem(`${domain}_proxmoxCSRF`, CSRFPreventionToken);

        // Redirecionar para o dashboard
        navigate("/");
      } else {
        console.error("[Login] Ticket ou CSRFPreventionToken ausente na resposta.");
        setError("Erro interno: Resposta inválida do servidor.");
      }
    } catch (err) {
      console.error("[Login] Erro ao realizar o login:", err);
      setError("Um erro ocorreu. Por favor, tente novamente mais tarde.");
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
