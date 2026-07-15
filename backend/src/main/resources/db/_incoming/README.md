# Incoming schema dumps (local only)

Place live dumps here during baseline work. Generated files:

- `generate_schema_ddl.sql` — T-SQL catalog dumper (safe to keep in git)
- `seal_schema_dump.sql` — last dump output (optional; V0 is the committed artifact)

Regenerate dump:

```powershell
sqlcmd -S localhost -d SEAL -E -I `
  -i generate_schema_ddl.sql `
  -o seal_schema_dump.sql -y 0
```
