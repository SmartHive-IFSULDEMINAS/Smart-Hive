'use client'

import { useEffect, useState, useCallback } from 'react'
import { getInspecoes, createInspecao, updateInspecao, deleteInspecao, getColmeias } from '@/lib/api'
import { Plus, Search, Filter, Pencil, Trash2, MoreVertical, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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

const CONDICAO_OPTIONS = [
  { value: 'excelente', label: 'Excelente', cls: 'bg-green-100 text-green-800' },
  { value: 'boa', label: 'Boa', cls: 'bg-green-100 text-green-700' },
  { value: 'regular', label: 'Regular', cls: 'bg-amber-100 text-amber-800' },
  { value: 'ruim', label: 'Ruim', cls: 'bg-red-100 text-red-700' },
  { value: 'critica', label: 'Crítica', cls: 'bg-red-200 text-red-900' },
]

const QTD_OPTIONS = [
  { value: 'abundante', label: 'Abundante' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'baixa', label: 'Baixa' },
  { value: 'ausente', label: 'Ausente' },
]

const EMPTY_FORM = {
  colmeia: '',
  data: new Date().toISOString().slice(0, 16),
  inspetor: '',
  condicao_geral: 'boa',
  presenca_rainha: true,
  rainha_marcada: false,
  quantidade_crias: 'moderada',
  quantidade_mel: 'moderada',
  quantidade_polen: 'moderada',
  presenca_pragas: false,
  tipo_pragas: '',
  presenca_doencas: false,
  tipo_doencas: '',
  alimentacao_artificial: false,
  tipo_alimentacao: '',
  temperatura_ambiente: '',
  umidade_ambiente: '',
  observacoes: '',
  acoes_realizadas: '',
  proxima_inspecao: '',
}

const PAGE_SIZE = 10

function BoolCell({ value, invert = false }: { value: boolean; invert?: boolean }) {
  const ok = invert ? !value : value
  return ok ? (
    <CheckCircle2 className="size-4 text-green-600 mx-auto" />
  ) : (
    <XCircle className="size-4 text-red-500 mx-auto" />
  )
}

export default function InspecoesPage() {
  const [data, setData] = useState<any[]>([])
  const [colmeias, setColmeias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCondicao, setFilterCondicao] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [ir, cr] = await Promise.all([getInspecoes(), getColmeias()])
      setData(ir.data?.results ?? ir.data ?? [])
      setColmeias(cr.data?.results ?? cr.data ?? [])
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
      colmeia: item.colmeia,
      data: new Date(item.data).toISOString().slice(0, 16),
      inspetor: item.inspetor ?? '',
      condicao_geral: item.condicao_geral,
      presenca_rainha: item.presenca_rainha,
      rainha_marcada: item.rainha_marcada,
      quantidade_crias: item.quantidade_crias,
      quantidade_mel: item.quantidade_mel,
      quantidade_polen: item.quantidade_polen,
      presenca_pragas: item.presenca_pragas,
      tipo_pragas: item.tipo_pragas ?? '',
      presenca_doencas: item.presenca_doencas,
      tipo_doencas: item.tipo_doencas ?? '',
      alimentacao_artificial: item.alimentacao_artificial,
      tipo_alimentacao: item.tipo_alimentacao ?? '',
      temperatura_ambiente: item.temperatura_ambiente ?? '',
      umidade_ambiente: item.umidade_ambiente ?? '',
      observacoes: item.observacoes ?? '',
      acoes_realizadas: item.acoes_realizadas ?? '',
      proxima_inspecao: item.proxima_inspecao ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        temperatura_ambiente: form.temperatura_ambiente || null,
        umidade_ambiente: form.umidade_ambiente || null,
        proxima_inspecao: form.proxima_inspecao || null,
      }
      if (editingId) {
        await updateInspecao(editingId, payload)
        toast.success('Inspeção atualizada!')
      } else {
        await createInspecao(payload)
        toast.success('Inspeção registrada!')
      }
      setDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao salvar inspeção')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteInspecao(deleteId)
      toast.success('Inspeção excluída!')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Erro ao excluir inspeção')
    }
  }

  const setF = (field: string, val: any) => setForm((p: any) => ({ ...p, [field]: val }))

  const filtered = data.filter((i) => {
    const matchSearch =
      i.colmeia_identificador?.toLowerCase().includes(search.toLowerCase()) ||
      i.inspetor?.toLowerCase().includes(search.toLowerCase())
    const matchCondicao = !filterCondicao || i.condicao_geral === filterCondicao
    return matchSearch && matchCondicao
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">Inspeções</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-8 w-44 h-8 text-sm"
          />
        </div>
        <Button variant={filtersOpen ? 'default' : 'outline'} size="sm" onClick={() => setFiltersOpen((v) => !v)}>
          <Filter className="mr-1.5 size-3.5" />
          Filtros
        </Button>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Nova Inspeção
        </Button>
      </div>

      {/* Filtros */}
      {filtersOpen && (
        <div className="flex flex-wrap gap-3 rounded-lg border p-3 bg-muted/30">
          <div className="flex flex-col gap-1 min-w-44">
            <Label className="text-xs">Condição Geral</Label>
            <Select value={filterCondicao} onValueChange={(v) => { setFilterCondicao(v); setPage(0) }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {CONDICAO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filterCondicao && (
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={() => { setFilterCondicao(''); setPage(0) }} className="h-8 text-xs">
                Limpar
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
              <TableHead>Data</TableHead>
              <TableHead>Colmeia</TableHead>
              <TableHead>Apiário</TableHead>
              <TableHead>Inspetor</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead className="text-center">Rainha</TableHead>
              <TableHead className="text-center">Pragas</TableHead>
              <TableHead className="text-center">Doenças</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                  {filtered.length === 0 && !search && !filterCondicao
                    ? 'Nenhuma inspeção registrada'
                    : 'Nenhuma inspeção encontrada para os filtros'}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((i) => {
                const cond = CONDICAO_OPTIONS.find((o) => o.value === i.condicao_geral)
                return (
                  <TableRow key={i.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(i.data).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                      <span className="block text-xs text-muted-foreground">
                        {new Date(i.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">{i.colmeia_identificador}</TableCell>
                    <TableCell className="text-sm">{i.apiario_nome ?? '—'}</TableCell>
                    <TableCell className="text-sm">{i.inspetor || '—'}</TableCell>
                    <TableCell>
                      {cond && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cond.cls}`}>
                          {cond.label}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center"><BoolCell value={i.presenca_rainha} /></TableCell>
                    <TableCell className="text-center"><BoolCell value={i.presenca_pragas} invert /></TableCell>
                    <TableCell className="text-center"><BoolCell value={i.presenca_doencas} invert /></TableCell>
                    <TableCell className="p-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(i)}>
                            <Pencil className="mr-2 size-3.5" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(i.id)}>
                            <Trash2 className="mr-2 size-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
          </div>
        </div>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Inspeção' : 'Nova Inspeção'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Colmeia *</Label>
                <Select value={String(form.colmeia)} onValueChange={(v) => setF('colmeia', Number(v))} required>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {colmeias.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.identificador} — {c.apiario_nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Data e Hora *</Label>
                <Input type="datetime-local" value={form.data} onChange={(e) => setF('data', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Inspetor / Responsável</Label>
                <Input value={form.inspetor} onChange={(e) => setF('inspetor', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Condição Geral *</Label>
                <Select value={form.condicao_geral} onValueChange={(v) => setF('condicao_geral', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDICAO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Switches */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/20">
              <p className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado da colmeia</p>
              {[
                { key: 'presenca_rainha', label: 'Rainha Presente' },
                { key: 'rainha_marcada', label: 'Rainha Marcada' },
                { key: 'presenca_pragas', label: 'Presença de Pragas' },
                { key: 'presenca_doencas', label: 'Presença de Doenças' },
                { key: 'alimentacao_artificial', label: 'Alimentação Artificial' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Switch
                    id={key}
                    checked={form[key]}
                    onCheckedChange={(v) => setF(key, v)}
                  />
                  <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>

            {/* Campos condicionais */}
            {(form.presenca_pragas || form.presenca_doencas || form.alimentacao_artificial) && (
              <div className="grid grid-cols-2 gap-3">
                {form.presenca_pragas && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Tipo de Pragas</Label>
                    <Input value={form.tipo_pragas} onChange={(e) => setF('tipo_pragas', e.target.value)} />
                  </div>
                )}
                {form.presenca_doencas && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Tipo de Doenças</Label>
                    <Input value={form.tipo_doencas} onChange={(e) => setF('tipo_doencas', e.target.value)} />
                  </div>
                )}
                {form.alimentacao_artificial && (
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <Label>Tipo de Alimentação</Label>
                    <Input value={form.tipo_alimentacao} onChange={(e) => setF('tipo_alimentacao', e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {/* Quantidades */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'quantidade_crias', label: 'Qtd. Crias' },
                { key: 'quantidade_mel', label: 'Qtd. Mel' },
                { key: 'quantidade_polen', label: 'Qtd. Pólen' },
              ].map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label>{label}</Label>
                  <Select value={form[key]} onValueChange={(v) => setF(key, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QTD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Dados ambientais */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Temperatura Amb. (°C)</Label>
                <Input type="number" step="0.1" value={form.temperatura_ambiente} onChange={(e) => setF('temperatura_ambiente', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Umidade Amb. (%)</Label>
                <Input type="number" value={form.umidade_ambiente} onChange={(e) => setF('umidade_ambiente', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Próxima Inspeção</Label>
                <Input type="date" value={form.proxima_inspecao} onChange={(e) => setF('proxima_inspecao', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Observações</Label>
              <Textarea rows={2} value={form.observacoes} onChange={(e) => setF('observacoes', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ações Realizadas</Label>
              <Textarea rows={2} value={form.acoes_realizadas} onChange={(e) => setF('acoes_realizadas', e.target.value)} />
            </div>

            <DialogFooter className="mt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar' : 'Registrar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta inspeção? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
