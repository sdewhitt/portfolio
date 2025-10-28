
Development
1. Install deps: `npm install`
2. Run dev server: `npm run dev`

## Theme tokens

The app uses CSS variables mapped to Tailwind color utilities. You can tweak the palette in `app/globals.css` by updating these tokens (light and dark modes):

- `--background` / `--foreground`
- `--primary` / `--primary-foreground`
- `--accent` / `--accent-foreground`
- `--muted` / `--muted-foreground`
- `--border`, `--input`, `--ring`

Common Tailwind classes reference these tokens, e.g. `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, etc.

Chat UI uses a high-contrast indigo-based scheme:

- User messages: `bg-primary text-primary-foreground`
- Assistant messages: `bg-muted text-foreground`
- System messages: `bg-accent text-accent-foreground`

Adjust any of the variables to quickly reskin the chatbot.
