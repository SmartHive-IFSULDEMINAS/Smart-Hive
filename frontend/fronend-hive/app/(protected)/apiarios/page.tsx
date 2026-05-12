'use client'

import { useEffect, useState, useCallback } from 'react'
import { getApiarios, createApiario, updateApiario, deleteApiario } from '@/lib/api'
import { Plus, MapPin, Container, Phone, User, Pencil, Trash2, Search, Wifi } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardFooter,
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

const EMPTY_FORM = {
  nome: '',
  localizacao: '',
  latitude: '',
  longitude: '',
  descricao: '',
  responsavel: '',
  telefone_contato: '',
  data_criacao: new Date().toISOString().split('T')[0],
  ativo: true,
  observacoes: '',
}

export default function ApiáriosPage() {
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
      const r = await getApiarios()
      setData(r.data?.results ?? r.data ?? [])
    } catch {
      toast.error('Erro ao carregar apiários')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (item: any) => {
    setEditingId(item.id)
    setForm({
      nome: item.nome,
      localizacao: item.localizacao,
      latitude: item.latitude ?? '',
      longitude: item.longitude ?? '',
      descricao: item.descricao ?? '',
      responsavel: item.responsavel ?? '',
      telefone_contato: item.telefone_contato ?? '',
      data_criacao: item.data_criacao,
      ativo: item.ativo,
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
        latitude: form.latitude || null,
        longitude: form.longitude || null,
      }
      if (editingId) {
        await updateApiario(editingId, payload)
        toast.success('Apiário atualizado!')
      } else {
        await createApiario(payload)
        toast.success('Apiário criado!')
      }
      setDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao salvar apiário')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteApiario(deleteId.id)
      toast.success('Apiário excluído!')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Erro ao excluir apiário')
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p: any) => ({ ...p, [field]: e.target.value }))

  const filtered = data.filter(
    (a) =>
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.localizacao.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">Apiários</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar apiários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-52 h-8 text-sm"
          />
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Novo Apiário
        </Button>
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-3">
          <MapPin className="size-12 text-muted-foreground/30" />
          <p className="font-semibold">{search ? 'Nenhum apiário encontrado' : 'Nenhum apiário cadastrado'}</p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Tente uma busca diferente' : 'Comece adicionando seu primeiro apiário'}
          </p>
          {!search && (
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-4" />
              Novo Apiário
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card
              key={a.id}
              className={`flex flex-col border-l-4 ${a.ativo ? 'border-l-green-500' : 'border-l-red-400'}`}
            >
              <CardContent className="flex-1 pt-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">{a.localizacao}</p>
                    </div>
                  </div>
                  <Badge variant={a.ativo ? 'default' : 'destructive'} className="text-xs shrink-0">
                    {a.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Container className="size-3.5 text-primary" />
                    <strong>{a.total_colmeias ?? 0}</strong> colmeias
                  </span>
                  <span className="text-muted-foreground text-xs">{a.colmeias_ativas ?? 0} ativas</span>
                </div>

                {a.sensor_iot_ativo && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                    <Wifi className="size-3" />
                    IoT ativo
                    {a.temperatura_atual && (
                      <span className="ml-1 text-muted-foreground">· {parseFloat(a.temperatura_atual).toFixed(1)}°C</span>
                    )}
                  </div>
                )}

                {(a.responsavel || a.telefone_contato) && (
                  <div className="mt-2 pt-2 border-t space-y-0.5">
                    {a.responsavel && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="size-3" /> {a.responsavel}
                      </p>
                    )}
                    {a.telefone_contato && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="size-3" /> {a.telefone_contato}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-1 py-2 px-4 border-t">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(a)}>
                  <Pencil className="size-3.5 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setDeleteId({ id: a.id, nome: a.nome })}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Apiário' : 'Novo Apiário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" value={form.nome} onChange={set('nome')} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="localizacao">Localização / Endereço *</Label>
              <Input id="localizacao" value={form.localizacao} onChange={set('localizacao')} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" value={form.latitude} onChange={set('latitude')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" value={form.longitude} onChange={set('longitude')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input id="responsavel" value={form.responsavel} onChange={set('responsavel')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={form.telefone_contato} onChange={set('telefone_contato')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="data_criacao">Data de Criação *</Label>
                <Input id="data_criacao" type="date" value={form.data_criacao} onChange={set('data_criacao')} required />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="ativo"
                  checked={form.ativo}
                  onCheckedChange={(v) => setForm((p: any) => ({ ...p, ativo: v }))}
                />
                <Label htmlFor="ativo">Apiário Ativo</Label>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" rows={2} value={form.descricao} onChange={set('descricao')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" rows={2} value={form.observacoes} onChange={set('observacoes')} />
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o apiário <strong>{deleteId?.nome}</strong>? Todas as
              colmeias associadas serão removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
