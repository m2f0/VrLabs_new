async function fetchUserInfo() {
    try {
        const response = await fetch('/local/easyit_cyberarena/user_info.php', {
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error('Erro ao acessar o endpoint de informações do usuário.');
        }

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Erro desconhecido.');
        }

        console.log('Dados do usuário logado:', data.user);
        return data.user;
    } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
        throw error;
    }
}

async function checkMoodleSession() {
    try {
        const user = await fetchUserInfo();
        console.log('Usuário autenticado:', user);

        // Use os dados do usuário como necessário
        document.getElementById('studentName').value = `${user.firstname} ${user.lastname}`;
    } catch (error) {
        alert('Usuário não autenticado no Moodle. Redirecionando para a página de login.');
        window.location.href = '/login/index.php';
    }
}

