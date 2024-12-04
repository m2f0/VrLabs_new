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
  const [linkedClones, setLinkedClones] = useState([]);
  const [selectedVM, setSelectedVM] = useState(null);
  const [selectedClones, setSelectedClones] = useState([]); // Estado para clones selecionados
  const [buttonCode, setButtonCode] = useState("");
  const [isButtonGenerated, setIsButtonGenerated] = useState(false);
  const [linkedCloneButtonCode, setLinkedCloneButtonCode] = useState(""); // Código gerado para linked clones

  const API_TOKEN = "58fc95f1-afc7-47e6-8b7a-31e6971062ca";
  const API_USER = "apiuser@pve";
  const API_BASE_URL = "https://prox.nnovup.com.br";

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

  // Função para gerar o código HTML do botão que inicia os linked clones selecionados
  const generateLinkedCloneButtonCode = () => {
    if (selectedClones.length === 0) {
      alert("Selecione pelo menos um Linked Clone para gerar o botão.");
      return;
    }

    const buttons = selectedClones
      .map((cloneId) => {
        const clone = linkedClones.find((lc) => lc.id === cloneId);
        if (!clone) return "";

        return `
          <button onclick="startLinkedClone('${clone.id}', '${clone.node}', '${clone.name}')">
            Iniciar ${clone.name}
          </button>
          <script>
            async function startLinkedClone(vmid, node, name) {
              try {
                const response = await fetch(\`https://prox.nnovup.com.br/api2/json/nodes/\${node}/qemu/\${vmid}/status/start\`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "PVEAPIToken=apiuser@pve!apitoken=58fc95f1-afc7-47e6-8b7a-31e6971062ca",
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
          </script>
        `;
      })
      .join("\n");

    const code = `
      <!-- Botões para iniciar Linked Clones -->
      <div>
        ${buttons}
      </div>
    `;

    setLinkedCloneButtonCode(code);
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

  // Função para testar o código gerado para linked clones, abrindo-o em uma nova aba
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
        </head>
        <body>
          ${linkedCloneButtonCode}
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

  // Função para criar um linked clone diretamente da VM selecionada
  const createLinkedClone = async () => {
    if (!selectedVM) {
      alert("Selecione uma VM para criar um Linked Clone.");
      return;
    }

    const { id, node, name } = selectedVM;
    const newVmId = prompt("Digite o ID da nova VM (Linked Clone):");
    if (!newVmId) {
      alert("ID da nova VM é obrigatório.");
      return;
    }

    try {
      const body = new URLSearchParams({
        newid: newVmId,
        name: `${name}-lab-${newVmId}`,
        snapname: "SNAP_1",
        full: "0", // Certifique-se de enviar "0" como string
      });

      const response = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${id}/clone`,
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

      <Box
        m="20px 0"
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
          }}
        />
      </Box>

      <Box mt="20px" display="flex" justifyContent="center" gap="20px">
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.purpleAccent?.[600] || "#6a1b9a", // Cor personalizada
            color: "white",
            fontWeight: "bold",
            fontSize: "16px",
            padding: "10px 20px",
            "&:hover": {
              backgroundColor: colors.purpleAccent?.[500] || "#4a148c",
            },
          }}
          onClick={createLinkedClone}
        >
          CRIAR CLONE
        </Button>

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
          onClick={generateButtonCode}
        >
          AUTO
        </Button>
      </Box>

      <Box mt="20px" display="flex" justifyContent="center" gap="20px">
        {isButtonGenerated && (
          <>
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
              onClick={copyToClipboard}
            >
              COPIAR
            </Button>

            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.redAccent[600],
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                padding: "10px 20px",
                "&:hover": { backgroundColor: colors.redAccent[500] },
              }}
              onClick={testGeneratedCode}
            >
              TESTAR
            </Button>
          </>
        )}
      </Box>

      {isButtonGenerated && (
        <Box mt="20px">
          <textarea
            value={buttonCode}
            readOnly
            style={{
              width: "100%",
              height: "200px",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          />
        </Box>
      )}

      <Box mt="20px">
        <h3 style={{ color: colors.primary[100] }}>Linked Clones</h3>
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
            rows={linkedClones}
            columns={[
              { field: "id", headerName: "Clone ID", width: 100 },
              { field: "name", headerName: "Nome", width: 200 },
              { field: "status", headerName: "Status", width: 120 },
            ]}
            checkboxSelection
            disableSelectionOnClick
            onSelectionModelChange={(ids) => {
              setSelectedClones(ids); // Atualiza os clones selecionados
            }}
          />
        </Box>

        {/* Botões abaixo do DataGrid */}
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
              backgroundColor: colors.redAccent[600],
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              padding: "10px 20px",
              "&:hover": { backgroundColor: colors.redAccent[500] },
            }}
            onClick={testLinkedCloneButtonCode}
          >
            TESTAR
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default VmAutomation;
