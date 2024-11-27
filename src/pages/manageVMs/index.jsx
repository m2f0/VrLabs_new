import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [vmList, setVmList] = useState([]);

  // Obter o token da variável de ambiente
  const API_TOKEN = process.env.REACT_APP_PROXMOX_API_TOKEN;
  const API_USER = "apiuser@pve";

  if (!API_TOKEN) {
    console.error(
      "Token da API não definido! Configure o REACT_APP_PROXMOX_API_TOKEN no ambiente."
    );
    alert(
      "Token da API não definido! Configure o REACT_APP_PROXMOX_API_TOKEN no ambiente."
    );
  }

  // Função para buscar a lista de VMs
  const fetchVMs = async () => {
    try {
      const response = await fetch(
        "https://prox.nnovup.com.br:8006/api2/json/cluster/resources?type=vm",
        {
          method: "GET",
          mode: "no-cors", // Ignora política de CORS (apenas para testes)
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
        }
      );

      // Modo `no-cors` não permite acesso direto ao conteúdo da resposta.
      // Dados reais não podem ser processados aqui, mas o backend será acionado corretamente.
      console.log("Fetch executado com modo no-cors.");
    } catch (error) {
      console.error("Erro ao buscar a lista de VMs:", error);
      alert(
        "Erro ao buscar a lista de VMs. Verifique o console para mais detalhes."
      );
    }
  };

  const startVM = async (vmid, node) => {
    try {
      await fetch(
        `https://prox.nnovup.com.br:8006/api2/json/nodes/${node}/qemu/${vmid}/status/start`,
        {
          method: "POST",
          mode: "no-cors", // Ignora política de CORS (apenas para testes)
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
        }
      );
      alert(`VM ${vmid} iniciada com sucesso!`);
    } catch (error) {
      console.error(`Erro ao iniciar a VM ${vmid}:`, error);
      alert(`Falha ao iniciar a VM ${vmid}`);
    }
  };

  const stopVM = async (vmid, node) => {
    try {
      await fetch(
        `https://prox.nnovup.com.br:8006/api2/json/nodes/${node}/qemu/${vmid}/status/stop`,
        {
          method: "POST",
          mode: "no-cors", // Ignora política de CORS (apenas para testes)
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
        }
      );
      alert(`VM ${vmid} parada com sucesso!`);
    } catch (error) {
      console.error(`Erro ao parar a VM ${vmid}:`, error);
      alert(`Falha ao parar a VM ${vmid}`);
    }
  };

  const connectVM = (vmid, node) => {
    try {
      const url = `https://prox.nnovup.com.br:8006/?console=kvm&novnc=1&vmid=${vmid}&node=${node}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error(`Erro ao conectar à VM ${vmid}:`, error);
      alert(`Falha ao conectar à VM ${vmid}`);
    }
  };

  useEffect(() => {
    fetchVMs();
  }, []);

  const columns = [
    { field: "id", headerName: "VM ID", width: 100 },
    { field: "name", headerName: "Nome", width: 200 },
    { field: "status", headerName: "Status", width: 150 },
    { field: "node", headerName: "Node", width: 150 },
    {
      field: "actions",
      headerName: "Ações",
      width: 400,
      renderCell: ({ row }) => (
        <Box display="flex" gap="10px">
          <Button
            variant="contained"
            color="primary"
            onClick={() => startVM(row.id, row.node)}
            disabled={row.status === "running"}
          >
            Iniciar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => stopVM(row.id, row.node)}
            disabled={row.status === "stopped"}
          >
            Parar
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={() => connectVM(row.id, row.node)}
          >
            Conectar
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header
          title="Máquinas Virtuais"
          subtitle="Gerencie e Controle Suas VMs"
        />
      </Box>
      <Box
        m="8px 0 0 0"
        height="80vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid rows={vmList} columns={columns} />
      </Box>
    </Box>
  );
};

export default Team;
