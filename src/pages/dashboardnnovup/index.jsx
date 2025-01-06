import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ComputerIcon from "@mui/icons-material/Computer";
import PowerIcon from "@mui/icons-material/Power";
import PowerOffIcon from "@mui/icons-material/PowerOff";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";

const Dashboard = () => {
  const theme = useTheme();
  const smScreen = useMediaQuery(theme.breakpoints.up("sm"));
  const colors = tokens(theme.palette.mode);
  const [logs, setLogs] = useState([]);

  // Estados e hooks
  const [vmCount, setVMCount] = useState(0);
  const [runningVMCount, setRunningVMCount] = useState(0); // VMs em execução
  const [stoppedVMCount, setStoppedVMCount] = useState(0); // VMs desligadas
  const [nodeCount, setNodeCount] = useState(0); // Nodes

  // Função para buscar logs do servidor
  const fetchLogs = async () => {
    console.log("Token usado:", process.env.REACT_APP_API_TOKEN);
    console.log("Base URL:", process.env.REACT_APP_API_BASE_URL);

    if (!process.env.REACT_APP_API_BASE_URL || !process.env.REACT_APP_API_TOKEN) {
      console.error("Variáveis de ambiente não configuradas corretamente.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api2/json/nodes/cecqa/tasks`,
        {
          method: "GET",
          headers: {
            Authorization: process.env.REACT_APP_API_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao buscar logs: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const mappedLogs = data.data.map((log) => ({
        startTime: log.starttime
          ? new Date(log.starttime * 1000).toLocaleString()
          : "N/A",
        endTime: log.endtime
          ? new Date(log.endtime * 1000).toLocaleString()
          : "N/A",
        node: log.node || "N/A",
        user: log.user || "N/A",
        description: log.type || "N/A",
        status: log.status || "N/A",
      }));

      setLogs(mappedLogs);
    } catch (error) {
      console.error("Erro ao buscar logs do servidor:", error);
      setLogs([]);
    }
  };

  // Atualiza os logs automaticamente a cada 5 segundos
  useEffect(() => {
    fetchLogs(); // Busca inicial
    const interval = setInterval(fetchLogs, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(interval); // Limpa o intervalo ao desmontar
  }, []);

  // Função para buscar o número total de VMs e nodes
  const fetchVMData = async () => {
    console.log("Iniciando busca de VMs...");
    if (!process.env.REACT_APP_API_BASE_URL || !process.env.REACT_APP_API_TOKEN) {
      console.error("Variáveis de ambiente não configuradas corretamente.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api2/json/cluster/resources?type=vm`,
        {
          method: "GET",
          headers: {
            Authorization: process.env.REACT_APP_API_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API do Proxmox: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Dados recebidos:", data); // Verifique os dados retornados

      const totalVMs = data.data.length;
      const runningVMs = data.data.filter(
        (vm) => vm.status === "running"
      ).length;
      const stoppedVMs = totalVMs - runningVMs;

      setVMCount(totalVMs);
      setRunningVMCount(runningVMs);
      setStoppedVMCount(stoppedVMs);

      console.log("Total de VMs:", totalVMs);
      console.log("VMs em execução:", runningVMs);
      console.log("VMs desligadas:", stoppedVMs);
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      setVMCount(0);
      setRunningVMCount(0);
      setStoppedVMCount(0);
    }
  };

  // Carregar os dados ao montar o componente
  useEffect(() => {
    fetchVMData();
  }, []);

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box
        display={smScreen ? "flex" : "block"}
        flexDirection={smScreen ? "row" : "column"}
        justifyContent={smScreen ? "space-between" : "start"}
        alignItems={smScreen ? "center" : "start"}
        m="10px 0"
      >
        <Header title="DASHBOARD" subtitle="Bem vindo ao seu dashboard" />

        <Box>
          <Button
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </Box>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        {/* StatBox para Total VMs */}
        <Grid xs={12} sm={12} md={6} lg={3} xl={3}>
          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={vmCount.toLocaleString()}
              subtitle="VMs"
              progress={Math.min(vmCount / 100, 1)}
              increase={`${Math.round((vmCount / 100) * 100)}%`}
              icon={
                <ComputerIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              }
            />
          </Box>
        </Grid>

        {/* StatBox para VMs em execução */}
        <Grid xs={12} sm={12} md={6} lg={3} xl={3}>
          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={runningVMCount.toLocaleString()}
              subtitle="VMs On"
              progress={runningVMCount / (vmCount || 1)}
              increase={`${((runningVMCount / (vmCount || 1)) * 100).toFixed(
                2
              )}%`}
              icon={
                <PowerIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              }
            />
          </Box>
        </Grid>

        {/* StatBox para VMs desligadas */}
        <Grid xs={12} sm={12} md={6} lg={3} xl={3}>
          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={stoppedVMCount.toLocaleString()}
              subtitle="VMs Off"
              progress={stoppedVMCount / (vmCount || 1)}
              increase={`${((stoppedVMCount / (vmCount || 1)) * 100).toFixed(
                2
              )}%`}
              icon={
                <PowerOffIcon
                  sx={{ color: colors.redAccent[600], fontSize: "26px" }}
                />
              }
            />
          </Box>
        </Grid>

        {/* Quebra de linha */}
        <Grid xs={12}></Grid>

        {/* StatBox para Nodes */}
        <Grid xs={12} sm={12} md={6} lg={3} xl={3}>
          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={nodeCount.toLocaleString()}
              subtitle="Nodes"
              progress="0.80"
              increase="+5%"
              icon={
                <PointOfSaleIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              }
            />
          </Box>
        </Grid>
      </Grid>

      <Box
        mt="30px"
        p="20px"
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
      >
        <Typography
          variant="h5"
          fontWeight="600"
          color={colors.grey[100]}
          mb="20px"
        >
          Logs do Servidor
        </Typography>
        <Box
          maxHeight="400px"
          overflow="auto"
          sx={{
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-thumb": {
              background: colors.blueAccent[700],
              borderRadius: "4px",
            },
          }}
        >
          {logs.length > 0 ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: colors.grey[100],
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.grey[700]}` }}>
                  <th style={{ padding: "10px" }}>Start Time</th>
                  <th style={{ padding: "10px" }}>End Time</th>
                  <th style={{ padding: "10px" }}>Node</th>
                  <th style={{ padding: "10px" }}>User</th>
                  <th style={{ padding: "10px" }}>Description</th>
                  <th style={{ padding: "10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: `1px solid ${colors.grey[700]}`,
                    }}
                  >
                    <td style={{ padding: "10px" }}>{log.startTime}</td>
                    <td style={{ padding: "10px" }}>{log.endTime}</td>
                    <td style={{ padding: "10px" }}>{log.node}</td>
                    <td style={{ padding: "10px" }}>{log.user}</td>
                    <td style={{ padding: "10px" }}>{log.description}</td>
                    <td style={{ padding: "10px" }}>{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Typography variant="body2" color={colors.grey[100]}>
              Nenhum log disponível no momento.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
