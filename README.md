Installera beroenden: I din terminal, kör följande kommando för att installera alla nödvändiga paket från node_modules:

bash
Kopiera kod
npm install
Starta servern: För att starta servern, kör följande kommando:

bash
Kopiera kod
node server.js
Testa API:et med PowerShell: Öppna PowerShell och kör följande curl-kommando för att skicka en POST-förfrågan till servern:

powershell
Kopiera kod
Invoke-RestMethod -Uri http://localhost:5000/predict-tfjs -Method Post -Headers @{ "Content-Type" = "application/json" } -Body '{"age": 30, "income": 500000}'
Du kan testa olika värden för age och income för att få olika resultat från servern.

Synkronisering med index.html: index.html är synkad med servern, så du kan mata in data direkt i webbläsaren och skicka värden för att få ett resultat.


https://htmlpreview.github.io/?https://github.com/rabimorad/labb1myfeirabi/blob/main/index.html
