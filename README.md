# P2P Procurement Application

A complete Procure-to-Pay system: **Requisition → RFQ → PO → GR → Invoice**

## Architecture

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Angular 17 + Material | Azure Static Web Apps (Free) |
| Backend | .NET Core 8 Web API | Azure App Service F1 (Free) |
| Database | SQLite (dev) / SQL Server (prod) | Azure SQL Basic |
| Storage | Azure Blob | 5GB free (12 months) |
| Monitoring | Application Insights | 5GB/month free |
| CI/CD | GitHub Actions | 2000 min/month free |

## Quick Start (Local)

### Backend
```bash
cd backend
dotnet restore P2P.sln
dotnet run --project P2P.API
# API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
ng serve
# App: http://localhost:4200
```

### Docker (Full stack)
```bash
docker-compose up --build
# App: http://localhost:4200
# API: http://localhost:5000
```

## Demo Accounts

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@p2p.com | Admin@123456 |
| Approver | approver@p2p.com | Approver@123456 |
| Requester | requester@p2p.com | Requester@123456 |
| Finance | finance@p2p.com | Finance@123456 |
| Supplier | raj@techsupplies.com | Supplier@123456 |

## P2P Flow

```
1. Requester creates Purchase Requisition (PR)
2. Approver approves PR
3. Either:
   a. Create RFQ → Suppliers submit quotes → Evaluate → Auto-create PO
   b. Convert PR directly to PO with selected supplier
4. PO sent to Supplier → Supplier acknowledges
5. Supplier creates ASN (Advance Shipment Notice) before delivery
6. Warehouse creates Goods Receipt (GR) against PO
7. Supplier submits Invoice → Auto 3-way match (PO × GR × Invoice)
8. Finance approves invoice → Mark as Paid
```

## Supplier Portal Features

- Self-registration with admin approval workflow
- View & acknowledge POs
- Submit quotes for RFQs
- Create ASN (shipment notice) with tracking
- Submit invoices against POs
- View 3-way match results
- Raise & track disputes
- Payment status & aging dashboard

## API Documentation

When running locally: http://localhost:5000/swagger

## Azure Deployment

```bash
# Deploy infrastructure
cd infra
az deployment group create \
  --resource-group p2p-rg \
  --template-file main.bicep

# Set GitHub secrets for CI/CD:
# AZURE_WEBAPP_PUBLISH_PROFILE  → Download from App Service
# AZURE_STATIC_WEB_APPS_API_TOKEN → From Static Web App
```

## Project Structure

```
P2P-application/
├── backend/               # .NET Core 8 Clean Architecture
│   ├── P2P.Domain/       # Entities, Enums
│   ├── P2P.Application/  # CQRS Commands/Queries, DTOs
│   ├── P2P.Infrastructure/ # EF Core, Services
│   └── P2P.API/          # Controllers, Handlers, Program.cs
├── frontend/              # Angular 17 Standalone
│   └── src/app/
│       ├── core/          # Auth, Guards, Interceptors
│       ├── shared/        # Layout, Reusable components
│       └── features/      # Requisitions, PO, GR, Invoices...
├── infra/                 # Azure Bicep IaC
├── .github/workflows/     # GitHub Actions CI/CD
└── docker-compose.yml     # Local development
```
