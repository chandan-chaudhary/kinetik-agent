# KINETIK - AI-Powered Workflow Automation Platform

---

## 🚀 Overview

KINETIK is a cutting-edge workflow automation platform that empowers businesses to create, deploy, and manage intelligent AI-powered workflows. Built with a modern tech stack, it combines visual workflow design with powerful LLM integration and seamless third-party connections.

Transform your business operations with drag-and-drop workflow builder that requires no coding expertise. KINETIK leverages state-of-the-art language models from Groq, Google Gemini, and Ollama to bring intelligence to every step of your automation process. Whether you're automating SQL queries, analyzing market data, or orchestrating complex multi-step processes, KINETIK provides the flexibility and power to handle it all.

With built-in support for conditional logic, human-in-the-loop approvals, and real-time execution monitoring, you maintain full control while letting AI do the heavy lifting. From data extraction to decision-making, KINETIK streamlines your workflows and accelerates your business outcomes.

### ✨ Key Features

- 🤖 **AI-Powered Automation** - Deploy intelligent agents that learn and adapt to your business processes
- ⚡ **Real-time Processing** - Lightning-fast data processing with instant insights and actions
- 🔒 **Enterprise Security** - Bank-grade security with end-to-end encryption and JWT authentication
- 🔄 **Seamless Integration** - Connect with 200+ tools and platforms in your existing workflow
- 📊 **Advanced Analytics** - Deep insights and predictive analytics powered by machine learning
- 👥 **Team Collaboration** - Built for teams with roles, permissions, and shared workspaces
- 🎨 **Visual Workflow Builder** - Drag-and-drop interface for creating complex automation flows
- 🔍 **SQL Query Generation** - AI-powered SQL query generation and execution
- 📈 **Market Research** - Automated market data analysis and news aggregation
- 💬 **Telegram Integration** - Send notifications and reports directly to Telegram

---

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT with Passport.js
- **AI/ML**: LangChain, LangGraph
- **LLM Providers**: 
  - Groq (llama-3.3-70b-versatile)
  - Google Gemini (gemini-2.5-flash-lite)
  - Ollama (llama3.2)
- **API Integrations**:
  - Alpha Vantage (Market Data)
  - Alpaca (Trading)
  - Telegram Bot API

#### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Components**: Shadcn/UI + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios

#### Workflow Engine
- **Graph Execution**: LangGraph (StateGraph)
- **State Management**: Memory Saver for checkpointing
- **Node Types**:
  - Trigger Nodes (SQL Query, Market Research)
  - Action Nodes (LLM, SQL Generator/Executor, Asset Data, News Data)
  - Control Flow (Condition, Approval)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Git**

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/kinetik.git
cd kinetik
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Install Dependencies
```bash
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kinetik"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# LLM Configuration
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="llama-3.3-70b-versatile"
GROQ_MODEL_PROVIDER="groq"

GOOGLE_API_KEY="your-google-api-key"
GEMINI_MODEL="gemini-2.5-flash-lite"
GEMINI_MODEL_PROVIDER="google-genai"

OLLAMA_MODEL="llama3.2"
OLLAMA_MODEL_PROVIDER="ollama"

# Search & Web Scraping
TAVILY_API_KEY="your-tavily-api-key"

# SQL Database (for workflow SQL operations)
SQL_DATABASE_URL="postgresql://username:password@localhost:5432/target_db"

# Market Data APIs
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"
ALPACA_API_KEY="your-alpaca-key"
ALPACA_API_SECRET="your-alpaca-secret"

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-telegram-chat-id"

# Environment
NODE_ENV="development"
```

#### Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

#### Start Backend Server

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The backend API will be available at `http://localhost:3000`

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../frontend
```

#### Install Dependencies
```bash
npm install
```

#### Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="KINETIK"
```

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend application will be available at `http://localhost:3001`

---

## 🎯 Usage

### Creating Your First Workflow

1. **Sign Up / Login**
   - Navigate to `http://localhost:3001`
   - Create an account or login with existing credentials

2. **Create a New Workflow**
   - Click on "Create Workflow" button
   - Provide a descriptive name (e.g., `customer-data-analysis`)
   - Add an optional description

3. **Build Your Workflow**
   - **Add Trigger Node**: Choose from SQL Query Trigger or Market Research Trigger
   - **Add Action Nodes**: Drag and drop nodes like:
     - SQL Generator
     - SQL Executor
     - LLM Node (for AI processing)
     - Condition Node (for branching logic)
     - Approval Node (for human-in-the-loop)
   - **Connect Nodes**: Draw connections between nodes to define execution flow

4. **Configure Nodes**
   - Click on each node to configure its parameters
   - Set up database connections, API keys, or AI prompts as needed

5. **Execute Workflow**
   - Click "Run Workflow"
   - Provide required input parameters
   - Monitor execution in real-time

### Example Workflows

#### SQL Analysis Workflow
```
SQL Query Trigger → SQL Generator (AI) → Approval → SQL Executor → LLM Analysis → Output
```

#### Market Research Workflow
```
Market Research Trigger → Asset Data → News Data → LLM Analysis → Telegram Notification
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<!-- <div align="center">

**Built with ❤️ by the KINETIK Team**

⭐ Star us on GitHub — it helps!

</div> -->