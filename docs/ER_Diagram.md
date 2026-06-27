# Entity Relationship Diagram

This document contains the ER diagram for the Material Inventory Management System database, including the newly added modules for Site Management, Financials, and Labour.

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "created/manages"
    USERS ||--o{ SITES : "engineers"
    USERS ||--o{ ACTIVITY_LOGS : "generates"
    USERS ||--o{ LABOUR_ATTENDANCE : "records"
    USERS ||--o{ PROJECT_EXPENSES : "records"

    PROJECTS ||--o{ SITES : "contains"
    PROJECTS ||--o{ PURCHASE_ORDERS : "has"
    PROJECTS ||--o{ PAYMENT_MILESTONES : "tracks"
    PROJECTS ||--o{ SUBCONTRACTOR_TASKS : "manages"
    PROJECTS ||--o{ PROJECT_EXPENSES : "incurs"

    SITES ||--o{ INVENTORY : "stores"
    SITES ||--o{ INVENTORY_TRANSACTIONS : "logs"
    SITES ||--o{ MATERIAL_USAGE : "consumes"
    SITES ||--o{ WASTAGE_RECORDS : "generates"
    SITES ||--o{ STOCK_TRANSFERS : "sends/receives"
    SITES ||--o{ LABOUR_ATTENDANCE : "tracks"
    SITES ||--o{ EQUIPMENT_MACHINERY : "uses"
    SITES ||--o{ SITE_PROGRESS : "reports"
    SITES ||--o{ ALERTS : "has"

    LABOUR_ATTENDANCE ||--o{ LABOUR_WAGES : "pays"

    SUPPLIERS ||--o{ MATERIALS : "supplies"
    SUPPLIERS ||--o{ PURCHASE_ORDERS : "receives"

    MATERIAL_CATEGORIES ||--o{ MATERIALS : "categorizes"

    MATERIALS ||--o{ INVENTORY : "tracked as"
    MATERIALS ||--o{ INVENTORY_TRANSACTIONS : "involved in"
    MATERIALS ||--o{ PURCHASE_ORDER_ITEMS : "ordered as"
    MATERIALS ||--o{ MATERIAL_USAGE : "used as"
    MATERIALS ||--o{ WASTAGE_RECORDS : "wasted as"
    MATERIALS ||--o{ STOCK_TRANSFERS : "transferred as"
    MATERIALS ||--o{ ALERTS : "triggers"

    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : "contains"
    PURCHASE_ORDERS ||--o{ ALERTS : "triggers"

    CLIENT_ENQUIRIES ||--o{ USERS : "assigned to"
```
