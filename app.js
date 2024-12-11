// // Importera TensorFlow.js
// const tf = require('@tensorflow/tfjs');

// // Importera 'fs' (file system) för att läsa in JSON-filen
// const fs = require('fs');

// // Läs in innehållet från `data.json`-filen
// const rawData = fs.readFileSync('./data/data.json');

// // Omvandla den lästa JSON-strängen till ett JavaScript-objekt
// const jsonData = JSON.parse(rawData);

// // Extrahera input-data (ålder och inkomst) och label-data (kan köpa elbil)
// const inputs = jsonData.data.map(user => [user.age, user.income]);  // Skapar en lista av [ålder, inkomst]
// const labels = jsonData.data.map(user => [user.electricCar]);  // Skapar en lista med värden för kan köpa elbil (0 eller 1)

// // Skapa TensorFlow-tensorer från inputs och labels
// const inputTensor = tf.tensor2d(inputs);  // Omvandlar inputs till en 2D-tensor (2D-matris)
// const labelTensor = tf.tensor2d(labels);  // Omvandlar labels till en 2D-tensor

// // Bygg en enkel modell med ett lager
// const model = tf.sequential();
// model.add(tf.layers.dense({ units: 1, inputShape: [2], activation: 'sigmoid' }));

// // Kompilera modellen
// model.compile({
//   optimizer: 'sgd',  // Stokastisk gradientnedstigning
//   loss: 'binaryCrossentropy',  // Används för klassificering med binära etiketter (0 eller 1)
//   metrics: ['accuracy']  // Utvärderar noggrannheten på modellen
// });

// // Funktion för att träna modellen
// async function trainModel() {
//     // Träna modellen med de data vi har
//     await model.fit(inputTensor, labelTensor, { epochs: 100 });
  
//     console.log("Modellen är tränad");
  
//     // Gör en förutsägelse med en ny datapunkt (ålder 35, inkomst 450000)
//     const prediction = model.predict(tf.tensor2d([[42, 470000]]));  // Förutsägelse för en person med ålder = 25 och inkomst = 100000
    
//     // Vänta på att förutsägelsen ska hämtas och bearbetas
//     const predictionValue = await prediction.data();  // Hämtar resultatet av förutsägelsen
    
//     prediction.print();  // Skriv ut resultatet (kommer vara ett värde

//     // Förutsägelsen är ett värde mellan 0 och 1. Om det är nära 1, kan personen köpa elbil, annars inte.
//     if (predictionValue[0] > 0.5) {
//       console.log("Alladin kan köpa en elbil.");
//     } else {
//       console.log("Alladin kan inte köpa en elbil.");
//     }
//   }

// // Kör träningsfunktionen
// trainModel();
