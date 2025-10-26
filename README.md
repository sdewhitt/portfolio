# Portfolio Template (Next.js)

This is a lightweight portfolio starter built with Next.js (App Router) and Tailwind.

What it includes
- A reusable `Header` and `Footer` component
- A homepage with a hero and a projects grid
- `ProjectCard` component and example data in `app/data/projects.ts`
- Simple theme tokens in `app/globals.css` for easy customization

How to customize
1. Replace `Your Name` with your name in `app/components/Header.tsx` and `app/layout.tsx` metadata.
2. Update contact email in the header and hero CTA (`app/page.tsx`).
3. Replace `app/data/projects.ts` entries with your projects (title, description, tech, github, live, image).
4. Add asset images to the `public/` folder (e.g., `profile-placeholder.png`, `project-1.png`).

Development
1. Install deps: `npm install`
2. Run dev server: `npm run dev`

Tips
- Keep project descriptions short and link to code or demos.
- Use high-quality screenshots in `public/` for project images.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
