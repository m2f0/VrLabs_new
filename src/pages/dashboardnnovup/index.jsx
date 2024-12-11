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
        `${process.env.REACT_APP_API_BASE_URL}/api2/json/nodes/prox1/tasks`,
        {
          method: "GET",
          headers: {
            Authorization: process.env.REACT_APP_API_TOKEN, // Use o token formatado corretamente
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
      console.log(data); // Verifique os dados retornados
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
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

      {/* Restante do layout permanece inalterado */}
    </Box>
  );
};

export default Dashboard;
