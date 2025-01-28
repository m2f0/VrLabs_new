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
  console.log("[connectVM] Iniciando conexão para VM:", vmid);

  try {
    // 1. Solicitar o proxy VNC usando o API Token
    const vncProxyResponse = await fetch(
      `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`,
      {
        method: "POST",
        headers: {
          "Authorization": `PVEAPIToken=${process.env.REACT_APP_API_USERNAME}!apitoken=${process.env.REACT_APP_API_TOKEN}`
        },
      }
    );

    if (!vncProxyResponse.ok) {
      throw new Error(`Erro ao obter VNC proxy: ${vncProxyResponse.status}`);
    }

    const vncProxyData = await vncProxyResponse.json();
    const { ticket: vncTicket, port } = vncProxyData.data;

    // 2. Construir a URL com o caminho correto para o websocket
    const noVNCUrl = `${API_BASE_URL}/?console=kvm&novnc=1&node=${node}&resize=scale&vmid=${vmid}&path=api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket/port/${port}/vncticket/${encodeURIComponent(vncTicket)}`;

    console.log("[connectVM] URL noVNC gerada:", noVNCUrl);

    // 3. Abrir em uma nova aba
    window.open(noVNCUrl, '_blank');

    const wsUrl = `wss://${new URL(API_BASE_URL).hostname}/api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket/port/${port}/vncticket/${encodeURIComponent(vncTicket)}`;
    console.log("[connectVM] Testando conexão WebSocket:", wsUrl);
    testWebSocketConnection(wsUrl);

  } catch (error) {
    console.error("[connectVM] Erro ao conectar à VM:", error);
    alert(`Erro ao conectar à VM: ${error.message}`);
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

// Adicione esta função de utilidade
const testWebSocketConnection = (url) => {
  console.log("[testWebSocket] Tentando conectar ao WebSocket:", url);
  const ws = new WebSocket(url);
  
  ws.onopen = () => {
    console.log("[testWebSocket] Conexão estabelecida com sucesso");
    ws.close();
  };
  
  ws.onerror = (error) => {
    console.error("[testWebSocket] Erro na conexão:", error);
  };
  
  ws.onclose = (event) => {
    console.log("[testWebSocket] Conexão fechada:", event.code, event.reason);
  };
};
