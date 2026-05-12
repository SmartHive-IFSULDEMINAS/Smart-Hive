'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password2) {
      toast.error('As senhas não coincidem')
      return
    }
    setLoading(true)
    const result = await register(form)
    setLoading(false)
    if (result.success) {
      router.replace('/dashboard')
    } else {
      toast.error(result.error ?? 'Erro ao registrar')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
            SH
          </div>
          <CardTitle className="text-xl">Criar conta</CardTitle>
          <CardDescription>Preencha os dados para se registrar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">Nome</Label>
                <Input id="first_name" value={form.first_name} onChange={set('first_name')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input id="last_name" value={form.last_name} onChange={set('last_name')} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Usuário *</Label>
              <Input id="username" value={form.username} onChange={set('username')} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password2">Confirmar senha *</Label>
              <Input
                id="password2"
                type="password"
                placeholder="••••••••"
                value={form.password2}
                onChange={set('password2')}
                required
              />
            </div>
            <Button type="submit" className="w-full mt-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Registrar
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
