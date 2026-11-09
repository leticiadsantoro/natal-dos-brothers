# Site Natal

Site Next.js + TypeScript + PostgreSQL, baseado na arte original `natal.svg`. Sem login: qualquer visitante pode criar listas, alterar nome/foto e adicionar, editar ou excluir os presentes de qualquer pessoa.

## Executar localmente

Requisitos: Node.js 20.19+ (recomendado 24 LTS), npm. Não é necessário Docker para a primeira opção.

```sh
npm install
make up
```

O comando cria `.env` a partir de `.env.example` se necessário, inicia o PostgreSQL local, prepara o banco e só então inicia o Next.js. Abra http://localhost:3000. Use **Ctrl+C** no mesmo terminal para encerrar os dois; os dados e fotos continuam salvos em `.data/postgres`.

Também é possível iniciar separadamente com `npm run db:local` e, em outro terminal, `npm run dev`. Não execute o banco local e o Docker na mesma porta.

### Alternativa: Docker ou PostgreSQL existente

```sh
docker compose up -d db
npm run db:migrate
npm run dev
```

Para outro PostgreSQL, ajuste `DATABASE_URL` em `.env` e rode `npm run db:migrate`. Em produção use um PostgreSQL persistente, configure `DATABASE_URL` no ambiente e execute `npm run build` e `npm start`. Não use `db:local` em hospedagem efêmera.

## Recursos

- Página inicial com pessoas, fotos opcionais, contagem de presentes e acesso a cada lista.
- Página `/listas/[id]` com a mesma arte/cabeçalho e rodapé, e presentes em grade de catálogo.
- Botão **Criar minha lista de presentes**, com nome e foto opcional da pessoa. Os presentes são adicionados na página da lista.
- Alteração do nome e foto da lista (foto por upload, com opção de remover).
- Adição e edição de título, imagem e link opcional de cada presente.
- Botão **Comprar presente** abre o link em uma nova aba, quando informado.
- Exclusão de presentes com confirmação; cancelar mantém o presente.
- Botão para excluir uma lista e todos os seus presentes, com confirmação e retorno à página inicial.
- Imagem por upload ou busca no Wikimedia Commons, sem chave de API.
- Imagens pesquisadas exibem crédito, licença e link da fonte.
- Modais brancos/vermelhos, com bordas de cartinha; arte original preservada.
- Layout responsivo, diálogos nativos com Escape, foco contido e estados de envio/erro.

## Persistência e API

`lists`, `gifts` e `images` estão no PostgreSQL. Uploads são validados, limitados a 10 MB e 40 megapixels, convertidos para WebP de até 1400 px e armazenados como `bytea`. GIFs usam o primeiro quadro. Não há dependência de uma pasta pública de uploads nem de localStorage. A API só aceita URLs de imagens internas ou do Wikimedia Commons; SQL usa parâmetros.

| Método         | Rota                      | Uso                                          |
| -------------- | ------------------------- | -------------------------------------------- |
| GET / POST     | `/api/lists`              | Listar / criar listas com presentes iniciais |
| GET / PATCH    | `/api/lists/[id]`         | Consultar / editar nome e foto               |
| POST           | `/api/lists/[id]/gifts`   | Adicionar presente                           |
| PATCH / DELETE | `/api/gifts/[id]`         | Editar / excluir presente                    |
| POST           | `/api/uploads`            | Upload multipart no campo `file`             |
| GET            | `/api/images/[id]`        | Servir imagem armazenada                     |
| GET            | `/api/image-search?q=...` | Pesquisa pública de imagens                  |

A busca consulta https://commons.wikimedia.org/w/api.php (documentação: https://www.mediawiki.org/wiki/API:Imageinfo). A disponibilidade e relevância dependem do Commons; há estados de erro e resultado vazio, e o upload continua disponível. Termos em inglês costumam ampliar as opções. As URLs pesquisadas são externas, com atribuição persistida.

O acesso aberto é intencional. Não há contas, autenticação nem controle por proprietário. Os nomes são títulos das listas; pessoas com nomes iguais podem criar listas distintas, identificadas por UUID.

## Atualização do banco

Execute `npm run db:migrate` antes de iniciar a versão atualizada. O schema adiciona a coluna opcional `product_url` sem alterar os presentes existentes. Na Vercel, mantenha o Build Command `npm run db:migrate && npm run build`.

## Verificação

```sh
npm run typecheck
npm run build
# Com PostgreSQL e o site em execução:
npm run test:integration
```

Os testes usam dados temporários criados pela própria suíte e os removem ao terminar. Testam criação/leitura/edição, persistência de fotos, presentes iniciais, exclusão, validação de entrada e rejeição de origem diferente. Para outra porta do site, defina `TEST_BASE_URL`.

Arquivos principais: `src/app` (páginas e API), `src/components` (interface e modais), `src/lib` (PostgreSQL e validação), `db/001_initial.sql` (schema), `public/natal.svg` (arte original).
