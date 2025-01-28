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
  const [iframeUrl, setIframeUrl] = useState(""); // URL para o iframe

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const API_TOKEN = process.env.REACT_APP_API_TOKEN;

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
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[renewTicket] Erro ao renovar o ticket:", errorText);
        throw new Error(`[renewTicket] Erro ao renovar o ticket: ${response.status}`);
      }

      const data = await response.json();
      const { ticket, CSRFPreventionToken } = data.data;

      // Configura os cookies necessários
      const domain = new URL(process.env.REACT_APP_API_LOGIN_URL).hostname;
      Cookies.set("PVEAuthCookie", ticket, {
        path: "/",
        secure: true,
        sameSite: "None",
        domain,
      });
      Cookies.set("proxmoxCSRF", CSRFPreventionToken, {
        path: "/",
        secure: true,
        sameSite: "None",
        domain,
      });

      console.log("[renewTicket] Ticket e CSRFPreventionToken configurados com sucesso.");
      return { ticket, CSRFPreventionToken };
    } catch (error) {
      console.error("[renewTicket] Erro ao renovar o ticket:", error);
      throw error;
    }
  };

  const fetchVMs = async () => {
    console.log("[fetchVMs] Buscando lista de VMs...");

    try {
      let csrfToken = Cookies.get("proxmoxCSRF");
      let authCookie = Cookies.get("PVEAuthCookie");

      // Renova os tokens se não estiverem disponíveis
      if (!csrfToken || !authCookie) {
        console.warn("[fetchVMs] Tokens ausentes. Renovando...");
        const tokens = await renewTicket();
        csrfToken = tokens.CSRFPreventionToken;
        authCookie = tokens.ticket;
      }

      const response = await fetch(`${API_BASE_URL}/api2/json/cluster/resources?type=vm`, {
        method: "GET",
        headers: {
          "CSRFPreventionToken": csrfToken,
          Authorization: API_TOKEN,
        },
        credentials: "include",
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

  const connectVM = async (vmid, node) => {
    console.log("[connectVM] Iniciando conexão para VM:", vmid);

    try {
      const { ticket, CSRFPreventionToken } = await renewTicket();

      console.log("[connectVM] Ticket e CSRFPreventionToken obtidos:", {
        ticket,
        CSRFPreventionToken,
      });

      const vncProxyResponse = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`,
        {
          method: "POST",
          headers: {
            "CSRFPreventionToken": CSRFPreventionToken,
            Authorization: API_TOKEN,
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

      const noVNCUrl = `${API_BASE_URL}/?console=kvm&novnc=1&vmid=${vmid}&node=${node}&resize=1&path=api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket/port/${port}/vncticket/${vncTicket}`;
      setIframeUrl(noVNCUrl);

      console.log("[connectVM] URL noVNC configurada no iframe com sucesso:", noVNCUrl);
    } catch (error) {
      console.error("[connectVM] Erro ao conectar à VM:", error);
      alert("Erro ao conectar à VM. Verifique o console para mais detalhes.");
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
