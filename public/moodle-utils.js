async function checkMoodleSession() {
    try {
      const response = await fetch('/local/easyit_cyberarena/check_user.php');
      if (!response.ok) {
        throw new Error('Erro ao verificar a sessão do Moodle.');
      }
      const data = await response.json();
      if (data.status !== 'success') {
        alert('Usuário não autenticado no Moodle.');
        window.location.href = '/login/index.php';
      } else {
        console.log('Usuário autenticado:', data.username);
      }
    } catch (error) {
      console.error('Erro ao verificar sessão do Moodle:', error);
    }
  }
  