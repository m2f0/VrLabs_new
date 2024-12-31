async function fetchUserData() {
    try {
        // Faz a requisição ao panel.php
        const response = await fetch('/local/easyit_cyberarena/panel.php', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest', // Garantir que o servidor reconheça como uma requisição AJAX
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao obter dados do usuário no Moodle.');
        }

        // Tenta analisar a resposta como JSON
        const data = await response.json();

        // Verifica se os dados necessários estão presentes
        if (!data || !data.csrf || !data.userEmail || !data.userId || !data.userName) {
            throw new Error('Dados do usuário incompletos retornados pelo Moodle.');
        }

        console.log('Dados do usuário obtidos do panel.php:', data);

        // Define os dados globalmente no frontend
        window.userData = data;

        return data;
    } catch (error) {
        console.error('Erro ao obter dados do usuário no Moodle:', error);
        throw error;
    }
}

async function checkMoodleSession() {
    try {
        // Obtém os dados do usuário do panel.php
        const userData = await fetchUserData();

        // Faz a requisição ao rest.php para verificar a sessão
        const response = await fetch('/local/easyit_cyberarena/rest.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                action: 'session',
                token: '48gAQftgfzHO6SulDTsLcR2mxpGaO7',
                csrf: userData.csrf,
                userEmail: userData.userEmail,
                userId: userData.userId,
                userName: userData.userName,
            }),
        });

        if (!response.ok) {
            throw new Error('Erro ao verificar a sessão do Moodle.');
        }

        const data = await response.json();

        // Verifica o status retornado pelo backend
        if (data.status !== 200) {
            alert('Usuário não autenticado no Moodle.');
            window.location.href = '/login/index.php';
        } else {
            console.log('Usuário autenticado:', data.user.username);
        }
    } catch (error) {
        console.error('Erro ao verificar a sessão do Moodle:', error);
    }
}
