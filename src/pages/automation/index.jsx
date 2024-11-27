import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [vmList, setVmList] = useState([]);
  const [selectedVMs, setSelectedVMs] = useState([]);
  const [generatedHTML, setGeneratedHTML] = useState("");

  // Constantes definidas diretamente no código
  const API_TOKEN = "58fc95f1-afc7-47e6-8b7a-31e6971062ca"; // Token de autenticação
  const API_USER = "apiuser@pve"; // Usuário da API
  const API_BASE_URL = "https://prox.nnovup.com.br"; // URL base da API

  // Função para buscar a lista de VMs
  const fetchVMs = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api2/json/cluster/resources?type=vm`,
        {
          method: "GET",
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
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
        }))
      );
    } catch (error) {
      console.error("Erro ao buscar lista de VMs:", error);
      alert("Falha ao buscar as VMs. Verifique o console para mais detalhes.");
    }
  };

  // Função para gerar o código HTML
  const generateHTML = () => {
    if (selectedVMs.length === 0) {
      alert("Selecione pelo menos uma VM para gerar o código HTML.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gerenciador de VMs</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          .vm-container {
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          .vm-buttons button {
            margin-right: 10px;
            padding: 10px;
            background-color: #1976d2;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          .vm-buttons button:hover {
            background-color: #1565c0;
          }
        </style>
      </head>
      <body>
        <h1>Gerenciador de VMs</h1>
        ${selectedVMs
          .map((vmId) => {
            const vm = vmList.find((vm) => vm.id === vmId);
            return `
            <div class="vm-container">
              <p>VM: ${vm.name} (ID: ${vm.id})</p>
              <div class="vm-buttons">
                <button onclick="startVM('${vm.id}', '${vm.node}')">Start</button>
                <button onclick="stopVM('${vm.id}', '${vm.node}')">Stop</button>
                <button onclick="connectVM('${vm.id}', '${vm.node}')">Connect</button>
              </div>
            </div>
          `;
          })
          .join("")}
        <script>
          const API_BASE_URL = "${API_BASE_URL}";
          const API_USER = "${API_USER}";
          const API_TOKEN = "${API_TOKEN}";

          async function startVM(vmid, node) {
            try {
              const response = await fetch(
                \`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${vmid}/status/start\`,
                {
                  method: "POST",
                  headers: {
                    Authorization: \`PVEAPIToken=\${API_USER}!apitoken=\${API_TOKEN}\`,
                  },
                }
              );
              if (!response.ok) throw new Error("Failed to start VM");
              alert("VM " + vmid + " started successfully!");
            } catch (error) {
              alert("Error starting VM: " + error.message);
            }
          }

          async function stopVM(vmid, node) {
            try {
              const response = await fetch(
                \`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${vmid}/status/stop\`,
                {
                  method: "POST",
                  headers: {
                    Authorization: \`PVEAPIToken=\${API_USER}!apitoken=\${API_TOKEN}\`,
                  },
                }
              );
              if (!response.ok) throw new Error("Failed to stop VM");
              alert("VM " + vmid + " stopped successfully!");
            } catch (error) {
              alert("Error stopping VM: " + error.message);
            }
          }

          function connectVM(vmid, node) {
            const url = \`\${API_BASE_URL}/?console=kvm&novnc=1&vmid=\${vmid}&node=\${node}\`;
            window.open(url, "_blank");
          }
        </script>
      </body>
      </html>
    `;

    setGeneratedHTML(html);
  };

  // Função para abrir o HTML em uma nova aba
  const openGeneratedHTML = () => {
    if (!generatedHTML) {
      alert("Nenhum HTML gerado. Clique em 'Auto' primeiro.");
      return;
    }

    const newWindow = window.open();
    newWindow.document.write(generatedHTML);
    newWindow.document.close();
  };

  useEffect(() => {
    fetchVMs();
  }, []);

  const columns = [
    { field: "id", headerName: "VM ID", width: 100 },
    { field: "name", headerName: "Nome", width: 200 },
    { field: "status", headerName: "Status", width: 150 },
    { field: "node", headerName: "Node", width: 150 },
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
        height="70vh"
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
        <DataGrid
          rows={vmList}
          columns={columns}
          checkboxSelection
          onSelectionModelChange={(ids) => setSelectedVMs(ids)}
        />
      </Box>
      <Box mt="20px" display="flex" justifyContent="center">
        <Button
          variant="contained"
          style={{
            backgroundColor: colors.blueAccent[700],
            color: "white",
            marginRight: "10px",
          }}
          onClick={generateHTML}
        >
          Auto
        </Button>
        <Button
          variant="contained"
          style={{
            backgroundColor: colors.blueAccent[700],
            color: "white",
          }}
          onClick={openGeneratedHTML}
        >
          Abrir HTML
        </Button>
      </Box>
      {generatedHTML && (
        <Box mt="20px">
          <Typography variant="h6">Código HTML Gerado:</Typography>
          <textarea
            style={{ width: "100%", height: "300px" }}
            value={generatedHTML}
            readOnly
          />
        </Box>
      )}
    </Box>
  );
};

export default Team;
