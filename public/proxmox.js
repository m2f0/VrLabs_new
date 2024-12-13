// Função de login no Proxmox
async function loginProxmox() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Usuário e senha são obrigatórios.");
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api2/json/access/ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao autenticar: ${response.statusText}`);
    }

    const data = await response.json();
    const ticket = data.data.ticket;
    const csrfToken = data.data.CSRFPreventionToken;

    document.cookie = `PVEAuthCookie=${ticket}; path=/; Secure; SameSite=None; Domain=.nnovup.com.br`;
    localStorage.setItem("CSRFPreventionToken", csrfToken);

    alert("Login realizado com sucesso!");
  } catch (error) {
    console.error("Erro ao realizar login:", error);
    alert("Erro ao realizar login. Verifique o console.");
  }
}

// Função para iniciar uma VM
async function startVM(vmid, node, name) {
  try {
    const csrfToken = localStorage.getItem("CSRFPreventionToken");

    if (!csrfToken) {
      throw new Error("CSRFPreventionToken não encontrado. Faça login novamente.");
    }

    const response = await fetch(`${window.API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/status/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `PVEAPIToken=${window.API_TOKEN}`,
        "CSRFPreventionToken": csrfToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao iniciar a VM: ${response.statusText}`);
    }

    alert(`VM ${name} (ID: ${vmid}) iniciada com sucesso!`);
  } catch (error) {
    console.error("Erro ao iniciar VM:", error);
    alert(`Erro ao iniciar a VM ${name}.`);
  }
}

// Função para conectar a uma VM
function connectVM(vmid, node) {
  const ticket = getCookie("PVEAuthCookie");

  if (!ticket) {
    alert("Erro: Ticket de autenticação não encontrado.");
    return;
  }

  const url = `${window.API_BASE_URL}/?console=kvm&novnc=1&vmid=${vmid}&node=${node}`;
  document.cookie = `PVEAuthCookie=${ticket}; path=/; Secure; SameSite=None; Domain=.nnovup.com.br`;
  window.open(url, "_blank");
}

// Função para obter um cookie específico
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// Expondo as funções no escopo global
window.loginProxmox = loginProxmox;
window.startVM = startVM;
window.connectVM = connectVM;
