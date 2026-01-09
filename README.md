# UI Test GSM

## Development

Run the dev server:

```
npm install
npm run dev
```

## Configuration

All API endpoints are centralized and driven by environment variables. Do not hardcode URLs in components.

1. Create a `.env.local` at the project root (git-ignored) by copying `.env.example`:

```
copy .env.example .env.local
```

2. Edit values as needed:

```
VITE_API_TEST_GSM_BASE=http://localhost:5001
VITE_API_DATA_BASE=http://localhost:5002
```

3. Endpoint resolution lives in `src/config/apiConfig.js` and API calls in `src/services/*`.

Components should only consume services/config, e.g. the footer uses `checkGsmHealth()` without embedding URLs.
