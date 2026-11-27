# LibraryNest — Product Requirements Document (PRD)

| **Field**    | **Value** |
| ------------ | --------- |
| Product      | LibraryNest |
| Version      | MVP + Beta |
| Releases     | MVP — Mid-term, Beta — Final |
| Status       | Draft |
| Related docs | [Software Requirements Specification (SRS)](02-srs.md), [Technical Design Document (TDD)](03-tdd.md) |

This document covers **both releases**. Every goal, feature, and user story has a **Release** column to distinguish what was developed for the mid-term demonstration and what was added for the final demonstration.

**Documents in this set**

| **Short form** | **Full form** | **Purpose** | **File** |
| -------------- | ------------- | ----------- | -------- |
| PRD | Product Requirements Document | What we build and why | `docs/01-prd.md` |
| SRS | Software Requirements Specification | Functional requirements, permissions, and acceptance criteria | `docs/02-srs.md` |
| TDD | Technical Design Document | Architecture, database design, and API implementation | `docs/03-tdd.md` |

## 0. Release plan

| **Release** | **When** | **Focus** |
| ----------- | -------- | --------- |
| **MVP** | Mid-term | Core library system: book CRUD, book search, and availability display |
| **Beta** | Final | Loan management, authentication, Student/Librarian/Admin roles, permission enforcement, user and session management, groups, reading lists, audit logs, dashboard statistics, and security improvements |

## 1. Purpose

LibraryNest is a web-based library management application designed to simplify book discovery, catalog management, and loan management for students and library staff. The project was developed in two stages:

1. **MVP (mid-term):** A working library catalog system with book CRUD operations, book search by title, author, or ISBN, and book availability display.
2. **Beta (final):** Extended the MVP with loan management, user registration and login, role-based access control (RBAC), user and session management, group reading lists, audit logging, dashboard statistics, and improved security.

The system uses React with TypeScript for the frontend, FastAPI with Python for the backend, and Supabase PostgreSQL for data storage.

## 2. Problem statement

Manual library processes can make it difficult for students to find available books and for library staff to maintain accurate catalog records. Managing loan requests, user access, and library activities without a centralized system can also make tracking and administration more difficult.

LibraryNest aims to provide a centralized web application that supports book discovery, catalog management, loan workflows, and controlled access to library operations. It also provides administrative tools for managing users, monitoring activities, and organizing shared reading lists.

## 3. Goals

| **ID** | **Goal** | **Release** |
| ------ | -------- | ----------- |
| G-1 | Provide REST APIs for creating, viewing, updating, and deleting book records. | MVP |
| G-2 | Store book records in Supabase PostgreSQL so that data persists between application restarts. | MVP |
| G-3 | Allow users to search for books by title, author, or ISBN and view availability. | MVP |
| G-4 | Allow users to submit and track loan requests through recorded statuses. | Beta |
| G-5 | Provide registration and login so users can access the system through individual accounts. | Beta |
| G-6 | Enforce Student, Librarian, and Admin roles through RBAC and permission checks. | Beta |
| G-7 | Allow authorized administrators to manage user accounts, roles, and account access. | Beta |
| G-8 | Protect user and library data through authentication, authorization, input validation, and secure configuration. | Beta |
| G-9 | Allow users to manage their profile, password, and active sessions. | Beta |
| G-10 | Provide administrative controls for account activation, deactivation, banning, unbanning, and session revocation. | Beta |
| G-11 | Support groups, group membership, member permissions, and shared reading lists. | Beta |
| G-12 | Record and retrieve audit logs to support administrative monitoring and activity tracking. | Beta |
| G-13 | Provide dashboard statistics to help administrators monitor important system information. | Beta |
| G-14 | Provide an integrated frontend and backend application for the final demonstration. | Beta |

## 4. Target users

| **User** | **Need** | **Release** |
| -------- | -------- | ----------- |
| Student / library user | Search for books and check their availability. | MVP |
| Librarian | Create, update, delete, and maintain book records. | MVP |
| Frontend developer | Use documented REST APIs to connect the frontend to the backend. | MVP |
| Instructor / reviewer | Inspect the project and verify its functionality through the application and API documentation. | MVP |
| Student | Log in, view books, submit loan requests, and access personal loan records. | Beta |
| Librarian | Manage books and process loan requests and returns. | Beta |
| Admin | Manage users, assign roles, control account access, and view administrative information. | Beta |
| Group owner / member | Manage or participate in groups and use shared reading lists according to assigned permissions. | Beta |

In the **MVP**, the core book catalog operations are demonstrated without individual user accounts or loan management. In the **Beta**, authenticated users can access role-specific features, submit and manage loan requests, and use additional account and group functionality according to their permissions.

## 5. Scope

### In scope — MVP (mid-term)

* Create, list, view, update, and delete book records.
* Search books by title, author, or ISBN.
* Display book availability.
* Validate inputs and return clear API error responses.
* Store book records in Supabase PostgreSQL.
* Provide interactive API documentation through FastAPI.
* Run the core application for the mid-term demonstration.

### In scope — Beta (final)

* **Authentication:** User registration, login, logout, and token refresh.
* **Authorization:** Role-based access control for Student, Librarian, and Admin.
* **Loan management:** Submit loan requests, view loan records, and process loan statuses.
* **Student access:** View personal loan records and manage account information.
* **Librarian access:** Manage books and process loan requests and returns.
* **Admin user management:** View users, inspect user details, assign roles, and perform administrative account actions.
* **Account controls:** Activate, deactivate, ban, and unban accounts where authorized.
* **Bulk actions:** Perform supported administrative actions on multiple users.
* **Profile management:** View and update personal profile information.
* **Session management:** View personal sessions, revoke sessions, and allow authorized administrators to revoke user sessions.
* **Password management:** Change account passwords and manage authentication sessions.
* **Groups:** Create and manage groups, manage members, and update member permissions according to ownership and access rules.
* **Reading lists:** Add, view, update, and remove items from group reading lists.
* **Audit logging:** Record relevant system activities and allow authorized administrators to retrieve and filter audit logs.
* **Dashboard:** Display administrative statistics, including user, book, group, and activity-related counts supported by the application.
* **Security:** Password hashing, token validation, permission enforcement, input validation, secure secret configuration, and consistent error handling.
* **Integration:** Connect the React + TypeScript frontend with the FastAPI REST APIs.
* **Deployment:** Prepare and deploy the application for the final demonstration.

### Out of scope for this semester

* Online payments and fines processing.
* Email and SMS notifications.
* Advanced reservation queues and waitlists.
* AI-based book recommendations or other AI features.
* External university authentication or social login.
* Automated library inventory hardware integration.
* Unnecessary analytics and advanced reporting.
* Features beyond the requirements implemented for the MVP and Beta releases.

## 6. Features and priority (MoSCoW)

Priorities are release-specific. A Beta Must Have is required for the final demonstration, not for the mid-term.

| **ID** | **Feature** | **Release** | **Priority** |
| ------ | ----------- | ----------- | ------------ |
| F-1 | Create a book record | MVP | Must |
| F-2 | List and view book records | MVP | Must |
| F-3 | Update and delete book records | MVP | Must |
| F-4 | Search books by title, author, or ISBN | MVP | Must |
| F-5 | Display book availability | MVP | Must |
| F-6 | Validate inputs and return clear error responses | MVP | Must |
| F-7 | Store book data in Supabase PostgreSQL | MVP | Must |
| F-8 | Provide interactive API documentation | MVP | Should |
| F-9 | Connect the React frontend to the REST API | MVP | Should |
| F-10 | Submit and manage loan requests and statuses | Beta | Must |
| F-11 | User registration and login | Beta | Must |
| F-12 | Student, Librarian, and Admin roles | Beta | Must |
| F-13 | Enforce permissions on protected API endpoints | Beta | Must |
| F-14 | Associate loan records with authenticated users | Beta | Must |
| F-15 | Manage users, assign roles, and view user details | Beta | Must |
| F-16 | Activate, deactivate, ban, and unban user accounts | Beta | Must |
| F-17 | Perform supported bulk user actions | Beta | Should |
| F-18 | View and update personal profile information | Beta | Must |
| F-19 | Manage personal sessions and change passwords | Beta | Must |
| F-20 | Allow authorized administrators to revoke user sessions | Beta | Should |
| F-21 | Create and manage groups and group memberships | Beta | Should |
| F-22 | Manage group member permissions | Beta | Should |
| F-23 | Create and manage group reading lists | Beta | Should |
| F-24 | Record and retrieve audit logs | Beta | Must |
| F-25 | Display administrative dashboard statistics | Beta | Should |
| F-26 | Apply security improvements and prepare deployment | Beta | Must |

## 7. User stories

### MVP

| **ID** | **Story** | **Feature** | **Release** |
| ------ | --------- | ----------- | ----------- |
| US-01 | As a librarian, I want to add a book so that the library catalog stays updated. | F-1 | MVP |
| US-02 | As a library user, I want to view the book catalog so that I can discover available books. | F-2 | MVP |
| US-03 | As a librarian, I want to update or delete book records so that the catalog remains accurate. | F-3 | MVP |
| US-04 | As a library user, I want to search by title, author, or ISBN so that I can find a specific book. | F-4 | MVP |
| US-05 | As a library user, I want to see book availability so that I can decide whether a book is available. | F-5 | MVP |
| US-06 | As a developer, I want clear validation errors and API documentation so that I can understand and use the REST APIs. | F-6, F-8 | MVP |

### Beta

| **ID** | **Story** | **Feature** | **Release** |
| ------ | --------- | ----------- | ----------- |
| US-07 | As a student, I want to submit a loan request so that I can request a book online. | F-10 | Beta |
| US-08 | As a student, I want to view my loan records so that I can track my library activity. | F-10, F-14 | Beta |
| US-09 | As a librarian, I want to process loan requests and record returns so that library operations remain organized. | F-10 | Beta |
| US-10 | As a visitor, I want to register an account so that I can access LibraryNest as a registered user. | F-11 | Beta |
| US-11 | As a registered user, I want to log in and log out so that I can securely access my account. | F-11 | Beta |
| US-12 | As an authorized user, I want the system to restrict actions based on my role so that protected operations remain secure. | F-12, F-13 | Beta |
| US-13 | As an admin, I want to view users and their details so that I can manage the platform. | F-15 | Beta |
| US-14 | As an admin, I want to assign user roles so that access is controlled appropriately. | F-15 | Beta |
| US-15 | As an admin, I want to activate, deactivate, ban, or unban accounts so that I can control account access. | F-16 | Beta |
| US-16 | As an admin, I want to perform supported bulk actions so that I can manage multiple user accounts efficiently. | F-17 | Beta |
| US-17 | As a user, I want to view and update my profile so that my account information remains accurate. | F-18 | Beta |
| US-18 | As a user, I want to change my password and manage my sessions so that I can maintain control over my account security. | F-19 | Beta |
| US-19 | As an admin, I want to revoke a user's sessions so that I can respond to account security concerns. | F-20 | Beta |
| US-20 | As a group owner, I want to create and manage a group so that members can participate in shared library activities. | F-21 | Beta |
| US-21 | As a group owner, I want to manage members and their permissions so that group access is controlled. | F-22 | Beta |
| US-22 | As a group member, I want to view and manage the group's reading list according to my permissions so that members can organize books together. | F-23 | Beta |
| US-23 | As an admin, I want to view and filter audit logs so that I can monitor recorded system activities. | F-24 | Beta |
| US-24 | As an admin, I want to view dashboard statistics so that I can monitor important system information. | F-25 | Beta |

## 8. Success metrics

### MVP

* All required book CRUD API operations work during the mid-term demonstration.
* Book searches by title, author, and ISBN return the expected matching records.
* Book records persist in Supabase PostgreSQL.
* Book search responses complete within 2 seconds under normal testing conditions.
* The FastAPI documentation page displays available API endpoints and their request and response schemas.
* The core book catalog workflows can be demonstrated successfully.

### Beta

* Users can register, log in, log out, and refresh authentication successfully using valid credentials.
* 100% of tested unauthorized role-restricted API requests are denied.
* Students cannot access other users' personal loan records.
* Librarian and Admin operations follow the approved permission rules documented in the SRS.
* Passwords are not stored in plain text.
* Users can manage their profile, password, and supported sessions.
* Authorized administrative actions for user management and account access work as expected.
* Group membership and reading-list operations respect the applicable permissions.
* Relevant system activities are recorded and can be retrieved through the audit functionality.
* Administrative dashboard statistics display the supported counts.
* The frontend and backend work together for the defined Beta workflows.
* The deployed application is ready for the final demonstration.

## 9. Assumptions and constraints

* The project uses React + TypeScript for the frontend, FastAPI + Python for the backend, and Supabase PostgreSQL for the database.
* The backend exposes REST APIs and provides interactive API documentation through `/api/docs`.
* The OpenAPI specification is available through `/api/openapi.json`.
* The MVP focuses on core book catalog operations without individual user accounts or loan management.
* The Beta extends the MVP with authentication, loan management, user-specific records, and role-based permissions.
* Student, Librarian, and Admin users have different permissions, defined in the SRS.
* Group access and member permissions depend on group ownership and assigned permissions.
* Authentication and authorization are enforced by the backend; frontend controls alone do not determine access.
* Sensitive configuration values are maintained through environment variables rather than committed source code.
* The frontend and backend must integrate within the available semester timeline.
* Deployment depends on compatible hosting services, correct environment variables, and a working database connection.
* The feature scope remains limited to the requirements implemented for the MVP and Beta releases.

## 10. Milestones

### MVP — Mid-term

| **Milestone** | **Deliverable** |
| ------------- | --------------- |
| M1 — Documentation | PRD, SRS, and TDD covering the MVP and planned Beta scope |
| M2 — Data layer | Supabase PostgreSQL database connection and book data models |
| M3 — Book API | Book CRUD, search, availability, and input validation |
| M4 — Frontend integration | Core book catalog interface connected to the REST API |
| M5 — Mid-term demo | Core book catalog workflows demonstrated with API documentation |

### Beta — Final

| **Milestone** | **Deliverable** |
| ------------- | --------------- |
| B1 — Authentication | Registration, login, logout, token refresh, and authenticated user access |
| B2 — Loan management and RBAC | Loan workflows and Student, Librarian, and Admin permission checks |
| B3 — User and account management | User listing, role management, activation/deactivation, ban/unban, and bulk actions |
| B4 — Profile and sessions | Profile management, password change, session viewing and revocation |
| B5 — Groups and reading lists | Group creation, membership management, permissions, and shared reading lists |
| B6 — Audit and dashboard | Audit log recording and retrieval, filtering, and dashboard statistics |
| B7 — Integration and security | Frontend-backend integration, protected endpoints, password hashing, and secure configuration |
| B8 — Final demo | Integrated LibraryNest application deployed and prepared for the final demonstration |

## 11. Release dependencies

* The Beta builds on the MVP and extends the existing book catalog functionality.
* The database schema supports the entities and relationships required for books, users, loans, groups, and related application features.
* Authentication must be implemented before user-specific loan records and role-restricted operations can be enforced.
* RBAC and backend permission checks must be implemented before protected Beta operations can be considered complete.
* User and session management depend on the authentication system.
* Group membership and reading-list operations depend on group ownership and permission checks.
* Audit logging depends on the relevant application operations recording their activities.
* Dashboard statistics depend on the availability of the underlying application records.
* The frontend depends on stable REST API endpoints and consistent request and response formats.
* Deployment depends on compatible hosting services, correct environment variables, and a working Supabase PostgreSQL connection.