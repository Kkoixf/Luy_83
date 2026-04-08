# **Plano de Testes: Medidor de Temperatura**
***
**Caso teste 001:** Fazer a leitura da temperatura do usuário e enviar dados à plataforma.

**Objetivo:**
Verificar se o sensor de temperatura está operando normalmente e enviando corretamente os dados ao display ou à plataforma escolhida(site/app)

**Pré-Condições:**
1. Em caso de plataforma, o banco de dados deve estar online.
2. A mão deve estar conectada a uma fonte de energia.

**Passos / Ações**
1. Enviar um comando de início de leitura de temperatura.
*1.1 Em caso de plataforma, clicar em "Nova Leitura"
1.2 Clicar em "Medir Temperatura*
2. Posicionar a mão de modo que o sensor possa realizar a leitura.
3. Esperar o som/beep que indica o final da leitura

**Resultados Esperados**
1. No display, a medida certa da temperatura corporal do usuário.
1.1 Na plataforma, o registro dos dados coletados pelo sensor.
2. Beep indicando o fim do procedimento de leitura.