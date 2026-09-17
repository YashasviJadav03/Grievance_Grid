# Grievance Grid
### Automated Public Grievance Routing & SLA Accountability Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0.36-D71F00.svg)](https://www.sqlalchemy.org)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.6.0-F7931E.svg?logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![Deploy to Render](https://img.shields.io/badge/Render-Live%20Demo-46E3B7?logo=render&logoColor=white)](https://grievance-grid-frontend.onrender.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🚀 **Live Demo**: **[https://grievance-grid-frontend.onrender.com/](https://grievance-grid-frontend.onrender.com/)**  
> *Access the live civic grievance portal: submit complaints, test real-time intent routing, inspect live SLA tracking, and evaluate departmental analytics.*

---

## Executive Summary

Citizen grievance redressal mechanisms (such as CPGRAMS-style public portals) frequently experience procedural friction due to inter-departmental misrouting, absence of explicit service-level agreement (SLA) deadlines, and lack of automated escalation pathways. In many instances, public grievances enter an indeterminate administrative backlog without identifiable departmental ownership or auditability.

**Grievance Grid** addresses this systemic vulnerability through an autonomous routing and SLA-enforcement engine. The platform couples an automated intake pipeline with a two-tier natural language classifier, applies deterministic SLA policies to each grievance category, executes continuous background monitoring for deadline compliance, and mandates an immutable audit trail for all lifecycle state transitions.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Citizens["Citizen Intake Layer"]
        C1["Public Web Portal"] --> INTAKE["Intake API (/complaints)"]
        C2["Tracking Search"] --> TRACK["Tracker API (/complaints/:id)"]
    end

    subgraph IntakeEngine["Routing & Classification Pipeline"]
        INTAKE --> CLF{"Two-Tier Classifier"}
        CLF -->|"High Confidence"| RULE["Rule-Based Pattern Matcher"]
        CLF -->|"Conversational Fallback"| TFIDF["TF-IDF Vectorizer + Multinomial Naive Bayes"]
        RULE --> STAMP["Route Queue & Stamp SLA Deadline"]
        TFIDF --> STAMP
    end

    subgraph CoreEngine["Data Persistence & Audit Log"]
        STAMP --> DB[("Relational Database")]
        DB --> AUDIT[("StatusLog (Append-Only Audit Trail)")]
    end

    subgraph BackgroundWorker["Autonomous Escalation Service"]
        CRON["Background Scanner (Periodic)"] --> SCAN["Evaluate Active Tickets"]
        SCAN -->|"Elapsed >= 75%"| AMBER["Flag: At Risk"]
        SCAN -->|"Current Time >= Deadline"| ESCALATE["Auto-Escalate to Supervisor Queue (Priority: CRITICAL)"]
        ESCALATE --> AUDIT
    end

    subgraph Governance["Administrative & Operational Layer"]
        DB --> DASH["Officer Queue Dashboard (SLA Triage)"]
        DB --> ANALYTICS["Admin Analytics (Turnaround, Breach Ratio)"]
        DASH --> ACTION["Status Progression & Resolution Notes"]
        ACTION --> AUDIT
    end
```

---

## Finite State Machine & SLA Policy

All grievances are processed through a strictly validated finite state machine. Direct state transitions are governed by programmatic guardrails, and every state mutation appends an immutable record to the audit log.

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED: Intake Submission
    SUBMITTED --> CLASSIFIED: Automated Intent Classification
    CLASSIFIED --> ROUTED: Queue Assignment & SLA Deadline Stamped
    ROUTED --> IN_PROGRESS: Operational Acknowledgment
    IN_PROGRESS --> RESOLVED: Documented Resolution Recorded
    RESOLVED --> CLOSED: Formal Closure / Archival
    
    ROUTED --> ESCALATED: SLA Deadline Breached
    IN_PROGRESS --> ESCALATED: SLA Deadline Breached
    ESCALATED --> REASSIGNED: Supervisor Queue Reassignment
    REASSIGNED --> IN_PROGRESS: Work Resumed (Priority: CRITICAL)
```

### SLA Compliance Tiers

1. **On Schedule (Green)**: Elapsed time is less than 75% of the total allotted SLA duration.
2. **At Risk (Amber)**: Elapsed time equals or exceeds 75% but has not yet reached 100% of the SLA window.
3. **Breached (Red)**: Current time has reached or exceeded the calculated SLA deadline. The engine automatically transitions the ticket status to `ESCALATED`, sets `is_breached = True`, elevates priority to `CRITICAL`, reassigns the ticket to `SUPERVISOR_QUEUE_<DEPT>`, and registers an audit log entry authored by `SYSTEM_SLA_ENGINE`.

---

## Classification and Routing Pipeline

The intake system employs a two-tier hybrid architecture to ensure high-throughput deterministic routing while preserving resilience against non-standard terminology and conversational phrasing.

| Pipeline Tier | Underlying Technology | Operational Latency | Functional Scope |
| :--- | :--- | :--- | :--- |
| **Tier 1: Pattern Matcher** | Compiled Regular Expressions & Token Dictionaries | < 2 ms | Matches explicit civic terminology (e.g., pipeline rupture, live electrical conductor, road crater, overflowing dumpster). |
| **Tier 2: Statistical Classifier** | Scikit-Learn TF-IDF + Multinomial Naive Bayes | ~5 ms | Evaluates conversational input, morphological variations, and typos when Tier 1 confidence falls below operational thresholds. |

---

## Data Model and Schema

| Entity | Description |
| :--- | :--- |
| **`Department`** | Represents functional municipal divisions (`WATER`, `ROADS`, `ELECTRICITY`, `SANITATION`) and stores corresponding escalation points of contact. |
| **`Category`** | Granular problem classification defining standard turnaround hours, default priority, and pattern triggers. |
| **`SLARule`** | Policy container establishing warning thresholds (75%) and breach enforcement criteria per category. |
| **`Complaint`** | Operational grievance record containing a unique tracking identifier (`GG-YYYYMMDD-XXXX`), status, SLA deadline timestamp, breach state, and resolution notes. |
| **`StatusLog`** | Append-only audit trail capturing transition history, actor identity (`CITIZEN`, `SYSTEM_SLA_ENGINE`, `OFFICER`), timestamp, and justification. |
| **`User`** | Role-based access control entity representing Citizens, Department Officers, Supervisors, and Central System Administrators. |

---

## Core System Capabilities

### 1. Citizen Portal and Real-Time Routing Forecast
- **Predictive Intake**: As a citizen drafts a grievance, the system issues asynchronous classification queries to forecast the receiving department, specific category, and guaranteed SLA window prior to formal submission.
- **Public Grievance Tracker**: Enables direct progress inspection via tracking identifier without mandatory authentication. Renders an interactive lifecycle stepper, remaining SLA countdown, and official audit log.

### 2. Officer Operations Dashboard
- **SLA-Triaged Queue**: Displays departmental workloads categorized by SLA risk (Breached, At Risk, On Schedule).
- **Interactive Action Drawer**: Provides full incident context and enforces verified state machine transitions (`ROUTED` -> `IN_PROGRESS` -> `RESOLVED`), requiring structured resolution notes prior to ticket closure.

### 3. Administrative Telemetry and Analytics
- **System KPIs**: Aggregates total intake, active volume, overall breach ratios, and mean resolution turnaround times.
- **Departmental Compliance**: Compares cross-departmental volume distribution and compliance percentages to identify operational bottlenecks.
- **Audit Feed**: Streams real-time transition logs to ensure supervisory transparency.

### 4. SLA Time Simulation Sandbox
- Enables administrative review and demonstration of automated escalation by applying configurable negative time offsets to ticket timestamps and triggering the evaluation daemon on demand.

---

## Automated Verification Suite

The repository includes test suites verifying core system requirements:

- **Milestone Verification Suite (`backend/test_milestones.py`)**:
  - Validates relational database initialization, departmental seeding, and category configurations.
  - Verifies deterministic routing accuracy (e.g., confirmation that drinking water complaints route strictly to the Water Supply authority with an assigned 12-hour SLA).
  - Confirms state machine compliance across complete submission and resolution lifecycles.

- **SLA Escalation Suite (`backend/test_sla_escalation.py`)**:
  - Programmatically backdates grievance timestamps past assigned SLA thresholds.
  - Executes the escalation daemon and verifies automatic status updates to `ESCALATED`, priority reassignment to `CRITICAL`, and entry generation within `StatusLog`.