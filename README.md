# ProgettoProgrammazioneAvanzata
Repository per progetto del corso Programmazione Avanzata tenuto nell'anno accademico 25/26 all'Università Politecnica delle Marche.. 

# Use Cases 
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
# Grid Sequence Diagrams

Le route sono esposte con il prefisso configurato da `API_PREFIX` (di default
`/api/v1`). Tutte le route della risorsa `grids` richiedono un token JWT valido
e un credito utente maggiore di zero.

## Create grid

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

## Update grid

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

## Run grid

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

## Note

Nel diagramma di `update`, l'aggiornamento del credito avviene all'interno
della stessa transazione del cambio della grid o della creazione della
richiesta. La risposta viene inviata dal controller dopo il commit.
