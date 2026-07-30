# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Gestores de pequenos negócios** — donos ou responsáveis por salões de beleza, barbearias, clínicas e prestadores de serviço autônomos. Usam o painel de gestão para configurar serviços, horários, visualizar agendamentos e gerenciar o dia a dia.

**Clientes finais** — pessoas que acessam a página pública da empresa para agendar um serviço sem precisar de app, login ou cadastro.

**Operador master** — administrador da plataforma que cria e gerencia múltiplas empresas via painel master.

## Product Purpose

Agenda+ é uma plataforma SaaS de agendamento online multi-tenant. Permite que o operador master crie e administre múltiplas empresas, cada uma com sua própria página pública de agendamento, painel de gestão, serviços, horários e configurações. O cliente final agenda sem fricção — sem app, sem login, sem complicação.

## Positioning

Plataforma multi-tenant gerenciada: uma instalação serve múltiplas empresas com painéis independentes, administradas centralmente pelo operador master. Pequenos negócios ganham presença digital de agendamento sem precisar de solução própria.

## Operating Context

- Uso majoritariamente mobile (donos e clientes acessam pelo celular)
- Agendamentos por dia e horário, com bloqueios manuais e por dia da semana
- Painel de gestão: agendamentos, configurar serviços/horários, personalizar página
- Painel master: criar empresas, gerenciar financeiro, bloquear contas
- Stack: single-file SPA (`app.html`) com Supabase (PostgreSQL + RLS) como backend

## Capabilities and Constraints

- Single-file SPA — todo HTML, CSS e JS inline em `app.html`
- Supabase para auth, banco de dados e storage de imagens
- Agendamento público sem login para o cliente final
- Multi-tenant: cada empresa tem slug, página pública, painel de gestão próprio
- Horários universais (valem para todos os dias) com controle de dias da semana
- Bloqueio por horário individual ou dia inteiro
- Personalização por empresa: logo, foto de fundo, cor principal, serviços, botões externos
- Financeiro por empresa gerenciado pelo master
- PWA instalável

## Brand Commitments

Nome: **Agenda+**. Sem slogan ou identidade visual formal definida ainda.

## Evidence on Hand

Implementação existente em `app.html` (~2500+ linhas). Interface funcional com painéis de gestão e master operacionais. Sem assets de marketing ou copy institucional.

## Product Principles

1. **Zero fricção para o cliente** — agendar deve ser simples o suficiente para qualquer pessoa, em qualquer celular, sem conta.
2. **Controle total para o gestor** — o dono do negócio gerencia tudo (agenda, serviços, bloqueios, aparência) sem depender de suporte.
3. **Escala pelo master** — o operador da plataforma cria e administra empresas de forma centralizada, sem duplicar infraestrutura.
4. **Mobile-first** — todas as interfaces são projetadas primeiro para celular.
5. **Confiabilidade silenciosa** — o sistema não quebra o que já funciona ao evoluir.
