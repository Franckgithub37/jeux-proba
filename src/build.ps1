# Assemble index.html a partir des trois morceaux de src/ (entete + scene 3D + deroule),
# puis artifact.html : la meme page sans les balises html/head/body, pour la publication en artefact claude.ai
$enc = New-Object System.Text.UTF8Encoding($false)
$here = $PSScriptRoot
$racine = Split-Path -Parent $here
$parts = "head.html","middle.js","tail.js" | ForEach-Object { [System.IO.File]::ReadAllText((Join-Path $here $_), $enc) }
$page = $parts -join ""
[System.IO.File]::WriteAllText((Join-Path $racine "index.html"), $page, $enc)
"index.html : " + (Get-Item (Join-Path $racine "index.html")).Length + " octets"
$a = $page
foreach ($b in '<!DOCTYPE html>', '<html lang="fr">', '<head>', '</head>', '<body>', '</body>', '</html>', '<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">') { $a = $a.Replace($b, '') }
[System.IO.File]::WriteAllText((Join-Path $racine "artifact.html"), $a.TrimStart(), $enc)
