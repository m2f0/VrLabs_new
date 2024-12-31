async function fetchUserData() {
    try {
        // Faz a requisição ao panel.php
        const response = await fetch('/local/easyit_cyberarena/panel.php', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao obter dados do usuário no Moodle.');
        }

        // Obtem o HTML da resposta como texto
        const html = await response.text();

        // Cria um elemento DOM temporário para processar o HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Busca o script que define a variável userData
        const scriptContent = Array.from(doc.scripts)
            .map(script => script.textContent)
            .find(content => content && content.includes('var userData ='));

        if (!scriptContent) {
            throw new Error('A variável userData não foi encontrada na resposta do panel.php.');
        }

        // Executa o script para definir a variável userData
        eval(scriptContent); // Executa o código encontrado no script para criar a variável userData

        // Verifica se userData foi definida
        if (typeof userData === 'undefined' || !userData) {
            throw new Error('A variável userData não foi definida corretamente.');
        }

        console.log('Dados do usuário obtidos do panel.php:', userData);
        return userData;
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
