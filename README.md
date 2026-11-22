# 💰 FinTrack — Gestor de Finanças Pessoais

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-10B981?style=flat-square)

Aplicação **Full-Stack** de controle financeiro pessoal construída com **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express** e **Prisma**. Projetada para oferecer visibilidade clara de receitas, despesas, limites mensais por categoria e objetivos de economia em uma interface moderna e responsiva.

---

## ✨ Funcionalidades

- **Autenticação Segura (JWT + bcrypt)**: cadastro, login, sessão persistente e criação automática de categorias padrão para novos usuários.
- **Dashboard Interativo**:
  - KPIs do período selecionado: Saldo do mês (com **Taxa de Poupança**), Receitas, Despesas (com **comparativo percentual em relação ao mês anterior**) e Saldo Acumulado histórico.
  - Gráfico de barras com evolução dos últimos **6 meses** (Receitas × Despesas).
  - Gráfico donut com distribuição de despesas por categoria.
  - Acompanhamento rápido de metas mensais, objetivos financeiros e últimas movimentações.
- **Gestão Completa de Transações**:
  - Criar, editar e excluir receitas e despesas.
  - Filtros combinados por período (mês/ano), tipo, categoria e busca textual (ignorando acentos).
  - Ordenação por data, valor ou descrição + totalizadores dinâmicos dos itens filtrados.
  - **Exportação para CSV** compatível com Excel (UTF-8 com BOM).
- **Metas de Gastos & Categorias Personalizadas**:
  - Defina limites mensais por categoria de despesa com barras de progresso e alertas visuais (`ok`, `warning >= 80%`, `exceeded >= 100%`).
  - Replicação em 1 clique das metas do mês anterior (`Copiar do mês anterior`).
  - Criação, edição e exclusão de categorias com **paleta de cores e ícones personalizados**.
- **Objetivos Financeiros (Cofrinhos)**:
  - Crie metas de médio/longo prazo (ex.: *Reserva de Emergência*, *Viagem*) com valor alvo, prazo, ícone e cor.
  - Registre **aportes** e **resgates** acompanhando o progresso individual e consolidado.
- **Perfil & Configurações**:
  - Atualização de nome/e-mail, alteração segura de senha e exportação completa do histórico em CSV.
- **Experiência de Uso (UX)**:
  - Interface escura responsiva (desktop e mobile), notificações *toast* e modais de confirmação customizados.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| --- | --- |
| **Front-end** | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7, Recharts, Lucide Icons |
| **Back-end** | Node.js, TypeScript, Express 4, Zod (validação), JWT (`jsonwebtoken`), `bcryptjs` |
| **Banco de Dados** | Prisma ORM 6 + SQLite (pronto para migrar para PostgreSQL) |
| **Qualidade & CI** | Testes de integração nativos (`node:test`) + GitHub Actions CI |

---

## 📁 Estrutura do Projeto

```text
projeto-repo1/
├── .github/workflows/ci.yml   # Pipeline de CI (testes + builds)
├── backend/
│   ├── prisma/
│   │   ├── migrations/        # Histórico de migrations Prisma
│   │   ├── schema.prisma      # Modelos: User, Category, Transaction, Budget, Goal
│   │   └── seed.ts            # População de dados de demonstração
│   ├── scripts/
│   │   └── run-tests.mjs      # Runner isolado de testes com SQLite temporário
│   ├── src/
│   │   ├── constants/         # Categorias iniciais padrão
│   │   ├── controllers/       # Regras de negócio (auth, categories, transactions, budgets, goals, dashboard)
│   │   ├── lib/               # Instância singleton do Prisma Client
│   │   ├── middlewares/       # Autenticação JWT e tratamento centralizado de erros
│   │   ├── routes/            # Rotas REST organizadas por domínio
│   │   ├── schemas/           # Validação de payloads e queries com Zod
│   │   └── utils/             # Helpers de JWT e intervalos de datas
│   └── tests/
│       └── api.test.ts        # Suíte de testes de integração da API
├── frontend/
│   └── src/
│       ├── components/        # Layout, MonthSelector, TransactionModal, ConfirmModal, ProtectedRoute
│       ├── contexts/          # AuthContext, PeriodContext, ToastContext
│       ├── pages/             # AuthPage, DashboardPage, TransactionsPage, BudgetsPage, GoalsPage, SettingsPage
│       ├── services/          # Cliente HTTP tipado (api.ts)
│       ├── types/             # Tipagens TypeScript compartilhadas
│       └── utils/             # Formatação BRL/datas/CSV e mapeamento de ícones
├── package.json               # Scripts convenientes na raiz
└── LICENSE
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js 20+** e **npm**

### 1. Clone o repositório e instale as dependências

```bash
git clone <url-do-seu-repositorio>
cd projeto-repo1

npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure as variáveis de ambiente

Copie os arquivos de exemplo:

```bash
# Back-end
cp backend/.env.example backend/.env

# Front-end (opcional, padrão já aponta para http://localhost:3333)
cp frontend/.env.example frontend/.env
```

### 3. Prepare o banco de dados e dados de demonstração

```bash
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
```

### 4. Inicie os servidores (em dois terminais)

```bash
# Terminal 1 — API (http://localhost:3333)
npm run dev:backend

# Terminal 2 — Interface Web (http://localhost:5173)
npm run dev:frontend
```

### 👤 Conta de Demonstração

Após executar o seed (`db:seed`), você pode clicar em **"Entrar com conta demo"** na tela de login ou usar:

- **E-mail:** `demo@fintrack.dev`
- **Senha:** `123456`

---

## 🧪 Testes e Build

Execute a suíte de testes de integração do back-end (usa um banco SQLite isolado e limpa ao final):

```bash
npm test
```

Para compilar back-end e front-end em modo produção:

```bash
npm run build
```

---

## 📡 Endpoints Principais da API

Todas as rotas sob `/api/*` (exceto `/api/auth/register` e `/api/auth/login`) exigem header `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Health check da API e conexão com banco |
| `POST` | `/api/auth/register` | Cadastro de usuário com categorias padrão |
| `POST` | `/api/auth/login` | Autenticação e emissão de JWT |
| `GET` | `/api/auth/me` | Dados do usuário autenticado |
| `PUT` | `/api/auth/profile` | Atualiza nome e e-mail do perfil |
| `PUT` | `/api/auth/password` | Altera senha mediante verificação da atual |
| `GET` | `/api/categories` | Lista categorias (filtro opcional `?type=INCOME\|EXPENSE`) |
| `POST` | `/api/categories` | Cria nova categoria personalizada |
| `PUT` | `/api/categories/:id` | Atualiza nome, cor ou ícone da categoria |
| `DELETE` | `/api/categories/:id` | Remove categoria |
| `GET` | `/api/transactions` | Lista transações (`month`, `year`, `type`, `categoryId`, `search`) |
| `POST` | `/api/transactions` | Cria receita ou despesa |
| `PUT` | `/api/transactions/:id` | Atualiza transação existente |
| `DELETE` | `/api/transactions/:id` | Exclui transação |
| `GET` | `/api/budgets` | Lista metas do mês com gasto atual, % e status |
| `POST` | `/api/budgets` | Cria ou atualiza meta mensal por categoria |
| `POST` | `/api/budgets/copy-previous` | Copia metas do mês anterior para o período informado |
| `DELETE` | `/api/budgets/:id` | Remove meta mensal |
| `GET` | `/api/goals` | Lista objetivos financeiros e resumo consolidado |
| `POST` | `/api/goals` | Cria novo objetivo financeiro |
| `PUT` | `/api/goals/:id` | Atualiza objetivo existente |
| `POST` | `/api/goals/:id/contribute` | Registra aporte (`DEPOSIT`) ou resgate (`WITHDRAW`) |
| `DELETE` | `/api/goals/:id` | Exclui objetivo |
| `GET` | `/api/dashboard/summary` | Consolida KPIs, comparativos, gráficos, metas e objetivos |

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.
