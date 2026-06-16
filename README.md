# 🎢 Theme Park Analytics
<img width="100%" style="border-radius: 8px; margin-bottom: 20px;" alt="Luis Fernando - Banner de Capa" src="https://github.com/user-attachments/assets/6803a02d-d690-4ffb-b1ef-9bf440198d4e" />
<div align="center">

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-ef233c?style=for-the-badge)

**PT-BR** | [English below ↓](#-theme-park-analytics-1)

Aplicação web para análise de filas e lotação em parques temáticos ao redor do mundo — dados históricos, heatmaps, calendário de lotação e status em tempo real.

**[▶ Ver Demo](https://theme-park-analytics.vercel.app)** · **[API →](https://github.com/LuisFTacla/theme-park-analytics-api)**

</div>

---

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Stack Técnica](#stack-técnica)
- [Arquitetura](#arquitetura)
- [Configuração Local](#configuração-local)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Roadmap](#roadmap)
- [Histórico de Versões](#histórico-de-versões)

---

## Funcionalidades

### ⚡ Hoje no Parque (Tempo Real)
- Status ao vivo de todas as atrações (aberta / fechada)
- Ranking das **maiores filas no momento**
- Gráfico de **evolução minuto a minuto** da fila geral do dia
- **Heatmap interativo** por atração com intervalos configuráveis (15, 30 ou 60 min)
- Seletor de data para visualizar qualquer dia histórico no mesmo layout

### 📊 Movimento por Atração
- Gráfico de barras com **médias históricas de espera por hora do dia**
- Seletor de atração com destaque automático nos **3 horários de maior pico**

### 📅 Calendário de Lotação
- Heatmap anual com **uma célula por dia**, colorida pela média geral de espera
- Seletor de ano (quando há múltiplos anos no histórico)
- Legenda clara com escala de 5 níveis: Vazio → Lotado

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Estilo | Tailwind CSS + design system próprio |
| Roteamento | React Router v6 |
| Gráficos | Recharts |
| Animações | Framer Motion |
| Ícones | Lucide React |
| Fontes | Space Mono (display) + DM Sans (corpo) |
| Deploy | Vercel |
| Dados | [theme-park-analytics-api](https://github.com/LuisFTacla/theme-park-analytics-api) |

---

## Arquitetura

```
src/
├── pages/          # Home (seleção de parque) e Dashboard (análise)
├── components/     # Componentes de visualização (charts, heatmap, calendar)
│   └── ui/         # Design system: Card, Badge, Skeleton, Spinner, ErrorMessage
├── hooks/          # useQuery (fetch genérico) e useLiveData (polling)
├── services/       # api.ts — cliente HTTP tipado para a REST API
├── types/          # Interfaces e tipos TypeScript
└── utils/          # Helpers: cores, formatação, labels
```

### Fluxo de Dados

```
Usuário seleciona parque
        │
        ▼
  React Router → /park/:parkId
        │
        ▼
  Dashboard.tsx
   ├── useQuery → api.getLive()         → LiveRidesSection
   ├── useQuery → api.getEvolution()    → EvolutionChart
   ├── useQuery → api.getHeatmap()      → HeatmapGrid
   ├── useQuery → api.getHourlyAverages() → HourlyChart
   └── useQuery → api.getCalendar()    → CalendarGrid
```

---

## Configuração Local

### Pré-requisitos

- Node.js 18+
- A [API](https://github.com/LuisFTacla/theme-park-analytics-api) rodando localmente ou em produção

### Instalação

```bash
# Clone o repositório
git clone https://github.com/LuisFTacla/theme-park-analytics.git
cd theme-park-analytics

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

Edite o `.env`:

```env
# URL da API backend (deixe em branco para usar o proxy do Vite em dev)
VITE_API_URL=http://localhost:3001/api

# Em produção, aponte para a API deployada:
# VITE_API_URL=https://sua-api.onrender.com/api
```

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
npm run preview
```

---

## Estrutura do Projeto

```
theme-park-analytics/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.tsx                        # Roteamento principal
│   ├── main.tsx                       # Entry point React
│   ├── index.css                      # Estilos globais + Tailwind
│   ├── components/
│   │   ├── ui/
│   │   │   └── index.tsx              # Card, Badge, Skeleton, Spinner, ErrorMessage, EmptyState
│   │   ├── CalendarGrid.tsx           # Calendário anual de lotação
│   │   ├── EvolutionChart.tsx         # Gráfico de linha — evolução do dia
│   │   ├── HeatmapGrid.tsx            # Heatmap SVG — atrações × horário
│   │   ├── HourlyChart.tsx            # Gráfico de barras — médias históricas
│   │   └── LiveRidesSection.tsx       # Cards ao vivo com animações
│   ├── hooks/
│   │   ├── useQuery.ts                # Hook genérico de fetch com loading/error
│   │   └── useLiveData.ts             # Hook com polling a cada 60s
│   ├── pages/
│   │   ├── Home.tsx                   # Página inicial com seleção de parque
│   │   └── Dashboard.tsx              # Dashboard de análise por parque
│   ├── services/
│   │   └── api.ts                     # Cliente HTTP tipado
│   ├── types/
│   │   └── index.ts                   # Interfaces e tipos globais
│   └── utils/
│       └── index.ts                   # waitTimeColor, formatadores, labels
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## Roadmap

- [ ] Expansão da limpeza de dados para parques internacionais (Disney, Universal, etc.)
- [ ] Modelos de Machine Learning para predição de filas futuras
- [ ] Autenticação de usuários com histórico de parques favoritos
- [ ] PWA com notificações push para alertas de pico em tempo real
- [ ] Modo comparação entre dois dias ou dois parques

---

## Histórico de Versões

<details>
<summary><strong>v2.0</strong> — Atual</summary>

- 🏗️ Migração completa do Streamlit monolítico para React + TypeScript + API REST dedicada
- 🎨 Design system próprio com tipografia, paleta e tokens visuais consistentes
- ⚡ SPA com navegação instantânea via React Router
- 📦 Arquitetura baseada em componentes isolados e hooks customizados
- 🔌 Back-end desacoplado com cache e estrutura escalável
- 📱 Responsividade real via Tailwind CSS

</details>

<details>
<summary><strong>v1.1</strong></summary>

- ⚡ Migração de agregações para o servidor — redução de 95% no tráfego de dados
- 🌡️ Heatmap dinâmico com consulta de datas passadas e intervalo configurável (15m, 30m, 1h)
- 🚫 Detecção de paradas técnicas (fila = 0)
- 📱 UX responsiva aprimorada
- 📜 Painel de changelog

</details>

<details>
<summary><strong>v1.0</strong></summary>

- 🌍 Suporte a parques internacionais com mapeamento de fusos horários
- 🔴 Aba "Hoje no Parque" com dados em tempo real
- 📖 Documentação integrada na tela inicial

</details>

<details>
<summary><strong>v0.1</strong> — MVP</summary>

- 🎡 Projeto piloto exclusivo para o Beto Carrero World
- 📊 Médias horárias históricas por atração
- 📅 Heatmap anual de lotação

</details>

---

<br />
<br />

---

# 🎢 Theme Park Analytics

<div align="center">

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-ef233c?style=for-the-badge)

[PT-BR acima ↑](#-theme-park-analytics) | **English**

Web application for queue and crowd analysis at theme parks worldwide — historical data, heatmaps, crowd calendars, and real-time status.

**[▶ Live Demo](https://theme-park-analytics.vercel.app)** · **[API →](https://github.com/LuisFTacla/theme-park-analytics-api)**

</div>

---

## 📋 Table of Contents

- [Screenshots](#screenshots-1)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture-1)
- [Local Setup](#local-setup-1)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap-1)
- [Changelog](#changelog)

---

## Screenshots

> 💡 *Add application screenshots here. Suggested: Home, Dashboard → "Today" tab, Heatmap and Calendar.*

| Home | Today at the Park |
|------|------------------|
| ![Home](./docs/screenshot-home.png) | ![Dashboard](./docs/screenshot-dashboard.png) |

| Historical Averages | Crowd Calendar |
|---------------------|----------------|
| ![Hourly](./docs/screenshot-hourly.png) | ![Calendar](./docs/screenshot-calendar.png) |

---

## Features

### ⚡ Today at the Park (Real-Time)
- Live status for all rides (open / closed)
- Ranking of the **longest queues right now**
- **Minute-by-minute line chart** of the day's overall queue evolution
- **Interactive heatmap** per ride with configurable intervals (15, 30, or 60 min)
- Date picker to view any historical day in the same layout

### 📊 Ride Traffic
- Bar chart with **historical average wait times by hour of day**
- Ride selector with automatic highlighting of the **top 3 peak hours**

### 📅 Crowd Calendar
- Annual heatmap with **one cell per day**, colored by the overall average wait
- Year selector (when multiple years of history are available)
- Clear 5-level legend: Empty → Packed

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + custom design system |
| Routing | React Router v6 |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Fonts | Space Mono (display) + DM Sans (body) |
| Deploy | Vercel |
| Data | [theme-park-analytics-api](https://github.com/LuisFTacla/theme-park-analytics-api) |

---

## Architecture

```
src/
├── pages/          # Home (park selection) and Dashboard (analysis)
├── components/     # Visualization components (charts, heatmap, calendar)
│   └── ui/         # Design system: Card, Badge, Skeleton, Spinner, ErrorMessage
├── hooks/          # useQuery (generic fetch) and useLiveData (polling)
├── services/       # api.ts — typed HTTP client for the REST API
├── types/          # TypeScript interfaces and types
└── utils/          # Helpers: colors, formatting, labels
```

### Data Flow

```
User selects park
        │
        ▼
  React Router → /park/:parkId
        │
        ▼
  Dashboard.tsx
   ├── useQuery → api.getLive()            → LiveRidesSection
   ├── useQuery → api.getEvolution()       → EvolutionChart
   ├── useQuery → api.getHeatmap()         → HeatmapGrid
   ├── useQuery → api.getHourlyAverages()  → HourlyChart
   └── useQuery → api.getCalendar()        → CalendarGrid
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- The [API](https://github.com/LuisFTacla/theme-park-analytics-api) running locally or deployed

### Installation

```bash
# Clone the repository
git clone https://github.com/LuisFTacla/theme-park-analytics.git
cd theme-park-analytics

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit `.env`:

```env
# Backend API URL (leave blank to use Vite's dev proxy)
VITE_API_URL=http://localhost:3001/api

# In production, point to your deployed API:
# VITE_API_URL=https://your-api.onrender.com/api
```

```bash
# Start the development server
npm run dev

# Production build
npm run build
npm run preview
```

---

## Project Structure

```
theme-park-analytics/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.tsx                        # Main routing
│   ├── main.tsx                       # React entry point
│   ├── index.css                      # Global styles + Tailwind
│   ├── components/
│   │   ├── ui/
│   │   │   └── index.tsx              # Card, Badge, Skeleton, Spinner, ErrorMessage, EmptyState
│   │   ├── CalendarGrid.tsx           # Annual crowd calendar
│   │   ├── EvolutionChart.tsx         # Line chart — day evolution
│   │   ├── HeatmapGrid.tsx            # SVG heatmap — rides × time
│   │   ├── HourlyChart.tsx            # Bar chart — historical averages
│   │   └── LiveRidesSection.tsx       # Animated live ride cards
│   ├── hooks/
│   │   ├── useQuery.ts                # Generic fetch hook with loading/error
│   │   └── useLiveData.ts             # Hook with 60s polling
│   ├── pages/
│   │   ├── Home.tsx                   # Landing page with park selector
│   │   └── Dashboard.tsx              # Per-park analytics dashboard
│   ├── services/
│   │   └── api.ts                     # Typed HTTP client
│   ├── types/
│   │   └── index.ts                   # Global interfaces and types
│   └── utils/
│       └── index.ts                   # waitTimeColor, formatters, labels
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## Roadmap

- [ ] Data quality expansion for international parks (Disney, Universal, etc.)
- [ ] Machine Learning models for future queue prediction
- [ ] User authentication with favorite parks history
- [ ] PWA with push notifications for real-time crowd alerts
- [ ] Comparison mode between two days or two parks

---

## Changelog

<details>
<summary><strong>v2.0</strong> — Current</summary>

- 🏗️ Full migration from monolithic Streamlit to React + TypeScript + dedicated REST API
- 🎨 Custom design system with consistent typography, color palette, and visual tokens
- ⚡ SPA with instant navigation via React Router
- 📦 Component-based architecture with isolated components and custom hooks
- 🔌 Decoupled backend with caching and scalable structure
- 📱 True responsiveness via Tailwind CSS

</details>

<details>
<summary><strong>v1.1</strong></summary>

- ⚡ Server-side aggregations — 95% reduction in data traffic
- 🌡️ Dynamic heatmap with historical date queries and configurable interval (15m, 30m, 1h)
- 🚫 Technical downtime detection (queue = 0)
- 📱 Improved responsive UX
- 📜 Changelog panel

</details>

<details>
<summary><strong>v1.0</strong></summary>

- 🌍 International park support with timezone mapping
- 🔴 "Today at the Park" tab with real-time data
- 📖 Integrated documentation on the landing page

</details>

<details>
<summary><strong>v0.1</strong> — MVP</summary>

- 🎡 Pilot project exclusively for Beto Carrero World
- 📊 Historical hourly averages per ride
- 📅 Annual crowd heatmap

</details>

---

<div align="center">
  <sub>Built by <a href="https://www.linkedin.com/in/luis-fernando-melnek-tacla/">Luis Fernando Melnek Tacla</a> · Powered by Queue-Times.com · Google BigQuery · AWS Lambda · Vercel</sub>
</div>
