const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_TOKEN = process.env.REACT_APP_API_TOKEN;
const API_USERNAME = process.env.REACT_APP_API_USERNAME;
const API_PASSWORD = process.env.REACT_APP_API_PASSWORD;


const vmList = [
  { id: "3100", node: "prox", name: "VM-3100" },
];

// Função para renovar o ticket
async function renewTicket() {
  try {
    const response = await fetch(`${API_BASE_URL}/api2/json/access/ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: API_USERNAME,
        password: API_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao renovar o ticket: ${response.statusText}`);
    }

    const data = await response.json();
    const ticket = data.data.ticket;
    document.cookie = `PVEAuthCookie=${ticket}; path=/; Secure; SameSite=None; Domain=.nnovup.com.br`;
    return ticket;
  } catch (error) {
    console.error("Erro ao renovar o ticket:", error);
    alert("Falha ao renovar o ticket. Verifique o console.");
    throw error;
  }
}

// Função para conectar à VM
async function connectVM(vmid, node) {
  try {
    console.log(`[connectVM] Conectando à VM ${vmid} no node ${node}`);
    const ticket = await renewTicket();

    const response = await fetch(`${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`, {
      method: "POST",
      headers: {
        Authorization: API_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao conectar à VM: ${response.statusText}`);
    }

    const vncProxyData = await response.json();
    const { ticket: vncTicket, port } = vncProxyData.data;

    const noVNCUrl = `${API_BASE_URL}/?console=kvm&novnc=1&node=${node}&resize=1&vmid=${vmid}&path=api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket/port/${port}/vncticket/${vncTicket}`;
    document.getElementById("vm-iframe").src = noVNCUrl;
    console.log("[connectVM] URL gerada:", noVNCUrl);
  } catch (error) {
    console.error(`Erro ao conectar à VM ${vmid}:`, error);
    alert(`Falha ao conectar à VM. Verifique o console.`);
  }
}

// Renderizar os botões para cada VM
function renderButtons() {
  const buttonSection = document.getElementById("button-section");
  vmList.forEach((vm) => {
    const button = document.createElement("button");
    button.className = "button";
    button.textContent = `Conectar ${vm.name}`;
    button.onclick = () => connectVM(vm.id, vm.node);
    buttonSection.appendChild(button);
  });
}

// Inicializar a página
renderButtons();
