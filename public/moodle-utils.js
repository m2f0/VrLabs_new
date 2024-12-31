async function fetchUserData() {
    try {
        // Verifica se a variável userData está definida
        if (typeof userData === 'undefined' || !userData) {
            throw new Error('A variável userData não está definida no frontend.');
        }

        // Verifica se os campos necessários estão presentes
        const { csrf, userEmail, userId, userName } = userData;

        if (!csrf || !userEmail || !userId || !userName) {
            throw new Error('Dados de autenticação ausentes ou incompletos no userData.');
        }

        console.log('Dados do usuário obtidos do userData:', userData);
        return userData; // Retorna os dados do usuário
    } catch (error) {
        console.error('Erro ao obter dados do usuário no Moodle:', error);
        throw error;
    }
}

async function checkMoodleSession() {
    try {
        // Obtém os dados do usuário do userData
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
