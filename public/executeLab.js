(function () {
    // Essa função será chamada ao clicar no botão do Moodle
    window.executeLab = function (vmId, node, snapName) {
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Automação de Linked Clone</title>
            <script src="https://vrlabs.nnovup.com.br/moodle-utils.js"></script>
            <script src="https://vrlabs.nnovup.com.br/proxmox.js"></script>
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
                const API_BASE_URL = "https://mod.nnovup.com.br";
                const API_TOKEN = "Bearer <seu-token-aqui>";

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
        </head>
        <body onload="checkMoodleSession()">
            <h1>Automação de Linked Clone</h1>
            <button class="button" onclick="automateLinkedClone('${vmId}', '${node}', '${snapName}')">
                Criar laboratório
            </button>
            <div id="spinner"></div>
            <iframe id="vm-iframe" title="Console noVNC"></iframe>
        </body>
        </html>
        `;

        const newWindow = window.open("", "_blank");
        newWindow.document.open();
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    };
})();
