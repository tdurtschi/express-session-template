# Express Session Template

This is a simple example which uses LinkedIn's user authentication API to grant access to a user. It uses session cookies to manage the user's state.

Thanks to https://www.section.io/engineering-education/session-management-in-nodejs-using-expressjs-and-express-session/

## Prerequisites

- Node v16 or above.
- `.env` file in project directory (see `.env.example` for an example).
  - If you need OIDC credentials, see: https://learn.microsoft.com/en-us/linkedin/shared/authentication/client-credentials-flow
- PostgreSQL database for session state.
  - Alternately, just use the default store instead which will store sessions in memory.

## Available commands

- `npm run dev` Start the server in watch mode.
- `npm run start` Start the server.
