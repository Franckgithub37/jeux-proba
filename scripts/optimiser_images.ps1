# Allege les images generees pour le web : l'original (1024 px, environ 1 Mo) est range dans
# images/generated/hd/, et une version reduite (fond transparent conserve) prend sa place.
# A relancer apres chaque generation : powershell -ExecutionPolicy Bypass -File scripts\optimiser_images.ps1
Add-Type -AssemblyName System.Drawing
$dossier = Join-Path (Split-Path -Parent $PSScriptRoot) "images\generated"
$hd = Join-Path $dossier "hd"
New-Item -ItemType Directory -Force $hd | Out-Null
$grandes = @{ "perroquet" = 640; "boite_calmidol" = 420; "carnet_stylo" = 420; "de20" = 384; "entonnoir" = 384; "loupe" = 384; "main_droite" = 768; "main_gauche" = 768 }
foreach ($f in Get-ChildItem $dossier -Filter *.png) {
  $nom = $f.BaseName
  $cible = if ($grandes.ContainsKey($nom)) { $grandes[$nom] } else { 256 }
  $src = New-Object System.Drawing.Bitmap($f.FullName)
  if ($src.Width -le $cible) { $src.Dispose(); continue }
  $h = [int]($src.Height * $cible / $src.Width)
  $dst = New-Object System.Drawing.Bitmap($cible, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $attr = New-Object System.Drawing.Imaging.ImageAttributes
  $attr.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $cible, $h)), 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel, $attr)
  $g.Dispose(); $src.Dispose()
  Copy-Item $f.FullName (Join-Path $hd $f.Name) -Force
  $dst.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png); $dst.Dispose()
  "$nom : ${cible}x$h, " + [int]((Get-Item $f.FullName).Length / 1024) + " Ko"
}
