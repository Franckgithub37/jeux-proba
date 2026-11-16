# Fenetre de saisie : cle API Gemini + dossier OneDrive de destination des voix off.
# La cle est enregistree dans la variable d'environnement utilisateur GEMINI_API_KEY (jamais dans un fichier du projet).
# Le dossier est enregistre dans la variable VOIX_OFF_DOSSIER (chemin a partir de la racine de votre OneDrive).
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$racine = $env:OneDrive
if (-not $racine) { $racine = $env:OneDriveCommercial }
$defaut = [Environment]::GetEnvironmentVariable("VOIX_OFF_DOSSIER", "User")
if (-not $defaut) { $defaut = "Documents/Cowork/Jeu probabilité/audio" }

$f = New-Object System.Windows.Forms.Form
$f.Text = "Voix off - clé Gemini et dossier OneDrive"
$f.Size = New-Object System.Drawing.Size(600, 340)
$f.StartPosition = "CenterScreen"; $f.TopMost = $true; $f.FormBorderStyle = "FixedDialog"; $f.MaximizeBox = $false; $f.MinimizeBox = $false

$l1 = New-Object System.Windows.Forms.Label
$l1.Text = "Clé API Gemini (collez-la ici, elle reste sur cet ordinateur) :"
$l1.Location = New-Object System.Drawing.Point(16, 14); $l1.Size = New-Object System.Drawing.Size(560, 20)
$t1 = New-Object System.Windows.Forms.TextBox
$t1.Location = New-Object System.Drawing.Point(16, 38); $t1.Size = New-Object System.Drawing.Size(555, 24); $t1.UseSystemPasswordChar = $true

$l2 = New-Object System.Windows.Forms.Label
$l2.Text = "Dossier OneDrive de destination des fichiers audio :"
$l2.Location = New-Object System.Drawing.Point(16, 80); $l2.Size = New-Object System.Drawing.Size(560, 20)
$t2 = New-Object System.Windows.Forms.TextBox
$t2.Location = New-Object System.Drawing.Point(16, 104); $t2.Size = New-Object System.Drawing.Size(555, 24); $t2.Text = $defaut

$l3 = New-Object System.Windows.Forms.Label
$l3.Text = "Chemin à partir de la racine de votre OneDrive, avec des barres obliques.`nExemple : Voix off/Mon module  (le dossier est créé s'il n'existe pas).`nRacine détectée sur cet ordinateur : $racine"
$l3.Location = New-Object System.Drawing.Point(16, 136); $l3.Size = New-Object System.Drawing.Size(560, 60)
$l3.ForeColor = [System.Drawing.Color]::DimGray

$l4 = New-Object System.Windows.Forms.Label
$l4.Text = "Laissez la clé vide pour ne pas la modifier."
$l4.Location = New-Object System.Drawing.Point(16, 204); $l4.Size = New-Object System.Drawing.Size(560, 20)
$l4.ForeColor = [System.Drawing.Color]::DimGray

$ok = New-Object System.Windows.Forms.Button
$ok.Text = "Enregistrer"; $ok.Location = New-Object System.Drawing.Point(366, 250); $ok.Size = New-Object System.Drawing.Size(100, 32); $ok.DialogResult = "OK"
$ko = New-Object System.Windows.Forms.Button
$ko.Text = "Annuler"; $ko.Location = New-Object System.Drawing.Point(472, 250); $ko.Size = New-Object System.Drawing.Size(100, 32); $ko.DialogResult = "Cancel"
$f.Controls.AddRange(@($l1, $t1, $l2, $t2, $l3, $l4, $ok, $ko)); $f.AcceptButton = $ok; $f.CancelButton = $ko
$f.Add_Shown({ $f.Activate(); $t1.Focus() })
$r = $f.ShowDialog()
if ($r -ne "OK") { "ANNULE"; return }
$cle = $t1.Text.Trim(); $dossier = ($t2.Text.Trim() -replace "\\", "/").Trim("/")
$msg = @()
if ($cle.Length -ge 20) { [Environment]::SetEnvironmentVariable("GEMINI_API_KEY", $cle, "User"); $msg += "CLE ENREGISTREE (" + $cle.Length + " caracteres)" }
elseif ($cle.Length -gt 0) { $msg += "CLE TROP COURTE, non enregistree" }
else { $existe = [Environment]::GetEnvironmentVariable("GEMINI_API_KEY", "User"); $msg += $(if ($existe) { "CLE INCHANGEE (deja presente)" } else { "AUCUNE CLE" }) }
if ($dossier) { [Environment]::SetEnvironmentVariable("VOIX_OFF_DOSSIER", $dossier, "User"); $msg += "DOSSIER : $dossier" } else { $msg += "DOSSIER VIDE" }
$msg
