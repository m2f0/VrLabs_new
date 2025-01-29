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
  const [selectedClones, setSelectedClones] = useState([]);
  const [buttonCode, setButtonCode] = useState("");
  const [isButtonGenerated, setIsButtonGenerated] = useState(false);
  const [linkedCloneButtonCode, setLinkedCloneButtonCode] = useState("");
  const [snapshotList, setSnapshotList] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showSaveButton, setShowSaveButton] = useState(false); // Estado para controlar a exibição do botão "SALVAR"
  const [selectedVMs, setSelectedVMs] = useState([]); // Armazena múltiplas VMs selecionadas
  const [snapshotsByVM, setSnapshotsByVM] = useState([]); // Snapshots agrupados por VM
  const [selectedSnapshots, setSelectedSnapshots] = useState([]); // Snapshots selecionados




  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const API_TOKEN = process.env.REACT_APP_API_TOKEN;
  const API_USER = process.env.REACT_APP_API_USERNAME;
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  
    if (newValue === 3) {
      // Aba "Snapshots Selecionados"
      fetchSnapshotsForSelectedVMs();
    }
  };
  

  const fetchVMs = async () => {
    try {
      // First, get authentication ticket
      const ticketResponse = await fetch(
        `${API_BASE_URL}/api2/json/access/ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: API_USER,
            password: process.env.REACT_APP_API_PASSWORD,
          }),
        }
      );

      if (!ticketResponse.ok) {
        throw new Error(`Failed to get authentication ticket: ${ticketResponse.status}`);
      }

      const ticketData = await ticketResponse.json();
      const authTicket = ticketData.data.ticket;
      const csrfToken = ticketData.data.CSRFPreventionToken;

      // Then fetch VMs with proper authentication
      const response = await fetch(
        `${API_BASE_URL}/api2/json/cluster/resources?type=vm`,
        {
          method: "GET",
          headers: {
            "Authorization": `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
            "CSRFPreventionToken": csrfToken,
            "Cookie": `PVEAuthCookie=${authTicket}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API do Proxmox: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      const allVMs = (data.data || []).map((vm) => ({
        id: vm.vmid,
        name: vm.name || "Sem Nome",
        status: vm.status || "Indisponível",
        node: vm.node || "Indefinido",
        type: vm.type || "qemu",
      }));

      setVmList(allVMs);
    } catch (error) {
      console.error("Erro ao buscar lista de VMs:", error);
      alert("Falha ao buscar as VMs. Verifique o console para mais detalhes.");
    }
  };
  

  const fetchSnapshots = async (vmid, node, type) => {
    if (type !== "qemu") {
      console.warn(`Snapshots não suportados para o tipo: ${type}`);
      return;
    }

    try {
      // First, get authentication ticket
      const ticketResponse = await fetch(
        `${API_BASE_URL}/api2/json/access/ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: API_USER,
            password: process.env.REACT_APP_API_PASSWORD,
          }),
        }
      );

      if (!ticketResponse.ok) {
        throw new Error(`Failed to get authentication ticket: ${ticketResponse.status}`);
      }

      const ticketData = await ticketResponse.json();
      const authTicket = ticketData.data.ticket;
      const csrfToken = ticketData.data.CSRFPreventionToken;

      const endpoint = `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/snapshot`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
          "CSRFPreventionToken": csrfToken,
          "Cookie": `PVEAuthCookie=${authTicket}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(
          `Erro ao buscar snapshots: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      const snapshots = (data.data || [])
        .filter((snap) => snap.name !== "current")
        .map((snap) => ({
          id: `${vmid}-${snap.name}`,
          vmid,
          name: snap.name || "Sem Nome",
          description: snap.description || "Sem Descrição",
        }));

      setSnapshotList(snapshots);
    } catch (error) {
      console.error("Erro ao buscar snapshots:", error);
    }
  };
  
  

  const fetchSnapshotsForSelectedVMs = async () => {
    console.log("Fetching snapshots for VMs:", selectedVMs);
    
    if (!selectedVMs || selectedVMs.length === 0) {
      console.log("No VMs selected");
      setSnapshotsByVM([]);
      return;
    }

    try {
      const ticketResponse = await fetch(
        `${API_BASE_URL}/api2/json/access/ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: API_USER,
            password: process.env.REACT_APP_API_PASSWORD,
          }),
        }
      );

      if (!ticketResponse.ok) {
        throw new Error(`Failed to get authentication ticket: ${ticketResponse.status}`);
      }

      const ticketData = await ticketResponse.json();
      const authTicket = ticketData.data.ticket;
      const csrfToken = ticketData.data.CSRFPreventionToken;

      const snapshotPromises = selectedVMs.map(async (vm) => {
        try {
          if (vm.type !== "qemu" && vm.type !== "lxc") {
            console.warn(`Tipo de VM não suportado: ${vm.type} para VM ${vm.name}`);
            return null;
          }

          const endpoint = `${API_BASE_URL}/api2/json/nodes/${vm.node}/${vm.type}/${vm.id}/snapshot`;
          
          const response = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Authorization": `PVEAPIToken=${API_USER}!apitoken=${API_TOKEN}`,
              "CSRFPreventionToken": csrfToken,
              "Cookie": `PVEAuthCookie=${authTicket}`,
            },
            credentials: 'include',
          });

          if (!response.ok) {
            console.warn(`Snapshots não disponíveis para VM ${vm.name}: ${response.statusText}`);
            return null;
          }

          const data = await response.json();
          return {
            vmId: vm.id,
            vmName: vm.name,
            snapshots: (data.data || [])
              .filter(snap => snap.name !== "current")
              .map(snap => ({
                id: `${vm.id}-${snap.name}`,
                vmId: vm.id,
                vmName: vm.name,
                name: snap.name || "Sem Nome",
                description: snap.description || "Sem Descrição",
              }))
          };
        } catch (error) {
          console.error(`Erro ao buscar snapshots para VM ${vm.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(snapshotPromises);
      const validResults = results.filter(result => result !== null && result.snapshots.length > 0);
      
      console.log("Final snapshot results:", validResults);
      setSnapshotsByVM(validResults);
    } catch (error) {
      console.error("Erro ao buscar snapshots:", error);
      alert("Falha ao buscar snapshots. Verifique o console.");
    }
  };
  
  
  
  

  const generateSingleButtonCode = async () => {
    if (!selectedVM || !selectedSnapshot) {
        alert("Selecione uma VM e um Snapshot antes de continuar.");
        return;
    }

    try {
        const { id: vmId, node } = selectedVM;
        const { name: snapName } = selectedSnapshot;

        const buttonCode = `
<p>
  <a
    href="/local/easyit_cyberarena/create_lab.php?vmid=${vmId}&node=${node}&snapshot=${snapName}"
    target="_blank"
    style="margin: 10px; padding: 10px 20px; font-size: 16px; border: none; cursor: pointer; background-color: #2196f3; color: white; border-radius: 5px; text-decoration: none;"
  >
    Criar laboratório
  </a>
</p>
        `;

        navigator.clipboard.writeText(buttonCode).then(() => {
            alert("Código do botão copiado para a área de transferência!");
        }).catch(err => {
            console.error("Erro ao copiar o código:", err);
            alert("Erro ao copiar o código. Verifique os logs.");
        });

        console.log("Código gerado com sucesso:", buttonCode);
    } catch (error) {
        console.error("Erro ao gerar o botão:", error);
    }
};








  


  const generateLinkedCloneButtonCode = async () => {
    if (!selectedVM || !selectedSnapshot) {
        alert("Selecione uma VM e um Snapshot antes de continuar.");
        return;
    }

    try {
        const { id: vmId, node } = selectedVM;
        const { name: snapName } = selectedSnapshot;

        const code = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Automação de Linked Clone</title>
            <script src="https://vrlabs.cecyber.com/moodle-utils.js"></script>
            <script src="https://vrlabs.cecyber.com/proxmox.js"></script>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f9;
                    color: #333;
                    text-align: center;
                    padding: 20px;
                    margin: 0;
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
                #spinner {
                    display: none;
                    margin: 20px auto;
                    border: 8px solid #f3f3f3;
                    border-top: 8px solid #3498db;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    animation: spin 2s linear infinite;
                }
                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
            </style>
            <script>
                const API_BASE_URL = "https://mod.nnovup.com.br"; // Define a URL base da API
                const API_TOKEN = "Bearer <seu-token-aqui>"; // Adicione seu token de autenticação
            </script>
        </head>
        <body onload="checkMoodleSession()">
            <h1>Automação de Linked Clone</h1>
            <button class="button" onclick="automateLinkedClone('${vmId}', '${node}', '${snapName}')">
                Criar laboratório
            </button>
            <div id="spinner"></div>
            <iframe id="vm-iframe" title="Console noVNC"></iframe>
            <script>
                async function checkMoodleSession() {
                    try {
                        const user = await fetchUserInfo();
                        console.log('Usuário autenticado:', user);

                        window.studentName = \`\${user.firstname} \${user.lastname}\`;
                        window.studentId = user.id;
                    } catch (error) {
                        alert('Usuário não autenticado no Moodle. Redirecionando para a página de login.');
                        window.location.href = '/login/index.php';
                    }
                }

                async function automateLinkedClone(vmid, node, snapName) {
                    const spinner = document.getElementById('spinner');
                    const iframe = document.getElementById('vm-iframe');

                    if (!window.studentName || !window.studentId) {
                        alert("Erro ao obter os dados do usuário. Por favor, recarregue a página.");
                        return;
                    }

                    const newVmId = Math.floor(Math.random() * (90000 - 50000 + 1)) + 50000;
                    const sanitizedStudentName = window.studentName.replace(/[^a-zA-Z0-9-]/g, "").substring(0, 20);
                    const linkedCloneName = \`\${window.studentId}-\${sanitizedStudentName}-Lab-\${newVmId}\`;

                    try {
                        spinner.style.display = 'block';
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
                            return;
                        }

                        console.log('Linked Clone criado com sucesso.');
                        await new Promise((resolve) => setTimeout(resolve, 10000));

                        const startResponse = await fetch(\`\${API_BASE_URL}/api2/json/nodes/\${node}/qemu/\${newVmId}/status/start\`, {
                            method: "POST",
                            headers: {
                                Authorization: API_TOKEN
                            }
                        });

                        if (!startResponse.ok) {
                            const errorText = await startResponse.text();
                            console.error('Erro ao iniciar Linked Clone:', errorText);
                            return;
                        }

                        iframe.style.display = 'block';
                        connectVM(newVmId, node);
                    } catch (error) {
                        console.error('Erro no processo de automação:', error);
                    } finally {
                        spinner.style.display = 'none';
                    }
                }
            </script>
        </body>
        </html>
        `;

        setLinkedCloneButtonCode(code);
        setShowSaveButton(true); // Exibe o botão "SALVAR" após gerar o código
        console.log("Código gerado com sucesso.");
    } catch (error) {
        console.error("Erro ao gerar código:", error);
    }
};

  
  
  

  const copyToClipboard = () => {
    navigator.clipboard.writeText(buttonCode).then(() => {
      alert("Código do botão copiado para a área de transferência!");
    });
  };


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
    const { name: snapName } = selectedSnapshot;

    const newVmId = prompt("Digite o ID da nova VM (Linked Clone):");
    if (!newVmId) {
      alert("ID da nova VM é obrigatório.");
      return;
    }

    let cloneName = `${name}-CLONE-${newVmId}`;
    cloneName = cloneName
      .replace(/[^a-zA-Z0-9.-]/g, "")
      .replace(/^-+|-+$/g, "")
      .substring(0, 63);

    if (!/^[a-zA-Z0-9.-]+$/.test(cloneName)) {
      alert("Erro: Nome gerado para o clone é inválido.");
      return;
    }

    try {
      const body = new URLSearchParams({
        newid: newVmId,
        name: cloneName,
        snapname: snapName,
        full: "0",
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
        const errorText = await response.text();
        console.error("Erro no Proxmox:", errorText);
        throw new Error("Erro ao criar Linked Clone.");
      }

      alert("Linked Clone criado com sucesso!");
      fetchVMs();
    } catch (error) {
      console.error("Erro ao criar Linked Clone:", error);
      alert("Erro ao criar Linked Clone. Verifique os logs.");
    }
  };

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

  const saveGeneratedCode = () => {
    

    const fileName = prompt("Digite o nome do arquivo (sem extensão):", "linked_clone");
    if (!fileName) {
      alert("O nome do arquivo é obrigatório.");
      return;
    }

    try {
      const blob = new Blob([linkedCloneButtonCode], { type: "text/html" });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.html`;

      a.click();

      URL.revokeObjectURL(url);

      alert("Código salvo com sucesso!");
      setShowSaveButton(false); // Oculta o botão "SALVAR" após salvar o código
    } catch (error) {
      console.error("Erro ao salvar o código localmente:", error);
      alert("Erro ao salvar o código localmente. Verifique os logs.");
    }
  };

  useEffect(() => {
    fetchVMs();
  }, []);

  useEffect(() => {
    if (selectedVMs.length > 0) {
      console.log("Selected VMs changed:", selectedVMs);
      fetchSnapshotsForSelectedVMs();
    } else {
      setSnapshotsByVM([]);
    }
  }, [selectedVMs]);

  return (
    <Box m="20px">
      <Header
        title="Automação de Máquinas Virtuais"
        subtitle="Gerencie e Controle a Automação de suas VMs"
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
          "& .MuiTab-root.Mui-selected": {
            color: "orange",
          },
        }}
      >
        <Tab label="3o. Selecionar VMs" />
        <Tab label="4o. Multiplos Snapshots" />


      </Tabs>

      
      {activeTab === 0 && ( // Nova aba
  <Box mt="20px">
    <Box
      height="150vh"
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
      <h3 style={{ color: colors.primary[100], fontWeight: "bold" }}>
        1o. Passo: Selecione uma ou mais VMs
      </h3>
      <DataGrid
  rows={vmList}
  columns={[
    { field: "id", headerName: "VM ID", width: 100 },
    { field: "name", headerName: "Nome", width: 200 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "node", headerName: "Node", width: 120 },
    { field: "type", headerName: "Type", width: 120 },
  ]}
  checkboxSelection
  disableSelectionOnClick
  selectionModel={selectedVMs.map(vm => vm.id)}
  onSelectionModelChange={(newSelectionModel) => {
    const selectedVMsList = vmList.filter(vm => newSelectionModel.includes(vm.id));
    console.log("New selection:", selectedVMsList);
    setSelectedVMs(selectedVMsList);
  }}
/>


    </Box>
  </Box>
)}
{activeTab === 1 && (
  <Box mt="20px">
    <Box
      height="150vh"
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
      <h3 style={{ color: colors.primary[100], fontWeight: "bold" }}>
        2o. Passo: Selecione os snapshots das VMs selecionadas
      </h3>
      <DataGrid
        rows={snapshotsByVM.flatMap((group) => group.snapshots)}
        columns={[
          { field: "vmName", headerName: "VM", width: 200 },
          { field: "name", headerName: "Snapshot", width: 200 },
          { field: "description", headerName: "Descrição", width: 300 },
        ]}
        checkboxSelection
        disableSelectionOnClick
        onSelectionModelChange={(ids) => {
          const selected = snapshotsByVM
            .flatMap((group) => group.snapshots)
            .filter((snap) => ids.includes(snap.id));
          setSelectedSnapshots(selected);
          console.log("Snapshots selecionados:", selected);
        }}
      />
    </Box>
  </Box>
)}



    </Box>
  );
};

export default VmAutomation;
