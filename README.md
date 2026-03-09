"""
NGX Portfolio Dashboard — Google Sheets Version
================================================
Pulls live data from your private Google Sheet using a Service Account,
then renders the full multi-panel dashboard chart.

ENV SETUP
---------
Create a .env file (or export these vars) with ONE of the two auth methods:

  Method A — Service Account JSON file (recommended):
    GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service_account.json

  Method B — Inline JSON string (useful for Docker / CI secrets):
    GOOGLE_SERVICE_ACCOUNT_JSON_STR='{"type":"service_account","project_id":...}'

SHEET CONFIG
------------
  SPREADSHEET_ID=1kkZt2s-c1EmDXsoArth5IwwLRwxEEqW9XaoEcnPACpY

GOOGLE CLOUD SETUP (one-time)
------------------------------
1. Go to https://console.cloud.google.com
2. Create a project (or select existing)
3. Enable "Google Sheets API" and "Google Drive API"
4. IAM & Admin -> Service Accounts -> Create Service Account
5. Download the JSON key file
6. In your Google Sheet -> Share -> paste the service account email -> Viewer

INSTALL DEPENDENCIES
--------------------
  pip install google-auth google-auth-httplib2 google-api-python-client
  pip install pandas matplotlib openpyxl python-dotenv
"""
