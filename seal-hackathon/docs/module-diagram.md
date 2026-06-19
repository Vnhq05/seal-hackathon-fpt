# Module Dependency Diagram

## Synchronous Dependencies (PublicService calls)

```mermaid
graph TD
    common["common<br/>(shared kernel)"]

    auth --> user
    event --> user
    team --> user
    team --> event
    submission --> team
    submission --> event
    judging --> event
    judging --> submission
    judging --> team
    ranking --> judging
    ranking --> event
    ranking --> submission
    ranking --> team
    notification --> user

    style common fill:#e8e8e8,stroke:#999
    style auth fill:#ffcccc,stroke:#cc0000
    style user fill:#ffcccc,stroke:#cc0000
    style event fill:#ccddff,stroke:#0044cc
    style team fill:#ccffcc,stroke:#00aa00
    style submission fill:#ffffcc,stroke:#aaaa00
    style judging fill:#ffddcc,stroke:#cc6600
    style ranking fill:#ddccff,stroke:#6600cc
    style notification fill:#ccffff,stroke:#0099cc
    style audit fill:#f0f0f0,stroke:#666
```

## Asynchronous Dependencies (Domain Events)

```mermaid
graph LR
    subgraph Publishers
        auth_pub["auth"]
        user_pub["user"]
        event_pub["event"]
        team_pub["team"]
        submission_pub["submission"]
        judging_pub["judging"]
        ranking_pub["ranking"]
    end

    subgraph Consumers
        audit_con["audit<br/>(27 events)"]
        notification_con["notification<br/>(13 events)"]
        ranking_con["ranking<br/>(3 score events)"]
        judging_con["judging<br/>(1 reopen event)"]
    end

    auth_pub -->|LoginEvents| audit_con
    user_pub -->|AccountEvents| audit_con
    user_pub -->|AccountEvents| notification_con
    event_pub -->|EventEvents| audit_con
    event_pub -->|AssignmentEvents| notification_con
    event_pub -->|ScoringReopened| judging_con
    team_pub -->|TeamEvents| audit_con
    team_pub -->|TeamEvents| notification_con
    submission_pub -->|SubmissionEvents| audit_con
    submission_pub -->|SubmissionCreated| notification_con
    judging_pub -->|ScoreEvents| audit_con
    judging_pub -->|ScoreEvents| ranking_con
    ranking_pub -->|RankingEvents| audit_con
    ranking_pub -->|ResultsPublished| notification_con
```

## Topological Build Order

```
Level 0:  common
Level 1:  user, infrastructure
Level 2:  auth, event
Level 3:  team, notification, audit
Level 4:  submission
Level 5:  judging
Level 6:  ranking
```

## Module Summary Table

| Module | Entities | Repositories | Services | Controllers | Events Published | Events Consumed | Endpoints |
|---|---|---|---|---|---|---|---|
| common | 1 (BaseEntity) | 0 | 0 | 0 | 0 | 0 | 0 |
| auth | 2 | 2 | 4 | 1 | 3 | 0 | 6 |
| user | 1 | 1 | 3 | 2 | 4 | 0 | 9 |
| event | 5 | 5 | 7 | 4 | 6 | 0 | 24 |
| team | 4 | 4 | 6 | 2 | 6 | 0 | 15 |
| submission | 3 | 3 | 3 | 1 | 2 | 0 | 6 |
| judging | 3 | 3 | 4 | 1 | 5 | 1 | 9 |
| ranking | 4 | 4 | 4 | 3 | 4 | 3 | 10 |
| notification | 2 | 2 | 2 | 1 | 0 | 13 | 5 |
| audit | 1 | 1 | 1 | 1 | 0 | 27 | 4 |
| **Total** | **26** | **25** | **34** | **16** | **30** | **44** | **88** |
