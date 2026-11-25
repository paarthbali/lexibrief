# Contributing

Thanks for helping with LexiBrief. This is a small project, so the process is light.

## Set up

Follow **Getting started** in the [README](README.md). You need three terminals: the API, the Python extractor and the React client.

## Making a change

1. Create a branch from `main`, for example `fix/mobile-menu`.
2. Keep each pull request to one purpose.
3. Before opening it:
   - `npm run build` passes in `client/`.
   - Every changed server file passes `node --check`.
   - You looked at the screen at phone width (about 375 px) and at desktop width.
4. Fill in the pull request template.

## Style

- React components are `.jsx`, one component per file, in `client/src/components` or `client/src/pages`.
- Use Tailwind utility classes. Shared patterns (`card`, `btn-primary`, `field`) live in `client/src/index.css`, so reuse them before adding new ones.
- Server routes live in `server/src/routes`, shared logic in `server/src/lib`.
- Two-space indentation (see `.editorconfig`).
- Never commit `.env` files or API keys.

## Database changes

Edit `server/prisma/schema.prisma`, then run `npx prisma migrate dev --name short_description` in `server/` and commit the generated migration folder.

## Reporting problems

Open an issue with what you did, what you expected and what happened. Include the browser and screen size for layout problems.
