

## Clean up duplicate Slack integrations

### Problem
There are 7 `slack_integrations` rows all pointing to the same Slack workspace (`T06F9TXE0N8`). Only the **Grattia Sandbox** row (company: `807718ad-dbe3-4d79-812b-ee0dc662e674`) should remain. The duplicates cause the `/grattia` slash command to fail because `.single()` finds multiple rows.

### Changes

**Delete 6 stale rows** from `slack_integrations` using a data operation (not migration):

```sql
DELETE FROM slack_integrations 
WHERE company_id != '807718ad-dbe3-4d79-812b-ee0dc662e674';
```

This removes integrations for: beyey9, Grattia Live, Tesla, NBA, Notion, Stripe — keeping only Grattia Sandbox.

After cleanup, the `/grattia` slash command's `.single()` query on `workspace_id = 'T06F9TXE0N8'` will return exactly one row and work correctly.

No code changes needed.

