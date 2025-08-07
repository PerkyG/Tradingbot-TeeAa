// random-question.js

const QUESTION_CATEGORIES = {
  motivatie: [
    { question: "Waarom trade je vandaag? Kies je motivatie en deel optioneel een voice note met waarom.", type: "multiple_choice", options: ["Familie onderhouden (5 pts)", "Toekomst opbouwen (5 pts)", "Thea trots maken (4 pts)", "Uit verveling (0 pts)", "Ander (specificeer, 3 pts)"], excludeFromScoring: false },
    { question: "Wat drijft je het meest: geld, ontwikkeling of iets persoonlijks? Upload een foto van wat je inspireerd.", type: "open", excludeFromScoring: false },
    { question: "Hoe gemotiveerd voel je je nu? Hoe is je drive vandaag? (1-5 schaal, voice note voor uitleg).", type: "multiple_choice", options: ["5 (Volledig, Groen)", "4 (Hoog)", "3 (Gemiddeld, Geel)", "2 (Laag, Oranje)", "1 (Geen, Rood)"], excludeFromScoring: false },
    { question: "Herinner je een succesvol moment, waar kijk je positief op terug?; hoe motiveert dat je? Text of voice.", type: "open", excludeFromScoring: false },
    { question: "Is je motivatie intrinsiek of extrinsiek? Leg uit met een voorbeeld.", type: "multiple_choice", options: ["Intrinsiek (5 pts)", "Extrinsiek (3 pts)", "Mix (4 pts)", "Ander"], excludeFromScoring: false },
    { question: "Wat zou je motivatie boosten? Upload een idee-foto of text.", type: "open", excludeFromScoring: false },
    { question: "Voel je enthousiasme en gedrevenheid? Kies en voeg eventueel voicenote toe ", type: "multiple_choice", options: ["Ja, sterk (5 pts)", "Matig (3 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Memo: Blijf gemotiveerd! Lees een blog of kijk een oude show of twitterthread", type: "memo", excludeFromScoring: true }
  ],
  doelen: [
    { question: "Wat is je hoofddoel vandaag? Denk aan de priolijst en wees specifiek, deel een voice note voor extra bewustzijn.", type: "open", excludeFromScoring: false },
    { question: "Heb je je doelen opgeschreven? Upload een foto van je notitie.", type: "multiple_choice", options: ["Ja, volledig (5 pts)", "Gedeeltelijk (3 pts)", "Nee (1 pt)", "Ander"], excludeFromScoring: false },
    { question: "Zijn je doelen realistisch voor de tijd en soort dag die je hebt? Check en leg uit.", type: "multiple_choice", options: ["Ja (5 pts)", "Gedeeltelijk (3 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Hoe meet je vooruitgang? Journal en (discord) Log!", type: "open", excludeFromScoring: false },
    { question: "Passen je doelen van de dag bij je lange-termijn visie? Foto van plan?", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (2 pts)", "Ander"], excludeFromScoring: false },
    { question: "Wat als je het doel mist vandaag? Bedenk hoe je erop moet reageren", type: "open", excludeFromScoring: false },
    { question: "Memo: Stel dagelijkse doelen door je bewust te zijn het soort dag het voor je is", type: "memo", excludeFromScoring: true }
  ],
  voorbereiding: [
    { question: "Heb je je ochtendroutine voltooid (bewegen, ademen, koude douche, meditatie, fast)? Upload wat als bewijs/habit enforcer", type: "multiple_choice", options: ["Alles (5/5, Groen)", "Meeste (3-4/5, Geel)", "Weinig (1-2/5, Oranje)", "Niets (0/5, Rood)", "Ander"], excludeFromScoring: false },
    { question: "Ben je fysiek en mentaal voorbereid? Deel een korte voice note met de risico's op dat vlak voor vandaag.", type: "open", excludeFromScoring: false },
    { question: "Heb je je watchlist en gedeelde notion gecheckt? Screenshot uploaden?", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)", "Gedeeltelijk (3 pts)"], excludeFromScoring: false },
    { question: "Hoe is je werkplek? Foto voor accountability.", type: "open", excludeFromScoring: false },
    { question: "Heb je earnings&events gecheckt? Belangrijke updates?", type: "multiple_choice", options: ["Ja, volledig (5 pts)", "Nee (1 pt)", "Ander"], excludeFromScoring: false },
    { question: "Voel je je gefocust? Schaal 1-5 met voice voor extra's.", type: "multiple_choice", options: ["5 (Groen)", "3 (Geel)", "1 (Rood)"], excludeFromScoring: false },
    { question: "Heb je gegeten? Fast, gezond, iets anders?", type: "open", excludeFromScoring: false },
    { question: "Welke tijden zijn vandaag interessant om te traden?", type: "open", excludeFromScoring: false },
    { question: "Memo: Bereid je voor op succes. Denk aan hoe het eruit ziet. Voice?", type: "memo", excludeFromScoring: true }
  ],
  psychologie: [
    { question: "Hoe is je mindset nu? Positief, FOMO, rustig of gestresst? Voice note voor details.", type: "multiple_choice", options: ["Zeer positief (5 pts)", "Goed (4 pts)", "Neutraal (3 pts)", "Gestrest (2 pts)", "Negatief (1 pt)"], excludeFromScoring: false },
    { question: "Voel je FOMO of hebzucht? Rust of hoofd vol? Deel een gedachte via spraak.", type: "open", excludeFromScoring: false },
    { question: "Hoe ga je met de emoties die bij de dag komen kijken om?.", type: "multiple_choice", options: ["Goed (5 pts)", "Matig (3 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Ben je in de flow? Leg uit.", type: "open", excludeFromScoring: false },
    { question: "Wat is  de invloed van vorige trades? Reflecteer met voice.", type: "multiple_choice", options: ["Positief (5 pts)", "Negatief (1 pt)", "Neutraal (3 pts)"], excludeFromScoring: false },
    { question: "Mindset tip: Adem diep in en uit. Bij een adhoc actie, strek jezelf uit en doe even niets", type: "memo", excludeFromScoring: true },
    { question: "Hoe manage je stress? Hoe manage je 1 of 2 stopouts achter elkaar vandaag?", type: "open", excludeFromScoring: false }
  ],
  discipline: [
    { question: "Welke regels heb je recentelijk gebroken? Volg je die regels strikt vandaag?, type: "multiple_choice", options: ["Altijd (5 pts)", "Meestal (4 pts)", "Soms (3 pts)", "Zelden (2 pts)", "Nooit (1 pt)"], excludeFromScoring: false },
    { question: "Heb je impulsieve acties vermeden? Welke en hoe?", type: "open", excludeFromScoring: false },
    { question: "Hoe is je routine-discipline? Schaal met bonus voor details", type: "multiple_choice", options: ["Hoog (5 pts)", "Gemiddeld (3 pts)", "Laag (1 pt)"], excludeFromScoring: false },
    { question: "Discipline reminder: Blijf gefocust en een hunter, type: "memo", excludeFromScoring: true },
    { question: "Heb je pauzes genomen? Heb je afgebakende tickerlijst en tijden om te traden?", type: "open", excludeFromScoring: false },
    { question: "Hoe goed houd je je aan je plan? Is er een goede reden om af te wijken?", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Wat verbeter je in je discipline? Reflectie en vooruitblik. Ideeen via voice.", type: "open", excludeFromScoring: false }
  ],
  trades: [
    { question: "Hoeveel trades heb je vandaag genomen? Screenshot per trade en voorlopige reflectie erop", type: "open", excludeFromScoring: true },
    { question: "Waren je trades volgens plan of adhoc? Voice uitleg.", type: "multiple_choice", options: ["Alle (5 pts)", "Meeste (3 pts)", "Weinig (1 pt)"], excludeFromScoring: false },
    { question: "Wat is je beste trade vandaag? Deel chart photo.", type: "open", excludeFromScoring: false },
    { question: "Slechtste trade? Screenshot en geleerde lessen via voice.", type: "open", excludeFromScoring: false },
    { question: "Risico management ok? Totale exposure in check en aantal trades ook?", type: "multiple_choice", options: ["Perfect (5 pts)", "Goed (4 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Trades memo: Kwaliteit > kwantiteit. Denk aan less = more", type: "memo", excludeFromScoring: true },
    { question: "Heb je wins/losses geanalyseerd? Photo van trades en korte reflectie?", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Volgende trade plan? Nieuwe high timeframe ideeen opgedaan of herinnerd? Deel idee.", type: "open", excludeFromScoring: false }
  ],
  reflectie: [
    { question: "Was je geduldig (leeuw) of impulsief? Deel een chart-screenshot.", type: "multiple_choice", options: ["Volledig geduldig (5 pts)", "Meestal (4 pts)", "Mix (3 pts)", "Vaak impulsief (2 pts)", "Altijd (1 pt)", "Ander"], excludeFromScoring: false },
    { question: "Wat ging goed vandaag? Voice reflectie.", type: "open", excludeFromScoring: false },
    { question: "Wat kan beter? Upload notitie.", type: "open", excludeFromScoring: false },
    { question: "Emotionele reflectie: wanneer en wat?.", type: "multiple_choice", options: ["Positief (5 pts)", "Neutraal (3 pts)", "Negatief (1 pt)"], excludeFromScoring: false },
    { question: "Reflectie memo: Leer van fouten. Herhaal ze niet", type: "memo", excludeFromScoring: true },
    { question: "Heb je je doelen gehaald?.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Dagelijkse winst? dankbaar?", type: "open", excludeFromScoring: false },
    { question: "Morgen beter: Wat pas je aan?", type: "open", excludeFromScoring: false }
  ],
  leren: [
    { question: "Wat heb je vandaag geleerd? Spreek het in via voice note.", type: "open", excludeFromScoring: false },
    { question: "Nieuwe inzicht? 2b 2de x raak? Upload voorbeeld.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)", "Gedeeltelijk (3 pts)"], excludeFromScoring: false },
    { question: "Boek/artikel gelezen? Deel insight.", type: "open", excludeFromScoring: false },
    { question: "Leren memo: Blijf naar signal ipv noise luisteren.", type: "memo", excludeFromScoring: true },
    { question: "Fout geanalyseerd? Voice les.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Memo's gevolgd? Leg uit. of zoek ze in notion op", type: "open", excludeFromScoring: false },
    { question: "Volgende leerdoel?.", type: "open", excludeFromScoring: false }
  ],
  gezondheid: [
    { question: "Heb je gezond gegeten en bewogen?", type: "multiple_choice", options: ["Ja, volledig (5 pts)", "Gedeeltelijk (3 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Slaapkwaliteit?", type: "multiple_choice", options: ["Uitstekend (5 pts)", "Gemiddeld (3 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Hydratatie ok? Dagelijkse check.", type: "open", excludeFromScoring: false },
    { question: "Gezondheid memo: Lichaam eerst.", type: "memo", excludeFromScoring: true },
    { question: "Stress level?.", type: "multiple_choice", options: ["Laag (5 pts)", "Hoog (1 pt)"], excludeFromScoring: false },
    { question: "Beweging vandaag?", type: "open", excludeFromScoring: false },
    { question: "Mentale vs lichaamxonnectie gezondheid: Hoe voel je je?", type: "open", excludeFromScoring: false }
  ],
  relaties: [
    { question: "Heb je tijd gemaakt voor familie? Deel een moment.", type: "open", excludeFromScoring: false },
    { question: "ma cnnx?", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)", "Gemiddeld (3 pts)"], excludeFromScoring: false },
    { question: "Relaties memo: Koester ze.", type: "memo", excludeFromScoring: true },
    { question: "Vrienden contact?.", type: "open", excludeFromScoring: false },
    { question: "Balans werk/relaties?", type: "multiple_choice", options: ["Goed (5 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Dankbaarheid voor relaties? .", type: "open", excludeFromScoring: false }
  ],
  avond: [
    { question: "Hoe was je dag overall?.", type: "multiple_choice", options: ["Uitstekend (5 pts)", "Goed (4 pts)", "Gemiddeld (3 pts)", "Slecht (2 pts)", "Zeer slecht (1 pt)"], excludeFromScoring: false },
    { question: "Avond routine gedaan?.", type: "open", excludeFromScoring: false },
    { question: "Morgen plan? Deel via voice.", type: "multiple_choice", options: ["Klaar (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Avond memo: Rust uit.", type: "memo", excludeFromScoring: true },
    { question: "Dankbaar voor vandaag? Leg uit.", type: "open", excludeFromScoring: false },
    { question: "Slaap voorbereid? Check lijst.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Emotionele afsluiting? Voice reflectie.", type: "open", excludeFromScoring: false }
  ],
  memo: [
    { question: "Memo: Vergeet niet te rusten/balans", type: "memo", excludeFromScoring: true },
    { question: "Memo: Drink water", type: "memo", excludeFromScoring: true },
    { question: "Memo: Check doelen dagelijks.", type: "memo", excludeFromScoring: true },
    { question: "Memo: Blijf positief", type: "memo", excludeFromScoring: true },
    { question: "Memo: Leer van fouten", type: "memo", excludeFromScoring: true }
  ],
  marktanalyse: [
    { question: "Hoe staat de markt vandaag? typeer markt met #.", type: "open", excludeFromScoring: true },
    { question: "Trend analyse: Bullish of bearish? typeer markt met #.", type: "multiple_choice", options: ["Bullish (5 pts)", "Bearish (3 pts)", "Neutraal (4 pts)", "Ander"], excludeFromScoring: false },
    { question: "start here gechecked?.typeer markt met #.", type: "open", excludeFromScoring: false },
    { question: "Volatiliteit? BoB?.typeer markt met #.", type: "multiple_choice", options: ["Hoog (3 pts)", "Laag (5 pts)", "Middel (4 pts)"], excludeFromScoring: false },
    { question: "Nieuws impact? typeer markt met #..", type: "open", excludeFromScoring: false },
    { question: "Memo: Analyseer markt. #?", type: "memo", excludeFromScoring: true }
  ],
  strategie: [
    { question: "Wat is je managementplan?.", type: "open", excludeFromScoring: false },
    { question: "Volg je een specifieke methode?.", type: "multiple_choice", options: ["Scalping (4 pts)", "Day trading (5 pts)", "Swing (3 pts)", "Ander"], excludeFromScoring: false },
    { question: "Strategie aanpassing nodig?.", type: "open", excludeFromScoring: false },
    { question: "Entry/exit rules? mgt.", type: "multiple_choice", options: ["Duidelijk (5 pts)", "Vage (2 pts)"], excludeFromScoring: false },
    { question: "replay of papertrade gedaan? Upload data.", type: "open", excludeFromScoring: false },
    { question: "Memo: Stick to the plan.", type: "memo", excludeFromScoring: true }
  ],
  risico: [
    { question: "Risico assessment: Hoog of laag?.", type: "multiple_choice", options: ["Laag (5 pts)", "Hoog (1 pt)", "Middel (3 pts)"], excludeFromScoring: false },
    { question: "Stop-loss gezet?", type: "open", excludeFromScoring: false },
    { question: "Risico-reward ratio?", type: "multiple_choice", options: ["Goed (5 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Potentiële risks?.", type: "open", excludeFromScoring: false },
    { question: "Memo: Manage risico.", type: "memo", excludeFromScoring: true }
  ],
  performance: [
    { question: "Hoe presteer je? en tov de crowd?", type: "open", excludeFromScoring: false },
    { question: "Hitrate vandaag? Schaal met voice.", type: "multiple_choice", options: ["Hoog (5 pts)", "Laag (1 pt)"], excludeFromScoring: false },
    { question: "Performance review? Insights.", type: "open", excludeFromScoring: false },
    { question: "Vergelijking met gisteren?.", type: "multiple_choice", options: ["Beter (5 pts)", "Slechter (1 pt)"], excludeFromScoring: false },
    { question: "Memo: Track performance. discord, tradesviz?", type: "memo", excludeFromScoring: true }
  ],
  inzichten: [
    { question: "Welke inzichten vandaag?.", type: "open", excludeFromScoring: false },
    { question: "Nieuw inzicht over markt? Deel photo.", type: "open", excludeFromScoring: false },
    { question: "Lessen uit trades? Kies.", type: "multiple_choice", options: ["Veel (5 pts)", "Weinig (1 pt)"], excludeFromScoring: false },
    { question: "Inzicht memo: Noteer ze.", type: "memo", excludeFromScoring: true },
    { question: "Toekomstgericht inzicht? Voice plan.", type: "open", excludeFromScoring: false }
  ],
  ontwikkeling: [
    { question: "Hoe groei je als trader?.", type: "open", excludeFromScoring: false },
    { question: "Nieuwe skills geleerd? Deel via voice.", type: "multiple_choice", options: ["Ja (5 pts)", "Nee (1 pt)"], excludeFromScoring: false },
    { question: "Ontwikkeling doel? Plan upload.", type: "open", excludeFromScoring: false },
    { question: "Progressie check? Schaal.", type: "multiple_choice", options: ["Goed (5 pts)", "Slecht (1 pt)"], excludeFromScoring: false },
    { question: "Memo: Blijf groeien", type: "memo", excludeFromScoring: true }
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
