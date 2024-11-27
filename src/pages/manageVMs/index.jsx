import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [vmList, setVmList] = useState([]);

  // Obter o token da variável de ambiente
  const API_TOKEN = process.env.REACT_APP_PROXMOX_API_TOKEN;
  const API_USER = "apiuser@pve";

  if (!API_TOKEN) {
    console.error(
      "Token da API não definido! Configure o REACT_APP_PROXMOX_API_TOKEN no arquivo .env"
    );
    alert(
      "Token da API não definido! Configure o REACT_APP_PROXMOX_API_TOKEN no arquivo .env"
    );
  }

  // Função para buscar a lista de VMs
  const fetchVMs = async () => {
    try {
      const response = await fetch(
        "http://170.238.45.177:8006/api2/json/cluster/resources?type=vm",
        {
          method: "GET",
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
        }
      );
      const data = await response.json();
      if (data.data) {
        setVmList(
          data.data.map((vm) => ({
            id: vm.vmid,
            name: vm.name,
            status: vm.status,
            node: vm.node,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching VM list:", error);
      alert(
        "Erro ao buscar a lista de VMs. Verifique o console para mais detalhes."
      );
    }
  };

  // Função para iniciar uma VM
  const startVM = async (vmid, node) => {
    try {
      await fetch(
        `http://170.238.45.177:8006/api2/json/nodes/${node}/qemu/${vmid}/status/start`,
        {
          method: "POST",
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
        }
      );
      alert(`VM ${vmid} iniciada com sucesso!`);
      fetchVMs();
    } catch (error) {
      console.error(`Erro ao iniciar a VM ${vmid}:`, error);
      alert(`Falha ao iniciar a VM ${vmid}`);
    }
  };

  // Função para parar uma VM
  const stopVM = async (vmid, node) => {
    try {
      await fetch(
        `http://170.238.45.177:8006/api2/json/nodes/${node}/qemu/${vmid}/status/stop`,
        {
          method: "POST",
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
        }
      );
      alert(`VM ${vmid} parada com sucesso!`);
      fetchVMs();
    } catch (error) {
      console.error(`Erro ao parar a VM ${vmid}:`, error);
      alert(`Falha ao parar a VM ${vmid}`);
    }
  };

  // Função para conectar a uma VM
  const connectVM = async (vmid, node) => {
    try {
      const url = `http://170.238.45.177:8006/?console=kvm&novnc=1&vmid=${vmid}&node=${node}`;
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
