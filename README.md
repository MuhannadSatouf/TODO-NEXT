# Todo Workspace

A Next.js + Tailwind + Prisma todo application with register, login, and dashboard.

## Setup

Install dependencies:

```
npm install
```

Generate the Prisma client and create the SQLite database:

```
npm run db:generate
npm run db:push
```

Run the development server:

```
npm run dev
```

## Notes

- Authentication is demo-style and stores the user in local storage.
- The API expects the `x-user-id` header for todo actions.
- The SQLite database is stored at `prisma/dev.db`.
