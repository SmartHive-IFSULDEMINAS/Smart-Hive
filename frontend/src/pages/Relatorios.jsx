import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Tabs,
    Tab,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Skeleton,
    Alert,
    useTheme,
} from '@mui/material';
import {
    Summarize as ReportsIcon,
    Place as PlaceIcon,
    Hive as HiveIcon,
    LocalFlorist as HoneyIcon,
    Grain as PolenIcon,
    Opacity as PropolisIcon,
    AttachMoney as FinanceiroIcon,
    FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import {
    getApiarios,
    getColmeias,
    getProducoes,
    getProducaoRelatorio,
    getColetasProduto,
    getCustos,
    getReceitas,
    exportApiarios,
    exportColmeias,
    exportProducao,
    exportColetasProduto,
    exportFinanceiro,
} from '../services/api';

const darkTooltipStyle = {
    background: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--chart-tooltip-border)',
    borderRadius: 10,
    fontSize: 13,
};

const COLORS = ['var(--chart-green)', 'var(--chart-blue)', 'var(--chart-orange)', 'var(--chart-gray)', 'var(--chart-red)', 'var(--chart-purple)'];

const STATUS_COLMEIA = [
    { value: 'ativa', label: 'Ativa' },
    { value: 'inativa', label: 'Inativa' },
    { value: 'quarentena', label: 'Em Quarentena' },
    { value: 'morta', label: 'Morta/Abandonada' },
];

const TIPO_MEL_OPTIONS = [
    { value: 'florada_silvestre', label: 'Florada Silvestre' },
    { value: 'laranjeira', label: 'Laranjeira' },
    { value: 'eucalipto', label: 'Eucalipto' },
    { value: 'assa_peixe', label: 'Assa-Peixe' },
    { value: 'cipo_uva', label: 'Cipó-Uva' },
    { value: 'multifloral', label: 'Multifloral' },
    { value: 'outro', label: 'Outro' },
];

const QUALIDADE_OPTIONS = [
    { value: 'extra', label: 'Extra' },
    { value: 'primeira', label: 'Primeira' },
    { value: 'segunda', label: 'Segunda' },
    { value: 'industrial', label: 'Industrial' },
];

const baixarArquivo = async (chamada, params, nomeBase, formato) => {
    const response = await chamada({ ...params, format: formato });
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const extensao = formato === 'pdf' ? 'pdf' : 'xlsx';
    link.href = url;
    link.download = `${nomeBase}_${new Date().toISOString().split('T')[0]}.${extensao}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

const agruparPorMes = (itens, campoData, campoValor) => {
    const grupos = itens.reduce((acc, item) => {
        const data = new Date(item[campoData]);
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[chave]) {
            acc[chave] = { chave, mes: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), valor: 0 };
        }
        acc[chave].valor += parseFloat(item[campoValor] || 0);
        return acc;
    }, {});
    return Object.values(grupos).sort((a, b) => a.chave.localeCompare(b.chave));
};

export default function Relatorios() {
    const theme = useTheme();
    const { canViewReports } = useAuth();
    const [aba, setAba] = useState('apiarios');
    const [apiarios, setApiarios] = useState([]);
    const [colmeias, setColmeias] = useState([]);
    const [linhas, setLinhas] = useState([]);
    const [relatorioMel, setRelatorioMel] = useState(null);
    const [custos, setCustos] = useState([]);
    const [receitas, setReceitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [exportando, setExportando] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [filtros, setFiltros] = useState({
        ativo: '', apiario: '', status: '', colmeia: '',
        tipo_mel: '', qualidade: '', data_inicio: '', data_fim: '',
    });

    useEffect(() => {
        Promise.all([getApiarios(), getColmeias()]).then(([apRes, colRes]) => {
            setApiarios(apRes.data.results || apRes.data);
            setColmeias(colRes.data.results || colRes.data);
        }).catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        setPage(0);
    }, [aba]);

    const filtrosLimpos = useMemo(() => {
        const limpos = {};
        Object.entries(filtros).forEach(([chave, valor]) => { if (valor !== '') limpos[chave] = valor; });
        return limpos;
    }, [filtros]);

    useEffect(() => {
        const carregar = async () => {
            try {
                setLoading(true);
                setErro(null);

                if (aba === 'apiarios') {
                    const res = await getApiarios(filtrosLimpos);
                    setLinhas(res.data.results || res.data);
                } else if (aba === 'colmeias') {
                    const res = await getColmeias(filtrosLimpos);
                    setLinhas(res.data.results || res.data);
                } else if (aba === 'mel') {
                    const [listaRes, relRes] = await Promise.all([
                        getProducoes(filtrosLimpos),
                        getProducaoRelatorio(filtrosLimpos),
                    ]);
                    setLinhas(listaRes.data.results || listaRes.data);
                    setRelatorioMel(relRes.data);
                } else if (aba === 'polen' || aba === 'propolis') {
                    const res = await getColetasProduto({ ...filtrosLimpos, tipo_produto: aba });
                    setLinhas(res.data.results || res.data);
                } else if (aba === 'financeiro') {
                    const [custosRes, receitasRes] = await Promise.all([
                        getCustos(filtrosLimpos),
                        getReceitas(filtrosLimpos),
                    ]);
                    setCustos(custosRes.data.results || custosRes.data);
                    setReceitas(receitasRes.data.results || receitasRes.data);
                }
            } catch (err) {
                setErro('Erro ao carregar dados do relatório');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        carregar();
    }, [aba, filtrosLimpos]);

    const handleFiltro = (nome, valor) => {
        setFiltros((prev) => ({ ...prev, [nome]: valor }));
        setPage(0);
    };

    const limparFiltros = () => {
        setFiltros({ ativo: '', apiario: '', status: '', colmeia: '', tipo_mel: '', qualidade: '', data_inicio: '', data_fim: '' });
    };

    const handleExport = async (formato) => {
        const config = {
            apiarios: { chamada: exportApiarios, nomeBase: 'apiarios' },
            colmeias: { chamada: exportColmeias, nomeBase: 'colmeias' },
            mel: { chamada: exportProducao, nomeBase: 'producao_mel' },
            polen: { chamada: exportColetasProduto, nomeBase: 'producao_polen', extra: { tipo_produto: 'polen' } },
            propolis: { chamada: exportColetasProduto, nomeBase: 'producao_propolis', extra: { tipo_produto: 'propolis' } },
            financeiro: { chamada: exportFinanceiro, nomeBase: 'financeiro' },
        }[aba];

        try {
            setExportando(formato);
            await baixarArquivo(config.chamada, { ...filtrosLimpos, ...(config.extra || {}) }, config.nomeBase, formato);
        } catch (err) {
            setErro('Erro ao gerar relatório');
            console.error(err);
        } finally {
            setExportando(null);
        }
    };

    // ── Dados derivados por aba ──────────────────────────────────────────
    const apiariosPieData = useMemo(() => {
        const ativos = linhas.filter((a) => a.ativo).length;
        const inativos = linhas.length - ativos;
        return [
            { name: 'Ativos', value: ativos, color: 'var(--chart-green)' },
            { name: 'Inativos', value: inativos, color: 'var(--chart-gray)' },
        ].filter((d) => d.value > 0);
    }, [linhas]);

    const colmeiasPieData = useMemo(() => {
        const contagem = linhas.reduce((acc, c) => {
            acc[c.status_display || c.status] = (acc[c.status_display || c.status] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(contagem).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
    }, [linhas]);

    const melPorTipoData = useMemo(() => (relatorioMel?.por_tipo || []).map((item) => ({
        name: TIPO_MEL_OPTIONS.find((o) => o.value === item.tipo_mel)?.label || item.tipo_mel,
        valor: parseFloat(item.total_kg) || 0,
    })), [relatorioMel]);

    const producaoPorMesData = useMemo(() => {
        if (aba === 'polen' || aba === 'propolis') return agruparPorMes(linhas, 'data_coleta', 'quantidade_g');
        return [];
    }, [linhas, aba]);

    const financeiroPorMesData = useMemo(() => {
        const porMes = {};
        custos.forEach((c) => {
            const data = new Date(c.data);
            const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            if (!porMes[chave]) porMes[chave] = { chave, mes: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), custos: 0, receitas: 0 };
            porMes[chave].custos += parseFloat(c.valor || 0);
        });
        receitas.forEach((r) => {
            const data = new Date(r.data);
            const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            if (!porMes[chave]) porMes[chave] = { chave, mes: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), custos: 0, receitas: 0 };
            porMes[chave].receitas += parseFloat(r.valor || 0);
        });
        return Object.values(porMes).sort((a, b) => a.chave.localeCompare(b.chave));
    }, [custos, receitas]);

    const linhasFinanceiro = useMemo(() => [
        ...custos.map((c) => ({ ...c, tipoLancamento: 'Custo', categoria: c.tipo_custo_display, valorFmt: `- R$ ${parseFloat(c.valor).toFixed(2)}` })),
        ...receitas.map((r) => ({ ...r, tipoLancamento: 'Receita', categoria: r.tipo_receita_display, valorFmt: `R$ ${parseFloat(r.valor).toFixed(2)}` })),
    ].sort((a, b) => new Date(b.data) - new Date(a.data)), [custos, receitas]);

    const linhasTabela = aba === 'financeiro' ? linhasFinanceiro : linhas;
    const linhasPagina = linhasTabela.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // ── Configuração de filtros visíveis por aba ─────────────────────────
    const mostrarFiltro = (nome) => {
        const mapa = {
            apiarios: ['ativo'],
            colmeias: ['apiario', 'status'],
            mel: ['colmeia', 'apiario', 'tipo_mel', 'qualidade', 'data_inicio', 'data_fim'],
            polen: ['colmeia', 'apiario', 'data_inicio', 'data_fim'],
            propolis: ['colmeia', 'apiario', 'data_inicio', 'data_fim'],
            financeiro: ['data_inicio', 'data_fim'],
        };
        return (mapa[aba] || []).includes(nome);
    };

    const filtrosAtivos = Object.values(filtrosLimpos).length;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                <ReportsIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700} sx={{ flex: 1, minWidth: 120 }}>Relatórios</Typography>
                <Button
                    size="small" variant="outlined" startIcon={<FileDownloadIcon />}
                    disabled={Boolean(exportando)} onClick={() => handleExport('excel')}
                >
                    {exportando === 'excel' ? 'Gerando...' : 'Exportar Excel'}
                </Button>
                <Button
                    size="small" variant="outlined" startIcon={<FileDownloadIcon />}
                    disabled={Boolean(exportando)} onClick={() => handleExport('pdf')}
                >
                    {exportando === 'pdf' ? 'Gerando...' : 'Exportar PDF'}
                </Button>
            </Box>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

            <Paper sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Tabs
                    value={aba}
                    onChange={(_, v) => setAba(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ px: 1.5 }}
                >
                    <Tab icon={<PlaceIcon fontSize="small" />} iconPosition="start" value="apiarios" label="Apiários" />
                    <Tab icon={<HiveIcon fontSize="small" />} iconPosition="start" value="colmeias" label="Colmeias" />
                    <Tab icon={<HoneyIcon fontSize="small" />} iconPosition="start" value="mel" label="Produção de Mel" />
                    <Tab icon={<PolenIcon fontSize="small" />} iconPosition="start" value="polen" label="Produção de Pólen" />
                    <Tab icon={<PropolisIcon fontSize="small" />} iconPosition="start" value="propolis" label="Produção de Própolis" />
                    {canViewReports && <Tab icon={<FinanceiroIcon fontSize="small" />} iconPosition="start" value="financeiro" label="Financeiro" />}
                </Tabs>
            </Paper>

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    {mostrarFiltro('ativo') && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={filtros.ativo} label="Status" onChange={(e) => handleFiltro('ativo', e.target.value)}>
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="true">Ativos</MenuItem>
                                    <MenuItem value="false">Inativos</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    {mostrarFiltro('apiario') && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apiário</InputLabel>
                                <Select value={filtros.apiario} label="Apiário" onChange={(e) => handleFiltro('apiario', e.target.value)}>
                                    <MenuItem value="">Todos</MenuItem>
                                    {apiarios.map((a) => <MenuItem key={a.id} value={a.id}>{a.nome}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    {mostrarFiltro('colmeia') && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Colmeia</InputLabel>
                                <Select value={filtros.colmeia} label="Colmeia" onChange={(e) => handleFiltro('colmeia', e.target.value)}>
                                    <MenuItem value="">Todas</MenuItem>
                                    {colmeias.map((c) => <MenuItem key={c.id} value={c.id}>{c.identificador}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    {mostrarFiltro('status') && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={filtros.status} label="Status" onChange={(e) => handleFiltro('status', e.target.value)}>
                                    <MenuItem value="">Todos</MenuItem>
                                    {STATUS_COLMEIA.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    {mostrarFiltro('tipo_mel') && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo de Mel</InputLabel>
                                <Select value={filtros.tipo_mel} label="Tipo de Mel" onChange={(e) => handleFiltro('tipo_mel', e.target.value)}>
                                    <MenuItem value="">Todos</MenuItem>
                                    {TIPO_MEL_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    {mostrarFiltro('qualidade') && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Qualidade</InputLabel>
                                <Select value={filtros.qualidade} label="Qualidade" onChange={(e) => handleFiltro('qualidade', e.target.value)}>
                                    <MenuItem value="">Todas</MenuItem>
                                    {QUALIDADE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    {mostrarFiltro('data_inicio') && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                fullWidth size="small" type="date" label="Data início"
                                value={filtros.data_inicio} onChange={(e) => handleFiltro('data_inicio', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    )}
                    {mostrarFiltro('data_fim') && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                fullWidth size="small" type="date" label="Data fim"
                                value={filtros.data_fim} onChange={(e) => handleFiltro('data_fim', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    )}
                    {filtrosAtivos > 0 && (
                        <Grid size={{ xs: 12, sm: 'auto' }}>
                            <Button size="small" variant="outlined" onClick={limparFiltros}>Limpar filtros</Button>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Resumo */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>
                                {aba === 'financeiro' ? 'Lançamentos' : 'Registros'}
                            </Typography>
                            {loading
                                ? <Skeleton width={80} height={40} />
                                : <Typography variant="h4" fontWeight={700}>{linhasTabela.length}</Typography>
                            }
                        </CardContent>
                    </Card>
                </Grid>
                {aba === 'financeiro' && (
                    <>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>Total Receitas</Typography>
                                    {loading ? <Skeleton width={80} height={40} /> : (
                                        <Typography variant="h4" fontWeight={700} color="success.main">
                                            R$ {receitas.reduce((acc, r) => acc + parseFloat(r.valor || 0), 0).toFixed(2)}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>Total Custos</Typography>
                                    {loading ? <Skeleton width={80} height={40} /> : (
                                        <Typography variant="h4" fontWeight={700} color="error.main">
                                            R$ {custos.reduce((acc, c) => acc + parseFloat(c.valor || 0), 0).toFixed(2)}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}
                {(aba === 'polen' || aba === 'propolis') && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>Total Coletado</Typography>
                                {loading ? <Skeleton width={80} height={40} /> : (
                                    <Typography variant="h4" fontWeight={700}>
                                        {linhas.reduce((acc, i) => acc + parseFloat(i.quantidade_g || 0), 0).toFixed(1)} g
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                )}
                {aba === 'mel' && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>Total Produzido</Typography>
                                {loading ? <Skeleton width={80} height={40} /> : (
                                    <Typography variant="h4" fontWeight={700}>
                                        {linhas.reduce((acc, i) => acc + parseFloat(i.quantidade_kg || 0), 0).toFixed(1)} kg
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {/* Gráfico */}
            <Card sx={{ mb: 2.5 }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {{
                            apiarios: 'Apiários Ativos vs Inativos',
                            colmeias: 'Colmeias por Status',
                            mel: 'Produção por Tipo de Mel',
                            polen: 'Coletas por Mês',
                            propolis: 'Coletas por Mês',
                            financeiro: 'Custos vs Receitas por Mês',
                        }[aba]}
                    </Typography>
                    <Box sx={{ height: 280 }}>
                        {loading ? (
                            <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 1 }} />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                {aba === 'apiarios' ? (
                                    apiariosPieData.length > 0 ? (
                                        <PieChart>
                                            <Pie data={apiariosPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                                {apiariosPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <RechartsTooltip contentStyle={darkTooltipStyle} formatter={(v) => [v, 'Apiários']} />
                                            <Legend />
                                        </PieChart>
                                    ) : <Box />
                                ) : aba === 'colmeias' ? (
                                    colmeiasPieData.length > 0 ? (
                                        <PieChart>
                                            <Pie data={colmeiasPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                                {colmeiasPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <RechartsTooltip contentStyle={darkTooltipStyle} formatter={(v) => [v, 'Colmeias']} />
                                            <Legend />
                                        </PieChart>
                                    ) : <Box />
                                ) : aba === 'mel' ? (
                                    <BarChart data={melPorTipoData} layout="vertical">
                                        <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                                        <XAxis type="number" unit=" kg" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                        <RechartsTooltip contentStyle={darkTooltipStyle} formatter={(v) => [`${v.toFixed(1)} kg`, 'Produção']} />
                                        <Bar dataKey="valor" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                ) : aba === 'financeiro' ? (
                                    <BarChart data={financeiroPorMesData}>
                                        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                        <YAxis unit=" R$" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                        <RechartsTooltip contentStyle={darkTooltipStyle} formatter={(v, name) => [`R$ ${v.toFixed(2)}`, name]} />
                                        <Legend />
                                        <Bar dataKey="receitas" name="Receitas" fill="var(--chart-green)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="custos" name="Custos" fill="var(--chart-red)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <BarChart data={producaoPorMesData}>
                                        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                        <YAxis unit=" g" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                        <RechartsTooltip contentStyle={darkTooltipStyle} formatter={(v) => [`${v.toFixed(1)} g`, 'Quantidade']} />
                                        <Bar dataKey="valor" fill={aba === 'polen' ? 'var(--chart-amber)' : 'var(--chart-teal)'} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Tabela */}
            <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {aba === 'apiarios' && <><TableCell>Nome</TableCell><TableCell>Localização</TableCell><TableCell>Status</TableCell><TableCell align="right">Colmeias</TableCell></>}
                                {aba === 'colmeias' && <><TableCell>Identificador</TableCell><TableCell>Apiário</TableCell><TableCell>Espécie</TableCell><TableCell>Status</TableCell><TableCell align="right">Abelhas (est.)</TableCell></>}
                                {aba === 'mel' && <><TableCell>Data</TableCell><TableCell>Colmeia</TableCell><TableCell>Apiário</TableCell><TableCell align="right">Quantidade</TableCell><TableCell>Tipo</TableCell></>}
                                {(aba === 'polen' || aba === 'propolis') && <><TableCell>Data</TableCell><TableCell>Colmeia</TableCell><TableCell>Apiário</TableCell><TableCell align="right">Quantidade</TableCell></>}
                                {aba === 'financeiro' && <><TableCell>Data</TableCell><TableCell>Tipo</TableCell><TableCell>Descrição</TableCell><TableCell>Categoria</TableCell><TableCell align="right">Valor</TableCell></>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>{[1, 2, 3, 4, 5].map((c) => <TableCell key={c}><Skeleton height={18} /></TableCell>)}</TableRow>
                                ))
                            ) : linhasPagina.length === 0 ? (
                                <TableRow><TableCell colSpan={5}><Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>Nenhum registro encontrado</Typography></TableCell></TableRow>
                            ) : aba === 'apiarios' ? (
                                linhasPagina.map((a) => (
                                    <TableRow key={a.id} hover>
                                        <TableCell>{a.nome}</TableCell>
                                        <TableCell>{a.localizacao}</TableCell>
                                        <TableCell>{a.ativo ? 'Ativo' : 'Inativo'}</TableCell>
                                        <TableCell align="right">{a.total_colmeias ?? '—'}</TableCell>
                                    </TableRow>
                                ))
                            ) : aba === 'colmeias' ? (
                                linhasPagina.map((c) => (
                                    <TableRow key={c.id} hover>
                                        <TableCell>{c.identificador}</TableCell>
                                        <TableCell>{c.apiario_nome}</TableCell>
                                        <TableCell>{c.especie_nome || '—'}</TableCell>
                                        <TableCell>{c.status_display}</TableCell>
                                        <TableCell align="right">{c.quantidade_abelhas_estimada ?? '—'}</TableCell>
                                    </TableRow>
                                ))
                            ) : aba === 'mel' ? (
                                linhasPagina.map((p) => (
                                    <TableRow key={p.id} hover>
                                        <TableCell>{new Date(p.data_colheita).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>{p.colmeia_identificador}</TableCell>
                                        <TableCell>{p.apiario_nome}</TableCell>
                                        <TableCell align="right">{p.quantidade_kg} kg</TableCell>
                                        <TableCell>{TIPO_MEL_OPTIONS.find((o) => o.value === p.tipo_mel)?.label || p.tipo_mel}</TableCell>
                                    </TableRow>
                                ))
                            ) : (aba === 'polen' || aba === 'propolis') ? (
                                linhasPagina.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell>{new Date(item.data_coleta).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>{item.colmeia_identificador}</TableCell>
                                        <TableCell>{item.apiario_nome}</TableCell>
                                        <TableCell align="right">{item.quantidade_g} g</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                linhasPagina.map((item) => (
                                    <TableRow key={`${item.tipoLancamento}-${item.id}`} hover>
                                        <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>{item.tipoLancamento}</TableCell>
                                        <TableCell>{item.descricao}</TableCell>
                                        <TableCell>{item.categoria}</TableCell>
                                        <TableCell align="right" sx={{ color: item.tipoLancamento === 'Custo' ? 'error.main' : 'success.main', fontWeight: 600 }}>
                                            {item.valorFmt}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={linhasTabela.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Linhas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            </Paper>
        </Box>
    );
}
