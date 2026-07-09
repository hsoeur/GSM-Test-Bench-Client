# UI Test GSM

## Development

Run the dev server:

```bash
npm install
npm run dev
```

## Runtime Configuration

The React build does not contain deployment-specific values anymore.
Configuration is loaded by the browser from:

```text
/config/runtime-config.json
```

Change API URLs, product status UIDs, machine UID, product-to-sequence mappings,
print-label mappings, or API status polling values in
`public/config/runtime-config.json`.

With Docker, you can either:

- mount a config folder with your own `runtime-config.json`;
- or set container environment variables such as `API_DATA_BASE`,
  `API_MO_BASE`, `API_PRINT_BASE`, `PRODUCT_STATUS_KO_UID`, and `MACHINE_UID`.

When environment variables are provided, the container startup script generates
`/usr/share/nginx/html/config/runtime-config.json`. You only need to restart the
container after changing values, not rebuild the React project.

Example:

```yaml
environment:
  API_TEST_GSM_BASE: http://localhost:5001
  API_DATA_BASE: http://192.168.1.104:10000
  API_MO_BASE: http://192.168.1.104:10000
  API_PRINT_BASE: http://192.168.1.104:7001
  PRODUCT_STATUS_OK_UID: OK
  PRODUCT_STATUS_KO_UID: NOK
  MACHINE_UID: MO03A
```

API endpoint resolution lives in `src/config/apiConfig.js` and runtime config
loading lives in `src/config/runtimeConfig.js`.
