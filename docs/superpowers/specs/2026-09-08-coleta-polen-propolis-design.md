# Registro de coleta de pólen e própolis — design

## Contexto

O time recebeu o pedido: "Será importante registrar a coleta de própolis e também de pólen". Uma investigação no código mostrou que isso não existe hoje:

- **Produção de Mel** (`ProducaoMel` + tela "Produção") registra colheitas, mas é honey-específico: tem `tipo_mel`, `qualidade`, `quantidade_kg`, sem campo de tipo de produto reaproveitável.
- **Própolis** só existe como categoria de **venda/receita** (`Receita.tipo_receita = 'venda_propolis'`) — serve pra lançar uma venda no financeiro, não para registrar a colheita em si (quantidade coletada, data, colmeia de origem).
- **"Análise de Pólen"** (`IAPolen`) é uma feature de classificação de espécie de pólen via sensor espectral/IA — não tem relação com volume de pólen colhido.

Este spec cobre um novo fluxo de **registro de coleta** (colmeia, data, quantidade, observações) para pólen e própolis, com telas próprias no menu — mirando o mesmo papel que "Produção" já cumpre para o mel, mas sem duplicar o modelo de dados do mel.

## Decisões já tomadas (com o usuário)

- Telas separadas no menu lateral, uma para cada produto — não abas dentro de uma tela.
- Quantidade em **gramas** (não kg — colheitas de pólen/própolis são tipicamente bem menores que as de mel).
- Sem campos de classificação extra por enquanto (sem "tipo" ou "qualidade" como o mel tem) — só colmeia, data, quantidade, observações.
- Aparecem no Dashboard geral, como estatísticas de mês/ano — sem entrar no gráfico "Evolução da Produção" nem na "Previsão de Produção", que continuam específicos de mel/kg.
- Nomenclatura: "Produção de Pólen" e "Produção de Própolis", mesmo padrão de nome que "Produção" (mel) já usa.

## Arquitetura

Um único model/endpoint compartilhado no backend (`ColetaProduto`, com um campo `tipo_produto`), consumido por duas páginas de frontend genuinamente separadas (rotas, itens de menu e títulos próprios), cada uma filtrando pelo seu tipo. Isso evita duplicar model/serializer/viewset entre pólen e própolis, que têm exatamente os mesmos campos — mas ainda entrega telas totalmente distintas para quem usa o sistema, que era o requisito.

Se no futuro pólen e própolis precisarem de campos divergentes (ex.: um "tipo" específico só para pólen), o model pode ser desmembrado então — não é uma migração difícil, e não vale a complexidade adicional agora que ambos têm o mesmo formato.

## Backend

### Model

Novo model em `backend/api/models.py`, ao lado de `ProducaoMel`, seguindo as mesmas convenções (campos `created_at`/`updated_at`, `Meta.ordering`, `__str__`):

```python
class ColetaProduto(models.Model):
    """Modelo para registro de coleta de produtos derivados (pólen, própolis)"""

    TIPO_PRODUTO_CHOICES = [
        ('propolis', 'Própolis'),
        ('polen', 'Pólen'),
    ]

    colmeia = models.ForeignKey(
        Colmeia,
        on_delete=models.CASCADE,
        related_name='coletas_produto',
        verbose_name='Colmeia'
    )
    tipo_produto = models.CharField(
        max_length=20,
        choices=TIPO_PRODUTO_CHOICES,
        verbose_name='Tipo de Produto'
    )
    data_coleta = models.DateField(verbose_name='Data da Coleta')
    quantidade_g = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Quantidade (g)'
    )
    observacoes = models.TextField(blank=True, verbose_name='Observações')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Coleta de Produto'
        verbose_name_plural = 'Coletas de Produto'
        ordering = ['-data_coleta']

    def __str__(self):
        return f"{self.quantidade_g}g de {self.get_tipo_produto_display()} - {self.colmeia.identificador} - {self.data_coleta.strftime('%d/%m/%Y')}"
```

Requer uma migration nova (`makemigrations`/`migrate`).

### Serializers

Em `backend/api/serializers.py`, ao lado dos serializers de `ProducaoMel`:

- `ColetaProdutoSerializer` — todos os campos, para criar/editar/detalhar.
- `ColetaProdutoListSerializer` — versão enxuta para listagem (inclui `colmeia_identificador` e `apiario_nome` via campos derivados, mesmo padrão de `ProducaoMelListSerializer`).

### ViewSet e rota

Em `backend/api/views.py`: `ColetaProdutoViewSet(viewsets.ModelViewSet)`, com `queryset = ColetaProduto.objects.select_related('colmeia', 'colmeia__apiario').all()`, `filter_backends = [filters.SearchFilter, filters.OrderingFilter]`, e um `get_queryset` sobrescrito que lê `request.query_params.get('tipo_produto')` (obrigatório na prática, já que as duas telas sempre mandam esse filtro) e, no mesmo padrão de `ProducaoMelViewSet.get_queryset`, também `colmeia`, `apiario` e `data_inicio`/`data_fim` — não usa `django-filter` (a suíte de ViewSets do projeto filtra via `get_queryset` manual lendo `request.query_params`, não há uso de `django-filter` apesar da menção em `CLAUDE.md`; este spec segue o padrão real do código, não o do documento).

Registrado em `backend/api/urls.py` via router, path `coletas-produto` → `/api/coletas-produto/`.

### Dashboard

Em `DashboardView` (`backend/api/views.py`), adiciona ao dicionário `stats`:

```python
'producao_polen_mes_g': ColetaProduto.objects.filter(
    tipo_produto='polen', data_coleta__gte=inicio_mes
).aggregate(total=Sum('quantidade_g'))['total'] or 0,
'producao_polen_ano_g': ColetaProduto.objects.filter(
    tipo_produto='polen', data_coleta__gte=inicio_ano
).aggregate(total=Sum('quantidade_g'))['total'] or 0,
'producao_propolis_mes_g': ColetaProduto.objects.filter(
    tipo_produto='propolis', data_coleta__gte=inicio_mes
).aggregate(total=Sum('quantidade_g'))['total'] or 0,
'producao_propolis_ano_g': ColetaProduto.objects.filter(
    tipo_produto='propolis', data_coleta__gte=inicio_ano
).aggregate(total=Sum('quantidade_g'))['total'] or 0,
```

Sem mudanças no gráfico de evolução mensal nem na previsão — ambos continuam mel-específicos (fora de escopo, ver "Fora de escopo" abaixo).

## Frontend

### Componente compartilhado

`frontend/src/components/ColetaProdutoPage.jsx` — recebe `tipoProduto` (`'polen'` | `'propolis'`), `titulo` e `icone` como props. Contém toda a lógica hoje presente em `Producao.jsx` (listagem em tabela, cards de resumo — total coletado, número de coletas, média por coleta —, dialog de criar/editar, exclusão com confirmação), adaptada para os campos de `ColetaProduto` (sem os campos `tipo_mel`/`qualidade`/`numero_quadros_colhidos`/`umidade_mel` que só existem em mel). Toda chamada à API já passa `tipoProduto` fixo (na query de listagem e no payload de criação/edição).

### Páginas finas

`frontend/src/pages/ProducaoPolen.jsx`:
```jsx
export default function ProducaoPolen() {
    return <ColetaProdutoPage tipoProduto="polen" titulo="Produção de Pólen" icone={<PolenIcon />} />;
}
```

`frontend/src/pages/ProducaoPropolis.jsx`: mesmo padrão, com `tipoProduto="propolis"` e `titulo="Produção de Própolis"`.

### Serviço de API

Em `frontend/src/services/api.js`, ao lado das funções de produção de mel:

```js
export const getColetasProduto = (params) => api.get('/coletas-produto/', { params });
export const getColetaProduto = (id) => api.get(`/coletas-produto/${id}/`);
export const createColetaProduto = (data) => api.post('/coletas-produto/', data);
export const updateColetaProduto = (id, data) => api.put(`/coletas-produto/${id}/`, data);
export const deleteColetaProduto = (id) => api.delete(`/coletas-produto/${id}/`);
```

### Rotas e menu

Em `App.jsx`, duas novas rotas protegidas: `/producao-polen` → `ProducaoPolen`, `/producao-propolis` → `ProducaoPropolis`.

Em `Layout.jsx`, dois novos itens no grupo `OPERAÇÕES`, logo após "Produção":
```js
{ text: 'Produção de Pólen',    icon: <PolenIcon />,     path: '/producao-polen' },
{ text: 'Produção de Própolis', icon: <PropolisIcon />,  path: '/producao-propolis' },
```
e as entradas correspondentes no mapa de título por rota (perto de `'/producao': 'Produção'`).

### Dashboard

Em `Dashboard.jsx`, dois novos `StatCard` (mesma família visual dos já existentes), exibindo `producao_polen_mes_g`/`ano_g` e `producao_propolis_mes_g`/`ano_g` do payload do dashboard — posicionados abaixo da linha atual de 4 KPIs, não substituindo nenhum existente.

## Fora de escopo

- Campos de classificação/qualidade para pólen ou própolis (pode ser adicionado depois se necessário).
- Vínculo automático com o financeiro (`Receita`) — assim como a colheita de mel hoje não cria uma receita automaticamente (venda é lançada manualmente, separada da colheita), coleta de pólen/própolis segue o mesmo padrão: só um registro de colheita, sem gerar lançamento financeiro sozinho.
- Gráfico "Evolução da Produção" e "Previsão de Produção" no Dashboard — continuam mel/kg-específicos.
- Qualquer alteração em `ProducaoMel` ou na tela "Produção" existente.

## Testes

- Backend: testes automatizados no padrão já usado em `backend/api/tests.py` (o projeto tem suíte automatizada rodável via `python manage.py test`) — cobrindo criação de `ColetaProduto` para os dois tipos, filtro por `tipo_produto` na listagem, e que os totais do dashboard batem com os dados criados.
- Frontend: sem suíte automatizada configurada (só ESLint) — verificação manual via navegador: criar/editar/excluir uma coleta de cada tipo, confirmar que a lista e os cards do Dashboard refletem os dados.
