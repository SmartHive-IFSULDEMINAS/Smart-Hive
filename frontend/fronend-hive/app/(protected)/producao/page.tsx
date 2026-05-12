'use client'

import { useEffect, useState, useCallback } from 'react'
import { getProducoes, createProducao, updateProducao, deleteProducao, getColmeias } from '@/lib/api'
import { Plus, Search, Pencil, Trash2, MoreVertical, Droplets } from 'lucide-react'
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

const TIPO_MEL_OPTIONS = [
  { value: 'silvestre', label: 'Silvestre' },
  { value: 'eucalipto', label: 'Eucalipto' },
  { value: 'laranjeira', label: 'Laranjeira' },
  { value: 'assa_peixe', label: 'Assa-peixe' },
  { value: 'outro', label: 'Outro' },
]

const EMPTY_FORM = {
  colmeia: '',
  data_colheita: new Date().toISOString().split('T')[0],
  quantidade_kg: '',
  tipo_mel: 'silvestre',
  umidade_percentual: '',
  preco_kg: '',
  observacoes: '',
}

const PAGE_SIZE = 10

export default function ProducaoPage() {
  const [data, setData] = useState<any[]>([])
  const [colmeias, setColmeias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [pr, cr] = await Promise.all([getProducoes(), getColmeias()])
      setData(pr.data?.results ?? pr.data ?? [])
      setColmeias(cr.data?.results ?? cr.data ?? [])
    } catch {
      toast.error('Erro ao carregar produções')
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
      data_colheita: item.data_colheita,
      quantidade_kg: item.quantidade_kg,
      tipo_mel: item.tipo_mel ?? 'silvestre',
      umidade_percentual: item.umidade_percentual ?? '',
      preco_kg: item.preco_kg ?? '',
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
        umidade_percentual: form.umidade_percentual || null,
        preco_kg: form.preco_kg || null,
      }
      if (editingId) {
        await updateProducao(editingId, payload)
        toast.success('Produção atualizada!')
      } else {
        await createProducao(payload)
        toast.success('Produção registrada!')
      }
      setDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao salvar produção')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProducao(deleteId)
      toast.success('Produção excluída!')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Erro ao excluir produção')
    }
  }

  const setF = (field: string, val: any) => setForm((p: any) => ({ ...p, [field]: val }))

  const filtered = data.filter((p) =>
    p.colmeia_identificador?.toLowerCase().includes(search.toLowerCase()) ||
    p.apiario_nome?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const totalKg = filtered.reduce((s, p) => s + parseFloat(p.quantidade_kg ?? 0), 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">Produção de Mel</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-8 w-44 h-8 text-sm"
          />
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Nova Colheita
        </Button>
      </div>

      {/* KPI rápido */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Droplets className="size-4 text-primary" />
          <span>Total filtrado: <strong className="text-foreground">{totalKg.toFixed(2)} kg</strong> em {filtered.length} colheitas</span>
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
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd. (kg)</TableHead>
              <TableHead className="text-right">Umidade (%)</TableHead>
              <TableHead className="text-right">Preço (R$/kg)</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  Nenhuma colheita registrada
                </TableCell>
              </TableRow>
            ) : (
              paged.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm">{new Date(p.data_colheita).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-semibold text-sm">{p.colmeia_identificador}</TableCell>
                  <TableCell className="text-sm">{p.apiario_nome ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{TIPO_MEL_OPTIONS.find((o) => o.value === p.tipo_mel)?.label ?? p.tipo_mel ?? '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">{parseFloat(p.quantidade_kg).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm">{p.umidade_percentual ? `${parseFloat(p.umidade_percentual).toFixed(1)}%` : '—'}</TableCell>
                  <TableCell className="text-right text-sm">{p.preco_kg ? `R$ ${parseFloat(p.preco_kg).toFixed(2)}` : '—'}</TableCell>
                  <TableCell className="p-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="mr-2 size-3.5" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}>
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
          <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Colheita' : 'Nova Colheita'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Colmeia *</Label>
                <Select value={String(form.colmeia)} onValueChange={(v) => setF('colmeia', Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {colmeias.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.identificador} — {c.apiario_nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Data de Colheita *</Label>
                <Input type="date" value={form.data_colheita} onChange={(e) => setF('data_colheita', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Quantidade (kg) *</Label>
                <Input type="number" step="0.01" value={form.quantidade_kg} onChange={(e) => setF('quantidade_kg', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de Mel</Label>
                <Select value={form.tipo_mel} onValueChange={(v) => setF('tipo_mel', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_MEL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Umidade (%)</Label>
                <Input type="number" step="0.1" value={form.umidade_percentual} onChange={(e) => setF('umidade_percentual', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Preço (R$/kg)</Label>
                <Input type="number" step="0.01" value={form.preco_kg} onChange={(e) => setF('preco_kg', e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Observações</Label>
              <Textarea rows={2} value={form.observacoes} onChange={(e) => setF('observacoes', e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar' : 'Registrar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este registro de produção?</AlertDialogDescription>
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
