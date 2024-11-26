<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>
    mermaid.initialize({ startOnLoad: true });
</script>

# Cecyber

### **Fluxo da Solução**

1. **Iniciar a Máquina Virtual via API:**
   - Sua aplicação frontend enviará uma solicitação para a API do Proxmox VE solicitando o início da VM específica.
   - Para segurança, será utilizado um token de API gerado previamente e armazenado em um ambiente seguro.

2. **Obter Ticket VNC e Porta de Comunicação:**
   - Após iniciar a VM, a aplicação requisitará à API um ticket temporário e a porta correspondente para o acesso remoto via VNC.

3. **Estabelecer Conexão com noVNC:**
   - Com o ticket gerado, o frontend carregará o cliente noVNC embutido no navegador e configurará a conexão com a VM por meio do WebSocket disponibilizado pelo Proxmox.

4. **Interação Remota pelo Navegador:**
   - O cliente final poderá acessar a interface gráfica da VM diretamente no navegador, interagindo em tempo real com o sistema operacional ou a aplicação hospedada.

---

### **Diagrama de Funcionamento**

<div class="mermaid">
graph TD
    A[Usuário no Browser] --> B[Frontend App]
    B --> C[Proxmox API]
    C --> D[Inicia VM no Proxmox]
    D --> E[Proxmox Hypervisor]
    E --> F[VM Iniciada]
    F --> G[Proxmox API - Ticket VNC]
    G --> H[Frontend noVNC Cliente]
    H --> I[WebSocket para VM]
    I --> J[Interação Remota na VM]
</div>

---

### **Componentes da Solução**

1. **Frontend:**
   - Será responsável por interagir com a API do Proxmox e gerenciar o cliente noVNC.
   - Garantirá que apenas usuários autenticados possam iniciar e acessar as máquinas virtuais.

2. **API do Proxmox:**
   - Permitirá operações como iniciar/parar VMs, obter tickets VNC e monitorar o status das máquinas.
   - Sua arquitetura RESTful será utilizada para integração direta com o frontend.

3. **noVNC:**
   - Uma interface gráfica no navegador permitirá que os usuários interajam com as máquinas virtuais remotamente, utilizando a conexão VNC encapsulada em WebSockets.

4. **Proxmox VE:**
   - O hipervisor que gerencia as máquinas virtuais e fornece os recursos necessários para o ambiente operacional.

5. **VM:**
   - As máquinas virtuais serão configuradas para rodar sistemas operacionais ou aplicações específicas, de acordo com as demandas do cliente.

---

### **Monitoramento das Máquinas Virtuais**

**Backend:**
- O backend realizará requisições periódicas à API do Proxmox para obter métricas de desempenho das máquinas virtuais, como:
  - Uso de CPU
  - Consumo de memória
  - Taxa de I/O de disco
  - Tráfego de rede
  - Status das VMs (ligada/desligada)
- Essas informações serão armazenadas temporariamente para exibição em tempo real no frontend.

**Frontend:**
- O frontend exibirá essas métricas em painéis interativos, permitindo ao usuário monitorar o desempenho das VMs em tempo real.
- Alertas visuais podem ser configurados para informar o usuário sobre situações críticas, como uso excessivo de recursos.

**Ações Disponíveis:**
- Os usuários poderão iniciar/parar máquinas diretamente do painel de monitoramento.
- Gráficos históricos serão exibidos para analisar tendências de desempenho.

---

### **Diagrama de Funcionamento**

<div class="mermaid">
graph TD
    A[Usuário no Browser] --> B[Frontend App]
    B --> C[Proxmox API]
    C --> D[Inicia VM no Proxmox]
    D --> E[Proxmox Hypervisor]
    E --> F[VM Iniciada]
    F --> G[Proxmox API - Ticket VNC]
    G --> H[Frontend noVNC Cliente]
    H --> I[WebSocket para VM]
    I --> J[Interação Remota na VM]
    E --> K[Proxmox API - Métricas de Monitoramento]
    K --> L[Backend - Coleta de Métricas]
    L --> M[Frontend - Painel de Monitoramento]
    M --> A
</div>

---

### **Vantagens da Solução**

- **Segurança:** Toda a comunicação será protegida por HTTPS, e os tickets VNC terão validade limitada para garantir acesso seguro.
- **Automação:** A integração com a API do Proxmox permite que os processos sejam escaláveis e facilmente replicáveis.
- **Flexibilidade:** Usuários poderão acessar as máquinas virtuais de qualquer dispositivo com navegador, eliminando a necessidade de clientes específicos.
- **Centralização:** O gerenciamento das VMs será feito de forma centralizada e automatizada, reduzindo a complexidade operacional.
- **Monitoramento Facilitado:** O monitoramento via frontend proporciona uma visão clara e intuitiva do estado das máquinas virtuais e dos recursos alocados, permitindo identificação rápida de problemas e tomada de decisão informada.
- **Interface Amigável:** Uma interface gráfica bem projetada melhora a experiência do usuário, tornando mais fácil gerenciar e monitorar as VMs sem a necessidade de comandos complexos.
- **Acompanhamento em Tempo Real:** Através do frontend, é possível acompanhar métricas de desempenho e eventos em tempo real, garantindo maior controle e eficiência na administração dos recursos.

---

### Utilização da API do ProxMox pela aplicação:

- Documentação da API do ProxMox https://pve.proxmox.com/pve-docs/api-viewer/index.html
  
- Autenticação
Endpoint:
POST /api2/json/access/ticket

Descrição:
Obtém um ticket de autenticação (PVEAuthCookie) e um CSRF token utilizando as credenciais de login do Proxmox.

Parâmetros:

username: Nome de usuário no Proxmox (ex.: root@pam).
password: Senha do usuário.
Uso:
O ticket e o token retornados devem ser incluídos nos cabeçalhos das requisições subsequentes.

- Obter Ticket VNC para Acesso via noVNC
Endpoint:
POST /api2/json/nodes/{node}/qemu/{vmid}/vncproxy

Descrição:
Cria um ticket temporário e fornece a porta para conexão VNC da VM, usada para configurar o cliente noVNC no navegador.

Parâmetros:

node: Nome do nó onde a VM está localizada.
vmid: ID da máquina virtual.
Resposta:

port: Porta do servidor VNC.
ticket: Token temporário para autenticação.

- Iniciar Máquina Virtual:
Iniciar Máquina Virtual
Endpoint:
POST /api2/json/nodes/{node}/qemu/{vmid}/status/start

Descrição:
Inicia uma VM específica identificada por {vmid} no nó {node}.

Parâmetros:

node: Nome do nó onde a VM está localizada.
vmid: ID da máquina virtual.
Exemplo:
POST /api2/json/nodes/proxmox-node1/qemu/100/status/start

- Parar Máquina Virtual
Endpoint:
POST /api2/json/nodes/{node}/qemu/{vmid}/status/stop

Descrição:
Encerra uma VM específica.

Parâmetros:

node: Nome do nó onde a VM está localizada.
vmid: ID da máquina virtual.

- Obter Ticket VNC:
Parar Máquina Virtual
Endpoint:
POST /api2/json/nodes/{node}/qemu/{vmid}/status/stop

Descrição:
Encerra uma VM específica.

Parâmetros:

node: Nome do nó onde a VM está localizada.
vmid: ID da máquina virtual.

- Parar Máquina Virtual (se necessário):
Endpoint: POST /api2/json/nodes/{node}/qemu/{vmid}/status/stop

- Obter Status da Máquina Virtual
Endpoint:
GET /api2/json/nodes/{node}/qemu/{vmid}/status/current

Descrição:
Retorna o status atual da VM, incluindo informações como:

Uso de CPU
Uso de memória
Disco e rede
Status (ligada/desligada)
Parâmetros:

node: Nome do nó onde a VM está localizada.
vmid: ID da máquina virtual.

- Monitorar Métricas de Recursos
Endpoint:
GET /api2/json/nodes/{node}/status

Descrição:
Retorna métricas gerais do nó, como:

Uso total de CPU e memória.
Informações sobre discos e redes do servidor.
Parâmetros:

node: Nome do nó.

- Listar Todas as Máquinas Virtuais
Endpoint:
GET /api2/json/nodes/{node}/qemu

Descrição:
Retorna a lista de todas as VMs no nó especificado, incluindo informações como:

IDs das VMs (vmid).
Status atual.
Nome das VMs.
Parâmetros:

node: Nome do nó.

# Casos de Uso Adicionais da Aplicação

Abaixo estão os casos de uso adicionais que podem ser implementados na aplicação, expandindo as funcionalidades para oferecer uma experiência mais rica aos usuários.

---

## 1. Gestão de Recursos do Nó Proxmox

### Monitorar Utilização do Nó
- **Descrição:** Acompanhar em tempo real o consumo de recursos do nó onde as VMs estão hospedadas (CPU, memória, disco e rede).
- **Requisição API:**  
  `GET /api2/json/nodes/{node}/status`
- **Benefício:** Identificar gargalos de recursos no nó e planejar upgrades ou redistribuição de cargas.

### Exibir Informações do Nó
- **Descrição:** Exibir informações detalhadas sobre o nó, como:
  - Nome do host.
  - Sistema operacional.
  - Versão do Proxmox.
  - Disponibilidade de armazenamento.
- **Requisição API:**  
  `GET /api2/json/nodes/{node}`

---

## 2. Gerenciamento de Backup

### Agendar Backups Automáticos
- **Descrição:** Permitir que o usuário agende backups automáticos de máquinas virtuais para armazenamento seguro.
- **Requisição API:**  
  `POST /api2/json/nodes/{node}/vzdump`
- **Benefício:** Evitar perda de dados em caso de falhas ou erros operacionais.

### Restaurar VMs a Partir de Backups
- **Descrição:** Restaurar máquinas virtuais a partir de backups disponíveis.
- **Requisição API:**  
  `POST /api2/json/nodes/{node}/qemu`
- **Benefício:** Recuperar sistemas rapidamente em caso de falhas ou atualizações mal-sucedidas.

---

## 3. Controle Avançado de VMs

### Clonar Máquinas Virtuais
- **Descrição:** Permitir a clonagem de uma VM existente para criar novos ambientes rapidamente.
- **Requisição API:**  
  `POST /api2/json/nodes/{node}/qemu/{vmid}/clone`
- **Benefício:** Reduz o tempo necessário para criar VMs idênticas, útil em cenários de testes ou produção.

### Alterar Configuração de VMs
- **Descrição:** Permitir ajustes dinâmicos nas configurações da VM (CPU, memória, disco).
- **Requisição API:**  
  `PUT /api2/json/nodes/{node}/qemu/{vmid}/config`
- **Benefício:** Ajustar as VMs para atender a novas demandas de carga ou economizar recursos.

### Migrar VMs Entre Nós
- **Descrição:** Migrar máquinas virtuais de um nó para outro sem interrupção (live migration).
- **Requisição API:**  
  `POST /api2/json/nodes/{node}/qemu/{vmid}/migrate`
- **Benefício:** Equilibrar a carga de trabalho entre diferentes nós.

---

## 4. Automação e Agendamento

### Agendar Início e Parada de VMs
- **Descrição:** Configurar horários automáticos para ligar e desligar máquinas virtuais.
- **Benefício:** Reduzir custos com recursos ociosos fora do horário de uso.

### Scripts Personalizados
- **Descrição:** Permitir que os usuários anexem scripts para execução automática em eventos específicos (ex.: inicialização da VM).
- **Benefício:** Automatizar tarefas, como configuração de sistemas ou inicialização de serviços.

---

## 5. Auditoria e Logs

### Exibir Histórico de Eventos
- **Descrição:** Exibir um log detalhado das ações realizadas no Proxmox (ex.: início/parada de VMs, falhas, backups).
- **Requisição API:**  
  `GET /api2/json/cluster/log`
- **Benefício:** Acompanhar o histórico de eventos para auditoria e solução de problemas.

### Monitorar Alertas de Sistema
- **Descrição:** Apresentar alertas de sistema em tempo real, como falhas em VMs ou consumo excessivo de recursos.
- **Benefício:** Reduzir o tempo de resposta para resolução de problemas críticos.

---

## 6. Gestão de Usuários e Permissões

### Controle de Acesso Baseado em Funções
- **Descrição:** Permitir diferentes níveis de acesso (ex.: administrador, operador, visualizador) para usuários da aplicação.
- **Requisição API:**  
  `POST /api2/json/access/roles`
- **Benefício:** Melhor controle sobre quem pode realizar operações sensíveis.

### Criar e Gerenciar Usuários
- **Descrição:** Criar novos usuários ou gerenciar os existentes diretamente pela interface.
- **Requisição API:**  
  `POST /api2/json/access/users`
- **Benefício:** Permitir administração centralizada de usuários.

---

## 7. Extensões e Integrações

### Integração com Serviços de Monitoramento Externo
- **Descrição:** Exportar métricas do Proxmox para sistemas de monitoramento como Grafana ou Prometheus.
- **Requisição API:**  
  `GET /api2/json/nodes/{node}/rrddata`
- **Benefício:** Consolidar a monitoração em ferramentas padrão do mercado.

### Notificações por Email ou SMS
- **Descrição:** Configurar alertas automáticos para eventos críticos no Proxmox.
- **Benefício:** Melhorar a proatividade na administração.

---

Com esses casos de uso adicionais, sua aplicação terá maior alcance e aplicabilidade, permitindo uma gestão mais robusta e eficiente das máquinas virtuais e do ambiente Proxmox.

### **Diagrama de Casos de Uso e Integrações**

<div class="mermaid">
graph TD
    A[Gestão de Recursos do Nó] --> A1[Monitorar Utilização do Nó]
    A1 --> P1[API: GET /status]
    A --> A2[Exibir Informações do Nó]
    A2 --> P2[API: GET /nodes/]
    B[Gerenciamento de Backup] --> B1[Agendar Backups Automáticos]
    B1 --> P3[API: POST /nodes/vzdump]
    B --> B2[Restaurar VMs a Partir de Backups]
    B2 --> P4[API: POST /nodes/qemu]
    C[Controle Avançado de VMs] --> C1[Clonar Máquinas Virtuais]
    C1 --> P5[API: POST /nodes/qemu/clone]
    C --> C2[Alterar Configuração de VMs]
    C2 --> P6[API: PUT /nodes/qemu/config]
    D[Automação e Agendamento] --> D1[Agendar Início e Parada de VMs]
    D1 --> P7[Gerenciado pelo Backend]
    E[Auditoria e Logs] --> E1[Exibir Histórico de Eventos]
    E1 --> P8[API: GET /cluster/log]
</div>
