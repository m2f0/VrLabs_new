async function checkMoodleSession() {
    try {
        // Obtenha o token CSRF de um elemento oculto no HTML, se disponível
        const csrf = document.querySelector('input[name="csrf"]')?.value || ''; // Ajuste conforme necessário
        const email = document.querySelector('meta[name="user-email"]')?.content || ''; // Email do usuário
        const userId = document.querySelector('meta[name="user-id"]')?.content || ''; // ID do usuário
        const userName = document.querySelector('meta[name="user-name"]')?.content || ''; // Nome do usuário

        // Verifica se as variáveis estão disponíveis
        if (!csrf || !email || !userId || !userName) {
            throw new Error('Dados de autenticação não encontrados no frontend.');
        }

        // Faz a requisição ao endpoint
        const response = await fetch('/local/easyit_cyberarena/rest.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest', // Importante para evitar o erro 'Invalid Request [x]'
            },
            body: JSON.stringify({
                action: 'session',
                token: '48gAQftgfzHO6SulDTsLcR2mxpGaO7', // Token REST configurado
                csrf: csrf, // Token CSRF
                userEmail: email, // E-mail do usuário
                userId: userId, // ID do usuário
                userName: userName // Nome do usuário
            }),
        });

        if (!response.ok) {
            throw new Error('Erro ao verificar a sessão do Moodle.');
        }

        const data = await response.json();

        // Verifica o status retornado
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
