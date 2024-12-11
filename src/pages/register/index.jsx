import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Grid,
} from "@mui/material";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationKey, setRegistrationKey] = useState(""); // Contra-senha
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    // Verifica se as senhas coincidem
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    // Verifica a contra-senha
    if (registrationKey !== process.env.REACT_APP_REGISTRATION_KEY) {
      setError("Contra-senha inválida. Não foi possível criar o usuário.");
      return;
    }

    try {
      // Login no Proxmox para obter o ticket e o token CSRF
      const loginResponse = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api2/json/access/ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: process.env.REACT_APP_API_USERNAME,
            password: process.env.REACT_APP_API_PASSWORD,
          }).toString(),
        }
      );

      if (!loginResponse.ok) {
        throw new Error("Falha na autenticação. Verifique as credenciais do Proxmox.");
      }

      const loginData = await loginResponse.json();
      const { ticket, CSRFPreventionToken } = loginData.data;

      // Criação do usuário no Proxmox
      const createUserResponse = await fetch(process.env.REACT_APP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `PVEAuthCookie=${ticket}`,
          CSRFPreventionToken,
        },
        body: JSON.stringify({
          userid: `${username}${process.env.REACT_APP_USER_REALM}`,
          password: password,
          comment: "Novo usuário criado via app",
          enable: 1,
        }),
      });

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        throw new Error(
          errorData.errors || "Erro ao criar o usuário no Proxmox."
        );
      }

      setSuccess("Usuário registrado com sucesso!");
      setError("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setRegistrationKey("");
    } catch (err) {
      setError(err.message || "Um erro ocorreu. Por favor, tente novamente.");
      setSuccess("");
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
          Criar uma Conta
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" gutterBottom>
          Insira os detalhes abaixo para criar uma conta.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleRegister}>
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
              <TextField
                label="Confirmar Senha"
                type="password"
                variant="outlined"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contra-Senha"
                type="password"
                variant="outlined"
                fullWidth
                value={registrationKey}
                onChange={(e) => setRegistrationKey(e.target.value)}
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
                Registrar
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;
