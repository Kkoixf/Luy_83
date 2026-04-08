**Requisito: [REQ-NF005 - Armazenamento de Dados de pacientes](/Projeto-Mão-Robótica/Requisitos/Requisitos-Não%2DFuncionais/REQ%2DNF005-%2D-Armazenamento-de-Dados-de-pacientes)**


 Os dados coletados pelos sensores serão armazenados em um banco de dados criptografados de maneira que siga as normas da LGPD (Lei Geral de Proteção de Dados)
Perfis de diferentes tipos (usuário, operador, administrador) terão diferentes níveis de controle.
Usuário: Acesso aos seus dados pessoais e às ferramentas disponíveis para a leitura dos seus sinais vitais. Nível de acesso: BÁSICO.
Administrador: Cria, edita, e exclui dados sensíveis. Gerencia usuários, permissões e perfis. Nível de acesso: ALTO.
Operador: Monitora rotina usando ferramentas pré-configuradas. Gera relatórios operacionais. Nível de acesso: MÉDIO.