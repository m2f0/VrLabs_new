async function startVM(vmid, node, name) {
  const ticket = getCookie("PVEAuthCookie"); // Função para obter o cookie
  if (!ticket) {
    alert("Erro: Ticket de autenticação não encontrado.");
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/status/start`, {
      method: "POST",
      headers: {
        Authorization: `PVEAuthCookie=${ticket}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao iniciar a VM: ${errorText}`);
    }

    alert(`VM ${name} iniciada com sucesso!`);
  } catch (error) {
    console.error("Erro ao iniciar a VM:", error);
    alert(error.message);
  }
}

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
}

// Usar o cookie no código
const pveAuthCookie = getCookie("PVEAuthCookie");
if (!pveAuthCookie) {
  alert("Erro: Ticket de autenticação não encontrado.");
} else {
  console.log("Cookie encontrado:", pveAuthCookie);
}




function connectVM(vmid, node) {
  const url = `${window.API_BASE_URL}/?console=kvm&novnc=1&vmid=${vmid}&node=${node}`;
  window.open(url, "_blank");
}
