# Progetto Programmazione Avanzata
Repository per progetto del corso Programmazione Avanzata tenuto nell'anno accademico 25/26 all'Università Politecnica delle Marche.. 

## Indice

- [Descrizione del progetto](#descrizione-del-progetto)
- [Tecnologie utilizzate](#tecnologie-utilizzate)
- [Endpoint](#endpoint)
- [Progettazione](#progettazione)
  - [Use Cases](#use-cases)
  - [Diagrammi di sequenza](#diagrammi-di-sequenza)
    - [Create grid](#create-grid)
    - [Update grid](#update-grid)
    - [Run grid](#run-grid)
    - [Note](#note)
- [Pattern utilizzati](#pattern-utilizzati)
  - [MVC / Layered Architecture](#mvc--layered-architecture)
  - [Repository](#repository)
  - [Factory Method](#factory-method)
  - [Chain of responsability](#chain-of-responsability)
- [Avviare il progetto con Docker](#avviare-il-progetto-con-docker)
- [Test con Jest](#test-con-jest)
  - [Test presenti](#test-presenti)
  - [Dipendenze per i test](#dipendenze-per-i-test)
  - [Esecuzione](#esecuzione)
- [Postman](#postman)


# Descrizione del progetto:

Si realizzi un sistema che consenta di gestire la creazione e valutazione di modelli di ricerca del percorso su griglia. In particolare, il sistema deve prevedere la possibilità di gestire l'aggiornamento della matrice (valori di 0 / 1) effettuato da utenti autenticati (mediante JWT). Il progetto simula il concetto del crowd-sourcing dove gli utenti possono contribuire attivamente. Un esempio di applicazione è quello di tenere traccia dei minuti che sono necessari per percorre un determinato tratto di strada. Di seguito il dettaglio di quanto si deve realizzare (tutte le chiamate devono essere autenticate con JWT):

* Dare la possibilità di creare un nuovo modello seguendo l'interfaccia definita nella sezione API di <https://www.npmjs.com/package/astar-typescript> ed in particolare di specificare la griglia con i valori iniziali
  + In particolare, è necessario validare la richiesta di creazione del modello (es. dimensione della griglia)
  + Per ogni modello valido deve essere addebitato un numero di token che è pari a 0.025 moltiplicato il numero di celle della griglia.
  + Il modello può essere creato se c'è credito sufficiente ad esaudire la richiesta.
* Dare la possibilità di aggiornare un modello cambiando il valore da 0 a 1 o da 1 a 0; si distinguano due casi:
  + Utente che fa richiesta di aggiornamento che coincide con l'utente che ha creato il modello
    - In questo caso la richiesta se valida consente di apporre direttamente la modifica
  + Utente che fa richiesta di aggiornamento che NON coincide con l'utente che ha creato il modello
    - In questo caso la richiesta deve essere approvata o rifiutata dall'utente che ha creato il modello.
    - Creare una rotta per approvare o rigettare una data richiesta di aggiornamento
    - Creare una rotta che consenta di approvare o rigettare un batch di richieste di aggiornamento
  + La richiesta di aggiornamento costa 0.3 per ogni cella che si vuole aggiornare; rifiutare se il credito non è sufficiente. L'importo viene sottratto all'utente che sta facendo la richiesta.
* Creare una rotta che dato un modello consenta di restituire l'elenco degli aggiornamenti effettuati nel corso del tempo filtrando opzionalmente per data (inferiore a, superiore a, compresa tra) distinguendo per stato ovvero accettato / rigettato
* Creare una rotta che consenta di verificare lo stato di un modello ovvero se vi è/sono una/più richiesta/e in fase di pending.
* Creare una rotta che consenta di visualizzare tutte le richieste di aggiornamento che sono in fase pending relative a modelli creati dall'utente che si autentica mediante token JWT
* Creare una rotta che consenta di approvare / rigettare la richiesta di aggiornamento di una o più celle della griglia; solo l'utente che ha creato il modello può effettuare tale operazione (l'operazione può essere fatta anche in modalità bulk specificando quali richieste approvare o meno).
* Eseguire un modello fornendo un punto di partenza ed uno di arrivo; per ogni esecuzione deve essere applicato un costo pari a quello addebitato nella fase di creazione. Ritornare il risultato sotto forma di JSON. Il risultato deve anche considerare il tempo impiegato per l'esecuzione. L'esecuzione del modello deve prevedere ovviamente la necessità di specificare start, goal. Ritornare il percorso ed il costo associato a tale percorso (per costo si intende non i termini di token, ma in termini di percorso ottimo sul grafo considerando i pesi).
* Restituire l'elenco degli aggiornamenti di un dato modello eventualmente filtrando per:
  + Data di modifica specificando o la data di fine, o la data di inizio o entrambe.

## Tecnologie utilizzate:
- Node.JS + TypeScript
- Sequelize 
- Postgres
- Docker

## Endpoint

Il prefisso predefinito per tutte le route è `/api/v1` e può essere modificato
tramite la variabile d'ambiente `API_PREFIX`. Le route protette richiedono un
token JWT nell'header `Authorization: Bearer <token>`.

| Metodo | Endpoint | Autorizzazione | Descrizione |
|---|---|---|---|
| `GET` | `/api/v1/health` | Nessuna | Verifica che il server sia attivo. |
| `POST` | `/api/v1/auth/register` | Nessuna | Registra un nuovo utente. |
| `POST` | `/api/v1/auth/login` | Nessuna | Autentica un utente e restituisce il token JWT. |
| `POST` | `/api/v1/grids` | JWT + credito positivo | Crea un nuovo modello di griglia a partire da una matrice o dalle sue dimensioni, addebitando il costo previsto. |
| `PATCH` | `/api/v1/grids/:modelId` | JWT + credito positivo | Aggiorna una griglia; il proprietario applica la modifica direttamente, mentre gli altri utenti creano una richiesta di aggiornamento. |
| `POST` | `/api/v1/grids/:modelId/run` | JWT + credito positivo | Esegue il modello tra un punto di partenza e uno di arrivo e restituisce percorso, costo del percorso e tempo di esecuzione. |
| `GET` | `/api/v1/updateRequests/:modelId/updates` | JWT | Restituisce le richieste di aggiornamento accettate o rifiutate di una griglia, con filtri temporali opzionali. |
| `GET` | `/api/v1/updateRequests/:modelId/status` | JWT | Verifica se una griglia ha richieste di aggiornamento in stato `pending`. |
| `GET` | `/api/v1/updateRequests/pending` | JWT | Restituisce le richieste `pending` relative ai modelli creati dall'utente autenticato. |
| `PATCH` | `/api/v1/updateRequests/:id` | JWT | Approva o rifiuta una richiesta di aggiornamento specifica. |
| `PATCH` | `/api/v1/updateRequests/:id/updateCells` | JWT | Approva o rifiuta l'aggiornamento di una o più celle di una richiesta specifica. |
| `PATCH` | `/api/v1/updateRequests/batch` | JWT | Approva o rifiuta in modalità bulk più richieste di aggiornamento. |
| `PATCH` | `/api/v1/users/:id/credits` | JWT + ruolo admin | Aggiorna il credito dell'utente indicato; l'operazione è riservata agli amministratori. |

# Progettazione

## Use Cases 
```mermaid
graph LR
    NotAuth([Not Authenticated User])
    Auth([Authenticated User])
    AdminA([Admin])

    subgraph SystemBoundary["System Boundary"]
        Login((Login))
        Register((Register))
        RicaricaToken((Ricarica Token))
        CreaGriglia((Crea griglia))
        AggiornaModello((Aggiorna modello))
        ApprovaRichiesta((Approva richiesta aggiornamento))
        VisualizzaRichieste((Visualizza richieste aggiornamento))
        VisualizzaStato((Visualizza stato modello))
        EseguiModello((Esegui modello))
    end

    AdminA -.extends.-> Auth

    NotAuth --- Login
    NotAuth --- Register

    Auth --- CreaGriglia
    Auth --- AggiornaModello
    Auth --- ApprovaRichiesta
    Auth --- VisualizzaRichieste
    Auth --- VisualizzaStato
    Auth --- EseguiModello

    AdminA --- RicaricaToken
```
## Diagrammi di sequenza

Le route sono esposte con il prefisso configurato da `API_PREFIX` (di default
`/api/v1`). Tutte le route della risorsa `grids` richiedono un token JWT valido
e un credito utente maggiore di zero.

### Create grid

Endpoint: `POST /api/v1/grids`

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Router as Express router
    participant Auth as authenticateToken
    participant Credit as checkUserCredit
    participant Controller as GridController.createGrid
    participant Validation as Zod.gridSchema
    participant AStar as AStarFinder
    participant DB as Sequelize/PostgreSQL
    participant UserRepo as UserRepository
    participant GridRepo as GridRepository

    Client->>Router: POST /grids {name, matrix | width, height}
    Router->>Auth: verify Authorization Bearer token
    Auth-->>Router: req.user
    Router->>Credit: verify user exists and tokenCredit > 0
    Credit->>UserRepo: getUserById(req.user.id)
    UserRepo-->>Credit: user
    Credit-->>Router: next()
    Router->>Controller: createGrid(req, res, next)
    Controller->>Validation: safeParseAsync(req.body)
    Validation-->>Controller: validated grid data
    Controller->>AStar: build grid from matrix or dimensions
    AStar-->>Controller: grid nodes and numberOfFields
    Controller->>DB: transaction()
    DB->>UserRepo: getUserById(userId, transaction)
    UserRepo-->>DB: user with tokenCredit
    DB->>GridRepo: createGrid(grid, transaction)
    GridRepo-->>DB: persisted Grid
    DB->>UserRepo: updateCredit(userId, tokenCredit - cost, transaction)
    UserRepo-->>DB: credit updated
    Controller-->>Client: 201 Created {grid}
    DB-->>Controller: commit transaction

    alt invalid JWT or no credit
        Auth-->>Client: error response
    else invalid body or invalid dimensions
        Validation-->>Controller: validation error
        Controller-->>Client: error response
    else database or transaction error
        DB-->>Controller: rollback and error
        Controller-->>Client: error response
    end
```

### Update grid

Endpoint: `PATCH /api/v1/grids/:modelId`

L'utente proprietario modifica direttamente la grid. Un altro utente crea una
richiesta di aggiornamento, che il proprietario potrà approvare o rifiutare in
seguito tramite le route `updateRequests`.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Router as Express router
    participant Auth as authenticateToken
    participant Credit as checkUserCredit
    participant Exists as checkGridExists
    participant Controller as GridController.updateGrid
    participant Validation as Zod.gridUpdateSchema
    participant DB as Sequelize/PostgreSQL
    participant GridRepo as GridRepository
    participant UserRepo as UserRepository
    participant RequestRepo as UpdateRequestRepository

    Client->>Router: PATCH /grids/:modelId {matrix}
    Router->>Auth: verify JWT
    Auth-->>Router: req.user
    Router->>Credit: verify user exists and tokenCredit > 0
    Credit-->>Router: next()
    Router->>Exists: getGridById(modelId)
    Exists->>GridRepo: getGridById(modelId)
    GridRepo-->>Exists: existing Grid
    Exists-->>Router: next()
    Router->>Controller: updateGrid(req, res, next)
    Controller->>Validation: safeParseAsync(req.body)
    Validation-->>Controller: matrix
    Controller->>DB: transaction()
    DB->>GridRepo: getGridById(modelId, transaction)
    GridRepo-->>DB: current grid
    Controller->>Controller: countChangedCells(current, matrix)
    DB->>UserRepo: getUserById(userId, transaction)
    UserRepo-->>DB: user with tokenCredit

    alt current user is grid owner
        DB->>GridRepo: updateGrid(gridId, matrix, transaction)
        GridRepo-->>DB: grid updated and version incremented
    else current user is not grid owner
        DB->>RequestRepo: createUpdateRequest(PENDING, matrix, transaction)
        RequestRepo-->>DB: update request created
    end

    DB->>UserRepo: updateCredit(userId, tokenCredit - cost, transaction)
    UserRepo-->>DB: credit updated
    DB-->>Controller: commit transaction

    alt isChangeApplied = true
        Controller-->>Client: 200 Updated {matrix}
    else isChangeApplied = false
        Controller-->>Client: 201 Created {updateRequest}
    else invalid body, missing grid, insufficient credit, or database error
        Controller-->>Client: error response
    end
```

### Run grid

Endpoint: `POST /api/v1/grids/:modelId/run`

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Router as Express router
    participant Auth as authenticateToken
    participant Credit as checkUserCredit
    participant Exists as checkGridExists
    participant Controller as GridController.runGrid
    participant Validation as Zod.gridExecutionSchema
    participant GridRepo as GridRepository
    participant UserRepo as UserRepository
    participant AStar as AStarFinder

    Client->>Router: POST /grids/:modelId/run {start, goal}
    Router->>Auth: verify JWT
    Auth-->>Router: req.user
    Router->>Credit: verify user exists and tokenCredit > 0
    Credit-->>Router: next()
    Router->>Exists: getGridById(modelId)
    Exists->>GridRepo: getGridById(modelId)
    GridRepo-->>Exists: existing Grid
    Exists-->>Router: next()
    Router->>Controller: runGrid(req, res, next)
    Controller->>Validation: safeParseAsync(req.body)
    Validation-->>Controller: start and goal
    Controller->>GridRepo: getGridById(modelId)
    GridRepo-->>Controller: gridData
    Controller->>AStar: create finder from gridData
    Controller->>AStar: findPath(start, goal)
    AStar-->>Controller: path
    Controller->>UserRepo: getUserById(userId)
    UserRepo-->>Controller: user with tokenCredit
    Controller->>UserRepo: updateCredit(userId, tokenCredit - executionCost)
    UserRepo-->>Controller: credit updated
    Controller-->>Client: 200 OK {path, totalCost, time}

    alt invalid body, missing grid, insufficient credit, or database error
        Controller-->>Client: error response
    end
```

### Note

Nel diagramma di `update`, l'aggiornamento del credito avviene all'interno
della stessa transazione del cambio della grid o della creazione della
richiesta. La risposta viene inviata dal controller dopo il commit.

## Pattern utilizzati

### MVC / Layered Architecture
Il progetto segue una struttura a livelli simile a MVC:

- Routes: definiscono gli endpoint;
- Controllers: gestiscono le richieste;
- Repositories: gestiscono il database;
- Models: rappresentano le entità Sequelize;
- Middleware: gestiscono autenticazione, autorizzazione e validazione;
- DTO: definiscono i dati esposti all’esterno.

### Repository
I repository separano la logica di accesso al database dai controller.
I repository vengono passati ai middleware e ai controller tramite la dependency injection nel costruttore. 
``` typescript
constructor(
  private userRepository: IUserRepository,
  private gridRepository: IGridRepository,
  private updateRequestRepository: IUpdateRequestRepository
) {}
```
Questo rende i controller e middleware più facilmente testabili, perché nei test possono essere passati repository mock.


### Factory Method
Le factory centralizzano la creazione delle risposte.

- ErrorFactory
- SuccessFactory

```typescript
ErrorFactory.createError(
  ErrorTypes.NotFound,
  "User not found"
);
```

```typescript
SuccessFactory.createSuccess(
  SuccessTypes.Created,
  "User registered successfully.",
  user
);
```

In questo modo controller e middleware non devono costruire manualmente ogni risposta.

### Chain of responsability
Express usa una catena di middleware, dove ogni middleware può:

- elaborare la richiesta;
- chiamare next();
- interrompere la catena;
- inoltrare un errore.

```typescript
router.use(
  '/grids',
  authenticateToken,
  checkUserCredit(userRepository),
  gridRoutes
);
```
**Nota:** alcuni middleware sono stati creati con il pattern Factory.

# Avviare il progetto con Docker

# Test con jest

Il progetto utilizza **Jest** per eseguire test unitari sui middleware Express.
I test non richiedono l'avvio del server, Docker o una connessione a PostgreSQL:
le dipendenze dei middleware vengono sostituite con repository mockati tramite
`jest.fn()`.

## Test presenti

- `test/grid.test.ts`: verifica il middleware `checkGridExists`. Controlla che
  l'ID del modello venga letto dai parametri della richiesta, che il repository
  venga chiamato con l'ID corretto e che `next()` venga invocato quando la griglia
  esiste.
- `test/user.test.ts`: verifica il middleware `checkUserCredit`. Controlla che
  venga cercato l'utente autenticato tramite `req.user.id`, che il credito venga
  letto dal repository e che `next()` venga invocato quando il credito è positivo.

Entrambi i test usano i tipi `Request`, `Response` e `NextFunction` di Express e
le interfacce `IGridRepository` e `IUserRepository` per costruire mock compatibili
con le dipendenze reali. Le chiamate asincrone dei repository sono simulate con
`mockResolvedValue`.

### Dipendenze per i test

Le principali dipendenze coinvolte sono:

- `jest`: framework di test e API per le asserzioni e i mock;
- `@types/jest`: definizioni TypeScript per `describe`, `it`, `expect` e `jest`;
- `babel-jest`: integrazione tra Jest e Babel;
- `@babel/core`, `@babel/preset-env` e `@babel/preset-typescript`: trasformano i
  file TypeScript in codice eseguibile da Jest;
- `@types/express`: definizioni TypeScript utilizzate nei test per i tipi delle
  richieste, risposte e funzioni `next`.

La configurazione si trova in `jest.config.cjs`: l'ambiente è `node`, vengono
cercati i file `*.test.ts` nella cartella `test` e ogni file TypeScript viene
trasformato da `babel-jest`.

### Esecuzione

Eseguire tutti i test:

```bash
npm test
```

Eseguire un singolo file di test:

```bash
npx jest test/grid.test.ts
npx jest test/user.test.ts
```

I test possono essere eseguiti indipendentemente dal database perché verificano
solo il comportamento dei middleware e simulano le risposte dei repository.


# Postman