# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Getting Started

This project was scaffolded with SDD. To add your first feature:

```bash
/sdd-change new --type feature --name <your-first-feature>
```

This will guide you through:
1. Creating a specification for your feature
2. Planning the implementation
3. Building it step by step

## Development

Once you have features implemented:

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

Database and contract operations are performed via SDD commands:

```
/sdd-run database setup        # Deploy local database (requires K8s)
/sdd-run database port-forward  # Forward database port
/sdd-run contract generate-types # Generate TypeScript types from OpenAPI
```

## Project Structure

```
├── specs/                 # Static specifications
│   ├── domain/            # Domain definitions and use cases
│   ├── architecture/      # Architecture decisions
│   └── glossary.md        # Domain terminology
├── changes/               # Change specifications (features, fixes)
├── .sdd/                  # SDD state (workflows, archives, settings)
├── components/            # Application components
│   ├── contract/          # OpenAPI specification
│   ├── server/            # Backend (CMDO architecture)
│   └── webapp/            # Frontend (React + Vite)
└── config/                # Configuration files
```
