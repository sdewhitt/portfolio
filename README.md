# Portfolio

![Code Size (bytes)](https://img.shields.io/github/languages/code-size/sdewhitt/evallm-v2)
![Repo Size](https://img.shields.io/github/repo-size/sdewhitt/evallm-v2)
![Last Commit](https://img.shields.io/github/last-commit/sdewhitt/evallm-v2)

<p align="left">
  <a href="https://github.com/sebilune">
    <img src="https://skillicons.dev/icons?i=react,tailwind,ts,next,vercel,npm&perline=8" />
  </a>
</p>

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
