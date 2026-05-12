'use client'

import { useEffect, useState, useCallback } from 'react'
import { getNotificacoes, marcarNotificacaoLida, marcarTodasNotificacoesLidas } from '@/lib/api'
import { Bell, CheckCheck, RefreshCw, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TIPO_ICON: Record<string, any> = {
  info: Info,
  aviso: AlertTriangle,
  erro: XCircle,
  sucesso: CheckCircle2,
}

const TIPO_COLOR: Record<string, string> = {
  info: 'text-blue-500',
  aviso: 'text-yellow-500',
  erro: 'text-red-500',
  sucesso: 'text-green-500',
}

const PAGE_SIZE = 15

export default function AlertasPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroLeitura, setFiltroLeitura] = useState<'todas' | 'nao_lidas' | 'lidas'>('todas')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [pagina, setPagina] = useState(0)

  const carregar = useCallback(() => {
    setLoading(true)
    getNotificacoes()
      .then((r) => setData(r.data?.results ?? r.data ?? []))
      .catch(() => toast.error('Erro ao carregar notificações'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const handleLida = async (id: number) => {
    try {
      await marcarNotificacaoLida(id)
      toast.success('Notificação marcada como lida')
      carregar()
    } catch {
      toast.error('Erro ao marcar notificação')
    }
  }

  const handleTodasLidas = async () => {
    try {
      await marcarTodasNotificacoesLidas()
      toast.success('Todas as notificações marcadas como lidas')
      carregar()
    } catch {
      toast.error('Erro ao marcar notificações')
    }
  }

  const tipos = ['todos', ...Array.from(new Set(data.map((n) => n.tipo).filter(Boolean)))]

  const filtrado = data.filter((n) => {
    const passaLeitura =
      filtroLeitura === 'todas' ||
      (filtroLeitura === 'nao_lidas' && !n.lida) ||
      (filtroLeitura === 'lidas' && n.lida)
    const passaTipo = filtroTipo === 'todos' || n.tipo === filtroTipo
    return passaLeitura && passaTipo
  })

  const totalPages = Math.ceil(filtrado.length / PAGE_SIZE)
  const paginado = filtrado.slice(pagina * PAGE_SIZE, pagina * PAGE_SIZE + PAGE_SIZE)

  const naoLidas = data.filter((n) => !n.lida).length

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">
          Alertas e Notificações
          {naoLidas > 0 && (
            <Badge className="ml-2 text-xs">{naoLidas} não lida{naoLidas !== 1 ? 's' : ''}</Badge>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <RefreshCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        {naoLidas > 0 && (
          <Button variant="outline" size="sm" onClick={handleTodasLidas}>
            <CheckCheck className="mr-1.5 size-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Leitura</span>
          <Select value={filtroLeitura} onValueChange={(v) => { setFiltroLeitura(v as any); setPagina(0) }}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="nao_lidas">Não lidas</SelectItem>
              <SelectItem value="lidas">Lidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {tipos.length > 1 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Tipo</span>
            <Select value={filtroTipo} onValueChange={(v) => { setFiltroTipo(v); setPagina(0) }}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === 'todos' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtrado.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-3">
          <Bell className="size-12 text-muted-foreground/30" />
          <p className="font-semibold">Nenhuma notificação encontrada</p>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {paginado.map((n: any) => {
              const TipoIcon = TIPO_ICON[n.tipo] ?? Bell
              const iconColor = TIPO_COLOR[n.tipo] ?? (n.lida ? 'text-muted-foreground' : 'text-primary')
              return (
                <Card
                  key={n.id}
                  className={`border-l-4 transition-colors ${n.lida ? 'border-l-border bg-muted/20' : 'border-l-primary'}`}
                >
                  <CardHeader className="pb-1 flex-row items-start gap-2 pt-3">
                    <TipoIcon className={`size-4 mt-0.5 shrink-0 ${iconColor}`} />
                    <div className="flex flex-1 items-start justify-between gap-2">
                      <CardTitle className={`text-sm leading-snug ${n.lida ? 'font-medium text-muted-foreground' : 'font-semibold'}`}>
                        {n.titulo}
                      </CardTitle>
                      <div className="flex items-center gap-2 shrink-0">
                        {n.tipo && (
                          <Badge variant="outline" className="text-xs capitalize">{n.tipo}</Badge>
                        )}
                        {!n.lida && (
                          <>
                            <Badge variant="default" className="text-xs">Nova</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto py-0.5 px-2 text-xs"
                              onClick={() => handleLida(n.id)}
                            >
                              Marcar lida
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 pl-10">
                    <p className="text-sm text-muted-foreground">{n.mensagem}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {new Date(n.created_at).toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{pagina * PAGE_SIZE + 1}–{Math.min((pagina + 1) * PAGE_SIZE, filtrado.length)} de {filtrado.length}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={pagina >= totalPages - 1} onClick={() => setPagina((p) => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
