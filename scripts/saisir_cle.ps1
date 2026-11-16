# Ouvre une petite fenetre pour coller la cle OpenAI. La cle est enregistree dans la variable
# d'environnement utilisateur OPENAI_API_KEY : elle n'est ni affichee, ni ecrite dans un fichier du projet.
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$f = New-Object System.Windows.Forms.Form
$f.Text = "Le Perroquet de garde - cle OpenAI"
$f.Size = New-Object System.Drawing.Size(520, 210)
$f.StartPosition = "CenterScreen"; $f.TopMost = $true; $f.FormBorderStyle = "FixedDialog"; $f.MaximizeBox = $false; $f.MinimizeBox = $false
$l = New-Object System.Windows.Forms.Label
$l.Text = "Collez votre cle API OpenAI ci-dessous, puis cliquez sur Enregistrer.`nElle reste sur cet ordinateur et n'apparait pas dans la conversation."
$l.Location = New-Object System.Drawing.Point(16, 14); $l.Size = New-Object System.Drawing.Size(480, 44)
$t = New-Object System.Windows.Forms.TextBox
$t.Location = New-Object System.Drawing.Point(16, 66); $t.Size = New-Object System.Drawing.Size(470, 24); $t.UseSystemPasswordChar = $true
$ok = New-Object System.Windows.Forms.Button
$ok.Text = "Enregistrer"; $ok.Location = New-Object System.Drawing.Point(286, 112); $ok.Size = New-Object System.Drawing.Size(100, 32); $ok.DialogResult = "OK"
$ko = New-Object System.Windows.Forms.Button
$ko.Text = "Annuler"; $ko.Location = New-Object System.Drawing.Point(392, 112); $ko.Size = New-Object System.Drawing.Size(94, 32); $ko.DialogResult = "Cancel"
$f.Controls.AddRange(@($l, $t, $ok, $ko)); $f.AcceptButton = $ok; $f.CancelButton = $ko
$f.Add_Shown({ $f.Activate(); $t.Focus() })
$r = $f.ShowDialog()
$v = $t.Text.Trim()
if ($r -eq "OK" -and $v.Length -ge 20) {
  [Environment]::SetEnvironmentVariable("OPENAI_API_KEY", $v, "User")
  "CLE ENREGISTREE (" + $v.Length + " caracteres)"
} elseif ($r -eq "OK") { "CLE TROP COURTE, rien n'a ete enregistre" } else { "ANNULE" }
