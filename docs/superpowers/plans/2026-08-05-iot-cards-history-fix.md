# IoT Cards & History Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two frontend bugs in the hive (Colmeia) IoT views — an always-empty per-hive history chart and a flickering auto-refresh — and shorten the polling interval so sensor cards feel close to real-time without a page reload.

**Architecture:** Pure frontend fix, no backend or API changes. Two React components (`Colmeias.jsx`, `Dashboard.jsx`) get a state-initialization fix and a "background refresh" pattern already proven elsewhere in the codebase (`Dashboard.jsx`'s `fetchDashboard(isRefresh)`), then both get their polling interval shortened from 30s to 10s.

**Tech Stack:** React 19, MUI 7, Recharts, Vite dev server on :5173, Axios (`frontend/src/services/api.js`).

## Global Constraints

- No backend changes — endpoints already return the data needed (verified via live testing on 2026-08-05).
- No new dependencies, no new abstractions — this is a bug fix, not a refactor. Touch only the lines described below.
- Frontend has no test runner configured (`npm run lint` is the only automated check available) — verification steps in this plan are `npm run lint`, `npm run build`, and manual browser checks against the local dev server.
- UI strings stay in Brazilian Portuguese, matching the rest of the app.

---

### Task 1: Fix the mismatched default tab in the hive detail history widget

**Files:**
- Modify: `frontend/src/pages/Colmeias.jsx:130`

**Interfaces:**
- Consumes: nothing new — uses the existing `iotHistory` state (array of leitura objects with keys `temperatura`, `nivel_ruido`, `luminosidade`, `umidade`, `pressao`, `peso`) already populated by `loadIotHistory` (`Colmeias.jsx:284-300`).
- Produces: nothing new — this only fixes the initial value fed into the existing `iotTab` state, consumed by the `<Tabs value={iotTab} ...>` block at `Colmeias.jsx:970-977` and the `selectedIotHistory` filter at `Colmeias.jsx:302-308`.

**Context:** `Colmeias.jsx` has a "Ver detalhes" dialog per hive with a small history chart. Its tab state is initialized to the English string `'temperature'`:

```js
const [iotTab, setIotTab] = useState('temperature');
```

But every `<Tab>` in that widget and every key in the API response use the Portuguese name `'temperatura'`:

```jsx
<Tab value="temperatura" label="Temperatura" />
```

Because `'temperature' !== 'temperatura'`, MUI's `Tabs` renders with no tab actually selected, and `selectedIotHistory` (which filters `iotHistory` by `item[iotTab]`) always returns an empty array on first render — the chart shows "Sem leituras suficientes para esta métrica" every time the dialog opens, even when the hive has plenty of history. The browser console also logs an MUI warning: `The value provided to the Tabs component is invalid`.

- [ ] **Step 1: Make the fix**

In `frontend/src/pages/Colmeias.jsx`, change line 130:

```js
const [iotTab, setIotTab] = useState('temperature');
```

to:

```js
const [iotTab, setIotTab] = useState('temperatura');
```

- [ ] **Step 2: Verify with the running dev server**

Ensure the backend (`python manage.py runserver` from `backend/`) and frontend (`npm run dev` from `frontend/`) are running, and that at least one hive in the database has `sensor_iot_ativo=True` with several `LeituraSensor` rows (any hive with real sensor history works — if none exists, send a couple of readings via `POST http://127.0.0.1:8000/api/iot/colmeia/dados/` with a valid `token_iot`, or import a JSON batch through the "Importar JSON" button first).

In a browser, log in, go to **Colmeias**, open the 3-dot menu on a hive with sensor history, click **Ver detalhes**. Confirm:
- The **Temperatura** tab is visually selected (underlined) by default.
- The line chart renders immediately, without needing to click another tab first.
- No MUI "invalid Tabs value" warning appears in the browser console (DevTools → Console).

- [ ] **Step 3: Run lint**

```bash
cd frontend
npm run lint
```
Expected: no new errors introduced by this change.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Colmeias.jsx
git commit -m "fix: default hive-detail history tab to a valid metric key"
```

---

### Task 2: Stop the Colmeias table from flashing to a loading skeleton on every poll

**Files:**
- Modify: `frontend/src/pages/Colmeias.jsx:134-170` (the two mount/interval `useEffect`s and `fetchData`)

**Interfaces:**
- Consumes: existing `getColmeias`, `getApiarios`, `getEspecies` calls from `frontend/src/services/api.js` — signatures unchanged.
- Produces: `fetchData(isBackgroundRefresh = false)` — a new optional boolean parameter. Nothing outside this task calls `fetchData`, so no other file is affected by the signature change.

**Context:** Today, `fetchData` (`Colmeias.jsx:152-170`) always calls `setLoading(true)` at the start. The 30s polling `useEffect` (`Colmeias.jsx:138-144`) calls `fetchData()` with no arguments, so every single poll — even when nothing changed — wipes the table and re-renders `rowsPerPage` skeleton rows (`Colmeias.jsx:540-549`) before the real data comes back. `Dashboard.jsx` already solves the identical problem with a `fetchDashboard(isRefresh = false)` pattern (`Dashboard.jsx:253-270`) that only toggles a separate `refreshing` flag on background calls. This task ports that same pattern into `Colmeias.jsx`.

- [ ] **Step 1: Read the current code to confirm line numbers before editing**

```bash
cd frontend
sed -n '105,171p' src/pages/Colmeias.jsx
```
Confirm the `loading` state declaration (`Colmeias.jsx:110`), the two `useEffect`s (`Colmeias.jsx:134-144`), and `fetchData` (`Colmeias.jsx:152-170`) match what's described here. If line numbers drifted, adjust the edits below accordingly — the *content* being matched is what matters, not the line numbers.

- [ ] **Step 2: Add a `refreshing` state next to `loading`**

In `frontend/src/pages/Colmeias.jsx`, find:

```js
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
```

Replace with:

```js
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
```

- [ ] **Step 3: Make `fetchData` accept a background-refresh flag**

Find:

```js
    const fetchData = async () => {
        try {
            setLoading(true);
            const [colmeiasRes, apiariosRes, especiesRes] = await Promise.all([
                getColmeias(),
                getApiarios(),
                getEspecies(),
            ]);
            setColmeias(colmeiasRes.data.results || colmeiasRes.data);
            setApiarios(apiariosRes.data.results || apiariosRes.data);
            setEspecies(especiesRes.data.results || especiesRes.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
```

Replace with:

```js
    const fetchData = async (isBackgroundRefresh = false) => {
        try {
            if (isBackgroundRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const [colmeiasRes, apiariosRes, especiesRes] = await Promise.all([
                getColmeias(),
                getApiarios(),
                getEspecies(),
            ]);
            setColmeias(colmeiasRes.data.results || colmeiasRes.data);
            setApiarios(apiariosRes.data.results || apiariosRes.data);
            setEspecies(especiesRes.data.results || especiesRes.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
```

- [ ] **Step 4: Make the polling interval call `fetchData` in background mode**

Find:

```js
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData();
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);
```

Replace with:

```js
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData(true);
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);
```

(The interval value changes to `10000` in Task 3 — leave it at `30000` here so this task's diff stays focused on the flicker fix.)

- [ ] **Step 5: Verify manually**

With backend + frontend dev servers running and at least one hive present, open **Colmeias** in the browser, open DevTools → Elements, and watch the table for 35+ seconds (long enough to cross one 30s poll boundary). Confirm:
- The table rows stay rendered the whole time — no skeleton flash.
- Editing a hive's data in another tab (or waiting for a real sensor update) still shows up in the table after the next poll, proving the background refresh still updates data, just without the loading flicker.

- [ ] **Step 6: Run lint**

```bash
cd frontend
npm run lint
```
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Colmeias.jsx
git commit -m "fix: stop Colmeias table from flashing a loading skeleton on background polls"
```

---

### Task 3: Shorten the auto-refresh interval to 10 seconds

**Files:**
- Modify: `frontend/src/pages/Colmeias.jsx` (the `setInterval` from Task 2, Step 4)
- Modify: `frontend/src/pages/Dashboard.jsx:72` (`DASHBOARD_REFRESH_MS` constant)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — pure constant change.

**Context:** Both `Colmeias.jsx` and `Dashboard.jsx` poll every 30 seconds today. With Task 2's flicker fix in place, shortening the interval no longer costs a visible loading flash, so this task drops both to 10 seconds — sensor cards update roughly 3x faster without any push infrastructure.

- [ ] **Step 1: Shorten the Colmeias polling interval**

In `frontend/src/pages/Colmeias.jsx`, find (as left by Task 2):

```js
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData(true);
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);
```

Change `30000` to `10000`:

```js
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData(true);
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);
```

- [ ] **Step 2: Shorten the Dashboard polling interval**

In `frontend/src/pages/Dashboard.jsx`, find:

```js
const DASHBOARD_REFRESH_MS = 30000;
```

Change to:

```js
const DASHBOARD_REFRESH_MS = 10000;
```

- [ ] **Step 3: Verify end-to-end with a live sensor update**

With backend + frontend dev servers running:

1. Open **Dashboard** in the browser and find a hive card under "Monitoramento IoT em Tempo Real" (or open **Colmeias** if no card is visible yet).
2. In a terminal, send a new reading for that hive's `token_iot` (adjust identifiers/token to match your local data):
   ```bash
   curl -s -X POST http://127.0.0.1:8000/api/iot/colmeia/dados/ \
     -H "Content-Type: application/json" \
     -d '{"colmeia_identificador": "<IDENTIFICADOR>", "temperatura": 99.9, "nivel_ruido": 12.3}'
   ```
3. Watch the open browser tab **without reloading**. Confirm the temperature value on the card updates to `99.9°C` within about 10 seconds, and the table/cards do not flash to a loading state while doing so.

- [ ] **Step 4: Run lint and build**

```bash
cd frontend
npm run lint
npm run build
```
Expected: both succeed with no new errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Colmeias.jsx frontend/src/pages/Dashboard.jsx
git commit -m "perf: shorten dashboard and hive list auto-refresh interval to 10s"
```

---

## Self-Review Notes

- **Spec coverage:** Bug A (mismatched tab) → Task 1. Bug B (polling flicker) → Task 2. Polling interval reduction → Task 3. All three items from the design doc are covered; no backend task needed (confirmed no backend changes required).
- **Placeholder scan:** No TBD/TODO; every step has literal before/after code.
- **Type consistency:** `fetchData(isBackgroundRefresh = false)` introduced in Task 2 is used consistently in Task 3 (interval still calls `fetchData(true)`, only the delay constant changes). `refreshing` state introduced in Task 2 is not surfaced in the UI in this plan (no spinner requested) — it exists only to mirror the Dashboard's proven pattern and is available for a future visual indicator if wanted, but wiring a UI indicator is out of scope per the approved design.
