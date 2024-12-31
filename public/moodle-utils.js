async function checkMoodleSession() {
  try {
      // Ajuste o endpoint para usar o rest.php
      const response = await fetch('/local/easyit_cyberarena/rest.php?action=checkUser');
      if (!response.ok) {
          throw new Error('Erro ao verificar a sessão do Moodle.');
      }
      const data = await response.json();

      // Verifica o status retornado pelo servidor
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
