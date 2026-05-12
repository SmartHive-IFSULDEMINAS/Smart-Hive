'use client'

import { useEffect, useState, useCallback } from 'react'
import { getColmeias, getColmeiaLeiturasSensor } from '@/lib/api'
import { Volume2, Thermometer, Droplets, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const PERIODOS = [
  { value: '24h', label: 'Últimas 24 horas', hours: 24 },
  { value: '7d', label: 'Últimos 7 dias', hours: 168 },
  { value: '30d', label: 'Últimos 30 dias', hours: 720 },
]

const METRICAS = [
  { key: 'ruido', label: 'Ruído (dB)', color: 'hsl(var(--primary))', icon: Volume2 },
  { key: 'temperatura', label: 'Temperatura (°C)', color: '#ef4444', icon: Thermometer },
  { key: 'umidade', label: 'Umidade (%)', color: '#3b82f6', icon: Droplets },
]

export default function HistoricoRuidoPage() {
  const [colmeias, setColmeias] = useState<any[]>([])
  const [colmeiaSelecionada, setColmeiaSelecionada] = useState<string>('')
  const [periodo, setPeriodo] = useState('24h')
  const [leituras, setLeituras] = useState<any[]>([])
  const [loadingColmeias, setLoadingColmeias] = useState(true)
  const [loadingLeituras, setLoadingLeituras] = useState(false)
  const [metricasVisiveis, setMetricasVisiveis] = useState<string[]>(['ruido'])

  useEffect(() => {
    getColmeias()
      .then((r) => {
        const lista: any[] = r.data?.results ?? r.data ?? []
        setColmeias(lista)
        if (lista.length > 0) setColmeiaSelecionada(String(lista[0].id))
      })
      .catch(() => toast.error('Erro ao carregar colmeias'))
      .finally(() => setLoadingColmeias(false))
  }, [])

  const carregarLeituras = useCallback(async () => {
    if (!colmeiaSelecionada) return
    setLoadingLeituras(true)
    try {
      const periodoInfo = PERIODOS.find((p) => p.value === periodo)
      const limite = periodoInfo?.hours === 24 ? 96 : periodoInfo?.hours === 168 ? 168 : 300
      const r = await getColmeiaLeiturasSensor(Number(colmeiaSelecionada), { limit: limite })
      const dados: any[] = r.data?.results ?? r.data ?? []
      setLeituras([...dados].reverse())
    } catch {
      toast.error('Erro ao carregar leituras')
    } finally {
      setLoadingLeituras(false)
    }
  }, [colmeiaSelecionada, periodo])

  useEffect(() => {
    carregarLeituras()
  }, [carregarLeituras])

  const colmeia = colmeias.find((c) => String(c.id) === colmeiaSelecionada)

  const formatLabel = (ts: string) => {
    const d = new Date(ts)
    if (periodo === '24h') return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const chartData = leituras.map((l: any) => ({
    label: formatLabel(l.timestamp),
    ruido: l.ruido != null ? parseFloat(l.ruido) : null,
    temperatura: l.temperatura != null ? parseFloat(l.temperatura) : null,
    umidade: l.umidade != null ? parseFloat(l.umidade) : null,
  }))

  const kpis = leituras.length > 0 ? {
    ruidoAtual: leituras[leituras.length - 1]?.ruido,
    ruidoMax: Math.max(...leituras.map((l) => parseFloat(l.ruido ?? 0))),
    ruidoMin: Math.min(...leituras.filter((l) => l.ruido != null).map((l) => parseFloat(l.ruido))),
    tempAtual: leituras[leituras.length - 1]?.temperatura,
    umidadeAtual: leituras[leituras.length - 1]?.umidade,
  } : null

  const toggleMetrica = (key: string) => {
    setMetricasVisiveis((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">Histórico de Sensores</h2>
        <Button variant="outline" size="sm" onClick={carregarLeituras} disabled={loadingLeituras}>
          <RefreshCw className={`size-3.5 mr-1.5 ${loadingLeituras ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Colmeia</span>
          {loadingColmeias ? (
            <Skeleton className="h-9 w-56" />
          ) : (
            <Select value={colmeiaSelecionada} onValueChange={setColmeiaSelecionada}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecione a colmeia" />
              </SelectTrigger>
              <SelectContent>
                {colmeias.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.identificador} — {c.apiario_nome ?? c.apiario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Período</span>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 className="size-4 text-primary" />
                <span className="text-xs text-muted-foreground">Ruído Atual</span>
              </div>
              <p className="text-2xl font-bold">{kpis.ruidoAtual != null ? `${parseFloat(kpis.ruidoAtual).toFixed(1)} dB` : '—'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Min {kpis.ruidoMin?.toFixed(1)} · Max {kpis.ruidoMax?.toFixed(1)} dB
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-400">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Thermometer className="size-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Temperatura</span>
              </div>
              <p className="text-2xl font-bold">{kpis.tempAtual != null ? `${parseFloat(kpis.tempAtual).toFixed(1)}°C` : '—'}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-400">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="size-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Umidade</span>
              </div>
              <p className="text-2xl font-bold">{kpis.umidadeAtual != null ? `${parseFloat(kpis.umidadeAtual).toFixed(1)}%` : '—'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toggle métricas */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Mostrar:</span>
        {METRICAS.map((m) => {
          const ativo = metricasVisiveis.includes(m.key)
          return (
            <button
              key={m.key}
              onClick={() => toggleMetrica(m.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                ativo ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <m.icon className="size-3" />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {colmeia ? `${colmeia.identificador} — ${PERIODOS.find((p) => p.value === periodo)?.label}` : 'Selecione uma colmeia'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLeituras ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Nenhuma leitura disponível para este período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: any, name: string) => {
                    const m = METRICAS.find((m) => m.key === name)
                    return [value != null ? Number(value).toFixed(1) : '—', m?.label ?? name]
                  }}
                />
                <Legend formatter={(value) => METRICAS.find((m) => m.key === value)?.label ?? value} />
                {METRICAS.filter((m) => metricasVisiveis.includes(m.key)).map((m) => (
                  <Line
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    stroke={m.color}
                    dot={false}
                    strokeWidth={2}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {leituras.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">{leituras.length} leituras exibidas</p>
      )}
    </div>
  )
}
