<#
Mesure les voix off d'un dossier : hauteur de voix (F0, en Hz), niveau sonore (dB) et debit, piste par piste et phrase par phrase.
Sert a reperer une piste lue par une autre voix, une phrase dite sur un autre ton ou un ecart de volume.
  powershell -ExecutionPolicy Bypass -File scripts\mesurer_voix_off.ps1
  powershell -ExecutionPolicy Bypass -File scripts\mesurer_voix_off.ps1 -Dossier audio\brut -Detail
#>
param([string]$Dossier, [switch]$Detail, [string]$Filtre = "*.wav")
$ErrorActionPreference = "Stop"
$racine = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "audio_outils.ps1")
if (-not $Dossier) { $Dossier = Join-Path $racine "audio" } elseif (-not [IO.Path]::IsPathRooted($Dossier)) { $Dossier = Join-Path $racine $Dossier }
$lignes = @()
foreach ($f in Get-ChildItem $Dossier -Filter $Filtre | Sort-Object Name) {
  $rate = 0; $x = [Son]::Lire($f.FullName, [ref]$rate); $m = [Son]::Mesurer($x, $rate)
  $ecart = 0; foreach ($s in $m.Segs) { if ($s.F0 -gt 0 -and $m.F0 -gt 0 -and ($s.Fin - $s.Debut) -ge 0.6) { $e = [math]::Abs($s.F0 / $m.F0 - 1) * 100; if ($e -gt $ecart) { $ecart = $e } } }
  $dbs = @($m.Segs | Where-Object { ($_.Fin - $_.Debut) -ge 0.6 } | ForEach-Object { $_.Db }); $dyn = if ($dbs.Count) { ($dbs | Measure-Object -Maximum).Maximum - ($dbs | Measure-Object -Minimum).Minimum } else { 0 }
  $lignes += [pscustomobject]@{ Piste = $f.BaseName; Duree = [math]::Round($m.Duree, 1); Parole = [math]::Round($m.Parole, 1); F0 = [math]::Round($m.F0); Bas = [math]::Round($m.F0bas); Haut = [math]::Round($m.F0haut); EcartF0 = [math]::Round($ecart); dB = [math]::Round($m.Db, 1); EcartdB = [math]::Round($dyn, 1); Phrases = $m.Segs.Count }
  if ($Detail) { "--- $($f.BaseName)"; foreach ($s in $m.Segs) { "   {0,5:N1} - {1,5:N1} s   F0 {2,4:N0} Hz   {3,6:N1} dB" -f $s.Debut, $s.Fin, $s.F0, $s.Db } }
}
$lignes | Format-Table -AutoSize | Out-String -Width 200
