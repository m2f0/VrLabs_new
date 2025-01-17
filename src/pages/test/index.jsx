import React, { useEffect, useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";
import { Tabs, Tab } from "@mui/material";

const VmAutomation = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [vmList, setVmList] = useState([]);
  const [linkedClones, setLinkedClones] = useState([]);
  const [selectedClones, setSelectedClones] = useState([]);
  const [generatedPageCode, setGeneratedPageCode] = useState("");
  const [activeTab, setActiveTab] = useState(1);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const API_TOKEN = process.env.REACT_APP_API_TOKEN;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Função para buscar a lista de VMs do Proxmox
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
        throw new Error(`Erro na API do Proxmox: ${response.status}`);
      }

      const data = await response.json();
      const allVMs = data.data || [];

      // Filtrar Linked Clones, remover duplicados e ajustar o formato
      const uniqueClones = allVMs
        .filter((vm) => vm.name && vm.name.includes("CLONE")) // Apenas Linked Clones
        .reduce((acc, current) => {
          const exists = acc.find((item) => item.id === current.id);
          if (!exists) {
            acc.push({
              ...current,
              id: current.id.replace("qemu/", ""), // Remover o prefixo "qemu/"
            });
          }
          return acc;
        }, []);

      setLinkedClones(uniqueClones);
    } catch (error) {
      console.error("Erro ao buscar VMs:", error);
      alert("Erro ao buscar VMs. Verifique o console.");
    }
  };

  // Função para gerar o código da página
  // Função para gerar o código da página
// Função para gerar o código da página
const generatePageCode = () => {
  if (selectedClones.length === 0) {
    alert("Selecione pelo menos um linked clone para gerar a página.");
    return;
  }

  const buttons = selectedClones
    .map((cloneId) => {
      const clone = linkedClones.find((lc) => lc.id === cloneId);
      return `
        <button class="button start" onclick="startVM('${clone.id}', '${clone.node}')">
          Iniciar ${clone.name}
        </button>
        <button class="button connect" onclick="connectVM('${clone.id}', '${clone.node}')">
          Conectar ${clone.name}
        </button>
      `;
    })
    .join("\n");

  const pageCode = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Controle de Linked Clones</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; text-align: center; padding: 20px; }
        .button { margin: 10px; padding: 10px 20px; font-size: 16px; border: none; cursor: pointer; }
        .start { background-color: #4CAF50; color: white; }
        .connect { background-color: #2196F3; color: white; }
        iframe { margin-top: 20px; width: 100%; height: 800px; border: none; }
      </style>
    </head>
    <body>
      <h1>Controle de Linked Clones</h1>
      <div id="buttons-section">
        ${buttons}
      </div>
      <iframe id="vm-console" title="Console noVNC"></iframe>
      <script>
        const API_BASE_URL = "${API_BASE_URL}";
        const API_TOKEN = "${API_TOKEN}";

        const renewTicket = async () => {
          const username = "${process.env.REACT_APP_API_USERNAME}";
          const password = "${process.env.REACT_APP_API_PASSWORD}";

          try {
            const response = await fetch(
              \`\${API_BASE_URL}/api2/json/access/ticket\`,
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

            if (!response.ok) {
              throw new Error(\`Erro ao renovar ticket: \${response.status}\`);
            }

            const data = await response.json();
            document.cookie = \`PVEAuthCookie=\${data.data.ticket}; path=/; Secure; SameSite=None; Domain=.nnovup.com.br\`;
            return data.data.ticket;
          } catch (error) {
            console.error("Erro ao renovar ticket:", error);
          }
        };

        const startVM = async (vmid, node) => {
          try {
            const response = await fetch(
              \`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${vmid}/status/start\`,
              {
                method: "POST",
                headers: {
                  Authorization: API_TOKEN,
                },
              }
            );

            if (!response.ok) {
              throw new Error(\`Erro ao iniciar VM: \${response.status} \${response.statusText}\`);
            }

            alert(\`VM \${vmid} iniciada com sucesso!\`);
          } catch (error) {
            console.error("Erro ao iniciar VM:", error);
            alert(\`Erro ao iniciar VM \${vmid}.\`);
          }
        };

        const connectVM = async (vmid, node) => {
          try {
            const ticket = await renewTicket();

            const vncProxyResponse = await fetch(
              \`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${vmid}/vncproxy\`,
              {
                method: "POST",
                headers: {
                  Authorization: API_TOKEN,
                },
              }
            );

            if (!vncProxyResponse.ok) {
              throw new Error(\`Erro ao obter proxy VNC: \${vncProxyResponse.status}\`);
            }

            const { ticket: vncTicket, port } = await vncProxyResponse.json().data;

            const noVNCUrl = \`\${API_BASE_URL}/?console=kvm&novnc=1&node=\${node}&resize=1&vmid=\${vmid}&path=api2/json/nodes/\${node}/qemu/\${vmid}/vncwebsocket/port/\${port}/vncticket/\${vncTicket}\`;

            const iframe = document.getElementById("vm-console");
            iframe.src = noVNCUrl;
          } catch (error) {
            console.error("Erro ao conectar VM:", error);
            alert(\`Erro ao conectar VM \${vmid}.\`);
          }
        };
      </script>
    </body>
    </html>
  `;

  setGeneratedPageCode(pageCode);
};



  useEffect(() => {
    fetchVMs();
  }, []);

  return (
    <Box m="20px">
      <Header
        title="Automação de Máquinas Virtuais"
        subtitle="Selecione Linked Clones e Gere Páginas"
      />

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          "& .MuiTab-root": {
            fontWeight: "bold",
            fontSize: "16px",
            textTransform: "none",
          },
        }}
      >
        <Tab label="Linked Clones" />
      </Tabs>

      {activeTab === 1 && (
        <Box mt="20px">
          <Box
            height="40vh"
            sx={{
              "& .MuiDataGrid-root": { borderRadius: "8px", backgroundColor: colors.primary[400] },
            }}
          >
            <DataGrid
              rows={linkedClones}
              columns={[
                { field: "id", headerName: "Clone ID", width: 100 },
                { field: "name", headerName: "Nome", width: 200 },
                { field: "status", headerName: "Status", width: 120 },
              ]}
              checkboxSelection
              onSelectionModelChange={(ids) => setSelectedClones(ids)}
            />
          </Box>

          <Box mt="20px" display="flex" justifyContent="center" gap="20px">
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.blueAccent[600],
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
              }}
              onClick={generatePageCode}
            >
              Criar Página
            </Button>
          </Box>

          {generatedPageCode && (
            <Box mt="20px">
              <h3>Código Gerado</h3>
              <TextField
                value={generatedPageCode}
                multiline
                rows={10}
                fullWidth
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default VmAutomation;
