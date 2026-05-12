'use client'

import { useEffect, useState, useCallback } from 'react'
import { getTratamentos, createTratamento, updateTratamento, deleteTratamento, getColmeias } from '@/lib/api'
import { Plus, Search, Pencil, Trash2, MoreVertical, Pill } from 'lucide-react'
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

const TIPO_OPTIONS = [
  { value: 'preventivo', label: 'Preventivo' },
  { value: 'curativo', label: 'Curativo' },
  { value: 'alimentacao', label: 'Alimentação Suplementar' },
  { value: 'controle_pragas', label: 'Controle de Pragas' },
  { value: 'outro', label: 'Outro' },
]

const STATUS_OPTIONS = [
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
]

const STATUS_BADGE: Record<string, string> = {
  em_andamento: 'bg-blue-100 text-blue-700',
  concluido: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

const EMPTY_FORM = {
  colmeia: '',
  tipo_tratamento: 'preventivo',
  data_inicio: new Date().toISOString().split('T')[0],
  data_fim: '',
  medicamento: '',
  dosagem: '',
  frequencia_aplicacao: '',
  motivo: '',
  status: 'em_andamento',
  resultado: '',
  custo: '',
  observacoes: '',
}

const PAGE_SIZE = 10

export default function TratamentosPage() {
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
      const [tr, cr] = await Promise.all([getTratamentos(), getColmeias()])
      setData(tr.data?.results ?? tr.data ?? [])
      setColmeias(cr.data?.results ?? cr.data ?? [])
    } catch {
      toast.error('Erro ao carregar tratamentos')
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
      tipo_tratamento: item.tipo_tratamento ?? 'preventivo',
      data_inicio: item.data_inicio,
      data_fim: item.data_fim ?? '',
      medicamento: item.medicamento ?? '',
      dosagem: item.dosagem ?? '',
      frequencia_aplicacao: item.frequencia_aplicacao ?? '',
      motivo: item.motivo ?? '',
      status: item.status ?? 'em_andamento',
      resultado: item.resultado ?? '',
      custo: item.custo ?? '',
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
        data_fim: form.data_fim || null,
        custo: form.custo || null,
      }
      if (editingId) {
        await updateTratamento(editingId, payload)
        toast.success('Tratamento atualizado!')
      } else {
        await createTratamento(payload)
        toast.success('Tratamento registrado!')
      }
      setDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao salvar tratamento')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteTratamento(deleteId)
      toast.success('Tratamento excluído!')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Erro ao excluir tratamento')
    }
  }

  const setF = (field: string, val: any) => setForm((p: any) => ({ ...p, [field]: val }))

  const filtered = data.filter((t) =>
    t.colmeia_identificador?.toLowerCase().includes(search.toLowerCase()) ||
    t.medicamento?.toLowerCase().includes(search.toLowerCase()) ||
    t.motivo?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">Tratamentos</h2>
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
          Novo Tratamento
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Data Início</TableHead>
              <TableHead>Colmeia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Medicamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Custo (R$)</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Pill className="size-8 text-muted-foreground/30" />
                    Nenhum tratamento registrado
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm">{new Date(t.data_inicio).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-semibold text-sm">{t.colmeia_identificador ?? t.colmeia}</TableCell>
                  <TableCell className="text-sm">{TIPO_OPTIONS.find((o) => o.value === t.tipo_tratamento)?.label ?? t.tipo_tratamento}</TableCell>
                  <TableCell className="text-sm">{t.medicamento || '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[t.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_OPTIONS.find((o) => o.value === t.status)?.label ?? t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">{t.custo ? `R$ ${parseFloat(t.custo).toFixed(2)}` : '—'}</TableCell>
                  <TableCell className="p-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(t)}><Pencil className="mr-2 size-3.5" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(t.id)}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Tratamento' : 'Novo Tratamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2">
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
                <Label>Tipo de Tratamento *</Label>
                <Select value={form.tipo_tratamento} onValueChange={(v) => setF('tipo_tratamento', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setF('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Data de Início *</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => setF('data_inicio', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Data de Término</Label>
                <Input type="date" value={form.data_fim} onChange={(e) => setF('data_fim', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Medicamento / Produto</Label>
                <Input value={form.medicamento} onChange={(e) => setF('medicamento', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Dosagem</Label>
                <Input value={form.dosagem} onChange={(e) => setF('dosagem', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Frequência de Aplicação</Label>
                <Input value={form.frequencia_aplicacao} onChange={(e) => setF('frequencia_aplicacao', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Custo (R$)</Label>
                <Input type="number" step="0.01" value={form.custo} onChange={(e) => setF('custo', e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Motivo / Diagnóstico *</Label>
              <Textarea rows={2} value={form.motivo} onChange={(e) => setF('motivo', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Resultado</Label>
              <Textarea rows={2} value={form.resultado} onChange={(e) => setF('resultado', e.target.value)} />
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
            <AlertDialogDescription>Tem certeza que deseja excluir este tratamento?</AlertDialogDescription>
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
