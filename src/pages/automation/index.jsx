import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
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
  const [selectedVM, setSelectedVM] = useState(null);
  const [selectedClones, setSelectedClones] = useState([]); // Estado para clones selecionados
  const [buttonCode, setButtonCode] = useState("");
  const [isButtonGenerated, setIsButtonGenerated] = useState(false);
  const [linkedCloneButtonCode, setLinkedCloneButtonCode] = useState(""); // Código gerado para linked clones
  const [snapshotList, setSnapshotList] = useState([]); // Lista de snapshots das VMs
  const [selectedSnapshot, setSelectedSnapshot] = useState(null); // Snapshot selecionado
  const [activeTab, setActiveTab] = useState(0);

  const API_TOKEN = "35233cb2-3501-41c9-8eb2-876eb25b6481";
  const API_USER = "apiuser@pve";
  const API_BASE_URL = "https://pxqa.cecyber.com";
  const BACKEND_URL = "https://fq5n66-3000.csb.app/";

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Função para buscar a lista de VMs do Proxmox e filtrar as normais e os linked clones
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

      // Verifica se os dados estão no formato esperado
      const allVMs = (data.data || []).map((vm) => ({
        id: vm.vmid,
        name: vm.name || "Sem Nome", // Evita que "undefined" cause erro
        status: vm.status || "Indisponível", // Tratamento de status indefinido
        node: vm.node || "Indefinido", // Tratamento de node indefinido
      }));

      // Filtrar VMs normais (excluindo linked clones)
      const normalVMs = allVMs.filter(
        (vm) => vm.name && !vm.name.includes("-lab-")
      );

      // Filtrar apenas linked clones
      const clones = allVMs.filter(
        (vm) => vm.name && vm.name.includes("-lab-")
      );

      setVmList(normalVMs);
      setLinkedClones(clones);
    } catch (error) {
      console.error("Erro ao buscar lista de VMs:", error);
      alert("Falha ao buscar as VMs. Verifique o console para mais detalhes.");
    }
  };

  const fetchSnapshots = async (vmid, node) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/snapshot`,
        {
          method: "GET",
          headers: {
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao buscar snapshots: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Filtrar os snapshots para remover o "current"
      const snapshots = (data.data || [])
        .filter((snap) => snap.name !== "current") // Exclui o snapshot "current"
        .map((snap) => ({
          id: `${vmid}-${snap.name}`, // ID único para o snapshot
          vmid, // ID da VM associada
          name: snap.name || "Sem Nome",
          description: snap.description || "Sem Descrição",
        }));

      setSnapshotList(snapshots); // Atualiza a lista de snapshots
    } catch (error) {
      console.error("Erro ao buscar snapshots:", error);
      alert("Falha ao buscar snapshots. Verifique o console.");
    }
  };

  // Função para gerar o código HTML do botão AUTO, que cria linked clones para a VM selecionada
  const generateButtonCode = () => {
    if (!selectedVM) {
      alert("Selecione uma VM para gerar o botão.");
      return;
    }

    const { id, node, name } = selectedVM;
    const code = `<button onclick="createLab('${id}', '${node}', '${name}')">Criar Linked Clone</button>
<script>
  async function createLab(vmid, node, name) {
    const newVmId = prompt("Digite o ID da nova VM (Linked Clone):");
    if (!newVmId) {
      alert("ID da nova VM é obrigatório.");
      return;
    }

    try {
      const response = await fetch(\`${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${vmid}/clone\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}",
        },
        body: new URLSearchParams({
          newid: newVmId,
          name: \`\${name}-lab-\${newVmId}\`,
          snapname: "SNAP_1",
          full: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar Linked Clone.");
      }

      alert("Linked Clone criado com sucesso!");
    } catch (error) {
      alert("Erro ao criar Linked Clone. Verifique os logs.");
      console.error(error);
    }
  }
</script>`;
    setButtonCode(code);
    setIsButtonGenerated(true);
  };

  // Função para gerar o código HTML do botão que inicia e conecta os linked clones selecionados
  const generateLinkedCloneButtonCode = async () => {
    if (selectedClones.length === 0) {
      alert("Selecione pelo menos um Linked Clone para gerar o botão.");
      return;
    }

    try {
      // Obter o ticket antes de gerar o botão
      const ticketResponse = await fetch(
        `${API_BASE_URL}/api2/json/access/ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: API_USER,
            password: "1qazxsw2", // Use a senha correta
          }),
        }
      );

      if (!ticketResponse.ok) {
        throw new Error(`Erro ao obter o ticket: ${ticketResponse.statusText}`);
      }

      const ticketData = await ticketResponse.json();
      const ticket = ticketData.data.ticket;

      // Gerar botões com o ticket incluído como cookie
      const buttons = selectedClones
        .map((cloneId) => {
          const clone = linkedClones.find((lc) => lc.id === cloneId);
          if (!clone) return "";

          return `
          <button onclick="startLinkedClone('${clone.id}', '${clone.node}', '${clone.name}')">
            Iniciar ${clone.name}
          </button>
          <button onclick="connectVM('${clone.id}', '${clone.node}', '${ticket}')">
            Conectar ${clone.name}
          </button>
  
          <script>
            async function startLinkedClone(vmid, node, name) {
              try {
                const response = await fetch(\`${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${vmid}/status/start\`, {
                  method: "POST",
                  headers: {
                    Authorization: "PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}",
                  },
                });
  
                if (!response.ok) {
                  throw new Error("Erro ao iniciar Linked Clone.");
                }
  
                alert(\`Linked Clone \${name} iniciado com sucesso!\`);
              } catch (error) {
                alert("Erro ao iniciar Linked Clone. Verifique os logs.");
                console.error(error);
              }
            }
  
            function connectVM(vmid, node, ticket) {
              const url = \`${API_BASE_URL}/?console=kvm&novnc=1&vmid=\${vmid}&node=\${node}&PVEAuthCookie=\${ticket}\`;
              window.open(url, "_blank");
            }
          </script>
          `;
        })
        .join("\n");

      const code = `
      <div>
        ${buttons}
      </div>
    `;

      setLinkedCloneButtonCode(code);
    } catch (error) {
      console.error("Erro ao gerar o botão:", error);
      alert("Erro ao gerar o botão. Verifique os logs.");
    }
  };

  const testGeneratedLinkedCloneCode = () => {
    if (!linkedCloneButtonCode) {
      alert("Gere o código primeiro usando o botão 'Criar Código'.");
      return;
    }

    const newWindow = window.open("", "_blank");
    newWindow.document.write(`<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teste do Código do Linked Clone</title>
      </head>
      <body>
        ${linkedCloneButtonCode}
      </body>
      </html>`);
    newWindow.document.close();
  };

  // Função para copiar o código gerado para linked clones para a área de transferência
  const copyLinkedCloneButtonCode = () => {
    if (!linkedCloneButtonCode) {
      alert("Gere o código primeiro usando o botão Criar Botão.");
      return;
    }

    navigator.clipboard.writeText(linkedCloneButtonCode).then(() => {
      alert("Código do Linked Clone copiado para a área de transferência!");
    });
  };

  const testLinkedCloneButtonCode = () => {
    if (!linkedCloneButtonCode) {
      alert("Gere o código primeiro usando o botão Criar Botão.");
      return;
    }

    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Teste do Código do Linked Clone</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f4f4f9;
            }
  
            .button-container {
              display: flex;
              flex-direction: column;
              gap: 16px;
              align-items: center;
            }
  
            button {
              font-size: 18px;
              font-weight: bold;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            }
  
            button.start {
              background-color: #6c63ff;
              color: white;
            }
            button.start:hover {
              background-color: #574bfa;
            }
  
            button.connect {
              background-color: #00c9a7;
              color: white;
            }
            button.connect:hover {
              background-color: #00b38a;
            }
          </style>
        </head>
        <body>
          <div class="button-container">
            ${linkedCloneButtonCode}
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();
  };

  // Função para copiar o código gerado pelo botão AUTO para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(buttonCode).then(() => {
      alert("Código copiado para a área de transferência!");
    });
  };

  // Função para criar um linked clone diretamente da VM selecionada e do snapshot selecionado
  const createLinkedClone = async () => {
    if (!selectedVM) {
      alert("Selecione uma VM para criar um Linked Clone.");
      return;
    }

    if (!selectedSnapshot || selectedSnapshot.name === "current") {
      alert(
        "A VM selecionada não possui snapshots válidos para criar um Linked Clone."
      );
      return;
    }

    const { id: vmId, node, name } = selectedVM;
    const { name: snapName } = selectedSnapshot; // Nome correto do snapshot

    const newVmId = prompt("Digite o ID da nova VM (Linked Clone):");
    if (!newVmId) {
      alert("ID da nova VM é obrigatório.");
      return;
    }

    try {
      const body = new URLSearchParams({
        newid: newVmId,
        name: `${name}-lab-${newVmId}`,
        snapname: snapName, // Nome correto do snapshot
        full: "0", // Certifique-se de enviar "0" como string
      });

      const response = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmId}/clone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          },
          body,
        }
      );

      if (!response.ok) {
        const errorText = await response.text(); // Leia o corpo da resposta para mais detalhes
        console.error("Erro no Proxmox:", errorText);
        throw new Error("Erro ao criar Linked Clone.");
      }

      alert("Linked Clone criado com sucesso!");
      fetchVMs(); // Atualiza a lista de VMs após criar o clone
    } catch (error) {
      console.error("Erro ao criar Linked Clone:", error);
      alert("Erro ao criar Linked Clone. Verifique os logs.");
    }
  };

  // Função para testar o código gerado pelo botão AUTO, abrindo-o em uma nova aba
  const testGeneratedCode = () => {
    if (!buttonCode) {
      alert("Gere o código primeiro usando o botão AUTO.");
      return;
    }

    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Teste do Código</title>
        </head>
        <body>
          ${buttonCode}
        </body>
      </html>
    `);
    newWindow.document.close();
  };

  // Função para salvar o código gerado no backend
  const saveGeneratedCode = async () => {
    if (!linkedCloneButtonCode) {
      alert("Gere o código primeiro usando o botão Criar Botão.");
      return;
    }

    const fileName = prompt("Digite o nome do arquivo (sem extensão):");
    if (!fileName) {
      alert("O nome do arquivo é obrigatório.");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}save-html`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: `${fileName}.html`, // Nome do arquivo com extensão
          content: linkedCloneButtonCode, // Conteúdo gerado
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao salvar no backend:", errorText);
        throw new Error("Erro ao salvar o arquivo no backend.");
      }

      alert("Arquivo salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar o arquivo:", error);
      alert("Erro ao salvar o arquivo. Verifique os logs.");
    }
  };

  // Hook para carregar a lista de VMs assim que o componente é montado
  useEffect(() => {
    fetchVMs();
  }, []);

  // Renderização do componente principal, incluindo os DataGrids e os botões de ação
  return (
    <Box m="20px">
      <Header
        title="Automação de Máquinas Virtuais"
        subtitle="Gerencie e Controle Suas VMs"
      />

      {/* Abas */}
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
          "& .MuiTab-root.Mui-selected": {
            color: "orange", // Define a cor do texto selecionado como laranja
          },
        }}
      >
        <Tab label="Máquinas Virtuais" />
        <Tab label="Linked Clones" />
      </Tabs>

      {/* Conteúdo da aba "Máquinas Virtuais" */}
      {activeTab === 0 && (
        <Box mt="20px">
          <Box
            height="40vh"
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
            {/* Primeiro DataGrid */}
            <DataGrid
              rows={vmList}
              columns={[
                { field: "id", headerName: "VM ID", width: 100 },
                { field: "name", headerName: "Nome", width: 200 },
                { field: "status", headerName: "Status", width: 120 },
              ]}
              checkboxSelection
              disableSelectionOnClick
              onSelectionModelChange={(ids) => {
                if (ids.length > 1) {
                  alert("Selecione apenas uma VM por vez.");
                  return;
                }
                const selectedId = ids[0];
                const vm = vmList.find((vm) => vm.id === selectedId);
                setSelectedVM(vm);
                if (vm) {
                  fetchSnapshots(vm.id, vm.node); // Buscar snapshots da VM
                }
              }}
            />
          </Box>
          {selectedVM && (
            <Box mt="20px">
              <h4 style={{ color: colors.primary[100] }}>
                Snapshots da VM Selecionada: {selectedVM.name} (ID:{" "}
                {selectedVM.id})
              </h4>
              <Box
                height="40vh"
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
                  rows={snapshotList}
                  columns={[
                    { field: "id", headerName: "Snapshot ID", width: 150 },
                    { field: "name", headerName: "Nome", width: 200 },
                    {
                      field: "description",
                      headerName: "Descrição",
                      width: 300,
                    },
                  ]}
                  checkboxSelection // Ativa os checkboxes
                  disableSelectionOnClick
                  selectionModel={selectedSnapshot ? [selectedSnapshot.id] : []} // Reflete o snapshot selecionado
                  onSelectionModelChange={(ids) => {
                    const selectedId = ids[0]; // Permite apenas uma seleção
                    const snapshot = snapshotList.find(
                      (snap) => snap.id === selectedId
                    );
                    setSelectedSnapshot(snapshot); // Atualizar o estado com o snapshot selecionado
                  }}
                />
              </Box>
            </Box>
          )}

          <Box mt="20px" display="flex" justifyContent="center" gap="20px">
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.greenAccent?.[600] || "#4caf50",
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                padding: "10px 20px",
                "&:hover": {
                  backgroundColor: colors.greenAccent?.[500] || "#43a047",
                },
              }}
              onClick={async () => {
                if (!selectedVM) {
                  alert("Selecione uma VM para criar um snapshot.");
                  return;
                }

                let snapshotName = prompt(
                  "Digite o nome do novo snapshot (somente caracteres alfanuméricos):"
                );

                if (!snapshotName) {
                  alert("O nome do snapshot é obrigatório.");
                  return;
                }

                // Validar o nome do snapshot
                snapshotName = snapshotName.trim();
                const isValidName = /^[a-zA-Z0-9-_]+$/.test(snapshotName); // Permite caracteres alfanuméricos, hífen e underscore
                if (!isValidName) {
                  alert(
                    "O nome do snapshot contém caracteres inválidos. Use apenas letras, números, hífen ou underscore."
                  );
                  return;
                }

                try {
                  const response = await fetch(
                    `${API_BASE_URL}/api2/json/nodes/${selectedVM.node}/qemu/${selectedVM.id}/snapshot`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
                      },
                      body: JSON.stringify({
                        snapname: snapshotName,
                        description: `Snapshot criado para a VM ${selectedVM.name}`,
                      }),
                    }
                  );

                  if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Erro ao criar snapshot:", errorText);
                    throw new Error("Erro ao criar snapshot.");
                  }

                  alert(`Snapshot "${snapshotName}" criado com sucesso!`);
                  // Atualiza a lista de snapshots
                  fetchSnapshots(selectedVM.id, selectedVM.node);
                } catch (error) {
                  console.error("Erro ao criar snapshot:", error);
                  alert("Erro ao criar snapshot. Verifique os logs.");
                }
              }}
            >
              CRIAR SNAPSHOT
            </Button>

            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.purpleAccent?.[600] || "#6a1b9a",
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                padding: "10px 20px",
                "&:hover": { backgroundColor: colors.purpleAccent?.[500] },
              }}
              onClick={createLinkedClone}
            >
              CRIAR CLONE
            </Button>
          </Box>
        </Box>
      )}

      {/* Conteúdo da aba "Linked Clones" */}
      {activeTab === 1 && (
        <Box mt="20px">
          <Box
            height="40vh"
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
            {/* Segundo DataGrid */}
            <DataGrid
              rows={linkedClones}
              columns={[
                { field: "id", headerName: "Clone ID", width: 100 },
                { field: "name", headerName: "Nome", width: 200 },
                { field: "status", headerName: "Status", width: 120 },
              ]}
              checkboxSelection
              disableSelectionOnClick
              onSelectionModelChange={(ids) => {
                setSelectedClones(ids);
              }}
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
              onClick={generateLinkedCloneButtonCode}
            >
              Criar Botão
            </Button>
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
              onClick={copyLinkedCloneButtonCode}
            >
              Copiar Código
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.orangeAccent?.[600] || "#ff9800",
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                padding: "10px 20px",
                "&:hover": { backgroundColor: colors.orangeAccent?.[500] },
              }}
              onClick={testGeneratedLinkedCloneCode}
            >
              Testar Código
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.redAccent?.[600] || "#d32f2f",
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                padding: "10px 20px",
                "&:hover": { backgroundColor: colors.redAccent?.[500] },
              }}
              onClick={saveGeneratedCode}
            >
              Salvar Código
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default VmAutomation;
