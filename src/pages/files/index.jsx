import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material/styles";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

const HtmlFiles = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [fileList, setFileList] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");

  const fetchFiles = async () => {
    try {
      const response = await fetch("https://fq5n66-3000.csb.app/list-htmls");
      if (!response.ok) {
        throw new Error("Erro ao buscar a lista de arquivos.");
      }
      const data = await response.json();

      const filteredFiles = data.files.filter((file) => file !== "script.js");
      setFileList(filteredFiles);
    } catch (error) {
      console.error("Erro ao buscar arquivos:", error);
      alert("Falha ao buscar os arquivos existentes.");
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

  const openFile = () => {
    if (!selectedFile) {
      alert("Selecione um arquivo para abrir.");
      return;
    }
    const fileUrl = `https://jm7xgg-3000.csb.app/HTMLs/${selectedFile}`;
    window.open(fileUrl, "_blank");
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <Box m="20px">
      <Header title="Arquivos HTML" subtitle="Gerencie seus arquivos gerados" />
      <Box
        m="8px 0 0 0"
        height="60vh"
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
            setSelectedFile(selected);
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
  );
};

export default HtmlFiles;
