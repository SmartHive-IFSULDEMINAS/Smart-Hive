'use client'

import { useEffect, useState, useCallback } from 'react'
import { getDashboard, getDashboardFinanceiro, getDashboardSaude, getDashboardProdutividade } from '@/lib/api'
import { RefreshCw, TrendingUp, DollarSign, Heart, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const KPI_COLORS = ['hsl(var(--primary))', '#2E7D32', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6']

function StatCard({ title, value, sub, color = 'primary' }: { title: string; value: any; sub?: string; color?: string }) {
  const borderMap: Record<string, string> = {
    primary: 'border-l-primary',
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    red: 'border-l-red-500',
    amber: 'border-l-amber-500',
  }
  return (
    <Card className={`border-l-4 ${borderMap[color] ?? 'border-l-primary'}`}>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function AnalisesPage() {
  const [geral, setGeral] = useState<any>(null)
  const [financeiro, setFinanceiro] = useState<any>(null)
  const [saude, setSaude] = useState<any>(null)
  const [produtividade, setProdutividade] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [rGeral, rFin, rSaude, rProd] = await Promise.allSettled([
        getDashboard().then((r) => r.data),
        getDashboardFinanceiro().then((r) => r.data),
        getDashboardSaude().then((r) => r.data),
        getDashboardProdutividade().then((r) => r.data),
      ])
      if (rGeral.status === 'fulfilled') setGeral(rGeral.value)
      if (rFin.status === 'fulfilled') setFinanceiro(rFin.value)
      if (rSaude.status === 'fulfilled') setSaude(rSaude.value)
      if (rProd.status === 'fulfilled') setProdutividade(rProd.value)
    } catch {
      toast.error('Erro ao carregar análises')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const fmt = (v: any, decimais = 2) =>
    v != null ? `R$ ${parseFloat(v).toFixed(decimais)}` : '—'

  const producaoMensal: any[] = geral?.producao_mensal ?? []
  const custosPorTipo: any[] = financeiro?.custos_por_tipo ?? []
  const receitasPorTipo: any[] = financeiro?.receitas_por_tipo ?? []
  const producaoPorApiario: any[] = produtividade?.producao_por_apiario ?? []
  const producaoPorColmeia: any[] = (produtividade?.producao_por_colmeia ?? []).slice(0, 10)
  const condicoes: any[] = saude?.condicoes ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">Análises</h2>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <RefreshCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <Tabs defaultValue="producao">
          <TabsList className="mb-2">
            <TabsTrigger value="producao" className="gap-1.5"><TrendingUp className="size-3.5" /> Produção</TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-1.5"><DollarSign className="size-3.5" /> Financeiro</TabsTrigger>
            <TabsTrigger value="saude" className="gap-1.5"><Heart className="size-3.5" /> Saúde</TabsTrigger>
            <TabsTrigger value="produtividade" className="gap-1.5"><BarChart3 className="size-3.5" /> Produtividade</TabsTrigger>
          </TabsList>

          {/* === PRODUÇÃO === */}
          <TabsContent value="producao" className="flex flex-col gap-4 mt-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Apiários" value={geral?.total_apiarios} color="green" />
              <StatCard title="Total Colmeias" value={geral?.total_colmeias} color="primary" />
              <StatCard title="Inspeções (30d)" value={geral?.inspecoes_mes} color="blue" />
              <StatCard title="Produção Total (kg)" value={geral?.producao_total_kg != null ? parseFloat(geral.producao_total_kg).toFixed(1) : '—'} color="amber" />
            </div>

            {producaoMensal.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Produção Mensal (kg)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={producaoMensal}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [`${Number(v).toFixed(2)} kg`, 'Produção']} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === FINANCEIRO === */}
          <TabsContent value="financeiro" className="flex flex-col gap-4 mt-0">
            {!financeiro ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Dados financeiros não disponíveis (sem permissão ou sem registros).</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard title="Receitas (mês)" value={fmt(financeiro.receitas_mes)} color="green" sub={`Ano: ${fmt(financeiro.receitas_ano)}`} />
                  <StatCard title="Custos (mês)" value={fmt(financeiro.custos_mes)} color="red" sub={`Ano: ${fmt(financeiro.custos_ano)}`} />
                  <StatCard
                    title="Lucro (mês)"
                    value={fmt(financeiro.lucro_mes)}
                    color={financeiro.lucro_mes >= 0 ? 'green' : 'red'}
                    sub={`Ano: ${fmt(financeiro.lucro_ano)}`}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {custosPorTipo.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Custos por Tipo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={custosPorTipo}
                              dataKey="total"
                              nameKey="tipo_custo"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ tipo_custo, percent }) => `${tipo_custo} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {custosPorTipo.map((_, i) => (
                                <Cell key={i} fill={KPI_COLORS[i % KPI_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, 'Total']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {receitasPorTipo.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Receitas por Tipo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={receitasPorTipo}
                              dataKey="total"
                              nameKey="tipo_receita"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ tipo_receita, percent }) => `${tipo_receita} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {receitasPorTipo.map((_, i) => (
                                <Cell key={i} fill={KPI_COLORS[i % KPI_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, 'Total']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* === SAÚDE === */}
          <TabsContent value="saude" className="flex flex-col gap-4 mt-0">
            {!saude ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Dados de saúde não disponíveis.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard title="Colmeias em Quarentena" value={saude.colmeias_quarentena} color="amber" />
                  <StatCard title="Colmeias Mortas" value={saude.colmeias_mortas} color="red" />
                  <StatCard title="Com Pragas (30d)" value={saude.inspecoes_com_pragas} color="red" />
                  <StatCard title="Com Doenças (30d)" value={saude.inspecoes_com_doencas} color="red" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard title="Tratamentos Ativos" value={saude.tratamentos_ativos} color="primary" />
                  <StatCard title="Tratamentos (mês)" value={saude.tratamentos_mes} color="blue" />
                </div>

                {condicoes.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Condição Geral das Colmeias (30d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={condicoes} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="condicao_geral" tick={{ fontSize: 11 }} width={80} />
                          <Tooltip />
                          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* === PRODUTIVIDADE === */}
          <TabsContent value="produtividade" className="flex flex-col gap-4 mt-0">
            {!produtividade ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Dados de produtividade não disponíveis.</p>
            ) : (
              <>
                {producaoPorApiario.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Produção por Apiário — Ano Atual (kg)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={producaoPorApiario}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="colmeia__apiario__nome" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => [`${Number(v).toFixed(2)} kg`, 'Total']} />
                          <Bar dataKey="total_kg" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {producaoPorColmeia.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Top 10 Colmeias mais Produtivas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {producaoPorColmeia.map((c: any, i: number) => {
                          const max = parseFloat(producaoPorColmeia[0]?.total_kg ?? 1)
                          const pct = (parseFloat(c.total_kg ?? 0) / max) * 100
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs font-medium">{c.colmeia__identificador}</span>
                                  <span className="text-xs text-muted-foreground">{parseFloat(c.total_kg).toFixed(2)} kg</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
