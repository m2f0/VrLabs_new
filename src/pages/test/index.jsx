import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import Header from "../../components/Header";

const VmAutomation = () => {
  const [consoleUrl, setConsoleUrl] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const API_TOKEN = process.env.REACT_APP_API_TOKEN; // Certifique-se de que o token esteja correto
  const TEMPLATE_ID = 100; // Substitua pelo ID do template no Proxmox
  const NODE_NAME = "nome-do-node"; // Substitua pelo nome do node no Proxmox

  // Função para criar um linked clone
  const createLinkedClone = async () => {
    try {
      const newVmId = Math.floor(Math.random() * 10000); // Gera um ID único para a VM
      const cloneName = `auto-clone-${newVmId}`;

      // Faz a requisição para criar o clone
      const cloneResponse = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${NODE_NAME}/qemu/${TEMPLATE_ID}/clone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: API_TOKEN,
          },
          body: new URLSearchParams({
            newid: newVmId,
            name: cloneName,
            full: "0", // Linked Clone
          }),
        }
      );

      if (!cloneResponse.ok) {
        const error = await cloneResponse.text();
        throw new Error(`Erro ao criar o clone: ${error}`);
      }

      console.log(`Linked Clone criado: ${cloneName} (ID: ${newVmId})`);
      await startVM(newVmId, cloneName); // Inicia a VM após a criação
    } catch (error) {
      console.error("Erro ao criar Linked Clone:", error);
    }
  };

  // Função para iniciar a VM
  const startVM = async (vmId, vmName) => {
    try {
      const startResponse = await fetch(
        `${API_BASE_URL}/api2/json/nodes/${NODE_NAME}/qemu/${vmId}/status/start`,
        {
          method: "POST",
          headers: {
            Authorization: API_TOKEN,
          },
        }
      );

      if (!startResponse.ok) {
        const error = await startResponse.text();
        throw new Error(`Erro ao iniciar a VM: ${error}`);
      }

      console.log(`VM ${vmName} (ID: ${vmId}) iniciada com sucesso!`);
      generateConsoleLink(vmId); // Gera o link para o console após iniciar a VM
    } catch (error) {
      console.error("Erro ao iniciar a VM:", error);
    }
  };

  // Função para gerar o link do console
  const generateConsoleLink = (vmId) => {
    const url = `${API_BASE_URL}/?console=kvm&novnc=1&vmid=${vmId}&node=${NODE_NAME}`;
    setConsoleUrl(url);
    console.log(`Link do console gerado: ${url}`);
  };

  // Hook para executar a automação automaticamente ao carregar a página
  useEffect(() => {
    createLinkedClone();
  }, []);

  return (
    <Box m="20px">
      <Header
        title="Automação de Máquinas Virtuais"
        subtitle="Processo automático de criação, inicialização e conexão"
      />
      {consoleUrl ? (
        <Box mt="20px">
          <h2>Console da VM</h2>
          <a href={consoleUrl} target="_blank" rel="noopener noreferrer">
            Acessar Console da VM
          </a>
        </Box>
      ) : (
        <Box mt="20px">
          <h2>Processando...</h2>
          <p>Por favor, aguarde enquanto a máquina virtual está sendo configurada.</p>
        </Box>
      )}
    </Box>
  );
};

export default VmAutomation;
