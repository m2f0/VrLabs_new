import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";
import Cookies from 'js-cookie';

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [vmList, setVmList] = useState([]);
  const [iframeUrl, setIframeUrl] = useState(""); // URL para o iframe

  // Variáveis do .env
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // URL base da API
  const API_TOKEN = process.env.REACT_APP_API_TOKEN; // Token de autenticação

  // Função para buscar a lista de VMs
  const fetchVMs = async () => {
    console.log("[fetchVMs] Buscando lista de VMs...");
  
    try {
      const csrfToken = Cookies.get("proxmoxCSRF"); // Busca o CSRF token do cookie
      const authCookie = Cookies.get("PVEAuthCookie"); // Busca o cookie de autenticação
  
      if (!csrfToken || !authCookie) {
        throw new Error("Tokens de autenticação ausentes.");
      }
  
      const response = await fetch(`${API_BASE_URL}/api2/json/cluster/resources?type=vm`, {
        method: "GET",
        headers: {
          "CSRFPreventionToken": csrfToken,
          Authorization: `${process.env.REACT_APP_API_TOKEN}`,
        },
        credentials: "include", // Inclui os cookies automaticamente
      });
  
      if (!response.ok) {
        throw new Error(`Erro ao buscar VMs: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log("[fetchVMs] Lista de VMs recebida:", data);
  
      setVmList(
        data.data.map((vm) => ({
          id: vm.vmid,
          name: vm.name,
          status: vm.status,
          node: vm.node,
          type: vm.type || "qemu",
        }))
      );
    } catch (error) {
      console.error("[fetchVMs] Erro ao buscar lista de VMs:", error);
      alert("Erro ao buscar a lista de VMs. Verifique o console para mais detalhes.");
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
            Authorization: API_TOKEN,
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
            Authorization: API_TOKEN,
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

  // Função para renovar o ticket
  // Função para renovar o ticket e salvar nos domínios e localStorage
  const renewTicket = async () => {
    console.log("[renewTicket] Iniciando a renovação do ticket de autenticação...");
  
    try {
      const response = await fetch(process.env.REACT_APP_API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: process.env.REACT_APP_API_USERNAME,
          password: process.env.REACT_APP_API_PASSWORD,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[renewTicket] Erro ao renovar o ticket:", errorText);
        throw new Error(`[renewTicket] Erro ao renovar o ticket: ${response.status}`);
      }
  
      const data = await response.json();
      const { ticket, CSRFPreventionToken } = data.data;
  
      // Configura o cookie PVEAuthCookie no domínio correto
      document.cookie = `PVEAuthCookie=${ticket}; path=/; secure; sameSite=none; domain=${new URL(process.env.REACT_APP_API_LOGIN_URL).hostname}`;
  
      // Salva o CSRFPreventionToken em um cookie e localStorage para consistência
      document.cookie = `proxmoxCSRF=${CSRFPreventionToken}; path=/; secure; sameSite=none; domain=${new URL(process.env.REACT_APP_API_LOGIN_URL).hostname}`;
      localStorage.setItem("PVEAuthCookie", ticket);
      localStorage.setItem("proxmoxCSRF", CSRFPreventionToken);
  
      console.log("[renewTicket] Ticket e CSRFPreventionToken renovados com sucesso.");
      return { ticket, CSRFPreventionToken };
    } catch (error) {
      console.error("[renewTicket] Erro ao renovar o ticket:", error);
      throw error;
    }
  };
  
  
  
  
  

  
  
  
  
  

// Função para excluir uma VM
const deleteVM = async (vmid, node) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}`,
      {
        method: "DELETE",
        headers: {
          Authorization: API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Erro ao excluir VM: ${response.status} ${response.statusText}`
      );
    }

    alert(`VM ${vmid} excluída com sucesso!`);
    fetchVMs();
  } catch (error) {
    console.error(`Erro ao excluir a VM ${vmid}:`, error);
    alert(`Falha ao excluir a VM ${vmid}.`);
  }
};


// Função para conectar a uma VM (atualizada)
// Função para conectar a uma VM (corrigida)
const connectVM = async (vmid, node) => {
  console.log("[connectVM] Iniciando conexão para VM:", vmid);

  try {
    // Renova o ticket e obtém o CSRF token
    const { ticket, CSRFPreventionToken } = await renewTicket();

    // Solicita o proxy VNC para a VM
    const vncProxyResponse = await fetch(
      `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`,
      {
        method: "POST",
        headers: {
          "CSRFPreventionToken": CSRFPreventionToken,
          Authorization: `PVEAPIToken=${process.env.REACT_APP_API_TOKEN.split("=")[1]}`, // Certifique-se de enviar somente o token puro
        },
        credentials: "include",
      }
    );

    if (!vncProxyResponse.ok) {
      const errorResponse = await vncProxyResponse.text();
      console.error("[connectVM] Erro na resposta do VNC proxy:", errorResponse);
      throw new Error(`[connectVM] Erro ao obter VNC proxy: ${vncProxyResponse.status}`);
    }

    const vncProxyData = await vncProxyResponse.json();
    console.log("[connectVM] Resposta do VNC proxy:", vncProxyData);

    const { ticket: vncTicket, port } = vncProxyData.data;

    // Gera a URL para conexão noVNC
    const noVNCUrl = `${API_BASE_URL}/?console=kvm&novnc=1&node=${node}&resize=1&vmid=${vmid}&path=api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket/port/${port}/vncticket/${vncTicket}`;

    // Atualiza o iframe com a URL gerada
    setIframeUrl(noVNCUrl);

    console.log("[connectVM] URL noVNC configurada no iframe com sucesso:", noVNCUrl);
  } catch (error) {
    console.error("[connectVM] Erro ao conectar à VM:", error);
    alert("Erro ao conectar à VM. Verifique o console para mais detalhes.");
  }
};



















const createSnapshot = async (vmid, node, type) => {
  try {
    const snapshotName = prompt(`Digite o nome do Snapshot para a VM ${vmid}:`);
    if (!snapshotName) {
      alert("O nome do Snapshot é obrigatório.");
      return;
    }

    // Escolher o endpoint correto com base no tipo da VM
    const endpoint =
      type === "qemu"
        ? `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/snapshot`
        : `${API_BASE_URL}/api2/json/nodes/${node}/lxc/${vmid}/snapshot`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: API_TOKEN,
      },
      body: JSON.stringify({ snapname: snapshotName }),
    });

    if (!response.ok) {
      throw new Error(
        `Erro ao criar Snapshot: ${response.status} ${response.statusText}`
      );
    }

    alert(`Snapshot "${snapshotName}" criado com sucesso!`);
    fetchVMs(); // Atualiza a lista de VMs após criar o Snapshot
  } catch (error) {
    console.error(`Erro ao criar Snapshot para a VM ${vmid}:`, error);
    alert(`Falha ao criar Snapshot para a VM ${vmid}.`);
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
    { field: "type", headerName: "Tipo", width: 150 },
    {
      field: "actions",
      headerName: "Ações",
      width: 500,
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
  onClick={() => connectVM(row.id, row.node, row.type)} // Passar o tipo correto
>
  Conectar
</Button>

          <Button
  variant="contained"
  style={{ backgroundColor: "orange", color: "white" }}
  onClick={() => createSnapshot(row.id, row.node, row.type)} // Passar o tipo
>
  Snapshot
</Button>


          <Button
      variant="contained"
      style={{ backgroundColor: "red", color: "white" }}
      onClick={() => {
        if (
          window.confirm(
            `Tem certeza de que deseja excluir a VM ${row.name} (ID: ${row.id})?`
          )
        ) {
          deleteVM(row.id, row.node);
        }
      }}
    >
      Excluir
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
        height="100vh"
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
      {iframeUrl && (
        <Box mt="20px">
          <iframe
            src={iframeUrl}
            width="100%"
            height="800px"
            style={{ border: "none" }}
            title="Console noVNC"
          />
        </Box>
      )}
    </Box>
  );
};

export default Team;
