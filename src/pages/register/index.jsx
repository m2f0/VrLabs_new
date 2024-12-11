import React, { useState } from "react";
import {
  Container,
  Box,
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
  const [registrationKey, setRegistrationKey] = useState(""); // Nova variável de estado
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    // Verificar contra senha
    if (registrationKey !== process.env.REACT_APP_REGISTRATION_KEY) {
      setError("Contra senha inválida. A criação do usuário não foi autorizada.");
      return;
    }

    // Verificar senhas
    if (password !== confirmPassword) {
      setError("As senhas não correspondem");
      return;
    }

    try {
      // Simular chamada à API
      setSuccess("Usuário registrado com sucesso!");
      setError("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setRegistrationKey("");
    } catch (err) {
      setError("Um erro ocorreu. Por favor, tente novamente mais tarde.");
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
          Entre com seus dados para criar uma conta.
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
                label="Contra Senha"
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
