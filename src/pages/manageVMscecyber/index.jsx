import React, { useEffect, useState } from "react";
import { Box, Button, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [vmList, setVmList] = useState([]);

  // Constantes definidas diretamente no código
  const API_TOKEN = "35233cb2-3501-41c9-8eb2-876eb25b6481"; // Token de autenticação
  const API_USER = "apiuser@pve"; // Usuário da API
  const API_BASE_URL = "https://pxqa.cecyber.com"; // URL base da API

  // Função para buscar a lista de VMs
  const fetchVMs = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api2/json/cluster/resources?type=vm`,
        {
          method: "GET",
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`, // Formato correto do token
          },
        }
      );

      // Inspecionando a resposta
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("Headers:", [...response.headers.entries()]); // Converte os headers para um array legível

      if (!response.ok) {
        throw new Error(
          `Erro na API do Proxmox: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Dados recebidos:", data); // Inspeciona os dados recebidos

      setVmList(
        data.data.map((vm) => ({
          id: vm.vmid, // ID da VM
          name: vm.name, // Nome da VM
          status: vm.status, // Status (running/stopped)
          node: vm.node, // Nó onde a VM está localizada
          maxcpu: vm.maxcpu, // CPU máxima
          maxmem: vm.maxmem, // Memória máxima
          maxdisk: vm.maxdisk, // Disco máximo
        }))
      );
    } catch (error) {
      console.error("Erro ao buscar lista de VMs:", error);
      alert("Falha ao buscar as VMs. Verifique o console para mais detalhes.");
    }
  };

  // Função para iniciar uma VM
  const startVM = async (vmid, node) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/status/start`,
        {
          method: "POST",
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`, // Formato correto do token
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao iniciar VM: ${response.status} ${response.statusText}`
        );
      }

      alert(`VM ${vmid} iniciada com sucesso!`);
      fetchVMs();
    } catch (error) {
      console.error(`Erro ao iniciar a VM ${vmid}:`, error);
      alert(`Falha ao iniciar a VM ${vmid}.`);
    }
  };

  // Função para parar uma VM
  const stopVM = async (vmid, node) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/status/stop`,
        {
          method: "POST",
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao parar VM: ${response.status} ${response.statusText}`
        );
      }

      alert(`VM ${vmid} parada com sucesso!`);
      fetchVMs();
    } catch (error) {
      console.error(`Erro ao parar a VM ${vmid}:`, error);
      alert(`Falha ao parar a VM ${vmid}.`);
    }
  };

  // Função para conectar a uma VM
  const connectVM = async (vmid, node) => {
    try {
      // Obter o ticket
      const response = await fetch(`${API_BASE_URL}/api2/json/access/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: API_USER,
          password: "1qazxsw2", // Certifique-se de usar a senha correta
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter o ticket: ${response.statusText}`);
      }

      const data = await response.json();
      const ticket = data.data.ticket; // Extraia o ticket

      console.log("Ticket obtido:", ticket);

      // Construa a URL de conexão com o ticket
      const url = `${API_BASE_URL}/?console=kvm&novnc=1&vmid=${vmid}&node=${node}&PVEAuthCookie=${ticket}`;
      window.open(url, "_blank"); // Abra a nova aba
    } catch (error) {
      console.error("Erro ao conectar à VM:", error);
      alert("Falha ao conectar à VM. Verifique as credenciais ou o servidor.");
    }
  };

  const deleteVM = async (vmid, node) => {
    const confirmDelete = window.confirm(
      `Tem certeza de que deseja deletar a VM ${vmid}?`
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao deletar VM: ${response.status} ${response.statusText}`
        );
      }

      alert(`VM ${vmid} deletada com sucesso!`);
      fetchVMs(); // Atualiza a lista de VMs após a exclusão
    } catch (error) {
      console.error(`Erro ao deletar a VM ${vmid}:`, error);
      alert(`Falha ao deletar a VM ${vmid}.`);
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
      width: 450,
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

          <IconButton color="error" onClick={() => deleteVM(row.id, row.node)}>
            <DeleteForeverIcon />
          </IconButton>
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
