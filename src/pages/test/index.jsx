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
  const generatePageCode = () => {
    if (selectedClones.length === 0) {
      alert("Selecione pelo menos um linked clone para gerar a página.");
      return;
    }
  
    const buttons = selectedClones
      .map((cloneId) => {
        const clone = linkedClones.find((lc) => lc.id === cloneId);
        return `
          <button class="button start" onclick="startVM('${clone.id}', '${clone.node}', '${clone.name}')">
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
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f9;
          color: #333;
          text-align: center;
          padding: 20px;
        }
        .button {
          margin: 10px;
          padding: 10px 20px;
          font-size: 16px;
          border: none;
          cursor: pointer;
        }
        .start {
          background-color: #4CAF50;
          color: white;
        }
        .connect {
          background-color: #2196F3;
          color: white;
        }
        .login-container {
          margin-bottom: 20px;
        }
        input {
          padding: 10px;
          margin: 5px;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <h1>Controle de Linked Clones</h1>
      <div class="login-container">
        <h2>Login no Proxmox</h2>
        <input id="username" type="text" placeholder="Usuário" required>
        <input id="password" type="password" placeholder="Senha" required>
        <button class="button" onclick="loginProxmox()">Login</button>
      </div>
      <div id="buttons-container">
        <h2>Linked Clones</h2>
        ${buttons}
      </div>
      <script src="https://vrlabs.nnovup.com.br/proxmox.js"></script>
      <script>
        const API_BASE_URL = "${API_BASE_URL}";
  
        async function loginProxmox() {
          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;
  
          if (!username || !password) {
            alert("Usuário e senha são obrigatórios.");
            return;
          }
  
          try {
            const response = await fetch(\`\${API_BASE_URL}/access/ticket\`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({ username, password }),
            });
  
            if (!response.ok) {
              throw new Error(\`Erro ao autenticar: \${response.statusText}\`);
            }
  
            const data = await response.json();
            const ticket = data.data.ticket;
            const csrfToken = data.data.CSRFPreventionToken;
  
            // Armazena os cookies manualmente
            document.cookie = \`PVEAuthCookie=\${ticket}; path=/; Secure; SameSite=None; Domain=.nnovup.com.br\`;
  
            alert("Login realizado com sucesso!");
          } catch (error) {
            console.error("Erro ao realizar login:", error);
            alert("Erro ao realizar login. Verifique o console.");
          }
        }
  
        function startVM(vmid, node, name) {
          const ticket = getCookie("PVEAuthCookie");
  
          if (!ticket) {
            alert("Erro: Ticket de autenticação não encontrado. Faça login primeiro.");
            return;
          }
  
          fetch(\`\${API_BASE_URL}/nodes/\${node}/qemu/\${vmid}/status/start\`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: \`PVEAuthCookie=\${ticket}\`,
            },
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(\`Erro ao iniciar a VM: \${response.statusText}\`);
              }
              alert(\`VM \${name} (ID: \${vmid}) iniciada com sucesso!\`);
            })
            .catch((error) => {
              console.error("Erro ao iniciar a VM:", error);
              alert("Erro ao iniciar a VM.");
            });
        }
  
        function getCookie(name) {
          const value = \`;\${document.cookie}\`;
          const parts = value.split(\`;\${name}=\`);
          if (parts.length === 2) return parts.pop().split(";").shift();
        }
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
          <Box height="40vh" sx={{ "& .MuiDataGrid-root": { borderRadius: "8px", backgroundColor: colors.primary[400] } }}>
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
