root@mod:/home/user/htdocs/mod.nnovup.com.br/local/easyit_cyberarena# cat user_info.php
<?php
require_once('../../config.php');
require_once($CFG->dirroot . '/user/lib.php');

header('Content-Type: application/json');
require_login(); // Garante que o usuário está autenticado no Moodle

global $USER;

// Verifica se o usuário está logado corretamente
if (!isloggedin() || isguestuser()) {
    echo json_encode(['status' => 'error', 'message' => 'Usuário não autenticado ou sessão inválida.']);
    exit;
}

// Exponha apenas as informações que você precisa
echo json_encode([
    'status' => 'success',
    'user' => [
        'id' => $USER->id,
        'username' => $USER->username,
        'firstname' => $USER->firstname,
        'lastname' => $USER->lastname,
        'email' => $USER->email,
    ]
]);
exit;
root@mod:/home/user/htdocs/mod.nnovup.com.br/local/easyit_cyberarena#
