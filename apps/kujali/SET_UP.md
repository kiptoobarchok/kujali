# Quick Start Guide - Run Kujali Locally

## About Kujali

Kujali is a cashflow management tool for start-ups and scale-ups. A core feature allows users to define budgets and then manage revenue realization through CRM, sales forecasting, invoicing, etc.

Kujali is built as a **monorepo** deployed to Angular, Firebase, and Google Cloud. For data storage, Kujali uses **Firestore** with readers that stream data to **PostgreSQL** and **BigQuery** for BI & analysis.

### Monorepo Structure

The monorepo follows a clear structure ([monorepo.tools](https://monorepo.tools/)):

```
/apps                 # Lightweight containers that roll up features into deployable applications
  /kujali            # Main Angular frontend application
  /kujali-functions  # Firebase Cloud Functions backend

/libs                 # The "body" of the app - all core logic and features
  /elements          # Reusable UI components (buttons, forms, etc.)
  /features          # Actual logical frontend features (budgeting, finance, CRM, etc.)
  /state             # Link between frontend and backend (state management)
  /model             # Cross-application data models
  /util              # Reusable libraries that can be used across different client repos
  /functions         # Backend Cloud Functions organized by domain
```

**Key points:**
- **Apps**: Lightweight containers that configure cross-application behavior (not feature logic)
- **Libs**: Contains all the features and logic
  - `elements/`: Reusable components
  - `features/`: Logical frontend features
  - `state/`: Bridge between front and back
  - `model/`: Cross-application models
  - `util/`: Reusable libraries

### Data Architecture

- **Production**: Firestore (primary storage) → Readers stream data → PostgreSQL/BigQuery (for BI & analysis)
- **Development**: Direct PostgreSQL connection for simplified local setup

## Prerequisites Check
- ✅ Node.js installed (you have v24.11.1)
- ⚠️  Note: README suggests Node ^14.20.1, but v24 should work
- PostgreSQL server (local)
- Dependencies need to be installed

## Step-by-Step Setup

### 1. Install PostgreSQL

**Linux (Arch/Ubuntu/Debian):**
```bash
# Arch Linux
sudo pacman -S postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download from https://www.postgresql.org/download/windows/ and run the installer

### 2. Setup PostgreSQL Database

**Start PostgreSQL service:**
```bash
# Linux (systemd)
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS (Homebrew)
brew services start postgresql@14

# Windows: Service starts automatically after installation
```

**Create database and user:**
```bash
# Switch to postgres user
sudo -u postgres psql

# Or on macOS/Windows, connect directly:
psql postgres
```

**In PostgreSQL shell, run:**
```sql
-- Create database
CREATE DATABASE kujali_dev;

-- Create user
CREATE USER kujali_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE kujali_dev TO kujali_user;

-- Connect to the database
\c kujali_dev

-- Grant schema privileges (if needed)
GRANT ALL ON SCHEMA public TO kujali_user;

-- Exit
\q
```

### 3. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 4. Configure Environment

Update the environment file with your PostgreSQL configuration:
- File: `apps/kujali/src/environments/environment.ts`

**Note:** In development, we use PostgreSQL directly instead of Firestore. In production, the app uses Firestore with data streams to PostgreSQL/BigQuery for BI.

**Update environment.ts:**
```typescript
export const environment = {
  production: false,
  useEmulators: false, // Set to false when using local PostgreSQL
  
  // Development: Local PostgreSQL configuration
  database: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'kujali_user',
    password: 'your_secure_password',
    database: 'kujali_dev',
    synchronize: false, // Set to false in production
    logging: true
  },
  
  // Firebase config (may still be needed for auth, even in dev)
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  },
  
  project: {
    name: 'kujali-dev'
  }
}
```

### 5. Run Database Migrations (if applicable)

If your project has database migrations:
```bash
# Example migration commands (adjust based on your migration tool)
npm run migration:run
# or
npm run db:migrate
```

### 6. Seed Database (Optional)

If you have seed data:
```bash
npm run db:seed
```

### 7. Start PostgreSQL (if not already running)

**Check PostgreSQL status:**
```bash
# Linux
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql

# Connect test
psql -U kujali_user -d kujali_dev -h localhost
```

### 8. Run the Application

**Start Angular development server:**
```bash
npm start
```

The app will be available at:
- **App**: http://localhost:4200

**If you have a separate backend API server:**
```bash
# Terminal 1: Start backend API (if applicable)
npm run start:backend
# or
cd backend && npm start

# Terminal 2: Start Angular app
npm start
```

### 9. Access the App
- **App**: http://localhost:4200

**Note on Architecture:**
- The frontend (`apps/kujali`) connects directly to your local PostgreSQL
- In production, the app uses Firestore as primary storage
- Cloud Functions (`apps/kujali-functions`) handle backend logic in production

**If you need to run Cloud Functions locally (for full production-like setup):**
```bash
# Terminal 1: Start Firebase emulators (if you want to test functions)
npm run start-firebase-emulators

# Terminal 2: Start Angular app
npm start
```

**For simple development with just PostgreSQL:**
```bash
# Just start the Angular app - it will use your local PostgreSQL
npm start
```

### 10. Demo Login Credentials
```
Email: user@demo.com
Password: demoUser
```

**Note:** You may need to create this user in your PostgreSQL database if using a custom auth system.

## Troubleshooting

**If PostgreSQL connection fails:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or `brew services list` (macOS)
- Check connection: `psql -U kujali_user -d kujali_dev -h localhost`
- Verify credentials in `environment.ts` match your PostgreSQL setup
- Check PostgreSQL logs: `/var/log/postgresql/` (Linux) or check Homebrew logs (macOS)
- Ensure PostgreSQL is listening on localhost: check `postgresql.conf` (listen_addresses = 'localhost')

**If database errors occur:**
- Verify database exists: `psql -U postgres -c "\l" | grep kujali_dev`
- Check user permissions: `psql -U postgres -d kujali_dev -c "\du"`
- Run migrations if you have them: `npm run migration:run`

**If npm install fails:**
- Use `--legacy-peer-deps` flag: `npm install --legacy-peer-deps`
- Try with Node 14 or 16 if v24 has issues: `nvm use 16` (if using nvm)
- Clear cache: `npm cache clean --force`

**If build fails:**
- Check environment.ts has valid database configuration
- Ensure all dependencies installed: `npm install --legacy-peer-deps`
- Verify database connection before building

**If port conflicts occur:**
- PostgreSQL default port: 5432
- Angular dev server: 4200
- Backend API (if separate): Usually 3000
- Check what's using ports: `lsof -i :5432` (macOS/Linux) or `netstat -ano | findstr :5432` (Windows)

## PostgreSQL Quick Reference

**Connection strings:**
- Local: `postgresql://kujali_user:password@localhost:5432/kujali_dev`
- Connection test: `psql -U kujali_user -d kujali_dev -h localhost`

**Common PostgreSQL commands:**
```sql
-- List databases
\l

-- Connect to database
\c kujali_dev

-- List tables
\dt

-- Describe table
\d table_name

-- Exit
\q
```

## Quick Commands Reference
- `npm install --legacy-peer-deps` - Install dependencies
- `npm start` - Start Angular dev server
- `npm run build` - Build for production
- `sudo systemctl start postgresql` - Start PostgreSQL (Linux)
- `brew services start postgresql@14` - Start PostgreSQL (macOS)
- `psql -U kujali_user -d kujali_dev` - Connect to database

---

## Backend Development: CQRS Architecture & Deployment

### Understanding Backend Development Process

Kujali follows a **CQRS (Command Query Responsibility Segregation)** pattern for backend development, which separates read operations (queries) from write operations (commands). This architecture provides:

1. **Separation of Concerns**: Commands handle mutations, queries handle reads
2. **Scalability**: Read and write paths can scale independently
3. **Testability**: Clear boundaries make testing easier
4. **Maintainability**: Business logic is encapsulated in handlers

### Architecture Overview

The backend is structured using:

- **Commands**: Data transfer objects (DTOs) that encapsulate the intent to perform an action
- **Handlers**: Business logic that executes commands and interacts with repositories
- **Repositories**: Data access layer abstraction using Firestore
- **Registrars**: Wrappers that register handlers as Firebase Cloud Functions

### Design Choices for AddNoteToBudget Feature

#### 1. Command Design (`AddNoteToBudgetCommand`)

**Purpose**: Encapsulate all data needed to add a note to a budget.

**Design Rationale**:
- Simple interface with `orgId`, `budgetId`, and `noteContent`
- No business logic in the command (pure data container)
- Type-safe with TypeScript interfaces
- Easy to validate and test

```typescript
export interface AddNoteToBudgetCommand {
  orgId: string;
  budgetId: string;
  noteContent: string;
}
```

#### 2. Handler Design (`AddNoteToBudgetHandler`)

**Purpose**: Execute the business logic for adding notes to budgets.

**Design Choices**:
- **Extends `FunctionHandler<T, R>`**: Integrates with the existing function framework
- **Repository Pattern**: Uses `tools.getRepository()` for data access abstraction
- **Error Handling**: Returns result objects with success/failure status
- **Validation**: Validates input data before processing
- **Logging**: Uses `tools.Logger` for observability

**Key Implementation Details**:
- Repository path: `orgs/${orgId}/budgets/${budgetId}/config`
- Handles both creating new notes and appending to existing ones
- Graceful error handling with descriptive messages
- Type-safe with TypeScript generics

#### 3. Result Design (`AddNoteToBudgetResult`)

**Purpose**: Return structured results with success indicators.

**Design Rationale**:
- Extends `IObject` for consistency with codebase patterns
- Includes success flag and optional message
- Allows frontend to handle success/failure cases appropriately

### Deployment Process

#### Step 1: Create Function Registration File

Create a function file in `apps/kujali-functions/src/app/` that registers your handler:

```typescript
// apps/kujali-functions/src/app/budgetting/notes/add-note-to-budget.function.ts

import { RestRegistrar } from '@ngfi/functions';
import { KujaliFunction } from '../../../environments/kujali-func.class';
import { AddNoteToBudgetHandler } from '@app/model/budgetting/notes';

const addNoteHandler = new AddNoteToBudgetHandler();

export const addNoteToBudget = new KujaliFunction(
  'addNoteToBudget',
  new RestRegistrar(),  // For REST API calls
  [],                    // Guards (authentication, authorization)
  addNoteHandler
).build();
```

#### Step 2: Export from Main Entry Point

Add export to `apps/kujali-functions/src/main.ts`:

```typescript
export * from './app/budgetting/notes/add-note-to-budget.function';
```

#### Step 3: Build and Deploy

The deployment process is automated via Firebase:

```bash
# Build the functions
nx build kujali-functions

# Deploy functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:addNoteToBudget
```

**Deployment Pipeline** (as configured in `firebase.json`):

1. **Pre-deploy Steps**:
   - `nx build kujali-functions` - Builds the function code
   - `build-gc-functions-package.js` - Packages dependencies
   - `prep-environment.js` - Prepares environment config

2. **Build Output**: Functions are compiled to `dist/apps/kujali-functions`

3. **Deployment**: Firebase CLI deploys the compiled functions to Google Cloud

### Serverless Deployment & Scaling

#### What is Serverless?

**Serverless architecture** means:
- **No server management**: Cloud provider manages infrastructure
- **Automatic scaling**: Functions scale based on demand
- **Pay-per-use**: Only pay for execution time
- **Event-driven**: Functions triggered by events (HTTP requests, Firestore changes, etc.)

#### How Our Handler Scales in Serverless Architecture

1. **Automatic Horizontal Scaling**:
   - Firebase Cloud Functions automatically spin up new instances as demand increases
   - Each instance handles requests independently
   - No manual configuration needed

2. **Cold Start Considerations**:
   - First request may have ~500ms-2s latency (cold start)
   - Subsequent requests are fast (warm instances)
   - Can be minimized by keeping instances warm or using minimum instances

3. **Concurrency**:
   - Each function instance can handle multiple concurrent requests
   - Default: 80 concurrent requests per instance
   - Can be configured based on workload

4. **Regional Deployment**:
   - Functions deploy to specific regions (e.g., `europe-west1`)
   - Reduces latency for regional users
   - Can deploy to multiple regions for global scale

5. **Cost Efficiency**:
   - Only pay for execution time (milliseconds)
   - No idle server costs
   - Free tier: 2 million invocations/month

6. **Scaling Characteristics for AddNoteToBudget**:

   - **Read-heavy workloads**: Repository access is efficient with Firestore's connection pooling
   - **Write operations**: Firestore handles concurrent writes with transaction support
   - **Stateless design**: Handler is stateless, perfect for serverless
   - **Database connection**: Firestore Admin SDK manages connections automatically

#### Benefits of Serverless for This Handler

- **High Availability**: Automatic redundancy across zones
- **Automatic Scaling**: Handles traffic spikes without manual intervention
- **Cost Effective**: Only pay when function executes
- **Maintenance-Free**: No server patching or updates needed
- **Monitoring**: Built-in logging and metrics via Firebase/Google Cloud Console

#### Limitations & Considerations

- **Cold Starts**: Initial request latency
- **Execution Timeout**: Default 60s, max 540s
- **Memory Limits**: Configurable (128MB - 8GB)
- **Regional Latency**: Choose region close to users/database

### Testing Functions Locally

```bash
# Start Firebase emulators
npm run start-firebase-emulators

# Functions available at: http://localhost:5002
# Firestore UI: http://localhost:4000
```

### Function Types Available

Kujali supports multiple function types via registrars:

- **RestRegistrar**: HTTP callable functions (`https.onCall`)
- **EndpointRegistrar**: HTTP request functions (`https.onRequest`)
- **FirestoreRegistrar**: Firestore trigger functions
- **PubSubRegistrar**: Pub/Sub message handlers
- **CronRegistrar**: Scheduled functions

Choose the appropriate registrar based on your use case.

---

