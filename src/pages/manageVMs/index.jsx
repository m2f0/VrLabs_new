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
  const [iframeUrl, setIframeUrl] = useState(""); // URL para o iframe

  // Variáveis do .env
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // URL base da API
  const API_TOKEN = process.env.REACT_APP_API_TOKEN; // Token de autenticação

  // Função para buscar a lista de VMs
  const fetchVMs = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api2/json/cluster/resources?type=vm`,
        {
          method: "GET",
          headers: {
            Authorization: API_TOKEN,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(
          `Erro na API do Proxmox: ${response.status} ${response.statusText}`
        );
      }
  
      const data = await response.json();
      setVmList(
        data.data.map((vm) => ({
          id: vm.vmid,
          name: vm.name,
          status: vm.status,
          node: vm.node,
          type: vm.type || "qemu", // Adicionar o tipo
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
const renewTicket = async () => {
  console.log("[renewTicket] Iniciando a renovação do ticket de autenticação...");

  const username = process.env.REACT_APP_API_USERNAME;
  const password = process.env.REACT_APP_API_PASSWORD;

  console.log("[renewTicket] Username:", username);
  console.log("[renewTicket] Password:", password ? "******" : "Não fornecida");

  if (!username || !password) {
    console.error("[renewTicket] Credenciais de autenticação não configuradas corretamente.");
    throw new Error("Credenciais ausentes para autenticação.");
  }

  try {
    console.log("[renewTicket] Fazendo a requisição para o endpoint de autenticação...");

    const response = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api2/json/access/ticket`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      }
    );

    console.log("[renewTicket] Status da resposta:", response.status);

    if (!response.ok) {
      throw new Error(`[renewTicket] Erro ao renovar o ticket: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[renewTicket] Dados recebidos:", data);

    const { ticket, CSRFPreventionToken } = data.data;

    // Configurar o cookie do PVEAuthCookie
    document.cookie = `PVEAuthCookie=${ticket}; path=/; Secure; SameSite=None; Domain=.nnovup.com.br`;

    console.log("[renewTicket] Ticket renovado com sucesso:", ticket);
    console.log("[renewTicket] CSRFPreventionToken recebido:", CSRFPreventionToken);

    return { ticket, CSRFPreventionToken };
  } catch (error) {
    console.error("[renewTicket] Erro ao renovar o ticket:", error);
    throw new Error("[renewTicket] Falha ao renovar o ticket de autenticação.");
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


const connectVM = async (vmid, node, type) => {
  console.log("[connectVM] Iniciando conexão para VM:", vmid);

  try {
    // Renovar o ticket antes de conectar
    const { ticket: authTicket } = await renewTicket();
    console.log("[connectVM] Ticket renovado:", authTicket);

    // Configurar o cookie para autenticação no Proxmox
    document.cookie = `PVEAuthCookie=${authTicket}; path=/; Secure; SameSite=None; Domain=.nnovup.com.br`;

    // Escolher o endpoint correto com base no tipo da VM
    const endpoint =
      type === "qemu"
        ? `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`
        : `${API_BASE_URL}/api2/json/nodes/${node}/lxc/${vmid}/vncproxy`;

    // Fazer requisição ao endpoint VNC proxy para obter o ticket VNC
    const vncProxyResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: API_TOKEN,
      },
    });

    if (!vncProxyResponse.ok) {
      throw new Error(
        `Erro ao obter informações do console VNC: ${vncProxyResponse.status} ${vncProxyResponse.statusText}`
      );
    }

    const vncProxyData = await vncProxyResponse.json();
    const { ticket: vncTicket, port } = vncProxyData.data;

    // Gerar URL do noVNC
    const noVNCUrl = `${API_BASE_URL}/?console=kvm&novnc=1&vmid=${vmid}&vmname=${vmid}-${node}-${type}&node=${node}&resize=off&cmd=`;


    // Atualizar o iframe com a URL gerada
    setIframeUrl(noVNCUrl);
    console.log("[connectVM] Conexão ao noVNC configurada para VM:", vmid);
    console.log("[connectVM] URL gerada:", noVNCUrl);
  } catch (error) {
    console.error(`[connectVM] Erro ao conectar à VM ${vmid}:`, error);
    alert(`[connectVM] Falha ao conectar à VM ${vmid}. Verifique o console para mais detalhes.`);
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
