'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getDashboard,
  getDashboardComparativo,
  getDashboardPrevisao,
} from '@/lib/api'
import {
  MapPin,
  Container,
  Droplets,
  AlertTriangle,
  RefreshCw,
  CalendarDays,
  Thermometer,
  Volume2,
  Sun,
  Waves,
  Weight,
  Gauge,
  Clock,
  Wifi,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Cores dos status ───────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  ativa: '#4CAF50',
  inativa: '#9E9E9E',
  quarentena: '#F4A100',
  morta: '#F44336',
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    ativa: 'Ativas',
    inativa: 'Inativas',
    quarentena: 'Quarentena',
    morta: 'Mortas',
  }
  return map[s] ?? s
}

function condicaoBadge(condicao: string) {
  const map: Record<string, string> = {
    excelente: 'bg-green-100 text-green-800',
    boa: 'bg-green-100 text-green-800',
    regular: 'bg-amber-100 text-amber-800',
    ruim: 'bg-red-100 text-red-800',
    critica: 'bg-red-100 text-red-800',
  }
  return map[condicao] ?? 'bg-gray-100 text-gray-800'
}

// ─── KPI Card ───────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string
  value: React.ReactNode
  subtitle?: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <Card className="relative overflow-hidden">
      {/* barra de topo */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: accent }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}
          >
            <Icon className="size-4" style={{ color: accent }} />
          </div>
        </div>
        <p className="text-3xl font-extrabold leading-none text-foreground mb-1.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [comparativoData, setComparativoData] = useState<any>(null)
  const [previsaoData, setPrevisaoData] = useState<any>(null)
  const [loadingComp, setLoadingComp] = useState(false)
  const [loadingPrev, setLoadingPrev] = useState(false)
  const [periodoDias, setPeriodoDias] = useState('30')
  const [baseDias, setBaseDias] = useState('90')

  const fetchGeral = useCallback(async () => {
    const r = await getDashboard()
    setData(r.data)
  }, [])

  const fetchComparativo = useCallback(async (dias: string) => {
    setLoadingComp(true)
    try {
      const r = await getDashboardComparativo({ periodo_dias: Number(dias) })
      setComparativoData(r.data)
    } finally {
      setLoadingComp(false)
    }
  }, [])

  const fetchPrevisao = useCallback(async (dias: string) => {
    setLoadingPrev(true)
    try {
      const r = await getDashboardPrevisao({ base_dias: Number(dias) })
      setPrevisaoData(r.data)
    } finally {
      setLoadingPrev(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchGeral(), fetchComparativo(periodoDias), fetchPrevisao(baseDias)]).finally(
      () => setLoading(false)
    )
  }, [])

  useEffect(() => { fetchComparativo(periodoDias) }, [periodoDias])
  useEffect(() => { fetchPrevisao(baseDias) }, [baseDias])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchGeral(), fetchComparativo(periodoDias), fetchPrevisao(baseDias)])
    setRefreshing(false)
  }

  if (loading) return <DashboardSkeleton />

  // ─── Dados derivados ─────────────────────────────────────────────────────
  const statusData =
    data?.colmeias_por_status?.map((item: any) => ({
      name: statusLabel(item.status),
      value: item.total,
      color: STATUS_COLORS[item.status] ?? '#9E9E9E',
    })) ?? []

  const producaoMensal: any[] = data?.producao_por_mes ?? []
  const colmeiasApiario: any[] = data?.colmeias_por_apiario ?? []
  const proximasInspecoes: any[] = data?.proximas_inspecoes ?? []
  const ultimasProducoes: any[] = data?.ultimas_producoes ?? []
  const colmeiasIot: any[] = data?.colmeias_iot ?? []

  const getTemperatureColor = (v: number) => {
    if (v > 35) return '#EF9A9A'
    if (v < 20) return '#64B5F6'
    return '#4CAF50'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Cabeçalho ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral do Apiário</h2>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
            <CalendarDays className="size-3.5" />
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* ─── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Apiários"
          value={data?.total_apiarios ?? 0}
          subtitle={`${data?.apiarios_ativos ?? 0} ativos`}
          icon={MapPin}
          accent="#2E7D32"
        />
        <StatCard
          title="Colmeias"
          value={data?.total_colmeias ?? 0}
          subtitle={`${data?.colmeias_ativas ?? 0} ativas`}
          icon={Container}
          accent="#F4A100"
        />
        <StatCard
          title="Produção Anual"
          value={`${parseFloat(data?.producao_ano_kg ?? 0).toFixed(1)} kg`}
          subtitle={`${parseFloat(data?.producao_mes_kg ?? 0).toFixed(1)} kg este mês`}
          icon={Droplets}
          accent="#FF9800"
        />
        <StatCard
          title="Atenção"
          value={data?.tratamentos_em_andamento ?? 0}
          subtitle={`${data?.colmeias_em_quarentena ?? 0} em quarentena`}
          icon={AlertTriangle}
          accent="#F44336"
        />
      </div>

      {/* ─── Abas ──────────────────────────────────────────────────────── */}
      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          <TabsTrigger value="previsao">Previsão</TabsTrigger>
        </TabsList>

        {/* ── Visão Geral ──────────────────────────────────────────────── */}
        <TabsContent value="geral" className="mt-4 flex flex-col gap-4">
          {/* Gráficos superiores */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Área — Evolução da Produção */}
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">Evolução da Produção</CardTitle>
                <Badge variant="outline" className="text-xs">12 meses</Badge>
              </CardHeader>
              <CardContent>
                {producaoMensal.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={producaoMensal}>
                      <defs>
                        <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F4A100" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F4A100" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit=" kg" />
                      <Tooltip
                        formatter={(v: any) => [`${parseFloat(v).toFixed(1)} kg`, 'Produção']}
                      />
                      <Area
                        type="monotone"
                        dataKey="producao_kg"
                        stroke="#F4A100"
                        strokeWidth={2}
                        fill="url(#gradProd)"
                        dot={{ fill: '#F4A100', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                    Nenhum dado de produção
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pie — Status das Colmeias */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Status das Colmeias</CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="45%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [v, 'Colmeias']} />
                      <Legend
                        formatter={(value, entry: any) => (
                          <span style={{ color: entry.color, fontWeight: 600, fontSize: 12 }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                    Nenhuma colmeia cadastrada
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabelas */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Próximas Inspeções */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Próximas Inspeções</CardTitle>
              </CardHeader>
              <CardContent>
                {proximasInspecoes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colmeia</TableHead>
                        <TableHead>Apiário</TableHead>
                        <TableHead>Condição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proximasInspecoes.map((insp: any) => (
                        <TableRow key={insp.id}>
                          <TableCell className="font-medium text-sm">
                            {insp.colmeia_identificador}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {insp.apiario_nome}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${condicaoBadge(insp.condicao_geral)}`}
                            >
                              {insp.condicao_geral_display}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma inspeção agendada
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Últimas Produções */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Últimas Produções</CardTitle>
              </CardHeader>
              <CardContent>
                {ultimasProducoes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colmeia</TableHead>
                        <TableHead>Apiário</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ultimasProducoes.map((prod: any) => (
                        <TableRow key={prod.id}>
                          <TableCell className="font-medium text-sm">
                            {prod.colmeia_identificador}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {prod.apiario_nome}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="text-xs">
                              {prod.quantidade_kg} kg
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma produção registrada
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Barra horizontal — Colmeias por Apiário */}
          {colmeiasApiario.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Distribuição de Colmeias por Apiário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(colmeiasApiario.length * 40, 120)}>
                  <BarChart data={colmeiasApiario} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="apiario__nome"
                      width={150}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={(v: any) => [v, 'Colmeias']} />
                    <Bar dataKey="total" fill="#2E7D32" radius={[0, 6, 6, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* IoT */}
          {colmeiasIot.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 pb-2">
                <Wifi className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Monitoramento IoT em Tempo Real
                </CardTitle>
                <Badge variant="outline" className="ml-auto text-xs">
                  {data?.total_colmeias_iot ?? colmeiasIot.length} sensores
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {colmeiasIot.map((colmeia: any) => {
                    const sensors = [
                      {
                        key: 'temperatura_atual',
                        label: 'Temperatura',
                        Icon: Thermometer,
                        color: getTemperatureColor(Number(colmeia.temperatura_atual)),
                        format: (v: any) => `${Number(v).toFixed(1)}°C`,
                      },
                      {
                        key: 'nivel_ruido',
                        label: 'Ruído',
                        Icon: Volume2,
                        color: '#FFB74D',
                        format: (v: any) => `${Number(v).toFixed(1)} dB`,
                      },
                      {
                        key: 'luminosidade',
                        label: 'Luminosidade',
                        Icon: Sun,
                        color: '#FFC107',
                        format: (v: any) => `${Number(v).toFixed(0)} lux`,
                      },
                      {
                        key: 'umidade',
                        label: 'Umidade',
                        Icon: Waves,
                        color: '#64B5F6',
                        format: (v: any) => `${Number(v).toFixed(1)}%`,
                      },
                      {
                        key: 'pressao',
                        label: 'Pressão',
                        Icon: Gauge,
                        color: '#CE93D8',
                        format: (v: any) => `${Number(v).toFixed(1)} hPa`,
                      },
                      {
                        key: 'peso',
                        label: 'Peso',
                        Icon: Weight,
                        color: '#90A4AE',
                        format: (v: any) => `${Number(v).toFixed(1)} kg`,
                      },
                    ].filter((s) => colmeia[s.key] != null && colmeia[s.key] !== '')

                    return (
                      <div
                        key={colmeia.id}
                        className="rounded-xl border border-blue-200 bg-blue-50/30 p-3 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold">{colmeia.identificador}</p>
                            <p className="text-xs text-muted-foreground">{colmeia.apiario_nome}</p>
                          </div>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                            <Wifi className="size-3.5 text-blue-500" />
                          </div>
                        </div>

                        {sensors.length > 0 ? (
                          <div className="grid grid-cols-3 gap-1.5">
                            {sensors.map(({ key, label, Icon, color, format }) => (
                              <div
                                key={key}
                                className="flex flex-col items-center justify-center rounded-lg py-2 px-1 text-center"
                                style={{
                                  background: `${color}15`,
                                  border: `1px solid ${color}35`,
                                }}
                              >
                                <Icon className="size-3.5 mb-0.5" style={{ color }} />
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                  {label}
                                </span>
                                <span
                                  className="text-xs font-bold leading-tight mt-0.5"
                                  style={{ color }}
                                >
                                  {format(colmeia[key])}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-3">
                            Aguardando primeira leitura...
                          </p>
                        )}

                        {/* Sparklines */}
                        {colmeia.sparklines && (
                          <div className="mt-2 space-y-1">
                            {[
                              { key: 'temperatura', label: 'Temp.', color: '#4CAF50' },
                              { key: 'nivel_ruido', label: 'Ruído', color: '#FFB74D' },
                              { key: 'luminosidade', label: 'Luz', color: '#FFC107' },
                            ]
                              .filter((s) => (colmeia.sparklines[s.key] ?? []).length > 1)
                              .slice(0, 2)
                              .map((s) => (
                                <div key={s.key} className="flex items-center gap-2">
                                  <span className="min-w-[38px] text-[10px] text-muted-foreground">
                                    {s.label}
                                  </span>
                                  <div className="flex-1 h-5">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart
                                        data={(colmeia.sparklines[s.key] ?? []).map(
                                          (v: any, i: number) => ({ i, v })
                                        )}
                                      >
                                        <Line
                                          type="monotone"
                                          dataKey="v"
                                          stroke={s.color}
                                          strokeWidth={1.5}
                                          dot={false}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        {colmeia.data_ultima_leitura_sensor && (
                          <div className="mt-2 pt-2 border-t border-border flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-3" />
                            {new Date(colmeia.data_ultima_leitura_sensor).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Comparativo ──────────────────────────────────────────────── */}
        <TabsContent value="comparativo" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-3 pb-3">
              <CardTitle className="text-sm font-semibold">Comparativo entre Apiários</CardTitle>
              <Select value={periodoDias} onValueChange={setPeriodoDias}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="180">Últimos 180 dias</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loadingComp ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Apiário</TableHead>
                      <TableHead className="text-right">Produção (kg)</TableHead>
                      <TableHead className="text-right">Perdas</TableHead>
                      <TableHead className="text-right">Tratamentos</TableHead>
                      <TableHead className="text-right">Custos (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(comparativoData?.ranking ?? []).map((item: any, index: number) => (
                      <TableRow key={item.apiario_id}>
                        <TableCell>
                          <Badge
                            variant={index === 0 ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{item.apiario_nome}</TableCell>
                        <TableCell className="text-right text-sm">
                          {item.produtividade_kg?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-sm">{item.perdas}</TableCell>
                        <TableCell className="text-right text-sm">{item.tratamentos}</TableCell>
                        <TableCell className="text-right text-sm">
                          {item.custos?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!comparativoData?.ranking?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum dado disponível para o período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Previsão ─────────────────────────────────────────────────── */}
        <TabsContent value="previsao" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-3 pb-3">
              <CardTitle className="text-sm font-semibold">Previsão de Produção</CardTitle>
              <Select value={baseDias} onValueChange={setBaseDias}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Base: 30 dias</SelectItem>
                  <SelectItem value="90">Base: 90 dias</SelectItem>
                  <SelectItem value="180">Base: 180 dias</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {loadingPrev ? (
                <Skeleton className="h-28 w-full" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Projeção 7 dias', key: '7' },
                    { label: 'Projeção 30 dias', key: '30' },
                    { label: 'Projeção 90 dias', key: '90' },
                  ].map(({ label, key }) => (
                    <div key={key} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-xl font-bold mt-0.5">
                        {previsaoData?.resumo_apiarios?.[key]?.toFixed(2) ?? '0.00'} kg
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colmeia</TableHead>
                    <TableHead>Apiário</TableHead>
                    <TableHead className="text-right">7d (kg)</TableHead>
                    <TableHead className="text-right">30d (kg)</TableHead>
                    <TableHead className="text-right">90d (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(previsaoData?.colmeias ?? []).map((item: any) => (
                    <TableRow key={item.colmeia_id}>
                      <TableCell className="font-medium text-sm">
                        {item.colmeia_identificador}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.apiario_nome}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.projecoes?.['7']?.toFixed(2) ?? '0.00'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.projecoes?.['30']?.toFixed(2) ?? '0.00'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.projecoes?.['90']?.toFixed(2) ?? '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!previsaoData?.colmeias?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum dado de previsão disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
