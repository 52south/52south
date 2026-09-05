# 52 South booking backend

Google Apps Script source for the separately deployed booking endpoint. It logs each accepted request to a private Google Sheet, sends the restaurant/CC notification and a customer receipt, and records whether both mail calls completed.

The website form action must point to the deployed `/exec` URL. Keep the script deployment restricted to executing as the owner and accessible to anyone so customers do not need Google accounts.

Rollback: restore the previous form action, then disable the Apps Script deployment. The Sheet is intentionally retained as the booking audit log.
