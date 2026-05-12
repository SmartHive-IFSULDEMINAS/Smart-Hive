'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  MapPin,
  Container,
  ClipboardList,
  Volume2,
  Bell,
  BarChart3,
  Droplets,
  Pill,
  Bug,
  Microscope,
  LogOut,
  User,
  ChevronDown,
  Menu,
  Loader2,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/contexts/auth-context'
import {
  getNotificacoes,
  getNotificacoesNaoLidas,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
} from '@/lib/api'

const menuSections = [
  {
    label: 'Gestão',
    items: [
      { text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { text: 'Apiários', icon: MapPin, path: '/apiarios' },
      { text: 'Colmeias', icon: Container, path: '/colmeias' },
    ],
  },
  {
    label: 'Operações',
    items: [
      { text: 'Inspeções', icon: ClipboardList, path: '/inspecoes' },
      { text: 'Ruído', icon: Volume2, path: '/historico-ruido' },
      { text: 'Alertas', icon: Bell, path: '/alertas' },
      { text: 'Análises', icon: BarChart3, path: '/analises' },
      { text: 'Produção', icon: Droplets, path: '/producao' },
      { text: 'Tratamentos', icon: Pill, path: '/tratamentos' },
    ],
  },
  {
    label: 'Referência',
    items: [{ text: 'Espécies', icon: Bug, path: '/especies' }],
  },
  {
    label: 'Inteligência Artificial',
    items: [{ text: 'Análise de Pólen', icon: Microscope, path: '/ia-polen' }],
  },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/apiarios': 'Apiários',
  '/colmeias': 'Colmeias',
  '/inspecoes': 'Inspeções',
  '/historico-ruido': 'Histórico de Ruído',
  '/alertas': 'Alertas',
  '/analises': 'Análises',
  '/producao': 'Produção',
  '/tratamentos': 'Tratamentos',
  '/especies': 'Espécies',
  '/ia-polen': 'IA — Análise de Pólen',
}

interface Notificacao {
  id: number
  titulo: string
  mensagem: string
  lida: boolean
  created_at: string
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isDono, isGestor } = useAuth()

  const [notifications, setNotifications] = useState<Notificacao[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)

  const userRole = isDono ? 'Proprietário' : isGestor ? 'Gestor' : 'Apicultor'
  const userInitials = user?.username?.slice(0, 2).toUpperCase() ?? '??'

  const carregarNotificacoes = useCallback(async () => {
    try {
      setNotifLoading(true)
      const [listaRes, naoLidasRes] = await Promise.all([
        getNotificacoes(),
        getNotificacoesNaoLidas(),
      ])
      const itens: Notificacao[] = listaRes.data?.results ?? listaRes.data ?? []
      const naoLidas: Notificacao[] = naoLidasRes.data ?? []
      setNotifications(itens)
      setUnreadCount(naoLidas.length)
    } catch {
      // silencia erros de rede
    } finally {
      setNotifLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarNotificacoes()
    const id = setInterval(carregarNotificacoes, 60_000)
    return () => clearInterval(id)
  }, [carregarNotificacoes])

  const handleMarcarLida = async (id: number) => {
    await marcarNotificacaoLida(id)
    await carregarNotificacoes()
  }

  const handleMarcarTodas = async () => {
    await marcarTodasNotificacoesLidas()
    await carregarNotificacoes()
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        {/* ─── Sidebar ─── */}
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                SH
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold leading-tight">Smart-Hive</span>
                <span className="text-xs text-muted-foreground">Gestão de Apiário</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {menuSections.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.path
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.text}>
                            <Link href={item.path}>
                              <Icon className="size-4" />
                              <span>{item.text}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {userInitials}
                      </div>
                      <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                        <span className="text-xs font-medium">{user?.username}</span>
                        <span className="text-xs text-muted-foreground">{userRole}</span>
                      </div>
                      <ChevronDown className="ml-auto size-3 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-52">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user?.username}</span>
                        <span className="text-xs text-muted-foreground">{userRole}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 size-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* ─── Conteúdo principal ─── */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />

            <h1 className="flex-1 text-sm font-semibold">
              {pageTitles[pathname] ?? 'Smart-Hive'}
            </h1>

            {/* Notificações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-semibold">
                    Notificações{' '}
                    {unreadCount > 0 && (
                      <span className="text-muted-foreground">({unreadCount} não lidas)</span>
                    )}
                  </span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-0.5 px-2 text-xs"
                      onClick={handleMarcarTodas}
                    >
                      Marcar todas
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notifLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    Nenhuma notificação no momento.
                  </p>
                ) : (
                  <ScrollArea className="max-h-80">
                    {notifications.slice(0, 12).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => !item.lida && handleMarcarLida(item.id)}
                        className={`flex flex-col gap-0.5 px-3 py-2.5 cursor-pointer border-l-2 transition-colors hover:bg-accent ${
                          item.lida
                            ? 'border-transparent'
                            : 'border-primary bg-primary/5'
                        }`}
                      >
                        <span
                          className={`text-xs leading-snug ${item.lida ? 'font-medium' : 'font-semibold'}`}
                        >
                          {item.titulo}
                        </span>
                        <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                          {item.mensagem}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {new Date(item.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Avatar usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {userInitials}
                  </div>
                  <span className="hidden sm:inline text-xs">{user?.username}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.username}</span>
                    <span className="text-xs text-muted-foreground">{userRole}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Página */}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
