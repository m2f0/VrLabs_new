import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";

const VmAutomation = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [vmList, setVmList] = useState([]);
  const [selectedVMs, setSelectedVMs] = useState([]);
  const [generatedHTML, setGeneratedHTML] = useState("");
  const [fileName, setFileName] = useState("");
  const [isGenerated, setIsGenerated] = useState(false); // Controla exibição do botão e campo de salvar

  const API_TOKEN = "58fc95f1-afc7-47e6-8b7a-31e6971062ca";
  const API_USER = "apiuser@pve";
  const API_BASE_URL = "https://prox.nnovup.com.br";

  // Estado para armazenar o código do botão embed
  const [embedCode, setEmbedCode] = useState("");

  // Função para gerar o código embed do botão
  const generateEmbedCode = () => {
    if (!fileName) {
      alert("Defina um nome de arquivo para o HTML.");
      return;
    }

    const embed = `<button onclick="window.open('https://jm7xgg-3000.csb.app/HTMLs/${fileName}.html', '_blank')">Abrir HTML</button>`;
    setEmbedCode(embed);
  };

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

  // Função para salvar o HTML gerado
  const saveHTML = async () => {
    if (!fileName) {
      alert("Por favor, insira um nome para o arquivo.");
      return;
    }

    if (!generatedHTML) {
      alert("Nenhum HTML foi gerado para salvar.");
      return;
    }

    try {
      const response = await fetch("https://jm7xgg-3000.csb.app/save-html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: `${fileName}.html`,
          content: generatedHTML,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar o HTML no servidor.");
      }

      alert("HTML salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar o HTML:", error);
      alert("Erro ao salvar o HTML.");
    }
  };

  // Função para gerar o HTML
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
        <title>Laboratórios</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .vm-container { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
          .vm-buttons { margin-top: 10px; }
          .vm-buttons button { margin-right: 10px; padding: 10px; background-color: #1976d2; color: white; border: none; border-radius: 5px; cursor: pointer; }
          .vm-buttons button:hover { background-color: #1565c0; }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            display: none;
            margin: 10px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .connect-button {
            display: none;
            margin-top: 10px;
            padding: 10px;
            background-color: #4caf50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          .connect-button:hover {
            background-color: #45a049;
          }
        </style>
        <script>
          const API_BASE_URL = "${API_BASE_URL}";
          const API_TOKEN = "${API_TOKEN}";
          const API_USER = "${API_USER}";

          async function startLab(vmid, node, name) {
            const newVmId = prompt("Digite o ID do novo Linked Clone:");
            if (!newVmId) {
              alert("ID do novo Linked Clone é obrigatório.");
              return;
            }

            const spinner = document.getElementById(\`spinner-\${vmid}\`);
            const connectButton = document.getElementById(\`connect-button-\${vmid}\`);

            async function createClone() {
              try {
                spinner.style.display = "block";
                const response = await fetch(
                  \`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${vmid}/clone\`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                      Authorization: \`PVEAPIToken=\${API_USER}!apitoken=\${API_TOKEN}\`,
                    },
                    body: new URLSearchParams({
                      newid: newVmId,
                      name: \`\${name}-lab-\${newVmId}\`,
                      snapname: "SNAP_1",
                      full: 0,
                    }),
                  }
                );

                if (!response.ok) {
                  throw new Error(
                    \`Erro ao criar o Linked Clone: \${response.status} \${response.statusText}\`
                  );
                }

                alert("Linked Clone criado com sucesso!");
                return true;
              } catch (error) {
                console.error("Erro ao criar Linked Clone:", error);
                alert("Erro ao criar Linked Clone.");
                spinner.style.display = "none";
                return false;
              }
            }

            async function startClone() {
              try {
                const response = await fetch(
                  \`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${newVmId}/status/start\`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: \`PVEAPIToken=\${API_USER}!apitoken=\${API_TOKEN}\`,
                    },
                  }
                );

                if (!response.ok) {
                  throw new Error(
                    \`Erro ao iniciar o Linked Clone: \${response.status} \${response.statusText}\`
                  );
                }

                alert("Linked Clone iniciado com sucesso!");
                return true;
              } catch (error) {
                console.error("Erro ao iniciar Linked Clone:", error);
                alert("Erro ao iniciar Linked Clone.");
                spinner.style.display = "none";
                return false;
              }
            }

            async function fetchTicketAndConnect() {
              try {
                const response = await fetch(
                  \`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${newVmId}/vncproxy\`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: \`PVEAPIToken=\${API_USER}!apitoken=\${API_TOKEN}\`,
                    },
                  }
                );

                if (!response.ok) {
                  throw new Error(
                    \`Erro ao obter o ticket: \${response.status} \${response.statusText}\`
                  );
                }

                const data = await response.json();
                const { ticket } = data.data;

                connectButton.style.display = "block";
                connectButton.onclick = () => {
                  const url = \`\${API_BASE_URL}/?console=kvm&novnc=1&vmid=\${newVmId}&node=\${node}&resize=off&vncticket=\${encodeURIComponent(ticket)}\`;
                  window.open(url, "_blank");
                };
              } catch (error) {
                console.error("Erro ao conectar:", error);
                alert("Erro ao conectar à VM.");
              } finally {
                spinner.style.display = "none";
              }
            }

            const cloneCreated = await createClone();
            if (cloneCreated) {
              const cloneStarted = await startClone();
              if (cloneStarted) {
                await fetchTicketAndConnect();
              }
            }
          }
        </script>
      </head>
      <body>
        <h1>Gerenciador de VMs</h1>
        ${selectedVMs
          .map((vmId) => {
            const vm = vmList.find((vm) => vm.id === vmId);
            if (!vm) return "";

            return `
              <div class="vm-container">
                <p>VM: ${vm.name} (ID: ${vm.id})</p>
                <div class="vm-buttons">
                  <button onclick="startLab('${vm.id}', '${vm.node}', '${vm.name}')">Iniciar Laboratório</button>
                  <div id="spinner-${vm.id}" class="spinner"></div>
                  <button id="connect-button-${vm.id}" class="connect-button">Conectar</button>
                </div>
              </div>
            `;
          })
          .join("")}
      </body>
      </html>
    `;

    setGeneratedHTML(html);
    setIsGenerated(true);
  };

  useEffect(() => {
    fetchVMs();
  }, []);

  return (
    <Box m="20px">
      <Header
        title="Automação de Máquinas Virtuais"
        subtitle="Gerencie e Controle Suas VMs"
      />

      <Box
        m="20px 0"
        height="60vh"
        sx={{
          "& .MuiDataGrid-root": {
            borderRadius: "8px",
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
          },
          "& .MuiDataGrid-cell": {
            color: colors.primary[100],
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: colors.blueAccent[700],
            color: "white",
          },
        }}
      >
        <DataGrid
          rows={vmList}
          columns={[
            { field: "id", headerName: "VM ID", width: 100 },
            { field: "name", headerName: "Nome", width: 200 },
            { field: "status", headerName: "Status", width: 120 },
          ]}
          checkboxSelection
          onSelectionModelChange={(ids) => setSelectedVMs(ids)}
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
            padding: "10px 20px",
            "&:hover": { backgroundColor: colors.blueAccent[500] },
          }}
          onClick={generateHTML}
        >
          AUTO
        </Button>

        {isGenerated && (
          <Box display="flex" gap="10px" alignItems="center">
            <input
              type="text"
              placeholder="Digite o nome do arquivo"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              style={{
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                width: "200px",
              }}
            />
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                padding: "10px 20px",
                "&:hover": { backgroundColor: colors.greenAccent[500] },
              }}
              onClick={saveHTML}
            >
              Salvar
            </Button>
          </Box>
        )}

        {generatedHTML && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: colors.greenAccent[600],
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              padding: "10px 20px",
              "&:hover": { backgroundColor: colors.greenAccent[500] },
            }}
            onClick={() => {
              const win = window.open();
              win.document.write(generatedHTML);
              win.document.close();
            }}
          >
            Abrir HTML
          </Button>
        )}
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.greenAccent[600],
            color: "white",
            fontWeight: "bold",
            fontSize: "16px",
            padding: "10px 20px",
            "&:hover": { backgroundColor: colors.greenAccent[500] },
          }}
          onClick={generateEmbedCode}
        >
          Gerar Botão
        </Button>
      </Box>
      <textarea
        value={embedCode}
        readOnly
        style={{
          marginTop: "10px",
          width: "400px",
          height: "100px",
          padding: "10px",
          borderRadius: "5px",
          border: "1px solid #ccc",
          fontSize: "14px",
        }}
      />
    </Box>
  );
};

export default VmAutomation;
