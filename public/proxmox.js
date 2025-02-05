//Checkpoint v1.0
const API_BASE_URL = "https://pxpa2.cecyber.com";
const API_TOKEN = "PVEAPIToken=apiuser@pve!apitoken=9df761c2-6b64-4313-9811-8ca0df6fa966";
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
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Erro ao renovar o ticket: ${response.statusText}`);
    }

    const data = await response.json();
    const ticket = data.data.ticket;
    const csrfToken = data.data.CSRFPreventionToken;

    // Set cookies with correct attributes
    document.cookie = `PVEAuthCookie=${ticket}; path=/; domain=.nnovup.com.br; Secure; SameSite=None`;
    document.cookie = `CSRFPreventionToken=${csrfToken}; path=/; domain=.nnovup.com.br; Secure; SameSite=None`;

    return { ticket, csrfToken };
  } catch (error) {
    console.error("Erro ao renovar o ticket:", error);
    throw error;
  }
}


async function createLinkedClone(snapshotName, node, vmId, studentName) {
  try {
    // Get fresh ticket and CSRF token
    const { ticket, csrfToken } = await renewTicket();

    const sanitizedStudentName = studentName
      ? studentName.replace(/[^a-zA-Z0-9-]/g, "").substring(0, 20)
      : "SemNome";

    const newVmId = prompt("Digite o ID da nova VM (Linked Clone):");
    if (!newVmId) {
      alert("O ID da nova VM é obrigatório.");
      return;
    }

    const linkedCloneName = `${sanitizedStudentName}-lab-${newVmId}`;

    const params = new URLSearchParams({
      newid: newVmId,
      name: linkedCloneName,
      snapname: snapshotName,
      full: "0",
    });

    const response = await fetch(
      `${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmId}/clone`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": API_TOKEN,
          "CSRFPreventionToken": csrfToken,
          "Cookie": `PVEAuthCookie=${ticket}`,
        },
        credentials: "include",
        body: params,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro ao criar Linked Clone:", errorText);
      throw new Error(`Erro ao criar Linked Clone: ${errorText}`);
    }

    alert(`Linked Clone "${linkedCloneName}" criado com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar Linked Clone: ${error}`);
    alert(`Erro ao criar Linked Clone: ${error.message}`);
    return false;
  }
}







async function connectVM(vmid, node) {
  try {
    // Get fresh ticket and CSRF token
    const { ticket, csrfToken } = await renewTicket();

    const response = await fetch(`${API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`, {
      method: "POST",
      headers: {
        "Authorization": API_TOKEN,
        "CSRFPreventionToken": csrfToken,
        "Cookie": `PVEAuthCookie=${ticket}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Erro ao conectar à VM: ${response.statusText}`);
    }

    const vncProxyData = await response.json();
    const { ticket: vncTicket, port } = vncProxyData.data;

    // Include the auth ticket in the noVNC URL
    const noVNCUrl = `${API_BASE_URL}/?console=kvm&novnc=1&node=${node}&resize=1&vmid=${vmid}&path=api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket/port/${port}/vncticket/${vncTicket}&PVEAuthCookie=${ticket}`;
    
    // If using iframe
    const iframe = document.getElementById("vm-iframe");
    if (iframe) {
      iframe.src = noVNCUrl;
    } else {
      // If opening in new window
      window.open(noVNCUrl, `vnc_${vmid}`, 'width=800,height=600');
    }
    
    console.log("[connectVM] URL gerada:", noVNCUrl);
  } catch (error) {
    console.error(`Erro ao conectar à VM ${vmid}:`, error);
    alert(`Falha ao conectar à VM. Verifique o console.`);
  }
}
