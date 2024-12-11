// Ladda miljövariabler från en .env-fil, användbar för API-nycklar eller andra konfigurationer.
require('dotenv').config();

// Skapa en Fastify-server som hanterar HTTP-förfrågningar och loggar serveraktivitet.
const fastify = require('fastify')({ logger: true });

// Importera TensorFlow.js för att använda maskininlärning i Node.js.
const tf = require('@tensorflow/tfjs');

// Importera fs-modulen för att läsa och skriva filer från filsystemet.
const fs = require('fs');

// Importera CORS-plugin för att tillåta att klienter från olika domäner gör förfrågningar till servern.
const fastifyCors = require('@fastify/cors');

// === STEG 1: Ladda och Utforska Datan ===
let jsonData; // Variabel för att lagra inläst data
try {
    const rawData = fs.readFileSync('./data/data.json'); // Läser in data från en JSON-fil
    jsonData = JSON.parse(rawData); // Parserar JSON-strängen till ett objekt
} catch (error) {
    console.error("Fel vid läsning av data:", error); // Loggar fel om filen inte kan läsas in
    process.exit(1); // Avslutar processen om det uppstår ett fel
}

console.log("Antal datapunkter:", jsonData.data.length); // Loggar antalet datapunkter i datan
console.log("Exempel på data:", jsonData.data.slice(0, 5)); // Loggar de första fem datapunkterna som exempel

// === STEG 2: Normalisera Datan ===
function normalizeData(data) {
    const maxAge = Math.max(...data.map(d => d.age)); // Hitta maxvärdet för ålder
    const minAge = Math.min(...data.map(d => d.age)); // Hitta minvärdet för ålder
    const maxIncome = Math.max(...data.map(d => d.income)); // Hitta maxvärdet för inkomst
    const minIncome = Math.min(...data.map(d => d.income)); // Hitta minvärdet för inkomst

    return data.map(d => ({
        age: (d.age - minAge) / (maxAge - minAge), // Normalisera ålder till ett värde mellan 0 och 1
        income: (d.income - minIncome) / (maxIncome - minIncome), // Normalisera inkomst till ett värde mellan 0 och 1
        electricCar: d.electricCar // Behåll värdet för electricCar oförändrat
    }));
}

const normalizedData = normalizeData(jsonData.data); // Normalisera hela datasetet
console.log("Normaliserad data exempel:", normalizedData.slice(0, 5)); // Loggar exempel på normaliserad data

// === STEG 3: Skapa TensorFlow-Tensorer ===
const inputs = normalizedData.map(d => [d.age, d.income]); // Extrahera ålder och inkomst som input
const labels = normalizedData.map(d => [d.electricCar]); // Extrahera electricCar som output/label

const inputTensor = tf.tensor2d(inputs); // Skapa en 2D-tensor för inputdata
const labelTensor = tf.tensor2d(labels); // Skapa en 2D-tensor för labels

console.log("Input Tensor Shape:", inputTensor.shape); // Loggar formen på input-tensor
console.log("Label Tensor Shape:", labelTensor.shape); // Loggar formen på label-tensor

// === STEG 4: Slumpmässigt Splitta Data ===
function splitData(inputTensor, labelTensor, testSize = 0.2) {
    const totalSize = inputTensor.shape[0]; // Totala antalet datapunkter
    const testSizeCount = Math.floor(totalSize * testSize); // Antal datapunkter för testdata
    const trainSizeCount = totalSize - testSizeCount; // Antal datapunkter för träningsdata

    const indices = Array.from(Array(totalSize).keys()); // Skapa en array med index från 0 till totalSize
    for (let i = indices.length - 1; i > 0; i--) { // Implementera en Fisher-Yates shuffle för att slumpa index
        const j = Math.floor(Math.random() * (i + 1)); // Generera ett slumpmässigt index
        [indices[i], indices[j]] = [indices[j], indices[i]]; // Byt plats på två index
    }

    const trainIndices = indices.slice(0, trainSizeCount); // Extrahera träningsindex
    const testIndices = indices.slice(trainSizeCount); // Extrahera testindex

    const xTrain = inputTensor.gather(trainIndices); // Skapa träningsdata för input
    const yTrain = labelTensor.gather(trainIndices); // Skapa träningsdata för labels
    const xTest = inputTensor.gather(testIndices); // Skapa testdata för input
    const yTest = labelTensor.gather(testIndices); // Skapa testdata för labels

    return { xTrain, yTrain, xTest, yTest }; // Returnera tränings- och testdata
}

const { xTrain, yTrain, xTest, yTest } = splitData(inputTensor, labelTensor); // Splitta data i tränings- och testset
console.log("Träningsdata:", xTrain.shape, yTrain.shape); // Loggar formen på träningsdata
console.log("Testdata:", xTest.shape, yTest.shape); // Loggar formen på testdata

// === STEG 5: Skapa och Träna Modellen ===
const model = tf.sequential(); // Skapa en sekventiell modell
model.add(tf.layers.dense({ units: 1, inputShape: [2], activation: 'sigmoid' })); // Lägg till ett Dense-lager med sigmoid-aktivering

model.compile({
    optimizer: 'sgd', // Använd stochastic gradient descent som optimerare
    loss: 'binaryCrossentropy', // Använd binary crossentropy som förlustfunktion
    metrics: ['accuracy'], // Lägg till noggrannhet som en metrisk mätning
});

async function trainAndEvaluateModel() {
    await model.fit(xTrain, yTrain, { epochs: 150 }); // Ändrat från 50 till 150 epoker
    console.log('Modellen har tränats!'); // Logga när träningen är klar

    // Utvärdera modellen med testdata
    console.log('Modellens prestanda på testdatan:'); // Logga prestanda
    const result = model.evaluate(xTest, yTest); // Utvärdera modellen

    const loss = await result[0].data(); // Extrahera förlustvärdet
    const accuracy = await result[1].data(); // Extrahera noggrannhetsvärdet

    console.log(`Förlust: ${loss}`); // Logga förlustvärdet
    console.log(`Noggrannhet: ${accuracy}`); // Logga noggrannhetsvärdet
}

// === STEG 6: Skapa API för Prediktion ===
fastify.register(fastifyCors, {
    origin: '*', // Tillåt alla domäner att göra förfrågningar
});

fastify.post('/predict-tfjs', async (request, reply) => {
    const { age, income } = request.body; // Hämta ålder och inkomst från förfrågans body

    try {
        console.log('Mottog förfrågan:', { age, income }); // Logga mottagen förfrågan

        const normalizedInput = [
            (age - Math.min(...jsonData.data.map(d => d.age))) /  
            (Math.max(...jsonData.data.map(d => d.age)) - Math.min(...jsonData.data.map(d => d.age))), // Normalisera ålder
            (income - Math.min(...jsonData.data.map(d => d.income))) /  
            (Math.max(...jsonData.data.map(d => d.income)) - Math.min(...jsonData.data.map(d => d.income))) // Normalisera inkomst
        ];

        const prediction = model.predict(tf.tensor2d([normalizedInput])); // Gör en förutsägelse med modellen
        const predictionValue = await prediction.data(); // Extrahera förutsägelseresultatet
        console.log('Förutsägelse:', predictionValue[0]); // Logga förutsägelseresultatet

        return { prediction: predictionValue[0] }; // Returnera förutsägelsen som svar
    } catch (error) {
        console.error("Fel vid förutsägelse:", error); // Logga eventuella fel
        reply.code(500).send({ error: 'Förutsägelse misslyckades', details: error.message }); // Returnera felmeddelande
    }
});

// === STEG 7: Starta Servern och Träna Modellen ===
trainAndEvaluateModel().then(() => {
    fastify.listen({ port: 5000, host: '0.0.0.0' }, (err, address) => {
        if (err) {
            console.error('Fel vid start av servern:', err); // Logga fel vid serverstart
            process.exit(1); // Avsluta processen vid fel
        }
        console.log(`Servern lyssnar på ${address}`); // Logga att servern startat och lyssnar på en port
    });
});
