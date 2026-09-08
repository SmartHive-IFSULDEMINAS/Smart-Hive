import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    alpha,
} from '@mui/material';
import {
    Assessment as ReportsIcon,
    Place as PlaceIcon,
    Hive as HiveIcon,
    LocalFlorist as HoneyIcon,
    Grain as PolenIcon,
    Opacity as PropolisIcon,
    AttachMoney as FinanceiroIcon,
    FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import {
    exportApiarios,
    exportColmeias,
    exportProducao,
    exportColetasProduto,
    exportFinanceiro,
} from '../services/api';

const baixarArquivo = async (chamada, params, nomeBase, formato) => {
    const response = await chamada(params);
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

const relatorios = [
    {
        chave: 'apiarios',
        titulo: 'Apiários',
        descricao: 'Lista completa de apiários cadastrados, com localização e responsável.',
        icone: <PlaceIcon />,
        cor: '#64B5F6',
        chamada: exportApiarios,
        params: {},
        nomeBase: 'apiarios',
    },
    {
        chave: 'colmeias',
        titulo: 'Colmeias',
        descricao: 'Colmeias cadastradas, status, espécie e estimativa de abelhas.',
        icone: <HiveIcon />,
        cor: '#F4A100',
        chamada: exportColmeias,
        params: {},
        nomeBase: 'colmeias',
    },
    {
        chave: 'producao-mel',
        titulo: 'Produção de Mel',
        descricao: 'Histórico de colheitas de mel, quantidade, tipo e qualidade.',
        icone: <HoneyIcon />,
        cor: '#FF9800',
        chamada: exportProducao,
        params: {},
        nomeBase: 'producao_mel',
    },
    {
        chave: 'producao-polen',
        titulo: 'Produção de Pólen',
        descricao: 'Histórico de coletas de pólen por colmeia.',
        icone: <PolenIcon />,
        cor: '#8D6E63',
        chamada: exportColetasProduto,
        params: { tipo_produto: 'polen' },
        nomeBase: 'producao_polen',
    },
    {
        chave: 'producao-propolis',
        titulo: 'Produção de Própolis',
        descricao: 'Histórico de coletas de própolis por colmeia.',
        icone: <PropolisIcon />,
        cor: '#6D4C41',
        chamada: exportColetasProduto,
        params: { tipo_produto: 'propolis' },
        nomeBase: 'producao_propolis',
    },
    {
        chave: 'financeiro',
        titulo: 'Financeiro',
        descricao: 'Custos e receitas consolidados (Excel com abas separadas).',
        icone: <FinanceiroIcon />,
        cor: '#81C784',
        chamada: exportFinanceiro,
        params: {},
        nomeBase: 'financeiro',
    },
];

export default function Relatorios() {
    const [gerando, setGerando] = useState(null);
    const [erro, setErro] = useState(null);

    const handleGerar = async (relatorio, formato) => {
        const idBotao = `${relatorio.chave}-${formato}`;
        try {
            setGerando(idBotao);
            setErro(null);
            await baixarArquivo(relatorio.chamada, { ...relatorio.params, format: formato }, relatorio.nomeBase, formato);
        } catch (err) {
            setErro(`Erro ao gerar relatório de ${relatorio.titulo}`);
            console.error(err);
        } finally {
            setGerando(null);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <ReportsIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700}>Relatórios</Typography>
            </Box>

            {erro && (
                <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>{erro}</Typography>
            )}

            <Grid container spacing={2.5}>
                {relatorios.map((relatorio) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={relatorio.chave}>
                        <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: relatorio.cor } }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: alpha(relatorio.cor, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: relatorio.cor }}>
                                        {relatorio.icone}
                                    </Box>
                                    <Typography variant="subtitle1" fontWeight={700}>{relatorio.titulo}</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, flex: 1 }}>
                                    {relatorio.descricao}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<FileDownloadIcon />}
                                        disabled={Boolean(gerando)}
                                        onClick={() => handleGerar(relatorio, 'excel')}
                                        sx={{ flex: 1 }}
                                    >
                                        {gerando === `${relatorio.chave}-excel` ? 'Gerando...' : 'Excel'}
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<FileDownloadIcon />}
                                        disabled={Boolean(gerando)}
                                        onClick={() => handleGerar(relatorio, 'pdf')}
                                        sx={{ flex: 1 }}
                                    >
                                        {gerando === `${relatorio.chave}-pdf` ? 'Gerando...' : 'PDF'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
