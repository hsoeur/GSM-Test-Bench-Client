# UI Test GSM

## Development

Run the dev server:

```bash
npm install
npm run dev
```

## Runtime Configuration

The application has a single source of truth for runtime configuration:

```text
public/config/runtime-config.json
```

Change API URLs, product status UIDs, machine UID, product-to-sequence mappings,
print-label mappings, or API status polling values in
`public/config/runtime-config.json`.

The browser loads this file from `/config/runtime-config.json`. There are no
duplicate URL defaults in the React source code or Docker startup script.

With Docker, you can:

- mount a config folder with your own `runtime-config.json`;
- or replace the complete file with the `RUNTIME_CONFIG_JSON` environment
  variable.

Individual environment variables are intentionally not supported because they
would create a second set of default values. After changing a mounted
`runtime-config.json`, restart the container; rebuilding React is unnecessary.

API endpoint resolution lives in `src/config/apiConfig.js` and runtime config
loading lives in `src/config/runtimeConfig.js`.

For an isolated workstation where the browser and every API run on the same
machine, keep the `localhost` defaults above. These URLs are called by the
browser, so `localhost` refers to the workstation, not to the UI container.

## Machine and network printer routing

Each browser detects the unique production machine name before production can
start. The name is stored in local storage and can also be supplied in the URL:

```text
http://ui-test-gsm/?machine=PC-PRODUCTION-03
```

Printing uses `POST /api/Print/jobs`. Printer Prof must map the supplied
`machineName` to a network printer; this client never supplies a printer address.
The JSON body contains `jobId`, `machineName`, `manufacturingOrderUid`,
`productUid`, `uidUsage`, and `serialNumber`.

At startup, the client first calls `GET /api/Machine` on the local Test GSM API.
The returned `machineName` is saved automatically. The URL parameter, saved
value, and manual setup screen remain available as fallbacks when the local API
cannot provide the machine name.
