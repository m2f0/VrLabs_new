root@mod:/home/user/htdocs/mod.nnovup.com.br/local/easyit_cyberarena# cat create_lab.php
<?php
// Verifica se os parâmetros necessários estão presentes
if (!isset($_GET['vmid']) || !isset($_GET['node']) || !isset($_GET['snapshot'])) {
    die('Parâmetros inválidos. Certifique-se de fornecer vmid, node e snapshot.');
}

// Obtém os parâmetros da URL
$vmid = htmlspecialchars($_GET['vmid']);
$node = htmlspecialchars($_GET['node']);
$snapshot = htmlspecialchars($_GET['snapshot']);
?>
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
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    <script>
        // Define as variáveis globais uma única vez
//        const API_BASE_URL = "https://mod.nnovup.com.br";
//        const API_TOKEN = "Bearer <seu-token-aqui>";

        // Função para verificar sessão no Moodle
        async function checkMoodleSession() {
            try {
                const user = await fetchUserInfo();
                console.log('Usuário autenticado:', user);

                // Armazena as informações do usuário globalmente
                window.studentName = `${user.firstname} ${user.lastname}`;
                window.studentId = user.id;

                // Chama a função de automação após a sessão ser validada
                automateLinkedClone('<?php echo $vmid; ?>', '<?php echo $node; ?>', '<?php echo $snapshot; ?>');
            } catch (error) {
                alert('Usuário não autenticado no Moodle. Redirecionando para a página de login.');
                window.location.href = '/login/index.php';
            }
        }

        // Função para criar e conectar ao Linked Clone
        async function automateLinkedClone(vmid, node, snapshot) {
            const spinner = document.getElementById('spinner');
            const iframe = document.getElementById('vm-iframe');

            // Valida se os dados do usuário foram carregados corretamente
            if (!window.studentName || !window.studentId) {
                alert("Erro ao obter os dados do usuário. Por favor, recarregue a página.");
                return;
            }

            const newVmId = Math.floor(Math.random() * (90000 - 50000 + 1)) + 50000;
            const sanitizedStudentName = window.studentName.replace(/[^a-zA-Z0-9-]/g, "").substring(0, 20);
            const linkedCloneName = `${window.studentId}-${sanitizedStudentName}-Lab-${newVmId}`;

            try {
                spinner.style.display = 'block';

                // Envia a solicitação para criar o Linked Clone
                const params = new URLSearchParams({
                    newid: newVmId,
                    name: linkedCloneName,
                    snapname: snapshot,
                    full: "0"
                });

                const cloneResponse = await fetch(`${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/clone`, {
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
                await new Promise(resolve => setTimeout(resolve, 20000));

                // Envia a solicitação para iniciar o Linked Clone
                const startResponse = await fetch(`${API_BASE_URL}/api2/json/nodes/${node}/qemu/${newVmId}/status/start`, {
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

                console.log('Linked Clone iniciado com sucesso.');
                await new Promise(resolve => setTimeout(resolve, 20000));

                // Obter o ticket VNC e o port
                const vncResponse = await fetch(`${API_BASE_URL}/api2/json/nodes/${node}/qemu/${newVmId}/vncproxy`, {
                        method: "POST",
                        headers: {
                                Authorization: API_TOKEN
                        }
                });

                if (!vncResponse.ok) {
                        const errorText = await vncResponse.text();
                        console.error('Erro ao obter VNC Ticket:', errorText);
                return;
                }

                const vncData = await vncResponse.json();
                const vncticket = vncData.data.ticket;
                const port = vncData.data.port;

                // Construir a URL correta do noVNC
                iframe.src = `${API_BASE_URL}/?console=kvm&novnc=1&node=${node}&resize=1&vmid=${newVmId}&path=api2/json/nodes/${node}/qemu/${newVmId}/vncwebsocket/port/${port}/vncticket/${encodeURIComponent(vncticket)}`;
                iframe.style.display = "block";


                // iframe.src = `${API_BASE_URL}/novnc/?vmid=${newVmId}&node=${node}`;
               //  iframe.style.display = "block";

            } catch (error) {
                console.error('Erro no processo de automação:', error);
            } finally {
                spinner.style.display = 'none';
            }
        }

        // Chama a função de verificação de sessão ao carregar a página
        window.onload = checkMoodleSession;
    </script>
</head>
<body>
    <h1>Automação de Linked Clone</h1>
    <div id="spinner"></div>
    <iframe id="vm-iframe" title="Console noVNC"></iframe>
</body>
</html>
root@mod:/home/user/htdocs/mod.nnovup.com.br/local/easyit_cyberarena#
