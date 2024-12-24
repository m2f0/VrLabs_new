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
  const [selectedClones, setSelectedClones] = useState([]); // Estado para clones selecionadosfgerencie
  const [buttonCode, setButtonCode] = useState("");
  const [isButtonGenerated, setIsButtonGenerated] = useState(false);
  const [linkedCloneButtonCode, setLinkedCloneButtonCode] = useState(""); // Código gerado para linked clones
  const [snapshotList, setSnapshotList] = useState([]); // Lista de snapshots das VMs
  const [selectedSnapshot, setSelectedSnapshot] = useState(null); // Snapshot selecionado
  const [activeTab, setActiveTab] = useState(0);

    // Variáveis do .env
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const API_TOKEN = process.env.REACT_APP_API_TOKEN; // Formato: `PVEAPIToken=apiuser@pve!apitoken=<TOKEN>`
    const API_USER = process.env.REACT_APP_API_USERNAME;
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;


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
          Authorization: API_TOKEN, // Certifique-se de que a variável no .env tem o formato correto
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Erro na API do Proxmox: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Mapeia as VMs recebidas e filtra com base no nome
    const allVMs = (data.data || []).map((vm) => ({
      id: vm.vmid,
      name: vm.name || "Sem Nome", // Evita que "undefined" cause erro
      status: vm.status || "Indisponível", // Tratamento de status indefinido
      node: vm.node || "Indefinido", // Tratamento de node indefinido
    }));

    // Filtrar VMs normais (excluindo aquelas com "CLONE" no nome)
    const normalVMs = allVMs.filter(
      (vm) => vm.name && !vm.name.includes("CLONE")
    );

    // Filtrar apenas linked clones (aqueles com "CLONE" no nome)
    const clones = allVMs.filter((vm) => vm.name && vm.name.includes("CLONE"));

    setVmList(normalVMs); // Atualiza o estado das VMs normais
    setLinkedClones(clones); // Atualiza o estado dos clones
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
            Authorization: API_TOKEN, // Certifique-se de que o formato do token no .env está correto
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
  const generateLinkedCloneButtonCode = async () => {
    if (!selectedVM || !selectedSnapshot) {
      alert("Selecione uma VM e um Snapshot antes de continuar.");
      return;
    }
  
    try {
      const newVmId = prompt("Digite o ID da nova VM (Linked Clone):");
      if (!newVmId) {
        alert("O ID da nova VM é obrigatório.");
        return;
      }
  
      const linkedCloneName = prompt("Digite o nome do Linked Clone:");
      if (!linkedCloneName) {
        alert("O nome do Linked Clone é obrigatório.");
        return;
      }
  
      const { id: vmId, node } = selectedVM;
      const { name: snapName } = selectedSnapshot;
  
      const code = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Automação de Linked Clone</title>
          <script src="https://vrlabs.nnovup.com.br/proxmox.js"></script>
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
              background-color: #2196F3;
              color: white;
              border-radius: 5px;
            }
            iframe {
            width: 90%;
            height: 90vh;
            border: none;
            margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Automação de Linked Clone</h1>
          <button class="button" onclick="automateLinkedClone('${vmId}', '${node}', '${snapName}', '${newVmId}', '${linkedCloneName}')">
            Criar, Iniciar e Conectar
          </button>
          <iframe id="vm-iframe" title="Console noVNC"></iframe>
          <script>
            async function automateLinkedClone(vmid, node, snapName, newVmId, linkedCloneName) {
              try {
                console.log('Criando Linked Clone...');
                const params = new URLSearchParams({
                  newid: newVmId,
                  name: linkedCloneName,
                  snapname: snapName,
                  full: "0"
                });
  
                const cloneResponse = await fetch(\`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${vmid}/clone\`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: API_TOKEN
                  },
                  body: params
                });
  
                if (!cloneResponse.ok) {
                  const errorText = await cloneResponse.text();
                  console.error('Erro ao criar Linked Clone:', errorText);
                  alert('Erro ao criar Linked Clone. Verifique os logs.');
                  return;
                }
  
                alert('Linked Clone criado com sucesso!');
                console.log('Aguardando 10 segundos...');
                await new Promise((resolve) => setTimeout(resolve, 10000));
  
                console.log('Iniciando Linked Clone...');
                const startResponse = await fetch(\`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${newVmId}/status/start\`, {
                  method: "POST",
                  headers: {
                    Authorization: API_TOKEN
                  }
                });
  
                if (!startResponse.ok) {
                  const errorText = await startResponse.text();
                  console.error('Erro ao iniciar Linked Clone:', errorText);
                  alert('Erro ao iniciar Linked Clone. Verifique os logs.');
                  return;
                }
  
                alert('Linked Clone iniciado com sucesso!');
                console.log('Aguardando mais 10 segundos...');
                await new Promise((resolve) => setTimeout(resolve, 10000));
  
                console.log('Conectando ao Linked Clone...');
                connectVM(newVmId, node);
              } catch (error) {
                console.error('Erro no processo de automação:', error);
                alert('Erro no processo de automação. Verifique os logs.');
              }
            }
          </script>
        </body>
        </html>
      `;
      setLinkedCloneButtonCode(code);
      alert("Código gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar código:", error);
      alert("Erro ao gerar o código. Verifique os logs.");
    }
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
    const { name: snapName } = selectedSnapshot; // Nome do snapshot válido
  
    // Solicitar o ID e o nome do clone ao usuário
    const newVmId = prompt("Digite o ID da nova VM (Linked Clone):");
    if (!newVmId) {
      alert("ID da nova VM é obrigatório.");
      return;
    }
  
    let cloneName = `${name}-CLONE-${newVmId}`; // Nome base do clone
    cloneName = cloneName
      .replace(/[^a-zA-Z0-9.-]/g, "") // Remove caracteres inválidos
      .replace(/^-+|-+$/g, "") // Remove hífens no início/fim
      .substring(0, 63); // Garante que o nome não ultrapasse 63 caracteres
  
    if (!/^[a-zA-Z0-9.-]+$/.test(cloneName)) {
      alert("Erro: Nome gerado para o clone é inválido.");
      return;
    }
  
    try {
      const body = new URLSearchParams({
        newid: newVmId,
        name: cloneName, // Nome sanitizado do clone
        snapname: snapName, // Nome do snapshot
        full: "0", // Certifique-se de enviar "0" como string
      });
  
      const response = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmId}/clone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: API_TOKEN,
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
  const saveGeneratedCode = () => {
    if (!linkedCloneButtonCode) {
      alert("Gere o código primeiro usando o botão Criar Botão.");
      return;
    }
  
    const fileName = prompt("Digite o nome do arquivo (sem extensão):", "linked_clone");
    if (!fileName) {
      alert("O nome do arquivo é obrigatório.");
      return;
    }
  
    try {
      // Criar um blob com o conteúdo do código HTML
      const blob = new Blob([linkedCloneButtonCode], { type: "text/html" });
  
      // Criar uma URL para o blob
      const url = URL.createObjectURL(blob);
  
      // Criar um elemento de ancoragem para forçar o download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.html`;
  
      // Acionar o clique no elemento
      a.click();
  
      // Limpar o objeto URL
      URL.revokeObjectURL(url);
  
      alert("Código salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar o código localmente:", error);
      alert("Erro ao salvar o código localmente. Verifique os logs.");
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
        subtitle="Gerencie e Controle a Automação de suas VMs"
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
      color: "orange",
    },
  }}
>
  <Tab label="1o. Máquinas Virtuais" />
  <Tab label="2o. SnapShots" />
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
            {/* Texto acima do DataGrid */}
            <Box mb="10px">
              <h3 style={{ color: colors.primary[100], textAlign: "left", fontWeight: "bold" }}>
                1o. Passo: Selecione uma vm
              </h3>
            </Box>
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
          

          
        </Box>
      )}

      {/* Conteúdo da aba "SnapShots" */}
      {activeTab === 1 && (
        <Box mt="20px">
          <Box mb="10px">
            <h3 style={{ color: colors.primary[100], textAlign: "left", fontWeight: "bold" }}>
              2o. Passo: Selecione um ou mais snapshots disponíveis para a VM selecionada
            </h3>
          </Box>
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
                { field: "description", headerName: "Descrição", width: 300 },
              ]}
              checkboxSelection
              disableSelectionOnClick
              selectionModel={selectedSnapshot ? [selectedSnapshot.id] : []}
              onSelectionModelChange={(ids) => {
                const selectedId = ids[0];
                const snapshot = snapshotList.find((snap) => snap.id === selectedId);
                setSelectedSnapshot(snapshot);
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
                    Criar Código
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
