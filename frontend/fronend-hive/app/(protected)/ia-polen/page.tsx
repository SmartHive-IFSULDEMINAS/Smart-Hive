'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { classificarPolen, getClassificacoes, getClassificacaoEstatisticas } from '@/lib/api'
import { Loader2, Microscope, Upload, ImageIcon, X, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function IAPolenPage() {
  const [historico, setHistorico] = useState<any[]>([])
  const [estatisticas, setEstatisticas] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [classificando, setClassificando] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const carregar = useCallback(() => {
    Promise.all([
      getClassificacoes().then((r) => r.data?.results ?? r.data ?? []),
      getClassificacaoEstatisticas().then((r) => r.data).catch(() => null),
    ])
      .then(([hist, stats]) => {
        setHistorico(hist)
        setEstatisticas(stats)
      })
      .catch(() => toast.error('Erro ao carregar histórico'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivoSelecionado(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const limparSelecao = () => {
    setArquivoSelecionado(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClassificar = async () => {
    if (!arquivoSelecionado) return
    setClassificando(true)
    try {
      const formData = new FormData()
      formData.append('imagem', arquivoSelecionado)
      const res = await classificarPolen(formData)
      const especie = res.data?.especie ?? res.data?.resultado ?? 'OK'
      const conf = res.data?.confianca
      toast.success(`Classificado: ${especie}${conf != null ? ` (${(conf * 100).toFixed(0)}%)` : ''}`)
      limparSelecao()
      carregar()
    } catch {
      toast.error('Erro ao classificar imagem')
    } finally {
      setClassificando(false)
    }
  }

  const confiancaColor = (v: number) => {
    if (v >= 0.8) return 'bg-green-500'
    if (v >= 0.5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-2xl font-bold min-w-32">IA — Análise de Pólen</h2>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <RefreshCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Microscope className="size-4 text-primary" />
            Classificar nova imagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!preview ? (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-10 gap-3 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="size-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Clique para selecionar uma imagem</p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, JPEG — microscopia de pólen</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative w-full max-w-sm mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Pré-visualização"
                  className="rounded-lg border w-full object-contain max-h-64"
                />
                <button
                  onClick={limparSelecao}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 border shadow-sm hover:bg-muted"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="size-4" />
                <span className="truncate">{arquivoSelecionado?.name}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={limparSelecao} disabled={classificando}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleClassificar} disabled={classificando}>
                  {classificando ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Classificando...</>
                  ) : (
                    <><Microscope className="mr-2 size-4" /> Classificar</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas rápidas */}
      {estatisticas && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Total de Análises</p>
              <p className="text-2xl font-bold">{estatisticas.total ?? historico.length}</p>
            </CardContent>
          </Card>
          {estatisticas.especie_mais_comum && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Espécie Mais Comum</p>
                <p className="text-lg font-semibold leading-tight">{estatisticas.especie_mais_comum}</p>
              </CardContent>
            </Card>
          )}
          {estatisticas.confianca_media != null && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Confiança Média</p>
                <p className="text-2xl font-bold">{(estatisticas.confianca_media * 100).toFixed(0)}%</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Histórico */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Histórico de Classificações</h3>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : historico.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <Microscope className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Nenhuma classificação ainda. Envie uma imagem de pólen para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {historico.map((c: any) => {
              const confianca = c.confianca != null ? parseFloat(c.confianca) : null
              return (
                <Card key={c.id}>
                  <CardHeader className="pb-2 flex-row items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Microscope className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {c.especie ?? c.resultado ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.created_at ?? c.data).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </CardHeader>
                  {confianca != null && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${confiancaColor(confianca)}`}
                            style={{ width: `${(confianca * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {(confianca * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
