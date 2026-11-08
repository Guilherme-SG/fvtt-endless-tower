#Requires -RunAsAdministrator
<#
  Endless Tower: aplica o patch da tela de login.

  O que faz (idempotente, com backup):
    1. Adiciona a verificação instantânea no <head> e os links de CSS/JS ao layout do Foundry
       (templates\views\layouts\setup.hbs) garantindo zero flash de tela branca/cinza.
    2. Marca o mundo em world.json (joinTheme = default + <div class="et-login-marker">).
    3. Reverte o idioma global em options.json (en.endless-tower -> en.core).

  Antes de rodar: PARE o Foundry no FLC (senão ele sobrescreve world.json ao fechar).
  Rode de novo após cada atualização do Foundry (o instalador restaura o layout original).
#>
param(
  [string]$FoundryApp = 'C:\Program Files\Foundry Virtual Tabletop\resources\app',
  [string]$DataPath   = 'D:\FoundryVTT\Data',
  [string]$ConfigPath = 'D:\FoundryVTT\Config\options.json',
  [string]$WorldId    = 'endless-tower',
  [int]$Port          = 30000
)

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)

if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
  throw "Foundry ainda esta rodando (porta $Port). Pare no FLC e rode de novo."
}

# 1. Layout do Foundry
$layout = Join-Path $FoundryApp 'templates\views\layouts\setup.hbs'
$text = [IO.File]::ReadAllText($layout)
if (-not (Test-Path "$layout.endless-tower.bak")) { Copy-Item $layout "$layout.endless-tower.bak" }

# Remove qualquer versão anterior do patch para atualização limpa
$text = [regex]::Replace($text, '\s*<!-- Endless Tower login[\s\S]*?login\.js.*?>\s*(?:<\/script>)?', '')

$snippet = @"
    <!-- Endless Tower login (zero-flash check & assets) -->
    <script>if(document.title.trim()==="Endless Tower"){document.documentElement.classList.add("et-world","et-gate");}</script>
    <link href="modules/endless-tower/login/login.css" rel="stylesheet" type="text/css" media="all">
    <script src="modules/endless-tower/login/login.js" defer></script>
"@
$text = $text.Replace('</head>', $snippet + "`r`n</head>")
[IO.File]::WriteAllText($layout, $text, $utf8)
Write-Host "[ok] layout patched com zero-flash: $layout"

# 2. world.json
$worldPath = Join-Path $DataPath "worlds\$WorldId\world.json"
if (-not (Test-Path "$worldPath.pre-login.bak")) { Copy-Item $worldPath "$worldPath.pre-login.bak" }
$world = [IO.File]::ReadAllText($worldPath, $utf8)
$descPattern = '"description"\s*:\s*"(?:[^"\\]|\\.)*"'
$themePattern = '"joinTheme"\s*:\s*"[^"]*"'
if ($world -notmatch $descPattern -or $world -notmatch $themePattern) { throw 'world.json: description/joinTheme not found.' }
$world = [regex]::Replace($world, $themePattern, '"joinTheme": "default"')
$world = [regex]::Replace($world, $descPattern, '"description": "<div class=\"et-login-marker\"></div>"')
[IO.File]::WriteAllText($worldPath, $world, $utf8)
Write-Host "[ok] world.json updated: $worldPath"

# 3. options.json (idioma global)
if (Test-Path $ConfigPath) {
  $opts = [IO.File]::ReadAllText($ConfigPath, $utf8)
  if ($opts -match '"language"\s*:\s*"en\.endless-tower"') {
    $opts = [regex]::Replace($opts, '"language"\s*:\s*"en\.endless-tower"', '"language": "en.core"')
    [IO.File]::WriteAllText($ConfigPath, $opts, $utf8)
    Write-Host "[ok] options.json language reverted to en.core"
  }
}

Write-Host "`nPronto! Inicie o Foundry no FLC e abra /join (Ctrl+Shift+R)."
