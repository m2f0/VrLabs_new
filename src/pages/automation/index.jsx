import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [vmList, setVmList] = useState([]);
  const [selectedVMs, setSelectedVMs] = useState([]);
  const [generatedHTML, setGeneratedHTML] = useState("");
  const [fileName, setFileName] = useState(""); // Novo estado para o nome do arquivo
  const [fileList, setFileList] = useState([]); // Lista de arquivos existentes
  const [selectedFile, setSelectedFile] = useState(""); // Arquivo selecionado
  const [embedCode, setEmbedCode] = useState(""); // Código do botão embutido

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

  const fetchFiles = async () => {
    try {
      const response = await fetch("https://jm7xgg-3000.csb.app/list-htmls");
      if (!response.ok) {
        throw new Error("Erro ao buscar a lista de arquivos.");
      }
      const data = await response.json();

      // Filtrar o arquivo script.js
      const filteredFiles = data.files.filter((file) => file !== "script.js");

      setFileList(filteredFiles); // Atualiza o estado com a lista filtrada
    } catch (error) {
      console.error("Erro ao buscar arquivos:", error);
      alert("Falha ao buscar os arquivos existentes.");
    }
  };

  const openFile = () => {
    if (!selectedFile) {
      alert("Selecione um arquivo para abrir.");
      return;
    }
    const fileUrl = `https://jm7xgg-3000.csb.app/HTMLs/${selectedFile}`; // URL do arquivo
    window.open(fileUrl, "_blank"); // Abre o arquivo em uma nova aba
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
        <title>Laboratórios</title>
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
        <script src="https://jm7xgg-3000.csb.app/HTMLs/script.js"></script>
      </head>
      <body>
        <h1>Gerenciador de VMs</h1>
        ${selectedVMs
          .map((vmId) => {
            const vm = vmList.find((vm) => vm.id === vmId);
            if (!vm) return ""; // Evita problemas com VMs inexistentes

            return `
            <div class="vm-container">
              <p>VM: ${vm.name} (ID: ${vm.id})</p>
              <div class="vm-buttons">
                <button onclick="createLab('${vm.id}', '${vm.node}', '${vm.name}')">Criar Laboratório</button>
                <button onclick="startVM('${vm.id}', '${vm.node}')">Start</button>
                <button onclick="stopVM('${vm.id}', '${vm.node}')">Stop</button>
                <button onclick="connectVM('${vm.id}', '${vm.node}')">Connect</button>
              </div>
            </div>
          `;
          })
          .join("")}
      </body>
      </html>
    `;

    setGeneratedHTML(html); // Atualiza o HTML gerado
  };

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
          filename: `${fileName}.html`, // Nome do arquivo com extensão .html
          content: generatedHTML, // Conteúdo do HTML gerado
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar o HTML no servidor.");
      }

      alert("HTML salvo com sucesso no servidor!");
    } catch (error) {
      console.error("Erro ao salvar o HTML:", error);
      alert("Erro ao salvar o HTML.");
    }
  };

  const deleteFile = async (fileName) => {
    const confirmDelete = window.confirm(
      `Tem certeza de que deseja excluir o arquivo "${fileName}"?`
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `https://jm7xgg-3000.csb.app/delete-html/${fileName}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Erro ao excluir o arquivo.");
      }

      alert(`Arquivo "${fileName}" excluído com sucesso.`);
      fetchFiles(); // Atualizar a lista de arquivos após exclusão
    } catch (error) {
      console.error("Erro ao excluir o arquivo:", error);
      alert("Erro ao excluir o arquivo.");
    }
  };

  // Função para abrir uma nova aba com o HTML gerado
  const openHTML = () => {
    const newWindow = window.open();
    newWindow.document.write(generatedHTML);
    newWindow.document.close();
  };

  useEffect(() => {
    fetchVMs();
    fetchFiles(); // Buscar arquivos existentes
  }, []);

  const columns = [
    { field: "id", headerName: "VM ID", width: 100 },
    { field: "name", headerName: "Nome", width: 200 },
    { field: "status", headerName: "Status", width: 150 },
    { field: "node", headerName: "Node", width: 150 },
  ];

  return (
    <Box m="20px">
      <Box mt="40px">
        <Header
          title="Arquivos HTML"
          subtitle="Gerencie seus arquivos gerados"
        />
        <Box
          m="8px 0 0 0"
          height="40vh"
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
            rows={fileList.map((file, index) => ({ id: index, name: file }))}
            columns={[
              {
                field: "name",
                headerName: "Nome do Arquivo",
                width: 300,
                renderCell: (params) => (
                  <Box display="flex" alignItems="center" gap="10px">
                    <Typography>{params.value}</Typography>
                    <DeleteForeverIcon
                      style={{ cursor: "pointer", color: "red" }}
                      onClick={() => deleteFile(params.value)}
                    />
                  </Box>
                ),
              },
            ]}
            checkboxSelection
            onSelectionModelChange={(ids) => {
              const selected = fileList[ids[0]];
              setSelectedFile(selected); // Atualiza o arquivo selecionado
            }}
          />
        </Box>
        <Box mt="20px" display="flex" justifyContent="center" gap="10px">
          <Button
            variant="contained"
            style={{
              backgroundColor: colors.blueAccent[700],
              color: "white",
            }}
            onClick={openFile}
          >
            Abrir Arquivo
          </Button>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header
          title="Automação de Máquinas Virtuais"
          subtitle="Gerencie e Controle Suas VMs"
        />
      </Box>
      <Box
        m="8px 0 0 0"
        height="40vh"
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

      <Box
        mt="20px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap="10px"
      >
        <Button
          variant="contained"
          style={{
            backgroundColor: colors.blueAccent[700],
            color: "white",
          }}
          onClick={generateHTML}
        >
          Auto
        </Button>
        {embedCode && (
          <Box mt="20px">
            <Typography variant="h6">Código do Botão Embutido:</Typography>
            <textarea
              style={{ width: "100%", height: "100px" }}
              value={embedCode}
              readOnly
            />
          </Box>
        )}

        {generatedHTML && (
          <>
            <Button
              variant="contained"
              style={{
                backgroundColor: colors.blueAccent[700],
                color: "white",
              }}
              onClick={openHTML}
            >
              Abrir HTML
            </Button>
            <input
              type="text"
              placeholder="Digite o nome do arquivo"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              style={{
                padding: "10px",
                fontSize: "16px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                flex: "1",
              }}
            />
            <Button
              variant="contained"
              style={{
                backgroundColor: colors.blueAccent[700],
                color: "white",
              }}
              onClick={saveHTML}
            >
              Gravar
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Team;
