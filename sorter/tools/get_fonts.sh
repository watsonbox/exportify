#!/usr/bin/env bash
# Downloads the Google Fonts (OFL) used by tools/covers.py into ./fonts
set -e; mkdir -p fonts; cd fonts
B=https://raw.githubusercontent.com/google/fonts/main
for f in ofl/bebasneue/BebasNeue-Regular.ttf ofl/anton/Anton-Regular.ttf ofl/pacifico/Pacifico-Regular.ttf \
 "ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf" "ofl/playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf" \
 ofl/monoton/Monoton-Regular.ttf ofl/rubikmonoone/RubikMonoOne-Regular.ttf ofl/archivoblack/ArchivoBlack-Regular.ttf \
 "ofl/caveat/Caveat%5Bwght%5D.ttf" ofl/dmserifdisplay/DMSerifDisplay-Regular.ttf ofl/dmserifdisplay/DMSerifDisplay-Italic.ttf \
 ofl/rye/Rye-Regular.ttf ofl/yatraone/YatraOne-Regular.ttf ofl/vt323/VT323-Regular.ttf ofl/italiana/Italiana-Regular.ttf \
 "ofl/unbounded/Unbounded%5Bwght%5D.ttf" ofl/shrikhand/Shrikhand-Regular.ttf ofl/abrilfatface/AbrilFatface-Regular.ttf \
 ofl/bungee/Bungee-Regular.ttf ofl/lobster/Lobster-Regular.ttf ofl/righteous/Righteous-Regular.ttf \
 ofl/bowlbyonesc/BowlbyOneSC-Regular.ttf ofl/instrumentserif/InstrumentSerif-Italic.ttf; do
  n=$(basename "$f" | sed 's/%5B.*%5D//'); curl -sfL "$B/$f" -o "$n" && echo "ok $n"
done
