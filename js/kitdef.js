/* Promotion kit definitions shared by every concept: the sizes (banner, standee, poster 1.5×2 ft, A4, A5, Instagram, Facebook) and the four
   vibrant gradient colour sets (fluorescent accents allowed).  Pure data — used by js/famart.js and by every future concept. */
window.KIT={
  SIZES:[
    {id:"standee",label:"Standee · 2.5 × 6 ft",w:1200,h:2880,fam:"stand"},
    {id:"banner",label:"Banner · 3:1 (e.g. 9 × 3 ft)",w:3600,h:1200,fam:"banner"},
    {id:"poster",label:"Poster · 1.5 × 2 ft",w:1200,h:1600,fam:"poster"},
    {id:"a4",label:"Poster · A4",w:1240,h:1754,fam:"poster"},
    {id:"a5",label:"Poster · A5",w:874,h:1240,fam:"poster"},
    {id:"ig",label:"Instagram post · square 1080",w:1080,h:1080,fam:"square"},
    {id:"fb",label:"Facebook post · 1200 × 630",w:1200,h:630,fam:"wide"}],
  PALS:[
    {id:"gold",name:"Golden sunset",bg:["#140A26","#52103F","#B5352C","#F59E2B"],acc:["#FFF3B0","#F7C948","#E0922B"],ink:"#FFF6E0",qr:["#3A0F2B","#7A1F3D"],rib:"#E53935"},
    {id:"lime",name:"Neon lime forest",bg:["#021F1B","#045A44","#0B8F62","#B6F23A"],acc:["#F6FFC2","#D7FF3F","#8FD400"],ink:"#F4FFF0",qr:["#03352B","#0A6B4F"],rib:"#FF3D00"},
    {id:"pink",name:"Electric pink–violet",bg:["#11033A","#4A0FB5","#E6199F","#FF6A3D"],acc:["#FFF59B","#FFE145","#FFB000"],ink:"#FFFFFF",qr:["#2A0A66","#B0148A"],rib:"#00B8A3"},
    {id:"aqua",name:"Aqua neon",bg:["#00122E","#0A3FA8","#0090C0","#39FFB6"],acc:["#FFFBB0","#FFEE3B","#FFC400"],ink:"#FFFFFF",qr:["#00265C","#0A6DB5"],rib:"#FF2E63"}]};
