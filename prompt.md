# PDS ShortURL — Project Prompt

I am building a minimalistic URL Shortener as a Full-Stack web application.

Context / Educational goals:

- Small project for 2 to 4 Computer Engineering students.
- Main goal: understand the full flow of a simple Full-Stack app, including:
  - Data persistence with a light relational database (e.g. SQLite).
  - HTTP redirection handling (301 / 302).
  - Encoding and decoding of short link codes.
  - Integrated Full-Stack development (frontend + backend).

Core required features:

1. A simple frontend interface that:
   - Lets the user enter a long URL in a form.
   - Sends this URL to the backend.
   - Displays the generated short link.
2. A backend that:
   - Receives the long URL.
   - Generates a short code (e.g. base62, hash, or encoded auto-increment id).
   - Stores the pair (short_code, original_url, created_at, optional click_count) in a database.
   - Exposes a redirect route:
     - `/[short_code]` must perform an HTTP 301 or 302 redirect to the original URL.
3. Short link behavior:
   - Example: if the domain is `https://myshort.ly`, then the code `abc123` gives `https://myshort.ly/abc123` which redirects to the original URL.

Technical constraints:

- I want to use a modern React-based environment.
- I prefer Next.js (recent version, e.g. 15+) to have:
  - React frontend.
  - Lightweight backend via Route Handlers / API routes.
  - Easy integration with SQLite.

Way of working:

- You must help me structure the project in PHASES, step by step:
  - Phase 1: Choose exact stack, initialize the project, folder structure.
  - Phase 2: Data model + SQLite configuration + data access layer.
  - Phase 3: Backend API for creating a short link and resolving a short code.
  - Phase 4: Minimal UI to create and display short links.
  - Phase 5: Actual redirection from the short code.
  - Phase 6 (optional): Improvements (click statistics, URL validation, UI/UX).

Collaboration style:

- For each phase, give me:
  - A short explanation of what we are doing.
  - The file structure (with paths).
  - The full code needed for that phase (but do not overshoot and build later phases).
  - The terminal commands needed (npm/yarn) if any.
- Do NOT build the whole project at once. We move phase by phase.
- If a technical decision must be made (e.g. using Prisma vs raw SQLite, etc.), propose 1–2 options and recommend one.

Now, start with Phase 1 only.
Ask me 1–2 questions if you need to clarify (e.g. TypeScript or JavaScript, App Router or Pages Router, etc.), then provide:

- The exact stack (Next.js version, DB, ORM or not, etc.).
- The command to create the project.
- The initial minimal folder structure.

Phase 1: Choose the exact stack and initialize the project.

Context:

- Minimalistic URL shortener full-stack app.
- I want to use Next.js with React.
- Light relational DB, preferably SQLite.
- Educational goal: understand full-stack flow + redirects + storage.

Decisions to take:

1. Next.js version and whether to use the App Router.
2. TypeScript or JavaScript.
3. How to use SQLite (ORM like Prisma vs direct driver).

I want you to:

- Suggest the simplest and most educational stack (for example: Next.js 14 + App Router + TypeScript + Prisma + SQLite).
- Give me the exact command to create the project.
- Propose the initial minimal file structure (without business logic yet).
- Briefly explain why this stack is a good fit for a small educational project.

Then stop (do NOT move on to Phase 2 yet).

Phase 2: Data model + SQLite configuration.

Reminder: stack chosen in Phase 1:
[PASTE HERE the stack summary decided earlier, e.g.:

- Next.js 14 + App Router
- TypeScript
- Prisma with SQLite
  ]

Goal of this phase:

- Define the data schema to store:
  - id (primary key),
  - shortCode (unique string),
  - originalUrl (string),
  - createdAt (datetime),
  - clickCount (integer, optional at first).
- Configure SQLite and the chosen tool (e.g. Prisma) in the project.
- Generate the initial migration.
- Verify we can read/write one sample record via a simple test script or temporary route.

What I expect:

- Full content of config files (e.g. `schema.prisma`, any env variables notes, etc.).
- The exact commands to run (e.g. `npx prisma migrate dev`, etc.).
- A minimal code example (e.g. temporary API route or script) that inserts a dummy URL and reads it from the DB.

Do NOT touch the frontend UI or redirect logic yet. Focus only on persistence.
Stop afterwards.

Phase 3: Backend API for creating short links and resolving codes.

Context:

- Data model and SQLite are configured (Phase 2).
- We are on Next.js with [App Router / Pages Router] and [TypeScript / JavaScript].

Goals:

1. API route to create a short link:
   - Method: POST
   - Input JSON: `{ "url": "https://example.com/..." }`
   - Logic:
     - Validate the URL format.
     - Generate a unique short code (e.g. base62 or encoding an auto-increment id).
     - Save to database.
     - Return the created object, for example:
       
       ```json
       {
         "shortCode": "abc123",
         "shortUrl": "https://myshort.ly/abc123",
         "originalUrl": "https://example.com/..."
       }
       ```

2. API route to get the original URL from a short code:
   - Method: GET
   - Path: `/api/links/[code]` (or similar)
   - Response:
     - 200 with `{ "originalUrl": "..." }` if found.
     - 404 if the code does not exist.

What I expect:

- Full code for the API handlers (Next.js route handler files).
- A utility function to generate a unique short code.
- How to test these routes (e.g. curl, Postman, or browser).

Do NOT implement the real redirect from `/[code]` yet. Just the API.
Stop afterwards.

Phase 4: Minimal user interface.

Goals:

- Create a main page (e.g. `/`) with:
  - A form that:
    - Has a text input for the long URL.
    - A "Shorten" button.
  - On submit:
    - Calls the "create short link" API from Phase 3.
    - Displays the returned short link as clickable text.
  - Handle basic errors (invalid URL, server error).
- UI should be minimal but clean:
  - Simple HTML + maybe some CSS or Tailwind if already set up.

What I expect:

- Full code of the relevant React page (Next.js).
- How it calls the API (fetch, etc.).
- How it manages state (loading, error, result).

Do NOT implement the actual server redirect for `/[code]` yet. We just display the short URL.
Stop afterwards.

Phase 5: HTTP redirection via dynamic routes.

Goals:

- Implement a dynamic Next.js route for `/[code]`.
- Behavior:
  - When a user visits `https://myshort.ly/abc123`:
    - Look up the original URL associated with `abc123` in the DB.
    - If found:
      - Optionally increment the clickCount.
      - Perform a server-side redirect to the original URL (HTTP 301 or 302).
    - If not found:
      - Return a simple 404 page or error message.

What I expect:

- Full code of the dynamic route (App Router or Pages Router, depending on our stack).
- The correct way to perform a server-side redirect in Next.js.
- Make it clear whether we use 301 or 302, and briefly explain why.

At this point, the full flow should work:

- Form → API → DB → short link → redirect.

Stop afterwards.

Phase 6 (optional): Improvements.

Now propose realistic enhancements for a small educational project, for example:

- Display a list of previously created links (table with code, URL, createdAt, clickCount).
- Simple statistics (click counts per link).
- Better URL validation (e.g. enforce protocol, reject invalid patterns).
- Some styling (CSS, Tailwind, etc.).
- Basic error handling and dedicated error pages.

For each suggested improvement:

- Explain briefly the educational benefit.
- Outline how to implement it (which files to modify, what kind of code).
  We will then decide which ones to implement first.
