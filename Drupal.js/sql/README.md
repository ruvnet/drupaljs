# Supabase SQL Scripts and Configuration

This folder contains SQL scripts and configuration files for setting up and managing the Supabase database for Drupal.js.

## Files

- `init.sql`: Initial database setup script
- `functions.sql`: Custom PostgreSQL functions
- `triggers.sql`: Database triggers
- `roles.sql`: Database roles and permissions
- `indexes.sql`: Index definitions for performance optimization
- `migrations/`: Folder containing numbered migration scripts

## Setup Instructions

1. Connect to your Supabase project using the SQL Editor.
2. Run the scripts in the following order:
   - `init.sql`
   - `functions.sql`
   - `triggers.sql`
   - `roles.sql`
   - `indexes.sql`
3. Apply any migrations in the `migrations/` folder in numerical order.

## Migrations

When making changes to the database schema, create a new migration file in the `migrations/` folder with a timestamp prefix, e.g., `20230401000000_add_new_table.sql`.

## Best Practices

- Always backup your database before running any scripts.
- Test scripts in a development environment before applying to production.
- Keep this folder up-to-date with any manual changes made to the database.