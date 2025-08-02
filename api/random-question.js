// random-question.js

const QUESTION_CATEGORIES = {
  motivatie: [
    { question: "Waarom trade je vandaag? Kies je motivatie en deel optioneel een voice note met waarom.", type: "multiple_choice", options: ["Familie onderhouden (5 pts)", "Toekomst opbouwen (4 pts)", "Thea trots maken (4 pts)", "Uit verveling (2 pts)", "Ander (specificeer, 3 pts)"], excludeFromScoring: false },
    { question: "Wat drijft je het meest: geld, groei of iets persoonlijks? Upload een foto van een inspirerend object.", type: "open", excludeFromScoring: false },
    { question: "Hoe gemotiveerd voel je je nu? (1-5 schaal, voice note voor uitleg).", type: "multiple_choice", options: ["5 (Volledig, Groen)", "4 (Hoog)", "3 (Gemiddeld, Geel)", "2 (Laag, Oranje)", "1 (Geen, Rood)"], excludeFromScoring: false },
    { question: "Herinner je een succesvol moment; hoe motiveert dat je? Deel via voice.", type: "open", excludeFromScoring: false },
    { question: "Is je motivatie intrinsiek of extrinsiek? Leg uit met een voorbeeld.", type: "multiple_choice", options: ["Intrinsiek (5 pts)", "Extrinsiek (3 pts)", "Mix (4 pts)", "Ander"], excludeFromScoring: false },
    { question: "Wat zou je motivatie boosten? Upload een idee-foto.", type: "open", excludeFromScoring: false },
    { question: "Voel je passie voor trading? Schaal en voice note.", type: "multiple_choice", options: ["Ja, sterk (5 pts)", "Matig (3 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Memo: Blijf gemotiveerd! Voice reminder?", type: "memo", excludeFromScoring: true }
  ],
  doelen: [
    { question: "Wat is je hoofddoel vandaag? Wees specifiek en deel een voice note als reminder.", type: "open", excludeFromScoring: false },
    { question: "Heb je je doelen opgeschreven? Upload een foto van je notitie.", type: "multiple_choice", options: ["Ja, volledig (5 pts)", "Gedeeltelijk (3 pts)", "Nee (1 pt)", "Ander"], excludeFromScoring: false },
    { question: "Zijn je doelen SMART? Check en leg uit.", type: "multiple_choice", options: ["Ja (5 pts)", "Gedeeltelijk (3 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Hoe meet je vooruitgang? Deel een metric via voice.", type: "open", excludeFromScoring: false },
    { question: "Past dit doel bij je lange-termijn visie? Foto van plan?", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (2 pts)", "Ander"], excludeFromScoring: false },
    { question: "Wat als je het doel mist? Reflecteer.", type: "open", excludeFromScoring: false },
    { question: "Memo: Stel dagelijkse doelen. Voice note?", type: "memo", excludeFromScoring: true }
  ],
  voorbereiding: [
    { question: "Heb je je ochtendroutine voltooid (sport, douche, Wim Hof)? Upload een foto als bewijs.", type: "multiple_choice", options: ["Alles (5/5, Groen)", "Meeste (3-4/5, Geel)", "Weinig (1-2/5, Oranje)", "Niets (0/5, Rood)", "Ander"], excludeFromScoring: false },
    { question: "Ben je fysiek en mentaal voorbereid? Deel een korte voice note.", type: "open", excludeFromScoring: false },
    { question: "Heb je je tools gecheckt? Screenshot uploaden?", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)", "Gedeeltelijk (3 pts)"], excludeFromScoring: false },
    { question: "Hoe is je werkplek? Foto voor accountability.", type: "open", excludeFromScoring: false },
    { question: "Heb je nieuws gecheckt? Belangrijke updates?", type: "multiple_choice", options: ["Ja, volledig (5 pts)", "Nee (1 pt)", "Ander"], excludeFromScoring: false },
    { question: "Voel je je gefocust? Schaal 1-5 met voice.", type: "multiple_choice", options: ["5 (Groen)", "3 (Geel)", "1 (Rood)"], excludeFromScoring: false },
    { question: "Heb je gegeten? Gezond ontbijt foto?", type: "open", excludeFromScoring: false },
    { question: "Memo: Bereid je voor succes. Voice?", type: "memo", excludeFromScoring: true }
  ],
  psychologie: [
    { question: "Hoe is je mindset nu? Positief of gestrest? Voice note voor details.", type: "multiple_choice", options: ["Zeer positief (5 pts)", "Goed (4 pts)", "Neutraal (3 pts)", "Gestrest (2 pts)", "Negatief (1 pt)"], excludeFromScoring: false },
    { question: "Voel je angst of hebzucht? Deel een gedachte via photo.", type: "open", excludeFromScoring: false },
    { question: "Hoe handel je emoties? Strategie voice note.", type: "multiple_choice", options: ["Goed (5 pts)", "Matig (3 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Ben je in flow-state? Leg uit.", type: "open", excludeFromScoring: false },
    { question: "Invloed van vorige trades? Reflecteer met voice.", type: "multiple_choice", options: ["Positief (5 pts)", "Negatief (1 pt)", "Neutraal (3 pts)"], excludeFromScoring: false },
    { question: "Mindset tip: Adem diep. Foto van oefening?", type: "memo", excludeFromScoring: true },
    { question: "Hoe manage je stress? Deel tip.", type: "open", excludeFromScoring: false }
  ],
  discipline: [
    { question: "Volg je je regels strikt? Deel een voorbeeld via photo.", type: "multiple_choice", options: ["Altijd (5 pts)", "Meestal (4 pts)", "Soms (3 pts)", "Zelden (2 pts)", "Nooit (1 pt)"], excludeFromScoring: false },
    { question: "Heb je impulsieve acties vermeden? Voice reflectie.", type: "open", excludeFromScoring: false },
    { question: "Hoe is je routine-discipline? Schaal met bonus voor details.", type: "multiple_choice", options: ["Hoog (5 pts)", "Gemiddeld (3 pts)", "Laag (1 pt)"], excludeFromScoring: false },
    { question: "Discipline reminder: Blijf gefocust. Photo?", type: "memo", excludeFromScoring: true },
    { question: "Heb je breaks genomen? Balans check.", type: "open", excludeFromScoring: false },
    { question: "Volg je je plan? Upload bewijs.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Wat verbeter je in discipline? Idee voice.", type: "open", excludeFromScoring: false }
  ],
  trades: [
    { question: "Hoeveel trades heb je vandaag genomen? Upload een screenshot.", type: "open", excludeFromScoring: true },
    { question: "Waren ze volgens plan? Voice uitleg.", type: "multiple_choice", options: ["Alle (5 pts)", "Meeste (3 pts)", "Weinig (1 pt)"], excludeFromScoring: false },
    { question: "Beste trade vandaag? Deel chart photo.", type: "open", excludeFromScoring: false },
    { question: "Slechtste trade? Lessen via voice.", type: "open", excludeFromScoring: false },
    { question: "Risico management ok? Schaal.", type: "multiple_choice", options: ["Perfect (5 pts)", "Goed (4 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Trades memo: Kwaliteit > kwantiteit.", type: "memo", excludeFromScoring: true },
    { question: "Heb je wins/losses geanalyseerd? Photo?", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Volgende trade plan? Deel idee.", type: "open", excludeFromScoring: false }
  ],
  reflectie: [
    { question: "Was je geduldig (leeuw) of impulsief? Deel een chart-screenshot.", type: "multiple_choice", options: ["Volledig geduldig (5 pts)", "Meestal (4 pts)", "Mix (3 pts)", "Vaak impulsief (2 pts)", "Altijd (1 pt)", "Ander"], excludeFromScoring: false },
    { question: "Wat ging goed vandaag? Voice reflectie.", type: "open", excludeFromScoring: false },
    { question: "Wat kan beter? Upload notitie.", type: "open", excludeFromScoring: false },
    { question: "Emotionele reflectie: Hoe voelde het? Schaal.", type: "multiple_choice", options: ["Positief (5 pts)", "Neutraal (3 pts)", "Negatief (1 pt)"], excludeFromScoring: false },
    { question: "Reflectie memo: Leer van fouten.", type: "memo", excludeFromScoring: true },
    { question: "Heb je je doelen gehaald? Voice uitleg.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Dagelijkse winst? Deel metric photo.", type: "open", excludeFromScoring: false },
    { question: "Morgen beter: Wat pas je aan?", type: "open", excludeFromScoring: false }
  ],
  leren: [
    { question: "Wat heb je vandaag geleerd? Spreek het in via voice note.", type: "open", excludeFromScoring: false },
    { question: "Nieuwe strategie getest? Upload voorbeeld.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)", "Gedeeltelijk (3 pts)"], excludeFromScoring: false },
    { question: "Boek/artikel gelezen? Deel insight.", type: "open", excludeFromScoring: false },
    { question: "Leren memo: Blijf studeren.", type: "memo", excludeFromScoring: true },
    { question: "Fout geanalyseerd? Voice les.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Mentor advies gevolgd? Leg uit.", type: "open", excludeFromScoring: false },
    { question: "Volgende leerdoel? Plan photo.", type: "open", excludeFromScoring: false }
  ],
  gezondheid: [
    { question: "Heb je gezond gegeten en bewogen? Foto van je maaltijd.", type: "multiple_choice", options: ["Ja, volledig (5 pts)", "Gedeeltelijk (3 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Slaapkwaliteit? Schaal met voice.", type: "multiple_choice", options: ["Uitstekend (5 pts)", "Gemiddeld (3 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Hydratatie ok? Dagelijkse check.", type: "open", excludeFromScoring: false },
    { question: "Gezondheid memo: Lichaam eerst.", type: "memo", excludeFromScoring: true },
    { question: "Stress level? Deel via photo.", type: "multiple_choice", options: ["Laag (5 pts)", "Hoog (1 pt)"], excludeFromScoring: false },
    { question: "Beweging vandaag? Upload bewijs.", type: "open", excludeFromScoring: false },
    { question: "Mentale gezondheid: Hoe voel je je?", type: "open", excludeFromScoring: false }
  ],
  relaties: [
    { question: "Heb je tijd gemaakt voor familie? Deel een moment via voice.", type: "open", excludeFromScoring: false },
    { question: "Communicatie met Thea? Positief?", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)", "Gemiddeld (3 pts)"], excludeFromScoring: false },
    { question: "Relaties memo: Koester ze.", type: "memo", excludeFromScoring: true },
    { question: "Vrienden contact? Deel insight.", type: "open", excludeFromScoring: false },
    { question: "Balans werk/relaties? Schaal.", type: "multiple_choice", options: ["Goed (5 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Dankbaarheid voor relaties? Voice note.", type: "open", excludeFromScoring: false }
  ],
  avond: [
    { question: "Hoe was je dag overall? Reflecteer met een voice note.", type: "multiple_choice", options: ["Uitstekend (5 pts)", "Goed (4 pts)", "Gemiddeld (3 pts)", "Slecht (2 pts)", "Zeer slecht (1 pt)"], excludeFromScoring: false },
    { question: "Avond routine gedaan? Upload photo.", type: "open", excludeFromScoring: false },
    { question: "Morgen plan? Deel via voice.", type: "multiple_choice", options: ["Klaar (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Avond memo: Rust uit.", type: "memo", excludeFromScoring: true },
    { question: "Dankbaar voor vandaag? Leg uit.", type: "open", excludeFromScoring: false },
    { question: "Slaap voorbereid? Check lijst.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Emotionele afsluiting? Voice reflectie.", type: "open", excludeFromScoring: false }
  ],
  memo: [
    { question: "Memo: Vergeet niet te rusten. Voice note als reminder?", type: "memo", excludeFromScoring: true },
    { question: "Memo: Drink water. Photo reminder?", type: "memo", excludeFromScoring: true },
    { question: "Memo: Check doelen dagelijks.", type: "memo", excludeFromScoring: true },
    { question: "Memo: Blijf positief. Voice?", type: "memo", excludeFromScoring: true },
    { question: "Memo: Leer van trades.", type: "memo", excludeFromScoring: true }
  ],
  marktanalyse: [
    { question: "Hoe staat de markt vandaag? Deel een screenshot.", type: "open", excludeFromScoring: true },
    { question: "Trend analyse: Bullish of bearish? Voice uitleg.", type: "multiple_choice", options: ["Bullish (5 pts)", "Bearish (3 pts)", "Neutraal (4 pts)", "Ander"], excludeFromScoring: false },
    { question: "Key indicators gecheckt? Upload grafiek.", type: "open", excludeFromScoring: false },
    { question: "Volatiliteit niveau? Schaal met voice.", type: "multiple_choice", options: ["Hoog (3 pts)", "Laag (5 pts)", "Middel (4 pts)"], excludeFromScoring: false },
    { question: "Nieuws impact? Deel insight.", type: "open", excludeFromScoring: false },
    { question: "Memo: Analyseer markt. Photo?", type: "memo", excludeFromScoring: true }
  ],
  strategie: [
    { question: "Wat is je trading strategie? Upload plan foto.", type: "open", excludeFromScoring: false },
    { question: "Volg je een specifieke methode? Kies en leg uit.", type: "multiple_choice", options: ["Scalping (4 pts)", "Day trading (5 pts)", "Swing (3 pts)", "Ander"], excludeFromScoring: false },
    { question: "Strategie aanpassing nodig? Voice note.", type: "open", excludeFromScoring: false },
    { question: "Entry/exit rules? Deel voorbeeld.", type: "multiple_choice", options: ["Duidelijk (5 pts)", "Vage (2 pts)"], excludeFromScoring: false },
    { question: "Backtest resultaten? Upload data.", type: "open", excludeFromScoring: false },
    { question: "Memo: Stick to strategy. Voice?", type: "memo", excludeFromScoring: true }
  ],
  risico: [
    { question: "Risico assessment: Hoog of laag? Voice note.", type: "multiple_choice", options: ["Laag (5 pts)", "Hoog (1 pt)", "Middel (3 pts)"], excludeFromScoring: false },
    { question: "Stop-loss gezet? Deel setup photo.", type: "open", excludeFromScoring: false },
    { question: "Risico-reward ratio? Bereken en leg uit.", type: "multiple_choice", options: ["Goed (5 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Potentiële risks? List via voice.", type: "open", excludeFromScoring: false },
    { question: "Memo: Manage risico. Photo?", type: "memo", excludeFromScoring: true }
  ],
  performance: [
    { question: "Hoe presteer je? Deel metrics screenshot.", type: "open", excludeFromScoring: false },
    { question: "Win rate vandaag? Schaal met voice.", type: "multiple_choice", options: ["Hoog (5 pts)", "Laag (1 pt)"], excludeFromScoring: false },
    { question: "Performance review? Insights.", type: "open", excludeFromScoring: false },
    { question: "Vergelijking met gisteren? Photo.", type: "multiple_choice", options: ["Beter (5 pts)", "Slechter (1 pt)"], excludeFromScoring: false },
    { question: "Memo: Track performance. Voice?", type: "memo", excludeFromScoring: true }
  ],
  inzichten: [
    { question: "Welke inzichten vandaag? Spreek in via voice.", type: "open", excludeFromScoring: false },
    { question: "Nieuw inzicht over markt? Deel photo.", type: "open", excludeFromScoring: false },
    { question: "Lessen uit trades? Kies.", type: "multiple_choice", options: ["Veel (5 pts)", "Weinig (1 pt)"], excludeFromScoring: false },
    { question: "Inzicht memo: Noteer ze.", type: "memo", excludeFromScoring: true },
    { question: "Toekomstig inzicht? Voice plan.", type: "open", excludeFromScoring: false }
  ],
  ontwikkeling: [
    { question: "Hoe groei je als trader? Reflecteer met photo.", type: "open", excludeFromScoring: false },
    { question: "Nieuwe skills geleerd? Deel via voice.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Ontwikkeling doel? Plan upload.", type: "open", excludeFromScoring: false },
    { question: "Progressie check? Schaal.", type: "multiple_choice", options: ["Goed (5 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Memo: Blijf groeien. Voice?", type: "memo", excludeFromScoring: true }
  ]
};

export default function handler(req, res) {
  const { categorie } = req.query;
  let chosenCat = categorie;

  if (!chosenCat || !QUESTION_CATEGORIES[chosenCat]) {
    const allCats = Object.keys(QUESTION_CATEGORIES);
    chosenCat = allCats[Math.floor(Math.random() * allCats.length)];
  }

  const questions = QUESTION_CATEGORIES[chosenCat];
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

  res.status(200).json({
    categorie: chosenCat,
    question: randomQuestion.question,
    type: randomQuestion.type,
    options: randomQuestion.options || null,
    excludeFromScoring: randomQuestion.excludeFromScoring
  });
}
