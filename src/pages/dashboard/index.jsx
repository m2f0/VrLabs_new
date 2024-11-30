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
    try {
      const response = await fetch(
        "https://prox.nnovup.com.br/api2/json/nodes/prox1/tasks", // Altere o endpoint conforme necessário
        {
          method: "GET",
          headers: {
            Authorization: `PVEAPIToken=apiuser@pve!apitoken=58fc95f1-afc7-47e6-8b7a-31e6971062ca`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao buscar logs: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setLogs(data.data); // Supondo que os logs estejam no formato esperado
    } catch (error) {
      console.error("Erro ao buscar logs do servidor:", error);
      setLogs([]); // Caso haja erro, limpa os logs
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
    try {
      // Buscar informações de VMs
      const vmResponse = await fetch(
        "https://prox.nnovup.com.br/api2/json/cluster/resources?type=vm",
        {
          method: "GET",
          headers: {
            Authorization: `PVEAPIToken=apiuser@pve!apitoken=58fc95f1-afc7-47e6-8b7a-31e6971062ca`,
          },
        }
      );

      if (!vmResponse.ok) {
        throw new Error(
          `Erro na API do Proxmox: ${vmResponse.status} ${vmResponse.statusText}`
        );
      }

      const vmData = await vmResponse.json();
      const totalVMs = vmData.data.length;
      const runningVMs = vmData.data.filter(
        (vm) => vm.status === "running"
      ).length;
      const stoppedVMs = totalVMs - runningVMs;

      setVMCount(totalVMs);
      setRunningVMCount(runningVMs);
      setStoppedVMCount(stoppedVMs);

      // Buscar informações de nodes
      const nodeResponse = await fetch(
        "https://prox.nnovup.com.br/api2/json/nodes",
        {
          method: "GET",
          headers: {
            Authorization: `PVEAPIToken=apiuser@pve!apitoken=58fc95f1-afc7-47e6-8b7a-31e6971062ca`,
          },
        }
      );

      if (!nodeResponse.ok) {
        throw new Error(
          `Erro na API do Proxmox: ${nodeResponse.status} ${nodeResponse.statusText}`
        );
      }

      const nodeData = await nodeResponse.json();
      setNodeCount(nodeData.data.length); // Número de nodes
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      setVMCount(0);
      setRunningVMCount(0);
      setStoppedVMCount(0);
      setNodeCount(0);
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
              title={vmCount.toLocaleString()} // Exibe o número de VMs formatado
              subtitle="VMs"
              progress={Math.min(vmCount / 100, 1)} // Proporção em relação a 100, máximo 1.0
              increase={`${Math.round((vmCount / 100) * 100)}%`} // Porcentagem em relação a 100
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
              title={runningVMCount.toLocaleString()} // Exibe o número de VMs em execução formatado
              subtitle="VMs On"
              progress={runningVMCount / (vmCount || 1)} // Calcula a proporção de VMs em execução
              increase={`${((runningVMCount / (vmCount || 1)) * 100).toFixed(
                2
              )}%`} // Calcula o percentual de VMs ligadas
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
              title={stoppedVMCount.toLocaleString()} // Exibe o número de VMs desligadas formatado
              subtitle="VMs Off"
              progress={stoppedVMCount / (vmCount || 1)} // Calcula a proporção de VMs desligadas
              increase={`${((stoppedVMCount / (vmCount || 1)) * 100).toFixed(
                2
              )}%`} // Calcula o percentual de VMs desligadas
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
              title={nodeCount.toLocaleString()} // Exibe o número de nodes
              subtitle="Nodes"
              progress="0.80" // Exemplo de progresso
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
          Logs do Servidor Proxmox
        </Typography>
        <Box
          maxHeight="300px"
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
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.grey[700]}` }}>
                  <th style={{ textAlign: "left", padding: "10px" }}>Time</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Node</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>
                    Service
                  </th>
                  <th style={{ textAlign: "left", padding: "10px" }}>PID</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>
                    User Name
                  </th>
                  <th style={{ textAlign: "left", padding: "10px" }}>
                    Severity
                  </th>
                  <th style={{ textAlign: "left", padding: "10px" }}>
                    Message
                  </th>
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
                    <td style={{ padding: "10px" }}>{log.time}</td>
                    <td style={{ padding: "10px" }}>{log.node}</td>
                    <td style={{ padding: "10px" }}>{log.service}</td>
                    <td style={{ padding: "10px" }}>{log.pid}</td>
                    <td style={{ padding: "10px" }}>{log.user}</td>
                    <td style={{ padding: "10px" }}>{log.severity}</td>
                    <td style={{ padding: "10px" }}>{log.message}</td>
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
