---
name: agen+
description: Plataforma de agendamento online para pequenos negócios — um link, clientes agendam sozinhos.
colors:
  ink: "#0A0A09"
  ink-2: "#141210"
  ink-3: "#1C1A18"
  cream: "#F0EBE3"
  cream-2: "#E6DED5"
  muted: "#706C67"
  muted-2: "#9E9990"
  gold: "#E8952A"
  gold-deep: "#CC7E1C"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 4vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.1em"
rounded:
  pill: "99px"
  card: "20px"
  step: "50%"
  base: "10px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "60px"
  section: "80px"
  section-lg: "100px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "#000000"
    rounded: "{rounded.pill}"
    padding: "15px 32px"
  button-primary-hover:
    backgroundColor: "{colors.gold-deep}"
  button-small:
    backgroundColor: "{colors.gold}"
    textColor: "#000000"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "15px 32px"
---

# Design System: agen+

## Overview

**Creative North Star: "O Livro de Agendamentos de Luxo"**

agen+ traduz o objeto mais familiar de qualquer salão ou barbearia — o livro de agendamentos em papel — para uma linguagem digital premium. O fundo quase-preto (`#0A0A09`) evoca o couro de uma agenda de luxo; o âmbar (`#E8952A`) é o marcador dourado que indica o que importa. A tipografia Bricolage Grotesque carrega autoridade sem ser fria: é grossa, comprimida, confiante.

A landing page recusa os padrões da categoria: sem fundo branco com gradiente índigo, sem tons pastel neutros, sem serifa editorial. O mundo visual é deliberadamente escuro e quente — um espaço onde o profissional de beleza se reconhece como gestor, não como usuário de software.

**Key Characteristics:**
- Fundo escuro como superfície premium (não "modo dark" de desenvolvedor)
- Âmbar como único acento — aparece em CTAs, marcadores e elementos ativos; sua escassez é a sua força
- Tipografia display condensada e pesada (Bricolage Grotesque 800) como voz principal
- Textura de linhas horizontais no hero como referência ao papel quadriculado de uma agenda
- Seção de fechamento totalmente "encharcada" em âmbar — o único momento de inversão

## Colors

Paleta de dois mundos: quase-pretos quentes para superfícies, âmbar intenso como único acento de ação.

### Primary
- **Amber Ledger** (`#E8952A`): O único acento de ação. Usado exclusivamente em CTAs primários, marcadores de lista, bordas de estado ativo e o fundo da seção final. Sua raridade nas superfícies escuras é intencional.
- **Amber Deep** (`#CC7E1C`): Estado hover do âmbar. Nunca aparece em repouso.

### Neutral
- **Ink Black** (`#0A0A09`): Superfície base — hero, features, footer. Quase-preto com leve temperatura quente.
- **Ink Dark** (`#141210`): Superfície secundária — seção pain, gestor.
- **Ink Deeper** (`#1C1A18`): Superfície terciária — seção preço.
- **Warm Cream** (`#F0EBE3`): Texto principal sobre escuro. Tom de papel creme.
- **Cream Muted** (`#E6DED5`): Texto secundário sobre escuro.
- **Stone Mid** (`#706C67`): Texto terciário, labels, microcopy.
- **Stone Light** (`#9E9990`): Texto de suporte, nav links em repouso.

### Named Rules
**A Regra do Acento Único.** O âmbar aparece em ≤ 2 elementos por viewport. Seu uso em CTAs e marcadores é estrutural; aplicá-lo em decoração ou ênfases de texto dilui a hierarquia.

**A Regra do Fundo Quente.** Todos os fundos têm temperatura quente. Cinzas frios, azuis ou violetas são incompatíveis com este mundo.

## Typography

**Display Font:** Bricolage Grotesque (com fallback system-ui, sans-serif)
**Body Font:** system-ui / -apple-system / Segoe UI

**Character:** Bricolage Grotesque em peso 800 carrega o registro da headline de jornal — comprimida, direta, sem ornamentos. O corpo em system-ui é deliberadamente neutro para contrastar com a voz display sem competir.

### Hierarchy
- **Display** (800, `clamp(2.75rem, 7vw, 5.5rem)`, lh 1.04, ls -0.035em): Headlines de seção principais. Hero e seção de fechamento.
- **Headline** (800, `clamp(1.8rem, 4vw, 3rem)`, lh 1.08, ls -0.035em): Títulos de seções secundárias (gestor, preço).
- **Title** (700, `1.05rem`, lh 1.4, ls -0.01em): Títulos de features e passos.
- **Body** (400, `1rem`, lh 1.65): Texto corrido de descrição. Máximo ~58ch.
- **Label** (700, `0.75rem`, ls 0.1em, uppercase): Eyebrows de categoria (ex: "Preço simples, sem surpresa").

### Named Rules
**A Regra do Peso Único.** Bricolage Grotesque aparece apenas em 800. Sem uso em pesos intermediários (400, 600) — eles perdem o caráter da fonte neste contexto.

## Layout

Container principal: `max-width: 1200px`, centrado, padding lateral `max(24px, 5vw)`.

**Hero:** Grid 2 colunas (`1fr 1fr`), gap 60px, colapsa para 1 coluna em 800px. Mínimo `100svh`.

**Seção Gestor:** Grid 2 colunas (`1fr 1.2fr`), gap 60px, colapsa em 800px. Imagem na coluna direita.

**Seção Preço:** Coluna única centralizada, `max-width: 480px`.

**Seção Fechamento (CTA):** Grid 2 colunas (`1fr 1fr`), gap 40px, overflow hidden, sem padding vertical no container — a imagem da modelo ancora na borda inferior. Colapsa em 640px.

**Ritmo de seções:**
- `padding: 80px` — pain, how, gestor, price (seções de transição)
- `padding: 100px` — features, close (seções âncora)

**Breakpoints:** 800px (hero e gestor colapsam), 640px (steps e close colapsam), 480px (nav link some, CTA vira full-width).

## Elevation & Depth

O sistema é predominantemente plano — superfícies escuras criam profundidade por diferença de luminosidade (`--ink` vs `--ink-2` vs `--ink-3`), não por sombras. Bordas sutis (`rgba(240,235,227,0.07)`) separam seções sem peso visual.

A exceção é o mockup do celular, que usa um sistema de sombras elaborado para simular profundidade física:

### Shadow Vocabulary
- **Phone Shadow** (`0 32px 72px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)`): Sombra de profundidade máxima — usada exclusivamente no mockup do celular.
- **Image Drop Shadow** (`drop-shadow(0 24px 64px rgba(0,0,0,0.55))`): Sombra de figura — usada na imagem PNG com fundo transparente (telas-gestor.png, modelo-celular.png).

### Named Rules
**A Regra do Plano-por-Padrão.** Superfícies são planas em repouso. Sombras existem apenas em objetos físicos simulados (o celular) ou figuras recortadas sobre fundo (imagens PNG).

## Shapes

Linguagem de formas consistentemente arredondada — sem ângulos retos em componentes interativos.

- **Pílula (99px):** Todos os botões e nav links. Forma default de interação.
- **Card (20px):** Card de preço. Arredondamento generoso mas não circular.
- **Base (10px):** `--r` token disponível para containers menores.
- **Círculo (50%):** Marcador numérico dos passos.
- **Phone (44px):** Mockup do celular — extremamente arredondado para simular hardware real.

## Components

### Buttons
- **Shape:** Pílula completa (border-radius: 99px). Nunca quadrado.
- **Primário Grande:** Fundo âmbar (`#E8952A`), texto preto, padding 15px 32px, peso 800, tamanho 17px.
- **Primário Pequeno:** Mesmo tratamento, padding 10px 22px, tamanho 14px. Usado na nav.
- **Escuro (btn-ink):** Fundo `#0A0A09`, texto cream. Usado no CTA final sobre o fundo âmbar.
- **Hover:** Transição 0.15s para `gold-deep` (`#CC7E1C`) no âmbar; sem mudança de forma.
- **Active:** `transform: scale(0.97)`.

### Feature List
- Lista vertical com separadores `1px` em `rgba(240,235,227,0.12)`.
- Nome em Bricolage 700, tamanho fluido `clamp(1.1rem, 3vw, 1.4rem)`.
- Primeiro item com destaque extra: `clamp(1.3rem, 3.5vw, 1.7rem)`.
- Descrição em system-ui 1rem, cor `--muted-2`.

### Gestor Feature List (com marcadores âmbar)
- `list-style: none`, gap 12px entre itens.
- Marcador: círculo `7px × 7px` âmbar (`#E8952A`), `flex-shrink: 0`.
- Texto em `--cream-2`, 0.95rem.

### Price Card
- Background `--ink-2`, border `1px rgba(240,235,227,0.12)`, border-radius 20px, padding 40px 36px.
- Valor tipográfico: "R$" em 1.4rem, número em 4rem 800, período em 0.95rem — grid flex alinhado ao topo.

### Phone Mockup
- Dimensões fixas: 272px × 548px, border-radius 44px.
- Background `#f6f6f6` (evita flash preto nas transições de slide).
- Animação de flutuação: `phonefloat` 5s ease-in-out infinite, translateY 0 → -5px.
- Slides: cross-fade com opacity + transform, 0.6s, intervalo 2500ms.

### Navigation
- Posição: fixed, height 60px, backdrop-filter blur(20px), fundo `rgba(10,10,9,0.88)`.
- Container interno: `max-width: 1200px`, centrado.
- Logo: imagem PNG `/logoagen+.png`, height 48px.
- Links: system-ui 14px 500, cor `--muted-2`, padding 12px 14px, border-radius 99px.
- CTA nav: `btn-amber` pequeno.
- Mobile (<480px): links de texto somem, apenas logo + CTA.

## Do's and Don'ts

### Do:
- **Do** usar Bricolage Grotesque apenas em peso 800 para headlines — outros pesos perdem o caráter.
- **Do** reservar o âmbar para elementos de ação (CTAs, marcadores, estados ativos) — no máximo 2 usos por viewport.
- **Do** usar `drop-shadow` com `rgba(0,0,0,0.5+)` em imagens PNG sobre fundo escuro para criar separação visual.
- **Do** variar a luminosidade dos fundos entre seções (`--ink` → `--ink-2` → `--ink-3`) para criar ritmo sem cor adicional.
- **Do** manter todos os botões no formato pílula (99px) — é o único formato permitido.

### Don't:
- **Don't** usar fundos claros fora da seção "Como funciona" (que usa `--cream` intencionalmente como contraste máximo).
- **Don't** adicionar uma segunda cor de acento — o sistema tem exatamente um acento (âmbar).
- **Don't** usar Bricolage Grotesque abaixo de 700 ou acima de 800.
- **Don't** usar sombras `box-shadow` em superfícies planas — sombras são exclusivas de objetos físicos simulados.
- **Don't** usar kickers/eyebrows (labels coloridas em uppercase) acima de headings `<h2>` — os títulos devem se sustentar sozinhos.
