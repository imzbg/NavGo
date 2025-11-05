# NavGo

Refatoração & Reescrita da Aplicação Web antes desenvolvida com NextJS que simulava um GPS Online.

---

## Recursos principais

- Autenticacao simples (registro e login) com armazenamento em JSON.
- Busca de enderecos via Nominatim com sugestoes em tempo real.
- Calculo de rotas usando OSRM, exibindo alternativas com duracao e distancia.
- Mapa interativo em Leaflet com atualizacao da posicao e marcadores.
- Persistencia local (localStorage) de rotas, preferencias e perfil.
- Aplicativo Android via Capacitor com suporte a requisicoes HTTP nativas.

---

## Tecnologias

| Camada | Tecnologias |
|--------|-------------|
| Front-end | React 18, Vite, Ionic React, Leaflet, Capacitor |
| Back-end | Node.js, Express, node-fetch, dotenv |
| Ferramentas | TypeScript, npm, Android Studio (Capacitor) |

---

## Estrutura do projeto

```
NavGo/
├─ app/                # Front-end (React + Vite + Capacitor)
│  ├─ src/
│  │  ├─ assets/       # logo, estilos globais
│  │  ├─ components/   # AddressInput, BottomNav, etc.
│  │  ├─ pages/        # LoginPage, MapPage, RoutesPage, ProfilePage, SettingsPage
│  │  └─ services/     # consumo da API (CapacitorHttp / fetch)
│  └─ android/         # projeto Android gerado pelo Capacitor
├─ server/             # API Express (auth, rotas, geocode, incidents)
│  ├─ data/            # JSON simples para usuarios, preferencias e incidentes
│  └─ index.js         # servidor principal
└─ README.md           # este arquivo
```

---

## Como executar

### 1. Backend

```bash
cd server
npm install
npm run dev   # ou: node index.js
```

O servidor sobe por padrao em `http://localhost:4000` (veja `.env` para ajustar host/porta).

### 2. Front-end (web/capacitor)

```bash
cd app
npm install
npm run dev
```

Aplicacao disponivel em `http://localhost:5173`.

---

## Build e sincronizacao Android

1. Gere os assets web:
   ```bash
   cd app
   npm run build
   ```
2. Copie os assets para o projeto nativo:
   ```bash
   npx cap copy android
   ```
3. Abra `app/android` no Android Studio, limpe e reconstrua o projeto (`Build > Clean Project`, depois `Build > Rebuild Project`).
4. Execute no emulador. Em emulador use `http://10.0.2.2:4000`; em dispositivo real, configure o IP da maquina hospedeira nas variaveis `.env`.

---

## Variaveis importantes

- `app/.env` define `VITE_API_BASE_URL` (ex.: `http://10.0.2.2:4000`).
- `server/.env` define porta, URL do OSRM (`OSRM_URL`), host e demais flags.

---

## Equipe

- Bruno de Souza
- Pedro Emilio Martinelli
- Viny Wottrich

---
