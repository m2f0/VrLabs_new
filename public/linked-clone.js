// linked-clone.js
(async function () {
    // Obtém os parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const vmid = urlParams.get("vmid");
    const node = urlParams.get("node");
    const snapshot = urlParams.get("snapshot");

    // Verifica se os parâmetros necessários estão presentes
    if (!vmid || !node || !snapshot) {
        alert("Parâmetros inválidos ou ausentes. Verifique o link.");
        return;
    }

    // Configurações do ambiente
    const API_BASE_URL = "https://mod.nnovup.com.br";
    const API_TOKEN = "Bearer <seu-token-aqui>";

    // Função para criar, iniciar e conectar a um Linked Clone
    async function automateLinkedClone(vmid, node, snapshot) {
        const spinner = document.getElementById('spinner');
        const iframe = document.getElementById('vm-iframe');

        try {
            // Mostra o spinner de carregamento
            spinner.style.display = "block";

            // Gera um ID aleatório para a nova VM
            const newVmId = Math.floor(Math.random() * (90000 - 50000 + 1)) + 50000;
            const linkedCloneName = `Lab-${newVmId}`;

            // Etapa 1: Cria o Linked Clone
            const params = new URLSearchParams({
                newid: newVmId,
                name: linkedCloneName,
                snapname: snapshot,
                full: "0",
            });

            const cloneResponse = await fetch(
                `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/clone`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: API_TOKEN,
                    },
                    body: params,
                }
            );

            if (!cloneResponse.ok) {
                throw new Error("Erro ao criar Linked Clone.");
            }

            // Espera alguns segundos para garantir que a VM foi criada
            await new Promise((resolve) => setTimeout(resolve, 10000));

            // Etapa 2: Inicia a VM
            const startResponse = await fetch(
                `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${newVmId}/status/start`,
                {
                    method: "POST",
                    headers: {
                        Authorization: API_TOKEN,
                    },
                }
            );

            if (!startResponse.ok) {
                throw new Error("Erro ao iniciar Linked Clone.");
            }

            // Etapa 3: Conecta à VM (via iframe ou nova aba)
            iframe.src = `${API_BASE_URL}/novnc/?vmid=${newVmId}&node=${node}`;
            iframe.style.display = "block";
        } catch (error) {
            console.error("Erro no processo de automação:", error);
            alert("Erro no processo de automação. Verifique os logs.");
        } finally {
            // Esconde o spinner
            spinner.style.display = "none";
        }
    }

    // Cria os elementos da página
    document.body.innerHTML = `
        <h1>Automação de Linked Clone</h1>
        <div id="spinner" style="display:none; margin: 20px auto; border: 8px solid #f3f3f3; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 2s linear infinite;"></div>
        <iframe id="vm-iframe" title="Console noVNC" style="width: 90%; height: 90vh; border: none; margin-top: 20px; display:none;"></iframe>
    `;

    // Executa a automação
    await automateLinkedClone(vmid, node, snapshot);
})();
