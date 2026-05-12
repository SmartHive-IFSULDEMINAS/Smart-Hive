'use client'

import { useEffect, useState, useCallback } from 'react'
import { getEspecies, createEspecie, updateEspecie, deleteEspecie } from '@/lib/api'
import { Plus, Search, Pencil, Trash2, Bug } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

const AGRESSIVIDADE_LABELS: Record<number, string> = {
  1: 'Muito Dócil',
  2: 'Dócil',
  3: 'Moderada',
  4: 'Agressiva',
  5: 'Muito Agressiva',
}

const AGRESSIVIDADE_COLORS: Record<number, string> = {
  1: 'text-green-600',
  2: 'text-green-500',
  3: 'text-yellow-600',
  4: 'text-orange-500',
  5: 'text-red-600',
}

const EMPTY_FORM = {
  nome: '',
  nome_cientifico: '',
  descricao: '',
  caracteristicas: '',
  nivel_agressividade: '3',
  producao_media_anual_kg: '',
  cor_identificacao: '#F4A100',
}

export default function EspeciesPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<{ id: number; nome: string } | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const r = await getEspecies()
      setData(r.data?.results ?? r.data ?? [])
    } catch {
      toast.error('Erro ao carregar espécies')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true) }

  const openEdit = (item: any) => {
    setEditingId(item.id)
    setForm({
      nome: item.nome,
      nome_cientifico: item.nome_cientifico ?? '',
      descricao: item.descricao ?? '',
      caracteristicas: item.caracteristicas ?? '',
      nivel_agressividade: String(item.nivel_agressividade ?? 3),
      producao_media_anual_kg: item.producao_media_anual_kg ?? '',
      cor_identificacao: item.cor_identificacao ?? '#F4A100',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        nivel_agressividade: Number(form.nivel_agressividade),
        producao_media_anual_kg: form.producao_media_anual_kg || null,
      }
      if (editingId) {
        await updateEspecie(editingId, payload)
        toast.success('Espécie atualizada!')
      } else {
        await createEspecie(payload)
        toast.success('Espécie criada!')
      }
      setDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao salvar espécie')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteEspecie(deleteId.id)
      toast.success('Espécie excluída!')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Erro ao excluir espécie')
    }
  }

  const setF = (field: string, val: any) => setForm((p: any) => ({ ...p, [field]: val }))

  const filtered = data.filter((e) =>
    e.nome?.toLowerCase().includes(search.toLowerCase()) ||
    e.nome_cientifico?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">Espécies de Abelhas</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar espécies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-52 h-8 text-sm"
          />
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Nova Espécie
        </Button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-3">
          <Bug className="size-12 text-muted-foreground/30" />
          <p className="font-semibold">{search ? 'Nenhuma espécie encontrada' : 'Nenhuma espécie cadastrada'}</p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Tente uma busca diferente' : 'Cadastre as espécies de abelhas do seu apiário'}
          </p>
          {!search && (
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-4" />
              Nova Espécie
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.id} className="flex flex-col" style={{ borderLeftColor: e.cor_identificacao, borderLeftWidth: 4 }}>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start gap-2">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${e.cor_identificacao}20` }}
                  >
                    <Bug className="size-4" style={{ color: e.cor_identificacao }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm leading-tight">{e.nome}</CardTitle>
                    {e.nome_cientifico && (
                      <p className="text-xs italic text-muted-foreground truncate">{e.nome_cientifico}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3 flex-1 space-y-1.5">
                {e.nivel_agressividade && (
                  <p className={`text-xs font-medium ${AGRESSIVIDADE_COLORS[e.nivel_agressividade] ?? ''}`}>
                    Agressividade: {AGRESSIVIDADE_LABELS[e.nivel_agressividade] ?? e.nivel_agressividade}
                  </p>
                )}
                {e.producao_media_anual_kg && (
                  <p className="text-xs text-muted-foreground">
                    Produção média: <strong className="text-foreground">{parseFloat(e.producao_media_anual_kg).toFixed(1)} kg/ano</strong>
                  </p>
                )}
                {e.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{e.descricao}</p>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-1 py-2 px-4 border-t">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(e)}>
                  <Pencil className="size-3.5 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setDeleteId({ id: e.id, nome: e.nome })}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Espécie' : 'Nova Espécie'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Nome Popular *</Label>
                <Input value={form.nome} onChange={(e) => setF('nome', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Nome Científico</Label>
                <Input value={form.nome_cientifico} onChange={(e) => setF('nome_cientifico', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Nível de Agressividade</Label>
                <Select value={form.nivel_agressividade} onValueChange={(v) => setF('nivel_agressividade', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AGRESSIVIDADE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Produção Média (kg/ano)</Label>
                <Input type="number" step="0.1" value={form.producao_media_anual_kg} onChange={(e) => setF('producao_media_anual_kg', e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cor de Identificação</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.cor_identificacao}
                  onChange={(e) => setF('cor_identificacao', e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-1"
                />
                <Input value={form.cor_identificacao} onChange={(e) => setF('cor_identificacao', e.target.value)} className="flex-1" placeholder="#F4A100" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição</Label>
              <Textarea rows={2} value={form.descricao} onChange={(e) => setF('descricao', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Características</Label>
              <Textarea rows={2} value={form.caracteristicas} onChange={(e) => setF('caracteristicas', e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a espécie <strong>{deleteId?.nome}</strong>?
            </AlertDialogDescription>
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
