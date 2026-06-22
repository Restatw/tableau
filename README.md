# Tableau

A standalone web-based spreadsheet application built with **Univer**, **SheetJS**, **Vue 3**, and **Pinia**.  
No backend required — everything runs in the browser.

**Live:** [tableau.re95.org](https://tableau.re95.org)

---

## Features

- Full spreadsheet UI powered by Univer (canvas-rendered, formula bar, multi-sheet)
- Import `.xlsx` / `.xls` / `.csv` files via SheetJS
- Export the active workbook to `.xlsx`
- Internationalization — English (default), 繁體中文, 简体中文
- State management via Pinia (dirty tracking, filename, locale sync)

---

## Tech Stack

| Layer | Library | Purpose |
|---|---|---|
| UI Framework | Vue 3 (Composition API) | Component system |
| State | Pinia | Global store |
| Spreadsheet UI | Univer v0.5 | Canvas-rendered grid, formula bar |
| File I/O | SheetJS (xlsx) | Read / write Excel and CSV files |
| i18n | vue-i18n v9 | App-level translations |
| Build | Vite 5 | Dev server and production bundler |

---

## Project Structure

```
tableau/
├── index.html                   # SPA entry point
├── vite.config.js               # Vite config (chunk splitting, path alias)
├── package.json
└── src/
    ├── main.js                  # Mount Vue app; register Pinia + i18n
    ├── App.vue                  # Root layout: toolbar, editor, toast
    ├── styles/
    │   └── main.css             # Global styles (toolbar, buttons, toasts)
    ├── components/
    │   └── SpreadsheetEditor.vue  # Univer lifecycle (init, plugins, destroy)
    ├── stores/
    │   └── spreadsheet.js       # Pinia store: FUniver ref, filename, dirty flag
    ├── composables/
    │   ├── useFileIO.js         # SheetJS import/export + Univer snapshot conversion
    │   └── useToast.js          # Lightweight toast notification system
    └── i18n/
        ├── index.js             # createI18n instance (default: en)
        └── locales/
            ├── en.js            # English
            ├── zh-TW.js         # Traditional Chinese
            └── zh-CN.js         # Simplified Chinese
```

### Data Flow

```
Import .xlsx  →  SheetJS.read()  →  buildSnapshot()  →  Univer.createUnit()
Export .xlsx  →  FWorkbook.getSnapshot()  →  cellData2aoa()  →  SheetJS.writeFile()
Edit cell     →  fUniver.onCommandExecuted()  →  Pinia.markDirty()
Switch lang   →  vue-i18n locale  →  fWorkbook.setLocale()  (Univer synced)
```

### Univer Plugin Stack

Plugins must be registered in this order:

```js
UniverRenderEnginePlugin      // canvas rendering engine
UniverFormulaEnginePlugin     // formula calculation core
UniverUIPlugin                // base UI shell (mounted to #univer-container)
UniverDocsPlugin              // text/cell content model
UniverDocsUIPlugin            // text editing UI
UniverSheetsPlugin            // spreadsheet data model
UniverSheetsUIPlugin          // spreadsheet UI (grid, toolbar, context menu)
UniverSheetsFormulaPlugin     // formula evaluation for sheets
UniverSheetsFormulaUIPlugin   // formula bar UI  ← required for editing
UniverSheetsNumfmtPlugin      // number formatting
```

---

## Development

**Prerequisites:** Node.js 18+, npm 9+

```bash
# Install dependencies
npm install

# Start dev server (accessible on local network)
npm run dev
# → http://localhost:5173
# → http://<host-ip>:5173

# Production build
npm run build
# Output: dist/

# Preview production build locally
npm run preview
```

---

## Deployment

The app is deployed on a **Raspberry Pi 4** running nginx, proxied through Cloudflare.

### 1. Build

```bash
npm run build
```

### 2. Copy to web root

```bash
sudo cp -r dist/. /var/www/tableau.re95.org/
```

### 3. nginx config

Location: `/etc/nginx/sites-enabled/tableau.re95.org.conf`

```nginx
server {
    listen 443 ssl;
    server_name tableau.re95.org;

    ssl_certificate     /etc/letsencrypt/live/re95.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/re95.org/privkey.pem;

    include /etc/nginx/cloudflare-ips.conf;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/tableau.re95.org;
    index index.html;

    location ~* \.(?:js|css|woff2?|png|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Cloudflare DNS

Add a **CNAME** record in Cloudflare pointing `tableau` → your Pi's origin hostname (or an **A** record to the Pi's public IP), with **Proxy status: Proxied**.

> nginx is configured to accept only Cloudflare IP ranges (`/etc/nginx/cloudflare-ips.conf`). Direct connections to the Pi are rejected.

---

## Updating the Deployment

```bash
git pull origin main
npm install          # only if package.json changed
npm run build
sudo cp -r dist/. /var/www/tableau.re95.org/
```

---

## License

MIT
