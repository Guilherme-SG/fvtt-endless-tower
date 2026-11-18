# Foundry REST API (Rolling Dice & External Calls)

The REST API module is installed in the FoundryVTT world. Use `curl.exe` to call it.

## PowerShell Quirks

1. **`curl` alias**: PowerShell's `curl` is an alias for `Invoke-WebRequest` — different syntax.
   Always use `& "C:\Windows\System32\curl.exe"` to invoke the real curl binary.
2. **JSON payload escaping**: Do not pass JSON inline with `-d`. PowerShell mangles quotes.
   Write JSON to a temp file first (without BOM), then use `-d "@file"`.

## Example Request

```powershell
$json = '{"formula":"1d20","flavor":"Test"}'
[System.IO.File]::WriteAllText("$env:TEMP\req.json", $json)
& "C:\Windows\System32\curl.exe" -s -X POST "https://foundryrestapi.com/roll" `
  -H "Content-Type: application/json" `
  -H "x-api-key: $env:FOUNDRY_API_KEY" `
  -d "@$env:TEMP\req.json"
```

- **Authentication**: API key is stored in `.env` as `FOUNDRY_API_KEY`.
- **Official documentation**: https://foundryrestapi.com/docs/api
