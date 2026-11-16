<#
Génère les voix off avec l'API Gemini à partir d'un script Markdown (voir VOIX_OFF_SCRIPT.md) et dépose les WAV dans le dossier audio.
La clé est lue dans la variable GEMINI_API_KEY et le dossier dans VOIX_OFF_DOSSIER (enregistrés par scripts\saisir_cles.ps1).

Chaque piste passe par trois étapes :
  1. génération, avec la même voix et les mêmes consignes de ton pour toutes les pistes ;
  2. contrôle de la hauteur de voix (F0) : une piste lue par une autre voix, ou dont une phrase part dans l'aigu, est refaite ;
  3. traitement : silences de début et de fin fixes, même niveau sonore partout, vitesse (environ 14 % plus rapide que l'enregistrement d'origine par défaut, sans changer la hauteur, avec un débit égalisé d'une piste à l'autre).
L'enregistrement d'origine est gardé dans le sous-dossier "brut", la piste traitée est écrite dans le dossier lui-même.

Exemples :
  powershell -ExecutionPolicy Bypass -File scripts\generer_voix_off.ps1 -Refaire
  powershell -ExecutionPolicy Bypass -File scripts\generer_voix_off.ps1 -Seulement vo_intro,vo_n1 -Refaire
  powershell -ExecutionPolicy Bypass -File scripts\generer_voix_off.ps1 -Retraiter -Tempo 1.15      (sans appeler Gemini)
  powershell -ExecutionPolicy Bypass -File scripts\generer_voix_off.ps1 -Extrait -Voix Charon
#>
param(
  [string]$Script,
  [string]$Modele = "gemini-2.5-flash-preview-tts",
  [string]$Voix = "Puck",
  [string]$Dossier,
  [string[]]$Seulement,
  [switch]$Refaire,
  [switch]$Retraiter,
  [switch]$RetirerBalises,
  [switch]$Extrait,
  [switch]$SansControle,
  [double]$Tempo = 1.145,
  [double]$DebitRef = 19.5,
  [double]$TempoMin = 1.07,
  [double]$TempoMax = 1.21,
  [double]$Niveau = -19,
  [double]$Tete = 0.15,
  [double]$Queue = 0.35,
  [int]$Essais = 4,
  [double]$F0Min = 88,
  [double]$F0Max = 125,
  [double]$F0Phrase = 150,
  [double]$Temperature = -1,
  [int]$Pause = 3
)
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "audio_outils.ps1")
if ($Seulement) { $Seulement = @($Seulement | ForEach-Object { $_ -split "," } | ForEach-Object { $_.Trim() } | Where-Object { $_ }) }
$enc = New-Object System.Text.UTF8Encoding($false)
$racine = Split-Path -Parent $PSScriptRoot
if (-not $Script) { $Script = Join-Path $racine "VOIX_OFF_SCRIPT.md" }
$cle = $env:GEMINI_API_KEY
if (-not $cle) { $cle = [Environment]::GetEnvironmentVariable("GEMINI_API_KEY", "User") }
if (-not $cle -and -not $Retraiter) { throw "Clé absente : lancez scripts\saisir_cles.ps1 pour la saisir." }
if (-not $Dossier) { $Dossier = $env:VOIX_OFF_DOSSIER; if (-not $Dossier) { $Dossier = [Environment]::GetEnvironmentVariable("VOIX_OFF_DOSSIER", "User") } }
$base = $env:OneDrive; if (-not $base) { $base = $env:OneDriveCommercial }
if (-not $Dossier) { $Dossier = "Documents/Cowork/Jeu probabilité/audio" }
$sortie = if ([System.IO.Path]::IsPathRooted($Dossier)) { $Dossier } else { Join-Path $base ($Dossier -replace "/", "\") }
$brut = Join-Path $sortie "brut"
New-Item -ItemType Directory -Force $sortie | Out-Null; New-Item -ItemType Directory -Force $brut | Out-Null

function Decouper([string]$md) {
  $md = $md.TrimStart([char]0xFEFF) -replace "`r`n", "`n"
  $lignes = $md -split "`n"; $q = @()
  foreach ($l in $lignes) { if ($l -match '^\s*>') { $q += ($l -replace '^\s*>\s?', '').Trim() } elseif ($q.Count) { break } }
  $segs = @(); $cur = $null; $dans = $false; $bloc = @()
  foreach ($l in $lignes) {
    if ($l -match '^\s*```') { if ($dans) { if ($cur -and -not $cur.texte) { $cur.texte = ($bloc -join "`n").Trim() }; $bloc = @(); $dans = $false } else { $dans = $true; $bloc = @() }; continue }
    if ($dans) { $bloc += $l; continue }
    if ($l -match '^#{1,6}\s+(.*)$') {
      $h = $Matches[1]
      if ($h -match '`([^`]+\.[A-Za-z0-9]{2,4})`') { $nom = ($Matches[1] -split '/')[-1] -replace '\.[^.]+$', ''; $cur = [pscustomobject]@{ nom = $nom; titre = ($h -replace '`[^`]+`', '').Trim(' ', '-', ':', '.', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'); ton = ''; voix = ''; texte = '' }; $segs += $cur } else { $cur = $null }
      continue
    }
    if ($cur -and -not $cur.texte) {
      if ($l -match '^\s*Ton\s*:\s*(.+)$') { $cur.ton = $Matches[1].Trim() }
      if ($l -match '^\s*Voix\s*:\s*([A-Za-z]+)') { $cur.voix = $Matches[1].Trim() }
    }
  }
  return @{ style = ($q -join "`n").Trim(); segs = @($segs | Where-Object { $_.texte }) }
}

function SansBalises([string]$t) { return (($t -replace '\[[^\]]*\]', '') -replace '[ \t]{2,}', ' ' -replace ' +([.,;:!?])', '$1').Trim() }

function Generer([string]$texte, [string]$ton, [string]$voix, [string]$style, [string]$cible) {
  $t = if ($RetirerBalises) { SansBalises ($texte -replace '\[[^\]]*pause[^\]]*\]', '...') } else { $texte }
  $notes = @(); if ($style) { $notes += $style }; if ($ton) { $notes += "Ton de ce passage : $ton" }
  $prompt = "# CONSIGNES DE MISE EN VOIX`n" + ($notes -join "`n") + "`n`n# TEXTE À LIRE (en français, mot pour mot, sans rien ajouter)`n" + $t
  $gen = @{ responseModalities = @("AUDIO"); speechConfig = @{ voiceConfig = @{ prebuiltVoiceConfig = @{ voiceName = $voix } } } }
  if ($Temperature -ge 0) { $gen.temperature = $Temperature }
  $corps = @{ contents = @(@{ parts = @(@{ text = $prompt }) }); generationConfig = $gen } | ConvertTo-Json -Depth 10 -Compress
  $url = "https://generativelanguage.googleapis.com/v1beta/models/${Modele}:generateContent"
  for ($essai = 1; $essai -le 3; $essai++) {
    try {
      $r = Invoke-RestMethod -Uri $url -Method Post -Headers @{ "x-goog-api-key" = $cle } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($corps)) -TimeoutSec 240
      $p = $r.candidates[0].content.parts | Where-Object { $_.inlineData } | Select-Object -First 1
      if (-not $p) { throw "Réponse sans audio : " + ($r | ConvertTo-Json -Depth 4 -Compress).Substring(0, 300) }
      $octets = [Convert]::FromBase64String($p.inlineData.data); $rate = 24000
      if ($p.inlineData.mimeType -match 'rate=(\d+)') { $rate = [int]$Matches[1] }
      if ([Text.Encoding]::ASCII.GetString($octets, 0, 4) -eq "RIFF") { [IO.File]::WriteAllBytes($cible, $octets); return }
      $pcm = New-Object 'int16[]' ($octets.Length / 2); [Buffer]::BlockCopy($octets, 0, $pcm, 0, $pcm.Length * 2); [Son]::Ecrire($cible, $pcm, $rate); return
    } catch {
      $m = $_.Exception.Message; if ($_.ErrorDetails.Message) { $m += " " + $_.ErrorDetails.Message }
      if ($essai -eq 3 -or $m -match '\b(400|401|403|404)\b') { throw $m.Substring(0, [Math]::Min(500, $m.Length)) }
      Start-Sleep -Seconds $(if ($m -match "429") { 35 * $essai } else { 8 * $essai })
    }
  }
}

# Hauteur de voix d'un enregistrement : médiane de la piste et phrase la plus aiguë. Le score est nul quand tout est dans les bornes.
function Evaluer([string]$chemin, [string]$texte) {
  $rate = 0; $x = [Son]::Lire($chemin, [ref]$rate); $m = [Son]::Mesurer($x, $rate); $pire = 0
  foreach ($s in $m.Segs) { if (($s.Fin - $s.Debut) -ge 0.8 -and $s.F0 -gt $pire) { $pire = $s.F0 } }
  $score = [math]::Max(0, $F0Min - $m.F0) + [math]::Max(0, $m.F0 - $F0Max) + [math]::Max(0, $pire - $F0Phrase)
  $car = (SansBalises $texte).Length
  return [pscustomobject]@{ f0 = [math]::Round($m.F0); pire = [math]::Round($pire); db = [math]::Round($m.Db, 1); duree = [math]::Round($m.Duree, 1); parole = $m.Parole; debit = [math]::Round($car / [math]::Max(0.5, $m.Parole), 1); score = $score }
}

# Vitesse appliquée à une piste : la vitesse générale, corrigée à moitié vers le débit de référence (une piste lue lentement est
# un peu plus accélérée, une piste lue vite un peu moins), pour que le rythme reste le même d'une piste à l'autre.
# Les pistes très courtes gardent la vitesse générale : leur débit se mesure mal.
function VitessePour($e) {
  if ($DebitRef -le 0 -or $e.parole -lt 4.5 -or $e.debit -le 0) { return $Tempo }
  return [math]::Round([math]::Max($TempoMin, [math]::Min($TempoMax, $Tempo * [math]::Sqrt($DebitRef / $e.debit))), 3)
}

function Traiter([string]$source, [string]$cible, [double]$vitesse) {
  $rate = 0; $x = [Son]::Lire($source, [ref]$rate); $y = [Son]::Traiter($x, $rate, $vitesse, $Niveau, $Tete, $Queue); [Son]::Ecrire($cible, $y, $rate)
  return [math]::Round($y.Length / $rate, 1)
}

if ($Extrait) {
  $cible = Join-Path $sortie "extrait_$Voix.wav"
  Generer "Bonjour, voici un extrait de cette voix. [pause courte] Est-elle faite pour votre module ?" "" $Voix "" $cible
  "extrait : $cible (voix $Voix, $Modele)"; return
}
$r = Decouper ([IO.File]::ReadAllText($Script, $enc))
"Script : $Script ($($r.segs.Count) pistes) - modèle $Modele - vitesse x$Tempo - destination $sortie"
$ok = 0; $ko = 0; $rapport = @()
foreach ($s in $r.segs) {
  if ($Seulement -and ($Seulement -notcontains $s.nom)) { continue }
  $cible = Join-Path $sortie ($s.nom + ".wav"); $source = Join-Path $brut ($s.nom + ".wav")
  if ($Retraiter) {
    if (-not (Test-Path $source)) { "pas d'enregistrement brut : $($s.nom)"; continue }
    $e = Evaluer $source $s.texte; $vt = VitessePour $e; $d = Traiter $source $cible $vt; "retraité : $($s.nom).wav - $d s - F0 $($e.f0) Hz - débit d'origine $($e.debit) car/s - vitesse x$vt"; $ok++; continue
  }
  if ((Test-Path $cible) -and -not $Refaire) { "déjà présent : $($s.nom).wav (ajouter -Refaire pour le régénérer)"; continue }
  $v = if ($PSBoundParameters.ContainsKey('Voix')) { $Voix } elseif ($s.voix) { $s.voix } else { $Voix }
  try {
    $meilleur = $null; $tmp = Join-Path $brut ($s.nom + ".essai.wav")
    for ($n = 1; $n -le $Essais; $n++) {
      Generer $s.texte $s.ton $v $r.style $tmp; $e = Evaluer $tmp $s.texte
      if (-not $meilleur -or $e.score -lt $meilleur.score) { Copy-Item $tmp $source -Force; $meilleur = $e }
      if ($SansControle -or $e.score -eq 0) { break }
      "   essai $n écarté : $($s.nom) - F0 $($e.f0) Hz, phrase la plus aiguë $($e.pire) Hz"
      Start-Sleep -Seconds $Pause
    }
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    $vt = VitessePour $meilleur; $d = Traiter $source $cible $vt
    $etat = if ($meilleur.score -eq 0 -or $SansControle) { "ok" } else { "A ECOUTER" }
    $l = "$($s.nom).wav : $etat - $d s - voix $v - F0 $($meilleur.f0) Hz (phrase la plus aiguë $($meilleur.pire) Hz) - niveau d'origine $($meilleur.db) dB - débit d'origine $($meilleur.debit) car/s - vitesse x$vt"
    $l; $rapport += $l; $ok++
  } catch { "ECHEC $($s.nom) : $_"; $rapport += "$($s.nom).wav : ECHEC"; $ko++ }
  Start-Sleep -Seconds $Pause
}
if (-not $Retraiter) { [IO.File]::WriteAllLines((Join-Path $sortie "rapport_voix_off.txt"), @("Voix off générées : $ok, échecs : $ko", "Modèle : $Modele - vitesse x$Tempo - niveau $Niveau dB", "") + $rapport, $enc) }
"Terminé : $ok piste(s), $ko échec(s)."
