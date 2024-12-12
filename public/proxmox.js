function startVM(vmid, node, name) {
    fetch(`${window.API_BASE_URL}/api2/json/nodes/${node}/qemu/${vmid}/status/start`, {
      method: "POST",
      headers: {
        Authorization: window.API_TOKEN,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao iniciar a VM");
        }
        alert(`VM ${name} iniciada com sucesso!`);
      })
      .catch((error) => alert(error.message));
  }
  
  function connectVM(vmid, node) {
    const url = `${window.API_BASE_URL}/?console=kvm&novnc=1&vmid=${vmid}&node=${node}`;
    window.open(url, "_blank");
  }
  