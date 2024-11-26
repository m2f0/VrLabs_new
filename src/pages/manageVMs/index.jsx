import React, { useEffect, useState } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Estado para armazenar as máquinas virtuais
  const [vmList, setVmList] = useState([]);

  // Função para buscar as VMs do Proxmox
  const fetchVMs = async () => {
    try {
      const response = await fetch(
        "https://proxmox.cecyber.com/api2/json/nodes/your-node/qemu",
        {
          method: "GET",
          headers: {
            Authorization: `PVEAuthCookie=${yourAuthCookie}`, // Adicione sua autenticação aqui
          },
        }
      );
      const data = await response.json();
      if (data.data) {
        setVmList(
          data.data.map((vm, index) => ({
            id: vm.vmid,
            name: vm.name || `VM-${index + 1}`,
            status: vm.status,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching VM list:", error);
    }
  };

  // Função para iniciar uma VM
  const startVM = async (vmid) => {
    try {
      await fetch(
        `https://proxmox.cecyber.com/api2/json/nodes/your-node/qemu/${vmid}/status/start`,
        {
          method: "POST",
          headers: {
            Authorization: `PVEAuthCookie=${yourAuthCookie}`, // Adicione sua autenticação aqui
            CSRFPreventionToken: yourCsrfToken, // Adicione o token CSRF aqui
          },
        }
      );
      alert(`VM ${vmid} started successfully!`);
      fetchVMs(); // Atualiza a lista após iniciar a VM
    } catch (error) {
      console.error(`Error starting VM ${vmid}:`, error);
      alert(`Failed to start VM ${vmid}`);
    }
  };

  // Função para parar uma VM
  const stopVM = async (vmid) => {
    try {
      await fetch(
        `https://proxmox.cecyber.com/api2/json/nodes/your-node/qemu/${vmid}/status/stop`,
        {
          method: "POST",
          headers: {
            Authorization: `PVEAuthCookie=${yourAuthCookie}`, // Adicione sua autenticação aqui
            CSRFPreventionToken: yourCsrfToken, // Adicione o token CSRF aqui
          },
        }
      );
      alert(`VM ${vmid} stopped successfully!`);
      fetchVMs(); // Atualiza a lista após parar a VM
    } catch (error) {
      console.error(`Error stopping VM ${vmid}:`, error);
      alert(`Failed to stop VM ${vmid}`);
    }
  };

  useEffect(() => {
    fetchVMs();
  }, []);

  const columns = [
    { field: "id", headerName: "VM ID", width: 100 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "status", headerName: "Status", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 300,
      renderCell: ({ row }) => (
        <Box display="flex" gap="10px">
          <Button
            variant="contained"
            color="primary"
            onClick={() => startVM(row.id)}
            disabled={row.status === "running"} // Desabilita o botão se a VM já estiver em execução
          >
            Start
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => stopVM(row.id)}
            disabled={row.status === "stopped"} // Desabilita o botão se a VM já estiver parada
          >
            Stop
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header
          title="Virtual Machines"
          subtitle="Manage and Control Virtual Machines"
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
          "& .name-column--cell": {
            color: colors.greenAccent[300],
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
