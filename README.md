# Molduras para Eventos

Sistema para criar eventos, cadastrar molduras e permitir que os convidados
tirem fotos com moldura via QR Code.

## Stack

React + Vite + Tailwind + Firebase (Firestore).

## O que foi simplificado em relação ao briefing original

- **Login fixo**: usuário `admin` / senha `C@dius` (sem recuperação de senha,
  já que não é mais e-mail/senha real). Definido em `.env` (`VITE_ADMIN_USER`
  / `VITE_ADMIN_PASS`) — troque a senha ali quando quiser.
- **Sem editor visual de moldura** (sem arrastar na tela): a tela "Ajustar
  área da foto" usa controles numéricos (sliders de posição, tamanho e
  rotação) com prévia ao vivo. Você ajusta uma única vez por moldura e todas
  as fotos geradas usam essa posição — o resultado final é o mesmo do
  briefing, só a forma de ajustar é mais simples de implementar e manter.
- **Sem Firebase Storage**: imagens (banner, logo, molduras, fotos geradas)
  são comprimidas no navegador e salvas como base64 direto nos documentos do
  Firestore, em vez de subidas para o Storage. Isso evita depender do plano
  pago (Blaze), que o Google passou a exigir para ativar Storage em projetos
  novos. Limite prático: cada imagem precisa caber em ~700 KB depois de
  comprimida (o código reduz qualidade/resolução automaticamente até caber).

## Setup

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative o **Firestore Database** (modo produção).
3. Copie `.env.example` para `.env` e preencha com as credenciais do seu
   projeto Firebase (Configurações do projeto → Seus apps → SDK Web).
4. Publique as regras de `firestore.rules` no console (ou via Firebase CLI:
   `firebase deploy --only firestore:rules`). As regras estão abertas para
   leitura/escrita porque o painel usa login fixo em vez de Firebase Auth —
   para uso público prolongado, considere restringir a escrita por IP ou
   mover para Cloud Functions.
5. Instale as dependências e rode:

```bash
npm install
npm run dev
```

6. Acesse `http://localhost:5173`, faça login com `admin` / `C@dius`.

## Fluxo de uso

1. Criar evento → gera automaticamente um código curto e a URL pública
   `/e/CODIGO`.
2. Cadastrar as molduras do evento (PNG transparente).
3. Em cada moldura, abrir "Ajustar área da foto" e posicionar o retângulo
   onde a foto da pessoa vai entrar. Salvar.
4. Ir em "QR Code" do evento, baixar ou imprimir.
5. No local do evento, os convidados escaneiam o QR Code, tiram ou escolhem
   uma foto, escolhem a moldura e baixam/compartilham o resultado.
6. Todas as fotos geradas aparecem na "Galeria" do evento no painel.

## Build para produção

```bash
npm run build
```

Gera a pasta `dist/`, que pode ser publicada no Firebase Hosting, Vercel,
Netlify etc.
