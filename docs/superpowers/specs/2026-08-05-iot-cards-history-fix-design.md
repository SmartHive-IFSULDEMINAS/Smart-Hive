# IoT: upload JSON, histórico por colmeia e atualização de cards — design

## Contexto

O time reportou três pedidos em torno do fluxo de dados IoT das colmeias:

1. Poder subir arquivos JSON gravados localmente para atualizar colmeias manualmente (fluxo "offline first": grava local, depois sobe pra plataforma).
2. Ver o histórico de coleta de dados por colmeia via gráfico — reclamação de que só dava pra ver as últimas informações.
3. Atualizar os cards automaticamente quando chega um dado novo, sem precisar dar F5.

Uma revisão ao vivo da aplicação (feita em 2026-08-05, com dados de exemplo semeados no banco local) mostrou que os itens 1 e 2 já estão praticamente implementados no commit `3e149b2` ("Add IoT JSON upload and history views"):

- **Upload de JSON**: testado end-to-end (upload via UI de um arquivo com 4 leituras em datas diferentes) — funciona corretamente, preserva os timestamps informados.
- **Histórico por colmeia (gráfico dedicado)**: a página `/historico-ruido` (`HistoricoRuido.jsx`) já permite escolher colmeia, métrica e período, e renderiza corretamente um gráfico com múltiplas leituras ao longo do tempo. Testado com 64 leituras espalhadas em ~3 dias — funciona.
- **Atualização automática (item 3)**: já existe polling de 30s tanto no Dashboard quanto na tela de Colmeias, mas com bugs que quebram a experiência (detalhados abaixo).

Este spec cobre **apenas os bugs e ajustes pontuais** encontrados nessa revisão — não uma reimplementação das features 1 e 2, que já funcionam.

## Bugs encontrados

### Bug A — histórico embutido no dialog de detalhes sempre vazio

Em `frontend/src/pages/Colmeias.jsx`, o dialog "Ver detalhes" de uma colmeia tem uma mini-visualização de histórico com abas por métrica. O estado inicial da aba selecionada é:

```js
const [iotTab, setIotTab] = useState('temperature');
```

mas as abas reais (e as chaves dos dados retornados pela API) usam nomes em português:

```jsx
<Tab value="temperatura" label="Temperatura" />
<Tab value="nivel_ruido" label="Ruído" />
...
```

Como `'temperature' !== 'temperatura'`, nenhuma aba fica selecionada de fato e o filtro `iotHistory.filter(item => item[iotTab] !== null...)` nunca encontra a chave `'temperature'` nos dados (que só têm `temperatura`, `nivel_ruido` etc). Resultado: toda vez que a pessoa abre os detalhes de uma colmeia, o histórico aparece como "Sem leituras suficientes para esta métrica" — mesmo havendo dezenas de leituras — até clicar manualmente em outra aba. Isso é exatamente o sintoma relatado ("só dá pra ver as últimas informações").

Console do navegador também acusa o erro do MUI: `The value provided to the Tabs component is invalid`.

**Fix:** trocar o estado inicial para `'temperatura'`.

### Bug B — tabela de Colmeias pisca a cada ciclo de polling

Em `Colmeias.jsx`:

```js
useEffect(() => {
    const intervalId = setInterval(() => {
        fetchData();
    }, 30000);
    return () => clearInterval(intervalId);
}, []);
```

`fetchData` sempre executa `setLoading(true)` no início, então a cada 30s a tabela inteira é substituída por linhas de skeleton por um instante — mesmo quando os dados não mudaram. Isso já é melhor que exigir F5, mas cria uma sensação de instabilidade/lentidão bem perceptível.

O Dashboard (`Dashboard.jsx`) já resolve esse mesmo problema com um segundo parâmetro:

```js
const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    ...
};
```

**Fix:** aplicar o mesmo padrão em `Colmeias.jsx` — atualizações de polling em segundo plano não devem acionar o estado de `loading` (skeleton), só trocar os dados quando a resposta chega.

## Ajuste — intervalo de polling

Intervalo atual: 30s tanto no Dashboard (`DASHBOARD_REFRESH_MS`) quanto em Colmeias. Não é push real-time (fora de escopo — exigiria WebSocket/SSE e mudança de arquitetura no backend), mas o time optou por reduzir o intervalo para deixar a atualização "quase imperceptível" combinada com o fix do Bug B.

**Fix:** reduzir de `30000` para `10000` ms nos dois lugares.

## Fora de escopo

- Reimplementar upload de JSON ou o histórico por gráfico — já funcionam.
- Push real-time via WebSocket/SSE — descartado nesta rodada; polling de 10s + fix do flicker é suficiente para a queixa atual.
- O bug cosmético "Data de Instalação: Invalid Date" observado no dialog de detalhes durante os testes (não relacionado aos três pedidos, aparenta ser um problema de formatação de data pré-existente) — não incluído aqui.

## Arquivos afetados

- `frontend/src/pages/Colmeias.jsx` — fix do `iotTab` inicial, fix do flicker de polling, redução do intervalo.
- `frontend/src/pages/Dashboard.jsx` — redução do intervalo (`DASHBOARD_REFRESH_MS`).

Nenhuma mudança de backend é necessária.

## Testes

- Manual: reabrir o dialog de detalhes de uma colmeia com leituras existentes e confirmar que o gráfico de "Temperatura" aparece populado sem precisar trocar de aba.
- Manual: observar a tela de Colmeias por >10s e confirmar que a tabela não volta a exibir skeleton enquanto há dados carregados.
- Manual: subir uma leitura nova via `POST /api/iot/colmeia/dados/` (ou re-upload de JSON) e confirmar que o card correspondente atualiza sozinho em até ~10s, sem F5.
