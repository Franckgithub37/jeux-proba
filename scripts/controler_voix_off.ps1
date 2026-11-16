<#
Controle les voix off generees : chaque fichier WAV du dossier audio est transcrit par Gemini, puis compare au texte du script.
Signale les pistes tronquees, les phrases manquantes et les indications entre crochets lues a voix haute.
  powershell -ExecutionPolicy Bypass -File scripts\controler_voix_off.ps1
  powershell -ExecutionPolicy Bypass -File scripts\controler_voix_off.ps1 -Seulement vo_c1a,vo_c1b
#>
param([string[]]$Seulement, [string]$Modele = "gemini-3.5-flash")
$ErrorActionPreference = "Stop"
if ($Seulement) { $Seulement = @($Seulement | ForEach-Object { $_ -split "," } | ForEach-Object { $_.Trim() } | Where-Object { $_ }) }
$enc = New-Object System.Text.UTF8Encoding($false)
$racine = Split-Path -Parent $PSScriptRoot
$cle = [Environment]::GetEnvironmentVariable("GEMINI_API_KEY", "User")
if (-not $cle) { throw "Cle absente : lancez scripts\saisir_cles.ps1." }
$md = ([IO.File]::ReadAllText((Join-Path $racine "VOIX_OFF_SCRIPT.md"), $enc)) -replace "`r`n", "`n"
$textes = @{}
foreach ($m in [regex]::Matches($md, '(?ms)^#{1,6}\s+[^\n]*`[^`\n]*?([A-Za-z0-9_\-]+)\.[A-Za-z0-9]{2,4}`[^\n]*\n.*?```\n(.*?)\n```')) { $textes[$m.Groups[1].Value] = $m.Groups[2].Value }
function Net([string]$t) { return (($t -replace '\[[^\]]*\]', ' ').ToLower() -replace "[^a-z0-9àâäçéèêëîïôöùûüœ' ]", ' ' -replace '\s+', ' ').Trim() }
foreach ($f in Get-ChildItem (Join-Path $racine "audio") -Filter "vo_*.wav" | Sort-Object Name) {
  $nom = $f.BaseName
  if ($Seulement -and ($Seulement -notcontains $nom)) { continue }
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($f.FullName))
  $corps = @{ contents = @(@{ parts = @(@{ text = "Transcris mot pour mot cet enregistrement en français. Réponds uniquement avec la transcription, sans commentaire." }, @{ inlineData = @{ mimeType = "audio/wav"; data = $b64 } }) }) } | ConvertTo-Json -Depth 10 -Compress
  try {
    $r = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/${Modele}:generateContent" -Method Post -Headers @{ "x-goog-api-key" = $cle } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($corps)) -TimeoutSec 240
    $tr = ($r.candidates[0].content.parts | ForEach-Object { $_.text }) -join " "
  } catch { "$nom : transcription impossible - $($_.Exception.Message)"; continue }
  $attendu = Net $textes[$nom]; $obtenu = Net $tr
  $motsA = $attendu -split ' '; $motsO = $obtenu -split ' '
  $fin = ($motsA | Select-Object -Last 4) -join ' '; $finO = ($motsO | Select-Object -Last 4) -join ' '
  $manq = @($motsA | Where-Object { $_.Length -gt 3 -and ($motsO -notcontains $_) })
  $etat = if ($fin -eq $finO -and $manq.Count -le 2) { "OK" } elseif ($fin -ne $finO) { "FIN DIFFERENTE" } else { "MOTS MANQUANTS" }
  "$nom : $etat - " + $motsO.Count + " mots entendus / " + $motsA.Count + " attendus" + $(if ($manq.Count) { " - absents : " + (($manq | Select-Object -First 8) -join ', ') } else { "" })
  if ($etat -ne "OK") { "   entendu : " + $tr.Trim() }
  Start-Sleep -Seconds 2
}
