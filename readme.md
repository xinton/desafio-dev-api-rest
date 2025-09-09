# Conta Digital Dock - Desafio Backend

Este projeto implementa um sistema de backend para um banco digital, composto por dois microsserviços: **Portadores** e **Contas**. Ele foi projetado para gerenciar portadores de contas e suas respectivas contas bancárias, incluindo transações como depósitos, saques e extratos, atendendo aos requisitos do desafio proposto.

A arquitetura foi pensada para ser robusta, escalável e alinhada às boas práticas de desenvolvimento de software e ambientes de nuvem.

## Visão Geral da Arquitetura

O sistema é composto pelos seguintes serviços orquestrados pelo Docker Compose:

-   **Serviço `portadores`**: Gerencia o ciclo de vida dos portadores de conta (criação, exclusão e consulta).
-   **Serviço `contas`**: Gerencia as contas bancárias, incluindo criação, alterações de status (bloqueio/desbloqueio) e transações financeiras.
-   **`db` (PostgreSQL)**: O banco de dados principal, com esquemas separados (`holders` e `accounts`) para cada serviço, garantindo o isolamento dos dados (Database per Service).
-   **`redis`**: Usado para duas finalidades principais:
    1.  **Cache**: O serviço `contas` usa o Redis para armazenar em cache saldos e extratos, reduzindo a carga no banco de dados e melhorando os tempos de resposta.
    2.  **Mensageria (Pub/Sub)**: Quando um novo portador é criado no serviço `portadores`, ele publica um evento `holder_created`. O serviço `contas` se inscreve neste evento e cria automaticamente uma nova conta bancária para esse portador, desacoplando os serviços.


## Decisões de Arquitetura e Design

Visando atender aos diferenciais propostos no desafio, como a aplicação de conceitos de microsserviços e a preparação para um ambiente de nuvem, as seguintes decisões foram tomadas:

1.  **Padrão de Microsserviços**: A aplicação foi dividida nos domínios `Portadores` e `Contas`. Essa abordagem aumenta a autonomia dos times, facilita a manutenção e permite que cada serviço escale de forma independente.
2.  **Comunicação Assíncrona com Redis Pub/Sub**: Em vez de uma chamada HTTP síncrona entre os serviços `Portadores` e `Contas` para a criação de uma conta, foi utilizado um padrão de mensageria. Isso desacopla os serviços, aumenta a resiliência (se o serviço de contas estiver temporariamente indisponível, a criação não é perdida) e melhora a performance percebida pelo usuário.
3.  **Database Per Service**: Cada microsserviço possui seu próprio esquema no banco de dados, garantindo o isolamento total dos dados e reforçando os limites de cada domínio.
4.  **Estratégia de Cache com Redis**: Para operações de leitura frequentes, como consulta de saldo e extrato, foi implementada uma camada de cache. Isso diminui a latência para o usuário final e reduz a carga sobre o banco de dados PostgreSQL.
5.  **Containerização com Docker**: Toda a aplicação é orquestrada com Docker Compose, o que garante um ambiente de desenvolvimento consistente e torna o projeto "cloud-native ready", facilitando o deploy em qualquer provedor de nuvem.

## Tecnologias Utilizadas

-   **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
-   **Banco de Dados**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Armazenamento em Memória**: [Redis](https://redis.io/) (usado para cache e mensageria via `ioredis`)
-   **Containerização**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
-   **Documentação da API**: [Swagger](https://swagger.io/) (integrado com NestJS)
-   **Logs**: [pino-pretty](https://www.npmjs.com/package/pino-pretty) para logs estruturados e legíveis em desenvolvimento.

## Como Começar

### Pré-requisitos

-   [Docker](https://www.docker.com/get-started) e [Docker Compose](https://docs.docker.com/compose/install/) devem estar instalados em sua máquina.
-   Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
// filepath: .env
POSTGRES_USER=nestuser
POSTGRES_PASSWORD=nestpass
POSTGRES_DB=nestdb
```

### Executando a Aplicação

1.  Clone o repositório.
2.  Navegue até o diretório raiz do projeto.
3.  Execute o seguinte comando para construir e iniciar todos os serviços em segundo plano:

    ```sh
    docker-compose up --build -d
    ```

Os serviços estarão disponíveis nas seguintes portas:
-   **Serviço de Portadores**: `http://localhost:3001`
-   **Serviço de Contas**: `http://localhost:3002`
-   **Banco de Dados PostgreSQL**: `localhost:5432`
-   **Redis**: `localhost:6379`

## Uso da API

Você pode interagir com a API usando `curl` ou qualquer cliente de API.

### Serviço de Portadores (`localhost:3001`)

-   **Documentação da API**: [http://localhost:3001/api](http://localhost:3001/api)

#### Criar um novo Portador

Isso também irá disparar a criação assíncrona de uma conta bancária no serviço `contas`.

```sh
curl -X POST http://localhost:3001/holders \
-H "Content-Type: application/json" \
-d '{
  "name": "John Doe",
  "cpf": "60212513001"
}'
```

#### Buscar um Portador por CPF

```sh
curl http://localhost:3001/holders/60212513001
```

#### Remover um Portador

```sh
curl -X DELETE http://localhost:3001/holders/60212513001
```

### Serviço de Contas (`localhost:3002`)

-   **Documentação da API**: [http://localhost:3002/accounts/api](http://localhost:3002/accounts/api)

*(Nota: Você precisa saber o `id` da conta (UUID) para usar estes endpoints. Você pode encontrá-lo consultando a tabela `accounts.accounts` no banco de dados após a criação de um portador.)*

#### Depositar em uma Conta

```sh
curl -X POST http://localhost:3002/accounts/{ACCOUNT_ID}/deposits \
-H "Content-Type: application/json" \
-d '{
  "amount": 500.00
}'
```

#### Sacar de uma Conta

```sh
curl -X POST http://localhost:3002/accounts/{ACCOUNT_ID}/withdrawals \
-H "Content-Type: application/json" \
-d '{
  "amount": 150.00
}'
```

#### Consultar Saldo da Conta

```sh
curl http://localhost:3002/accounts/{ACCOUNT_ID}/balance
```

#### Consultar Extrato da Conta

Você pode filtrar por um período e paginar os resultados.

```sh
# Obter todas as transações (paginado)
curl "http://localhost:3002/accounts/{ACCOUNT_ID}/statement"

# Obter transações para um período específico
curl "http://localhost:3002/accounts/{ACCOUNT_ID}/statement?startDate=2025-09-01&endDate=2025-09-07"
```

#### Bloquear uma Conta

```sh
curl -X PATCH http://localhost:3002/accounts/{ACCOUNT_ID}/block
```

#### Desbloquear uma Conta

```sh
curl -X PATCH http://localhost:3002/accounts/{ACCOUNT_ID}/unblock
```

#### Encerrar uma Conta

```sh
curl -X DELETE http://localhost:3002/accounts/{ACCOUNT_ID}
```

## Logs e Monitoramento

A aplicação está configurada para emitir logs estruturados em formato JSON para o `stdout`, uma prática recomendada para ambientes de contêineres. Isso facilita a ingestão e análise de logs por ferramentas de monitoramento como Datadog, AWS CloudWatch ou o ELK Stack.

No ambiente de desenvolvimento (`NODE_ENV !== 'production'`), os logs são formatados de forma mais legível (`pretty-printed`) no console para facilitar a depuração.

## Débitos Técnicos e Pontos de Melhoria

Como parte de um processo de desenvolvimento iterativo, alguns pontos foram mapeados para melhorias futuras, visando aumentar a resiliência e manutenibilidade do sistema:

-   **Internalização de Dependências**: Criar um validador de CPF interno para remover a dependência de pacotes externos para maior segurança.
-   **Mecanismos de Retentativa**: Implementar retentativas para mensagens que falham no processamento pelo consumidor (serviço de `Contas`).
-   **Dead Letter Queue (DLQ)**: Configurar uma DLQ para armazenar mensagens que falham após múltiplas tentativas, permitindo a análise e reprocessamento posterior.
-   **Validação de Dados Mais Robusta**: Embora haja validação básica (como o formato do CPF), validações adicionais podem ser necessárias conforme os requisitos de negócio se tornam mais complexos.
-   **Monitoramento e Alertas**: Implementar uma solução de monitoramento para alertar os desenvolvedores sobre falhas no sistema, degradação de desempenho ou outros problemas críticos em tempo real.

## Próximos Passos e Visão de Futuro

Este projeto estabelece uma base sólida. A seguir, uma visão das evoluções planejadas para transformar esta solução em um produto de nível de produção, aumentando sua segurança, escalabilidade e manutenibilidade:

-   **Evolução da Arquitetura de Microsserviços**:
    -   **Introdução de um API Gateway**: Implementar um API Gateway (ex: NGINX) como ponto de entrada único para todas as requisições externas. Isso centralizará responsabilidades como:
        -   **Autenticação e Autorização**: Proteger os serviços com um fluxo de autenticação (ex: JWT).
        -   **Rate Limiting e Load Balancing**: Proteger a API contra abuso e distribuir a carga entre as instâncias dos serviços.
        -   **Reverse Proxy**: Abstrair a complexidade da rede interna, expondo uma API unificada e coesa para os clientes.
        -   **Abstração de Identificadores**: O Gateway poderá traduzir identificadores públicos (como agência e número da conta) para os UUIDs internos usados pelos serviços, protegendo a implementação interna.
    -   **Evolução da Mensageria**: Migrar do Redis Pub/Sub para um message broker mais robusto como **RabbitMQ** ou **Kafka**, que oferece garantias de entrega, persistência de mensagens e suporte a padrões mais complexos.

-   **Qualidade de Código e Testes**:
    -   **Testes de Integração Automatizados**: Adicionar uma suíte de testes de integração utilizando `testcontainers` para validar a comunicação entre os serviços, banco de dados e Redis em um ambiente efêmero e controlado.
    -   **Padronização de Código**: Implementar `linting` para garantir a consistência e a qualidade do código em toda a base.

-   **Refatoração e Otimização**:
    -   **Padrão Repository**: Desacoplar a lógica de negócio do Prisma, implementando o padrão Repository. Isso tornará o código mais testável e facilitará futuras migrações de ORM ou banco de dados.
    -   **Otimização de Build**: Refinar os `Dockerfiles` para criar imagens menores e mais seguras, utilizando builds multi-stage e instalando apenas as dependências de produção.
