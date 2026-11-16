<#
Genere un PNG detoure (fond transparent) dans images/generated/ avec l'API Images d'OpenAI,
en joignant une ou plusieurs images de reference de images/ pour rester dans le style valide.

La cle n'est JAMAIS ecrite ici : elle est lue dans la variable d'environnement OPENAI_API_KEY.

Exemples :
  # un seul asset
  powershell -ExecutionPolicy Bypass -File scripts\generate_asset.ps1 -Sujet "a glossy orange 20-sided die" -Sortie de20
  # tous les assets de scripts\assets.json qui n'existent pas encore
  powershell -ExecutionPolicy Bypass -File scripts\generate_asset.ps1 -Tous
  # refaire un asset deja genere
  powershell -ExecutionPolicy Bypass -File scripts\generate_asset.ps1 -Tous -Seulement perroquet -Refaire
#>
param(
  [string]$Sujet,
  [string]$Sortie,
  [string[]]$Refs = @("ref_03_chapitre1_ia_a_tout_lu.png"),
  [string]$Taille = "1024x1024",
  [string]$Qualite = "medium",
  [string]$Modele = "gpt-image-2.5-sunburst",
  [switch]$Tous,
  [string[]]$Seulement,
  [switch]$Refaire
)
$ErrorActionPreference = "Stop"
$racine = Split-Path -Parent $PSScriptRoot
$dossierRefs = Join-Path $racine "images"
$dossierSortie = Join-Path $racine "images\generated"
New-Item -ItemType Directory -Force $dossierSortie | Out-Null

# Prompt de style fixe : seul le sujet change d'un appel a l'autre.
$STYLE = @'
Create ONE isolated illustration on a fully transparent background, in exactly the same visual style as the attached reference image(s): glossy 3D-cartoon user-interface illustration, soft rounded shapes, smooth gradients, subtle inner highlights and a soft rim light, clean crisp edges, friendly look for a medical e-learning game.
Palette only: night blue #01233F, deep blue #0C497B, bright blue #29ABE2, cyan #74D2FA, orange #FF8000, cream #F8F4E8, white.
Rules: transparent background, no frame, no card, no ground shadow, no extra objects, no text unless the subject explicitly asks for it. The subject is centered, fully visible, with a small empty margin all around, nothing cropped. Do not reproduce the layout of the reference: only its style.
Subject:
'@

$cle = $env:OPENAI_API_KEY
if (-not $cle) { $cle = [Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "User") }
if (-not $cle) { throw "Variable d'environnement OPENAI_API_KEY absente. Voir scripts\LISEZMOI.md." }

Add-Type -AssemblyName System.Net.Http
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [TimeSpan]::FromMinutes(5)
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $cle)

function Generer([string]$sujet, [string]$sortie, [string[]]$refs, [string]$taille) {
  $cible = Join-Path $dossierSortie ($sortie + ".png")
  if ((Test-Path $cible) -and -not $Refaire) { "deja present : $sortie.png (ajouter -Refaire pour le regenerer)"; return }
  $form = New-Object System.Net.Http.MultipartFormDataContent
  $champs = @{ model = $Modele; prompt = ($STYLE + " " + $sujet); size = $taille; quality = $Qualite; background = "transparent"; output_format = "png"; n = "1" }
  foreach ($k in $champs.Keys) { $form.Add((New-Object System.Net.Http.StringContent($champs[$k])), $k) }
  foreach ($r in $refs) {
    $chemin = Join-Path $dossierRefs $r
    if (-not (Test-Path $chemin)) { throw "Image de reference introuvable : $chemin" }
    $octets = New-Object System.Net.Http.ByteArrayContent(, [System.IO.File]::ReadAllBytes($chemin))
    $octets.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue("image/png")
    $form.Add($octets, "image[]", $r)
  }
  $rep = $client.PostAsync("https://api.openai.com/v1/images/edits", $form).Result
  $corps = $rep.Content.ReadAsStringAsync().Result
  if (-not $rep.IsSuccessStatusCode) { "ECHEC $sortie : HTTP " + [int]$rep.StatusCode + " " + $corps.Substring(0, [Math]::Min(400, $corps.Length)); return }
  $b64 = ($corps | ConvertFrom-Json).data[0].b64_json
  [System.IO.File]::WriteAllBytes($cible, [Convert]::FromBase64String($b64))
  "ok : images\generated\$sortie.png (" + [int]((Get-Item $cible).Length / 1024) + " Ko)"
}

if ($Tous) {
  $liste = Get-Content (Join-Path $PSScriptRoot "assets.json") -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($a in $liste) {
    if ($Seulement -and ($Seulement -notcontains $a.sortie)) { continue }
    $t = if ($a.taille) { $a.taille } else { $Taille }
    $r = if ($a.refs) { [string[]]$a.refs } else { $Refs }
    Generer $a.sujet $a.sortie $r $t
  }
} else {
  if (-not $Sujet -or -not $Sortie) { throw "Indiquer -Sujet et -Sortie, ou bien -Tous." }
  Generer $Sujet $Sortie $Refs $Taille
}
