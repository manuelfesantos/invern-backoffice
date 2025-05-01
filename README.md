# Invern Spirit Backoffice Administration

A React-based backoffice application designed to manage various aspects of the Invern Spirit platform, including products, collections, countries, and currencies. It utilizes Vite for fast development and builds, TypeScript for type safety, Tailwind CSS with Shadcn UI for styling and components, and Zod for robust form validation.

---

## ✨ Features

- **CRUD Operations:** Manage Products, Collections, Countries, and Currencies.
- **Data Tables:** Display lists of entities with reusable table components (`DataTableWrapper`).
- **Dynamic Forms:** Configuration-driven forms (`DomainForm`) using `react-hook-form` and Zod schemas for validation.
    - Automatic fetching of data for dropdowns/comboboxes (e.g., fetching currencies for the country form).
    - Intelligent field connections: Auto-populating related fields based on user input (e.g., filling name/symbol when a currency code is selected).
    - Automatic field calculations: Fetching external data to populate fields (e.g., fetching exchange rates).
- **Theming:** Light/Dark mode toggle with persistence using `localStorage`.
- **Responsive Design:** Adapts to different screen sizes with a collapsible sidebar for mobile.
- **API Integration:** Communicates with a backend API (specified via `VITE_API_URL`).
    - Handles API responses and errors gracefully.
    - Uses Cloudflare Access credentials (`VITE_ADMIN_CLIENT_ID`, `VITE_ADMIN_CLIENT_SECRET`) for secure backend access.
- **Notifications:** Uses `sonner` for displaying success/error toasts.
- **Code Quality:** Uses ESLint for linting and Prettier for code formatting.
- **Local HTTPS:** Configured for local development using HTTPS via `mkcert`.

## 🚀 Tech Stack

- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** TypeScript
- **Package Manager:** Bun
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Routing:** `react-router-dom` v6
- **Forms:** `react-hook-form`, Zod
- **State Management:** React Context & local state (`useState`, `useEffect`)
- **API Client:** Native `fetch` API
- **Icons:** `lucide-react`
- **Notifications:** `sonner`
- **Utilities:** `clsx`, `tailwind-merge` (via `cn`)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Bun:** Required for dependency management and scripts. [Install Bun](https://bun.sh/docs/installation)
- **Node.js:** Optional, but useful for additional tooling. [Download Node.js](https://nodejs.org/)
- **Git:** For cloning the repository.
- **mkcert:** For generating local TLS certificates. [mkcert Installation Guide](https://github.com/FiloSottile/mkcert#installation)

## ⚙️ Configuration

The application requires environment variables to function correctly.

1. Create a `.env` file in the project root.
2. Add the following variables, replacing placeholders with your values:

```dotenv
# Base URL of the backend API
VITE_API_URL=https://api-local.invernspirit.com

# Cloudflare Access credentials
VITE_ADMIN_CLIENT_ID=YOUR_CLOUDFLARE_CLIENT_ID
VITE_ADMIN_CLIENT_SECRET=YOUR_CLOUDFLARE_CLIENT_SECRET

# ExchangeRate-API key
VITE_EXCHANGE_RATE_API_KEY=YOUR_EXCHANGERATE_API_KEY
```

> **Note:** Add generated TLS certificate files (`localhost+2.pem`, `localhost+2-key.pem`) to `.gitignore` to avoid committing them.

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Configure Environment Variables:**

    - Create a `.env` file in the project root.
    - Add the variables as described in the [Configuration](#⚙️-configuration) section.

4. **Generate Local HTTPS Certificates:**
   ```bash
   mkcert localhost 127.0.0.1 ::1 localhost+2
   ```
   This will create:
    - `localhost+2.pem` (Certificate)
    - `localhost+2-key.pem` (Private Key)

   Place these files in the project root and add them to `.gitignore`.

## 💻 Running the Application (Development)

```bash
bun dev
```

Open your browser at `https://localhost:8081` (or the URL shown in terminal).

## 📦 Building for Production

```bash
bun run build
```

- Outputs static files to `dist/`.
- To preview locally:

```bash
bun run preview
```

Typically served at `https://localhost:8081`.

## 📁 Project Structure

```
shadcn-test/
├── public/               # Static assets
├── src/
│   ├── components/
│   │   ├── domain/       # Domain-specific components (e.g., DomainForm)
│   │   ├── layout/       # Layout components (PageWrapper, DataTableWrapper)
│   │   ├── ui/           # Shadcn UI components
│   │   ├── Navbar.tsx    # Top navigation bar
│   │   └── Sidebar.tsx   # Collapsible sidebar
│   ├── config/forms/     # Form configuration (validation, fields, API mapping)
│   ├── data/             # Static lookup data (countries, currencies)
│   ├── lib/              # Utility functions (e.g., cn)
│   ├── pages/            # Route components
│   ├── services/         # API interaction logic
│   ├── types/            # Type definitions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles, Tailwind directives
├── .env                  # Environment variables
├── .gitignore            # Untracked files
├── bun.lockb             # Bun lockfile
├── components.json       # Shadcn UI config
├── index.html            # Vite HTML template
├── package.json          # Project metadata & scripts
├── tsconfig*.json        # TypeScript configs
├── vite.config.ts        # Vite config (plugins, HTTPS)
└── README.md             # This file
```

## 🔑 Key Concepts & Components

- **PageWrapper** (`src/components/layout/PageWrapper.tsx`): Provides page structure with titles and action buttons.
- **DataTableWrapper** (`src/components/layout/DataTableWrapper.tsx`): Renders data tables with loading, errors, and customizable columns.
- **DomainForm** (`src/components/domain/DomainForm.tsx`): Reusable, configuration-driven form with data fetching, Zod validation, and automatic behaviors.
- **Form Configs** (`src/config/forms/*.config.ts`): Define fields, validation schemas, API endpoints, and advanced behaviors (dependencies, connections, calculations).
- **API Service** (`src/services/api.ts`): Centralizes backend communication, authentication headers, and response handling.
- **Shadcn UI** (`src/components/ui/`): Provides styled UI primitives customized via Tailwind.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add feature"
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request.

Ensure your code adheres to existing style and passes linting.

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

