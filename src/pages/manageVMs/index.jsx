// FUNCIONANDO v.5
import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [vmList, setVmList] = useState([]);
  const [iframeUrl, setIframeUrl] = useState(null); // URL para o iframe

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const API_TOKEN = process.env.REACT_APP_API_TOKEN;

  // Move debugAuthState inside the component
  const debugAuthState = () => {
    console.log("[debugAuth] Current cookies:", document.cookie);
    console.log("[debugAuth] Current domain:", window.location.hostname);
    console.log("[debugAuth] API base URL:", API_BASE_URL);
  };

  // Função para buscar lista de VMs
const fetchVMs = async () => {
  console.log("[fetchVMs] Buscando lista de VMs...");

  try {
    const response = await fetch(`${API_BASE_URL}/api2/json/cluster/resources?type=vm`, {
      method: "GET",
      headers: {
        // Correct format: username!tokenid=uuid
        "Authorization": `PVEAPIToken=${process.env.REACT_APP_API_USERNAME}!apitoken=${process.env.REACT_APP_API_TOKEN}`
      },
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

// Atualização da função connectVM para garantir a obtenção de tickets antes da conexão
const connectVM = async (vmid, node) => {
  debugAuthState();
  console.log("[connectVM] Iniciando conexão para VM:", vmid);

  try {
    // 1. Get authentication ticket and CSRF token
    const ticketResponse = await fetch(`${API_BASE_URL}/api2/json/access/ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: process.env.REACT_APP_API_USERNAME,
        password: process.env.REACT_APP_API_PASSWORD,
      }),
    });

    if (!ticketResponse.ok) {
      throw new Error(`Erro ao obter ticket: ${ticketResponse.status}`);
    }

    const ticketData = await ticketResponse.json();
    const authTicket = ticketData.data.ticket;
    const csrfToken = ticketData.data.CSRFPreventionToken;
    
    // Set the cookie for authentication
    document.cookie = `PVEAuthCookie=${authTicket}; path=/; Secure; SameSite=None; Domain=.nnovup.com.br`;

    // 2. Request VNC proxy with both auth ticket and CSRF token
    const vncProxyResponse = await fetch(
      `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`,
      {
        method: "POST",
        headers: {
          "Authorization": `PVEAPIToken=${process.env.REACT_APP_API_USERNAME}!apitoken=${process.env.REACT_APP_API_TOKEN}`,
          "CSRFPreventionToken": csrfToken,
          "Cookie": `PVEAuthCookie=${authTicket}`
        },
        credentials: 'include',
      }
    );

    if (!vncProxyResponse.ok) {
      throw new Error(`Erro ao obter VNC proxy: ${vncProxyResponse.status}`);
    }

    const vncProxyData = await vncProxyResponse.json();
    const { ticket: vncTicket, port } = vncProxyData.data;

    // 3. Build noVNC URL with the correct path format
    const noVNCUrl = `${API_BASE_URL}/?console=kvm&novnc=1&node=${node}&resize=off&vmid=${vmid}&path=api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket/port/${port}/vncticket/${encodeURIComponent(vncTicket)}`;

    console.log("[connectVM] URL noVNC gerada:", noVNCUrl);

    // 4. Open in new tab with specific features
    const windowFeatures = 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no';
    window.open(noVNCUrl, `vnc_${vmid}`, windowFeatures);

  } catch (error) {
    console.error("[connectVM] Erro ao conectar à VM:", error);
    alert(`Erro ao conectar à VM: ${error.message}`);
  }
};

const startVM = async (vmid, node) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/status/start`,
      {
        method: "POST",
        headers: {
          Authorization: `PVEAPIToken=${process.env.REACT_APP_API_USERNAME}!apitoken=${process.env.REACT_APP_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao iniciar VM: ${response.status} ${response.statusText}`);
    }

    alert(`VM ${vmid} iniciada com sucesso!`);
    fetchVMs(); // Refresh the VM list
  } catch (error) {
    console.error(`Erro ao iniciar a VM ${vmid}:`, error);
    alert(`Falha ao iniciar a VM ${vmid}.`);
  }
};

const stopVM = async (vmid, node) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/status/stop`,
      {
        method: "POST",
        headers: {
          Authorization: `PVEAPIToken=${process.env.REACT_APP_API_USERNAME}!apitoken=${process.env.REACT_APP_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao parar VM: ${response.status} ${response.statusText}`);
    }

    alert(`VM ${vmid} parada com sucesso!`);
    fetchVMs(); // Refresh the VM list
  } catch (error) {
    console.error(`Erro ao parar a VM ${vmid}:`, error);
    alert(`Falha ao parar a VM ${vmid}.`);
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
          Authorization: `PVEAPIToken=${process.env.REACT_APP_API_USERNAME}!apitoken=${process.env.REACT_APP_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao deletar VM: ${response.status} ${response.statusText}`);
    }

    alert(`VM ${vmid} deletada com sucesso!`);
    fetchVMs(); // Refresh the VM list
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
    { field: "type", headerName: "Tipo", width: 150 },
    {
      field: "actions",
      headerName: "Ações",
      width: 500,
      renderCell: ({ row }) => (
        <Box display="flex" gap="10px">
          <Button
            variant="contained"
            color="success"
            onClick={() => startVM(row.id, row.node)}
            disabled={row.status === "running"}
          >
            Iniciar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => stopVM(row.id, row.node)}
            disabled={row.status === "stopped"}
          >
            Parar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => connectVM(row.id, row.node)}
          >
            Conectar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteVM(row.id, row.node)}
          >
            Deletar
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="Máquinas Virtuais" subtitle="Gerencie e Controle Suas VMs" />
      <Box height="70vh">
        <DataGrid rows={vmList} columns={columns} />
      </Box>
      {iframeUrl && (
        <Box mt="20px" sx={{ width: '100%', height: '800px', border: '1px solid #ccc' }}>
          <iframe
            src={iframeUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#000'
            }}
            title="Console noVNC"
            allow="clipboard-read; clipboard-write"
          />
        </Box>
      )}
    </Box>
  );
};

export default Team;

const testWebSocketConnection = (url) => {
  console.log("[testWebSocket] Tentando conectar ao WebSocket:", url);
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket connection timeout"));
    }, 5000);

    ws.onopen = () => {
      clearTimeout(timeout);
      console.log("[testWebSocket] Conexão estabelecida com sucesso");
      ws.close();
      resolve();
    };
    
    ws.onerror = (error) => {
      clearTimeout(timeout);
      console.error("[testWebSocket] Erro na conexão:", error);
      reject(error);
    };
  });
};
