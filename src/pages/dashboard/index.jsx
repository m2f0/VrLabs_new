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

  // Estados e hooks
  const [vmCount, setVMCount] = useState(0);
  const [runningVMCount, setRunningVMCount] = useState(0); // VMs em execução
  const [stoppedVMCount, setStoppedVMCount] = useState(0); // VMs desligadas
  const [nodeCount, setNodeCount] = useState(0); // Nodes

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
              increase="+10%"
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
              increase="-5%" // Exemplo de variação negativa
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
    </Box>
  );
};

export default Dashboard;
