'use client'

import { useEffect, useState, useCallback } from 'react'
import { getColmeias, createColmeia, updateColmeia, deleteColmeia, getApiarios, getEspecies } from '@/lib/api'
import { Plus, Search, Filter, Pencil, Trash2, Eye, MoreVertical, Thermometer, Volume2, Sun, Waves, Gauge, Weight } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const STATUS_OPTIONS = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'inativa', label: 'Inativa' },
  { value: 'quarentena', label: 'Em Quarentena' },
  { value: 'morta', label: 'Morta/Abandonada' },
]

const TIPO_CAIXA_OPTIONS = [
  { value: 'langstroth', label: 'Langstroth' },
  { value: 'top_bar', label: 'Top Bar' },
  { value: 'warre', label: 'Warré' },
  { value: 'inpa', label: 'INPA' },
  { value: 'af', label: 'AF (Africanizada)' },
  { value: 'outro', label: 'Outro' },
]

const STATUS_BADGE: Record<string, string> = {
  ativa: 'bg-green-100 text-green-800',
  inativa: 'bg-gray-100 text-gray-700',
  quarentena: 'bg-amber-100 text-amber-800',
  morta: 'bg-red-100 text-red-800',
}

const EMPTY_FORM = {
  apiario: '',
  especie: '',
  identificador: '',
  nome: '',
  tipo_caixa: 'langstroth',
  quantidade_abelhas_estimada: 50000,
  status: 'ativa',
  data_instalacao: new Date().toISOString().split('T')[0],
  idade_rainha_meses: '',
  data_ultima_troca_rainha: '',
  numero_quadros: 10,
  peso_estimado_kg: '',
  observacoes: '',
}

const PAGE_SIZE = 10

function SensorChips({ colmeia }: { colmeia: any }) {
  const sensors = [
    { key: 'temperatura_atual', Icon: Thermometer, format: (v: any) => `${Number(v).toFixed(1)}°C`, color: '#4CAF50' },
    { key: 'nivel_ruido', Icon: Volume2, format: (v: any) => `${Number(v).toFixed(1)}dB`, color: '#FFB74D' },
    { key: 'umidade', Icon: Waves, format: (v: any) => `${Number(v).toFixed(1)}%`, color: '#64B5F6' },
    { key: 'luminosidade', Icon: Sun, format: (v: any) => `${Number(v).toFixed(0)}lux`, color: '#FFC107' },
    { key: 'peso', Icon: Weight, format: (v: any) => `${Number(v).toFixed(1)}kg`, color: '#90A4AE' },
  ].filter((s) => colmeia[s.key] != null && colmeia[s.key] !== '')

  if (!colmeia.sensor_iot_ativo) return <span className="text-xs text-muted-foreground">Sem sensor</span>

  return (
    <div className="flex flex-wrap gap-1">
      {sensors.map(({ key, Icon, format, color }) => (
        <span
          key={key}
          className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: `${color}20`, color }}
        >
          <Icon className="size-2.5" />
          {format(colmeia[key])}
        </span>
      ))}
      {sensors.length === 0 && <span className="text-xs text-muted-foreground">Sem leituras</span>}
    </div>
  )
}

export default function ColmeiasPage() {
  const [data, setData] = useState<any[]>([])
  const [apiarios, setApiarios] = useState<any[]>([])
  const [especies, setEspecies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterApiario, setFilterApiario] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<{ id: number; nome: string } | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [cr, ar, er] = await Promise.all([getColmeias(), getApiarios(), getEspecies()])
      setData(cr.data?.results ?? cr.data ?? [])
      setApiarios(ar.data?.results ?? ar.data ?? [])
      setEspecies(er.data?.results ?? er.data ?? [])
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true) }

  const openEdit = (item: any) => {
    setEditingId(item.id)
    setForm({
      apiario: item.apiario,
      especie: item.especie ?? '',
      identificador: item.identificador,
      nome: item.nome ?? '',
      tipo_caixa: item.tipo_caixa,
      quantidade_abelhas_estimada: item.quantidade_abelhas_estimada,
      status: item.status,
      data_instalacao: item.data_instalacao,
      idade_rainha_meses: item.idade_rainha_meses ?? '',
      data_ultima_troca_rainha: item.data_ultima_troca_rainha ?? '',
      numero_quadros: item.numero_quadros,
      peso_estimado_kg: item.peso_estimado_kg ?? '',
      observacoes: item.observacoes ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        especie: form.especie || null,
        idade_rainha_meses: form.idade_rainha_meses || null,
        data_ultima_troca_rainha: form.data_ultima_troca_rainha || null,
        peso_estimado_kg: form.peso_estimado_kg || null,
      }
      if (editingId) {
        await updateColmeia(editingId, payload)
        toast.success('Colmeia atualizada!')
      } else {
        await createColmeia(payload)
        toast.success('Colmeia criada!')
      }
      setDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao salvar colmeia')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteColmeia(deleteId.id)
      toast.success('Colmeia excluída!')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Erro ao excluir colmeia')
    }
  }

  const setF = (field: string, val: any) => setForm((p: any) => ({ ...p, [field]: val }))

  const filtered = data.filter((c) => {
    const matchSearch =
      c.identificador.toLowerCase().includes(search.toLowerCase()) ||
      (c.nome && c.nome.toLowerCase().includes(search.toLowerCase()))
    const matchApiario = !filterApiario || String(c.apiario) === filterApiario
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchApiario && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">Colmeias</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-8 w-44 h-8 text-sm"
          />
        </div>
        <Button
          variant={filtersOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <Filter className="mr-1.5 size-3.5" />
          Filtros
          {(filterApiario || filterStatus) && (
            <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-[10px] text-primary">
              {[filterApiario, filterStatus].filter(Boolean).length}
            </span>
          )}
        </Button>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Nova Colmeia
        </Button>
      </div>

      {/* Filtros */}
      {filtersOpen && (
        <div className="flex flex-wrap gap-3 rounded-lg border p-3 bg-muted/30">
          <div className="flex flex-col gap-1 min-w-40">
            <Label className="text-xs">Apiário</Label>
            <Select value={filterApiario} onValueChange={(v) => { setFilterApiario(v); setPage(0) }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {apiarios.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 min-w-40">
            <Label className="text-xs">Status</Label>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(0) }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(filterApiario || filterStatus) && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterApiario(''); setFilterStatus(''); setPage(0) }}
                className="h-8 text-xs"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Identificador</TableHead>
              <TableHead>Apiário</TableHead>
              <TableHead>Espécie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Abelhas Est.</TableHead>
              <TableHead>Sensores IoT</TableHead>
              <TableHead>Últ. Inspeção</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  {filtered.length === 0 && !search && !filterApiario && !filterStatus
                    ? 'Nenhuma colmeia cadastrada'
                    : 'Nenhuma colmeia encontrada para os filtros aplicados'}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell>
                    <p className="font-semibold text-sm">{c.identificador}</p>
                    {c.nome && <p className="text-xs text-muted-foreground">{c.nome}</p>}
                  </TableCell>
                  <TableCell className="text-sm">{c.apiario_nome}</TableCell>
                  <TableCell className="text-sm">{c.especie_nome ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_OPTIONS.find((o) => o.value === c.status)?.label ?? c.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {c.quantidade_abelhas_estimada?.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell><SensorChips colmeia={c} /></TableCell>
                  <TableCell className="text-sm">
                    {c.data_ultima_inspecao
                      ? new Date(c.data_ultima_inspecao).toLocaleDateString('pt-BR')
                      : '—'}
                  </TableCell>
                  <TableCell className="p-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setDetailItem(c); setDetailOpen(true) }}>
                          <Eye className="mr-2 size-3.5" /> Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="mr-2 size-3.5" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId({ id: c.id, nome: c.identificador })}
                        >
                          <Trash2 className="mr-2 size-3.5" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Colmeia' : 'Nova Colmeia'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Identificador *</Label>
                <Input placeholder="Ex: C001" value={form.identificador} onChange={(e) => setF('identificador', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Nome / Apelido</Label>
                <Input value={form.nome} onChange={(e) => setF('nome', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Apiário *</Label>
                <Select value={String(form.apiario)} onValueChange={(v) => setF('apiario', Number(v))} required>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {apiarios.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Espécie</Label>
                <Select value={form.especie ? String(form.especie) : ''} onValueChange={(v) => setF('especie', v || '')}>
                  <SelectTrigger><SelectValue placeholder="Não especificada" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Não especificada</SelectItem>
                    {especies.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nome ?? e.nome_comum}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de Caixa</Label>
                <Select value={form.tipo_caixa} onValueChange={(v) => setF('tipo_caixa', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_CAIXA_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={(v) => setF('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Qtd. Abelhas *</Label>
                <Input type="number" value={form.quantidade_abelhas_estimada} onChange={(e) => setF('quantidade_abelhas_estimada', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Nº Quadros *</Label>
                <Input type="number" value={form.numero_quadros} onChange={(e) => setF('numero_quadros', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Peso Est. (kg)</Label>
                <Input type="number" step="0.1" value={form.peso_estimado_kg} onChange={(e) => setF('peso_estimado_kg', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Data Instalação *</Label>
                <Input type="date" value={form.data_instalacao} onChange={(e) => setF('data_instalacao', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Idade Rainha (meses)</Label>
                <Input type="number" value={form.idade_rainha_meses} onChange={(e) => setF('idade_rainha_meses', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Últ. Troca Rainha</Label>
                <Input type="date" value={form.data_ultima_troca_rainha} onChange={(e) => setF('data_ultima_troca_rainha', e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Observações</Label>
              <Textarea rows={2} value={form.observacoes} onChange={(e) => setF('observacoes', e.target.value)} />
            </div>
            <DialogFooter className="mt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes — {detailItem?.identificador}</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm py-2">
              {[
                ['Apiário', detailItem.apiario_nome],
                ['Espécie', detailItem.especie_nome ?? 'Não especificada'],
                ['Tipo de Caixa', detailItem.tipo_caixa_display ?? detailItem.tipo_caixa],
                ['Qtd. Abelhas', detailItem.quantidade_abelhas_estimada?.toLocaleString('pt-BR')],
                ['Produção Total', `${parseFloat(detailItem.producao_total ?? 0).toFixed(2)} kg`],
                ['Instalação', new Date(detailItem.data_instalacao).toLocaleDateString('pt-BR')],
                ['Últ. Inspeção', detailItem.data_ultima_inspecao ? new Date(detailItem.data_ultima_inspecao).toLocaleDateString('pt-BR') : 'Nunca'],
                ['Nº Quadros', detailItem.numero_quadros],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[detailItem.status]}`}>
                  {STATUS_OPTIONS.find((o) => o.value === detailItem.status)?.label}
                </span>
              </div>
              {detailItem.observacoes && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p>{detailItem.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a colmeia <strong>{deleteId?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
