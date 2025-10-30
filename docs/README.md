# Documentation

Welcome to the portfolio project documentation! This folder contains all the guides and references for setting up and using the RAG-powered chatbot system.

## 📚 Documentation Index

### Quick Start
- **[QUICKSTART.md](./QUICKSTART.md)** - Fast setup guide with essential commands and configuration

### Setup Guides
- **[RAG-SETUP.md](./RAG-SETUP.md)** - Comprehensive setup guide for the RAG (Retrieval-Augmented Generation) system
- **[SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md)** - Step-by-step checklist to ensure everything is configured correctly

### Reference
- **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)** - Complete technical overview of what has been built, including:
  - Auto-sync system architecture
  - Library files and their purposes
  - Script files and utilities
  - Database schema
  - Integration examples

### Troubleshooting
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and their solutions for the RAG system

## 🚀 Getting Started

If you're new to this project:

1. Start with **QUICKSTART.md** for a rapid setup
2. Use **SETUP-CHECKLIST.md** to ensure you have everything configured
3. Refer to **TROUBLESHOOTING.md** if you encounter issues
4. Check **IMPLEMENTATION-SUMMARY.md** for technical details

## 🔑 Key Features

This portfolio uses a RAG system with:
- **Auto-sync** - Content automatically syncs when you send chat messages
- **Vector database** - Supabase with pgvector for semantic search
- **AI enhancement** - Optional OpenAI-powered content enhancement
- **Smart caching** - Only syncs when files actually change

## 📍 Other Documentation

- **AUTO-SYNC.md** - Located in `app/data/RAG/AUTO-SYNC.md`, contains detailed information about the automatic content synchronization system
- **Component notes** - Individual components may have their own documentation in their directories

## 🔗 Related Files

- `supabase-setup.sql` - Database schema (in project root)
- `.env.local` - Environment configuration (create from `.env.example`)
- `package.json` - Contains npm scripts for running various commands

## 📝 Maintenance

When updating the documentation:
- Keep QUICKSTART.md concise and action-oriented
- Update IMPLEMENTATION-SUMMARY.md when adding new features
- Add common issues to TROUBLESHOOTING.md as they arise
- Keep this README index up to date
