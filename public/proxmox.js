const API_BASE_URL = "https://prox.nnovup.com.br";
const API_TOKEN = "PVEAPIToken=apiuser@pve!api=2941a8af-6ae6-4a6e-810c-1c29910d22fc";
const API_USERNAME = "apiuser@pve";
const API_PASSWORD = "t?v1K!sfk/#/xSuK";

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

async function createLinkedClone(snapshotId, node, linkedCloneName) {
  try {
    const ticket = await renewTicket();

    // Solicitar um ID exclusivo para a nova VM
    const newVmId = prompt("Digite o ID da nova VM (Linked Clone):");
    if (!newVmId) {
      alert("O ID da nova VM é obrigatório.");
      return;
    }

    // Configurar os parâmetros para o Linked Clone
    const params = new URLSearchParams({
      newid: newVmId,
      name: linkedCloneName,
      snapname: snapshotId,
      full: "0", // Criar como Linked Clone
    });

    const response = await fetch(`${API_BASE_URL}/api2/json/nodes/${node}/qemu/${snapshotId}/clone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: API_TOKEN,
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro ao criar Linked Clone:", errorText);
      throw new Error("Erro ao criar Linked Clone.");
    }

    alert(`Linked Clone "${linkedCloneName}" criado com sucesso!`);
  } catch (error) {
    console.error(`Erro ao criar Linked Clone: ${error}`);
    alert("Erro ao criar Linked Clone. Verifique o console.");
  }
}


async function connectVM(vmid, node) {
  try {
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
