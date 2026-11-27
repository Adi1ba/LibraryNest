# Technical Design Document (TDD) — LibraryNest

| **Field**    | **Value**                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Product      | LibraryNest                                                                                              |
| Version      | MVP + Beta                                                                                               |
| Releases     | MVP — Mid-term, Beta — Final                                                                             |
| Status       | Draft                                                                                                    |
| Related docs | [Product Requirements Document (PRD)](01-prd.md), [Software Requirements Specification (SRS)](02-srs.md) |

Sections and tables are marked **MVP** or **Beta**. Build the MVP parts for the mid-term; the Beta parts extend them for the final.

## Documents in this set

| **Short form** | **Full form**                       | **Purpose**                                             | **File**    |
| -------------- | ----------------------------------- | ------------------------------------------------------- | ----------- |
| PRD            | Product Requirements Document       | What we build and why                                   | `01-prd.md` |
| SRS            | Software Requirements Specification | Exact requirements, permissions and acceptance criteria | `02-srs.md` |
| TDD            | Technical Design Document           | How we build it: architecture, data model, API          | `03-tdd.md` |

## 1. Overview

* **MVP:** A FastAPI REST API for book management, book search, and availability, connected to a React + TypeScript frontend. Book data is stored in Supabase PostgreSQL.
* **Beta:** The application extends the MVP with loan management, user registration and login, Student/Librarian/Admin roles, JWT authentication, role-based access control, profile and session management, user administration, groups, reading lists, audit logs, and administrative dashboards.

## 2. Tech stack

| **Layer**        | **Choice**                 | **Why**                                                          | **Release** |
| ---------------- | -------------------------- | ---------------------------------------------------------------- | ----------- |
| API              | FastAPI                    | Request validation, type hints, and automatic API documentation | MVP         |
| ORM / models     | SQLModel / SQLAlchemy      | Defines application models and handles database operations      | MVP         |
| Database         | Supabase PostgreSQL        | Stores application data                                          | MVP         |
| DB connection    | SQLAlchemy database engine | Connects the FastAPI backend to PostgreSQL                       | MVP         |
| Frontend         | React + TypeScript         | Builds the library web interface                                 | MVP         |
| Authentication   | JWT                        | Authenticates users through access tokens                        | Beta        |
| Password hashing | pwdlib with Argon2         | Securely hashes user passwords                                   | Beta        |
| Token security   | HS256 and refresh tokens   | Signs access tokens and supports token renewal                   | Beta        |

## 3. Architecture

```mermaid
flowchart TD
    U[Student / Librarian / Admin] --> F[React + TypeScript Frontend]
    F -->|REST API / JSON| A[FastAPI Backend]
    A --> O[SQLModel / SQLAlchemy]
    O --> D[(Supabase PostgreSQL)]
```

### 3.1 Request flow — MVP

```mermaid
sequenceDiagram
    participant U as User
    participant F as React Frontend
    participant A as FastAPI
    participant D as Supabase PostgreSQL

    U->>F: Search, view, or manage books
    F->>A: Send HTTP request
    A->>A: Validate request data
    A->>D: Query or update book records
    D-->>A: Return database result
    A-->>F: Return JSON response
    F-->>U: Display result
```

### 3.2 Login and authorization flow — Beta

```mermaid
sequenceDiagram
    participant U as User
    participant F as React Frontend
    participant A as FastAPI
    participant D as Supabase PostgreSQL

    U->>F: Submit email and password
    F->>A: POST /api/auth/login
    A->>D: Find user and verify password
    D-->>A: Return user record
    A->>A: Verify password and generate tokens
    A-->>F: Return access token and refresh token
    F->>A: Request protected resource with access token
    A->>A: Validate token and load current user
    A->>A: Check account status and authorization
    A->>D: Access permitted data
    D-->>A: Return database result
    A-->>F: Return JSON response
    F-->>U: Display result
```

## 4. Project structure

```text
backend/
    app/
        main.py                 # Creates FastAPI app and includes routers
        database.py             # Database engine and session dependency
        auth/
            models.py           # User model
            router.py           # Registration, login, refresh, logout and profile
            dependencies.py     # Current-user authentication dependencies
            permissions.py      # Role and permission checks
            schemas.py          # Authentication and user schemas
        books/
            router.py           # Book CRUD endpoints
        loans/
            router.py           # Loan management endpoints (Beta)
        users/
            router.py           # User administration endpoints (Beta)
        groups/
            router.py           # Group and reading-list endpoints (Beta)
        audit/
            router.py           # Audit log endpoints (Beta)
        ...
    requirements.txt

frontend/
    src/
        App.tsx                 # Application routes and authentication restore
        ...
        pages/
            Books.tsx           # Book browsing and management
            Loans.tsx           # Loan management (Beta)
            Login.tsx           # Login (Beta)
            Signup.tsx          # Registration (Beta)
            Profile.tsx         # User profile (Beta)
            Admin.tsx           # Administrative interface (Beta)

docs/
    01-prd.md
    02-srs.md
    03-tdd.md
```

Keep routers simple: validate input, apply authentication and permission checks where required, and use the database session to read or write records. Business logic should be handled by the relevant application service or module rather than duplicated across endpoints.

## 5. Data model

The application uses Supabase PostgreSQL as its database. SQLModel/SQLAlchemy models provide the backend representation of application data.

### 5.1 `book` entity — MVP

The book entity stores the information required for book management, search, and availability.

| **Field**          | **Purpose**                                      |
| ------------------ | ------------------------------------------------ |
| Book identifier    | Uniquely identifies a book record                |
| Title              | Stores the book title                            |
| Author             | Stores the author's name                         |
| ISBN               | Identifies the book using its ISBN               |
| Total copies       | Represents the total number of copies            |
| Available copies   | Represents the number of available copies        |

### 5.2 `loan` entity — Beta

Loan management is part of the Beta release. The loan module handles requests associated with books and registered users.

| **Field / relation** | **Purpose**                                                   |
| -------------------- | ------------------------------------------------------------- |
| Loan identifier      | Uniquely identifies a loan record                             |
| Book reference       | Associates a loan with a book                                 |
| User reference       | Associates a loan with a registered user                      |
| Loan status          | Represents the current processing state of a loan             |
| Request information  | Stores information associated with the loan request           |

The loan service must maintain book availability consistently when loan requests are processed and returned. Exact field names and database constraints follow the implemented models.

### 5.3 Additional entities — Beta

The Beta release introduces user management, group functionality, reading lists, and audit logging.

**User**

The user model supports registration, authentication, profile management, account status, and role-based access control.

| **Field / concept** | **Purpose**                                      |
| ------------------- | ------------------------------------------------ |
| User identifier     | Identifies a registered user                     |
| Name                | Stores the user's name                           |
| Email               | Identifies the user's account                    |
| Password hash       | Stores the securely hashed password              |
| Role                | Determines the user's application role           |
| Account status      | Represents whether the account is active         |

**Group**

Supports group creation, membership management, and member-specific permissions.

**Reading list**

Stores book entries associated with a group reading list.

**Audit log**

Records relevant application activities, including the actor, target, event, description, request information, and outcome.

**Session and refresh-token data**

Supports refresh-token handling, session management, and session revocation. Token and session records are handled according to the implemented authentication models and services.

Indexes and database constraints are maintained according to the actual SQLModel/SQLAlchemy models and migrations. Do not assume additional columns or indexes that are not present in the implementation.

### 5.4 Schemas

Request and response schemas validate incoming data and control the information returned by the API.

| **Schema / concept** | **Used for**                         | **Fields / information**                       | **Release** |
| ------------------- | ------------------------------------ | ----------------------------------------------- | ----------- |
| Book create         | Add a book                           | Book information                                | MVP         |
| Book update         | Update a book                        | Updated book information                        | MVP         |
| Book read           | Book responses                       | Book information and availability               | MVP         |
| Loan create         | Submit a loan request                | Loan request information                        | Beta        |
| Loan read           | Loan responses                       | Loan information and status                     | Beta        |
| Registration       | Register a user                      | Name, email, and password                       | Beta        |
| Login               | Authenticate a user                  | Email and password                              | Beta        |
| User read           | Return user information              | User profile and role information               | Beta        |
| Role update         | Change a user's role                 | Role information                                | Beta        |
| Profile update      | Update a user profile                | Profile information                             | Beta        |
| Group schemas       | Manage groups and memberships        | Group and membership information                | Beta        |
| Reading-list schemas| Manage group reading lists           | Reading-list item information                   | Beta        |
| Audit schemas       | Return audit records                 | Audit event information                         | Beta        |

Password hashes and other sensitive authentication data must not be exposed in public user responses.

## 6. REST API design

Base path: `/api`. Request and response bodies use JSON.

### 6.1 Endpoints — MVP

| **Method** | **Path**             | **Purpose**           | **Release** |
| ---------- | -------------------- | --------------------- | ----------- |
| `POST`     | `/api/books/`        | Add a book            | MVP         |
| `GET`      | `/api/books/`        | List and search books | MVP         |
| `GET`      | `/api/books/{book_id}` | View a book         | MVP         |
| `PUT`      | `/api/books/{book_id}` | Update a book        | MVP         |
| `DELETE`   | `/api/books/{book_id}` | Delete a book        | MVP         |

The book list endpoint supports searching by book information such as title, author, and ISBN.

### 6.2 Endpoints — Beta

Protected endpoints require a valid access token:

`Authorization: Bearer <access_token>`

**Authentication and profile**

| **Method** | **Path**                                  | **Purpose**                       |
| ---------- | ----------------------------------------- | --------------------------------- |
| `POST`     | `/api/auth/register`                      | Register a user                   |
| `POST`     | `/api/auth/login`                         | Authenticate a user               |
| `POST`     | `/api/auth/refresh`                       | Refresh authentication tokens      |
| `POST`     | `/api/auth/logout`                        | Log out and handle token revocation |
| `GET`      | `/api/auth/me`                            | Get the current user's profile     |
| `PATCH`    | `/api/auth/me`                            | Update the current user's profile  |
| `GET`      | `/api/auth/me/sessions`                   | List the current user's sessions   |
| `DELETE`   | `/api/auth/me/sessions/{session_id}`      | Revoke a session                  |
| `POST`     | `/api/auth/change-password`               | Change the account password       |

**Loan management**

| **Method** | **Path**                       | **Purpose**                   |
| ---------- | ------------------------------ | ----------------------------- |
| `GET`      | `/api/loans/`                  | List loan records             |
| `POST`     | `/api/loans/`                  | Create a loan request         |
| `GET`      | `/api/loans/{loan_id}`          | View a loan record             |
| `PATCH`    | `/api/loans/{loan_id}/status`   | Update loan status             |

**User and role management**

| **Method** | **Path**                                      | **Purpose**                    |
| ---------- | --------------------------------------------- | ------------------------------ |
| `GET`      | `/api/users/`                                 | List users                     |
| `GET`      | `/api/users/admin/dashboard-stats`            | Retrieve admin dashboard stats |
| `POST`     | `/api/users/bulk-action`                      | Perform bulk user actions      |
| `GET`      | `/api/users/{user_id}`                        | View user details              |
| `PATCH`    | `/api/users/{user_id}/role`                   | Update a user's role           |
| `PATCH`    | `/api/users/{user_id}/deactivate`             | Deactivate a user              |
| `PATCH`    | `/api/users/{user_id}/activate`               | Activate a user                |
| `POST`     | `/api/users/{user_id}/ban`                    | Ban a user                     |
| `PATCH`    | `/api/users/{user_id}/unban`                  | Unban a user                   |
| `POST`     | `/api/users/{user_id}/sessions/revoke`        | Revoke user sessions           |

**Groups and reading lists**

| **Method** | **Path**                                                        | **Purpose**                     |
| ---------- | --------------------------------------------------------------- | ------------------------------- |
| `GET`      | `/api/groups`                                                   | List groups                     |
| `POST`     | `/api/groups`                                                   | Create a group                  |
| `GET`      | `/api/groups/{group_id}`                                        | View a group                    |
| `PATCH`    | `/api/groups/{group_id}`                                        | Update a group                  |
| `DELETE`   | `/api/groups/{group_id}`                                        | Delete a group                  |
| `GET`      | `/api/groups/{group_id}/members`                                | List group members              |
| `POST`     | `/api/groups/{group_id}/members`                                | Add a group member              |
| `PATCH`    | `/api/groups/{group_id}/members/{user_id}/permissions`          | Update member permissions       |
| `DELETE`   | `/api/groups/{group_id}/members/{user_id}`                      | Remove a group member           |
| `POST`     | `/api/groups/{group_id}/reading-list`                           | Add a reading-list item         |
| `GET`      | `/api/groups/{group_id}/reading-list`                           | View the group reading list     |
| `PATCH`    | `/api/groups/{group_id}/reading-list/{item_id}`                 | Update a reading-list item       |
| `DELETE`   | `/api/groups/{group_id}/reading-list/{item_id}`                 | Delete a reading-list item       |

**Audit logs**

| **Method** | **Path**       | **Purpose**                |
| ---------- | -------------- | -------------------------- |
| `GET`      | `/api/audit/`  | Retrieve audit log records |

The audit endpoint supports filtering and pagination according to the implemented router.

### 6.3 Examples

**Search books**

```http
GET /api/books/?search=database
```

**Login — Beta**

```http
POST /api/auth/login
Content-Type: application/json
```

The login request contains the user's email and password. After successful authentication, the backend returns authentication token information.

**Access a protected resource — Beta**

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

The backend validates the token and returns the authenticated user's profile information.

### 6.4 Error format

Use FastAPI's standard error format where applicable.

```json
{
  "detail": "Resource not found"
}
```

Common HTTP status codes include:

* `400` — Invalid operation or request.
* `401` — Missing, invalid, or expired authentication.
* `403` — Authenticated user is not permitted to perform the action.
* `404` — Requested resource does not exist.
* `409` — Conflict with existing data or resource state.
* `422` — Request validation error.
* `500` — Unexpected server-side error.

The actual response status depends on the endpoint implementation and the type of error.

### 6.5 Design rules

* Use resource-based paths such as `/books/`, `/loans/`, `/users/`, and `/groups`.
* Use `GET` to read, `POST` to create or perform an action, `PUT` for book updates, `PATCH` for partial updates, and `DELETE` to delete resources.
* Validate request data before database changes.
* Authenticate protected requests before accessing user-specific resources.
* Check roles and resource-level permissions before restricted operations.
* Return clear error messages when an operation fails.
* Use `/api` as the API base path.
* Keep database access inside the backend; the frontend communicates through REST API requests.

## 7. Database access

* The backend uses SQLModel/SQLAlchemy to define models and communicate with Supabase PostgreSQL.
* The database module creates the database engine and provides a session dependency to FastAPI endpoints.
* Each request obtains a database session through the application's dependency system.
* All database access goes through the FastAPI backend; the frontend does not connect directly to PostgreSQL.
* Database changes must preserve data consistency, including book availability and loan processing.
* Database credentials and connection settings are supplied through environment variables.
* Database schema changes must remain compatible with the application code that uses them.

## 8. Configuration

| **Variable**       | **Purpose**                                      | **Release** |
| ------------------ | ------------------------------------------------ | ----------- |
| `DATABASE_URL`     | Supabase PostgreSQL connection URL               | MVP         |
| `JWT_SECRET_KEY`   | Secret used to sign access tokens                | Beta        |
| `PASSWORD_PEPPER`  | Additional secret used during password processing | Beta       |

Example local configuration:

```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET_KEY=replace_with_a_long_random_secret
PASSWORD_PEPPER=replace_with_a_different_long_random_secret
```

Use the actual Supabase connection string and the required environment configuration for the deployment environment. Do not commit `.env` files, database credentials, JWT secrets, or password pepper values to GitHub.

## 9. Deployment

* The frontend and backend are deployed and configured to communicate through the REST API.
* The backend connects to Supabase PostgreSQL using deployment environment variables.
* Environment variables must be configured outside the source code.
* The deployed application must be tested for book management, search, authentication, loan processing, and role-based access.
* The API documentation is available through FastAPI at `/api/docs`.
* The OpenAPI specification is available at `/api/openapi.json`.
* Deployment configuration must allow the frontend origin to communicate with the backend through the configured CORS settings.

## 10. Authentication and RBAC design — Beta

### 10.1 Authentication

* Users register with their name, email, and password.
* Email addresses must be unique.
* Passwords are processed using the configured password pepper and securely hashed using `pwdlib` with Argon2.
* Password hashes are stored instead of plain-text passwords.
* Login verifies the submitted credentials and generates an HS256-signed JWT access token.
* Access tokens contain claims such as `sub`, `role`, `iat`, and `exp`.
* The default access-token lifetime is 15 minutes.
* Refresh tokens are generated using a secure random token and stored as hashes for session and refresh management.
* The frontend restores authentication by validating the current access token and attempting token refresh when necessary.
* Protected requests must include a valid access token.

### 10.2 Role permissions

The application supports three user roles: Student, Librarian, and Admin. The backend applies role checks to restricted operations. Group-specific operations also use membership and permission checks.

| **Action**                         | **Student** | **Librarian** | **Admin** |
| ---------------------------------- | ----------- | ------------- | --------- |
| Search and view books              | Yes         | Yes           | Yes       |
| Manage books                       | No          | Yes           | Yes       |
| Access loan management             | According to endpoint permission | According to endpoint permission | According to endpoint permission |
| Manage users and roles             | No          | No            | Yes       |
| Access administrative user tools   | No          | No            | Yes       |
| Manage group membership            | According to group permissions | According to group permissions | According to group permissions |
| Manage group reading lists         | According to group permissions | According to group permissions | According to group permissions |
| View administrative audit logs     | No          | No            | Yes       |

Group owners and members are subject to the group-level permission checks implemented by the backend. A user's global role alone does not replace those checks.

### 10.3 Permission checks

* FastAPI verifies the access token before allowing access to protected endpoints.
* The backend loads the current user and checks account status before allowing protected operations.
* Inactive or banned users are rejected by the authentication dependency.
* The backend compares the role in the token with the user's current database role.
* Role-restricted endpoints use backend permission dependencies such as `require_roles`.
* Admin-only user-management operations are protected by Admin role checks.
* Group operations check ownership, membership, and the relevant member permission.
* Users must not be allowed to access resources outside the permissions granted to them.
* Unauthenticated requests return `401`; authenticated but unauthorized requests return `403` where applicable.

## 11. Security — Beta

| **Area**        | **Design**                                                              |
| --------------- | ----------------------------------------------------------------------- |
| Passwords       | `pwdlib` with Argon2 and password pepper                                |
| Authentication  | HS256-signed JWT access tokens                                          |
| Refresh tokens  | Secure random refresh tokens stored as hashes                           |
| Authorization   | Role checks and resource-level permission checks in FastAPI              |
| Account status  | Reject inactive or banned users during authentication                   |
| Database        | SQLModel/SQLAlchemy database operations                                 |
| Validation      | Validate input using request schemas                                    |
| Data exposure   | Never return password hashes or sensitive token data                    |
| Session control | Support session revocation and refresh-token management                  |
| Configuration   | Store secrets and database credentials in environment variables         |
| Audit           | Record relevant administrative and application events                   |

## 12. Database schema updates — Beta

* Extend the database with the user, authentication, and other entities required by Beta functionality.
* Associate loan records with registered users according to the implemented loan model.
* Add the database structures required for group membership, permissions, reading lists, and audit logging.
* Support refresh-token and session management using the implemented authentication design.
* Keep existing book data valid when extending the application.
* Ensure database schema changes are applied before deploying code that depends on them.
* Keep model definitions and database schema changes consistent.

## 13. Risks

| **Risk**                                       | **Mitigation**                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| Book availability becomes incorrect            | Maintain consistent availability updates during loan processing.     |
| Duplicate ISBN records                         | Enforce ISBN uniqueness in the database.                              |
| Unauthorized book or loan operations           | Apply backend role and permission checks.                              |
| Users access another user's protected data     | Validate ownership and resource-level permissions.                    |
| Inactive or banned users access the system     | Check account status during authentication.                            |
| Database connection failure                    | Verify Supabase configuration and handle database errors clearly.     |
| Refresh tokens or sessions are misused         | Store refresh-token hashes and support session revocation.             |
| Credentials or secrets are exposed             | Keep `.env` and deployment secrets out of GitHub.                      |
| Group resources are accessed without permission | Verify group ownership, membership, and member permissions.           |
| Audit information is incomplete                | Record relevant events through the audit service.                      |