// Bulk import script for Scór Quiz / Tráth na gCeist questions
// Run with: node import-scor-questions.js
require("dotenv").config();
const { pool, initDB } = require("./db");

const questions = [
  // =====================
  // GAELIC AND LADIES FOOTBALL
  // =====================
  // Round 3
  { category: "Gaelic and Ladies Football", question: "What county won the 2024 All-Ireland Senior Football Championship?", answer: "Armagh" },
  { category: "Gaelic and Ladies Football", question: "What is the name of the All-Ireland Minor Football Championship cup?", answer: "Tom Markham Cup" },
  { category: "Gaelic and Ladies Football", question: "What county is Fitzgerald Stadium in?", answer: "Kerry" },
  { category: "Gaelic and Ladies Football", question: "Who managed Dublin to 6 All-Ireland Football titles in a row?", answer: "Jim Gavin" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Royals?", answer: "Meath" },
  { category: "Gaelic and Ladies Football", question: "How many teams play in the Connacht Senior Football Championship?", answer: "7 (incl. London & New York)" },
  { category: "Gaelic and Ladies Football", question: "What county won the first Ladies All-Ireland Senior Football title in 1974?", answer: "Tipperary" },
  { category: "Gaelic and Ladies Football", question: "What is the name of the pre-season football competition in Ulster?", answer: "Dr McKenna Cup" },
  { category: "Gaelic and Ladies Football", question: "What county plays home games at Páirc Seán Mac Diarmada?", answer: "Leitrim" },
  { category: "Gaelic and Ladies Football", question: "Name the Dublin footballer who won 8 All-Ireland medals 2011-2020.", answer: "Stephen Cluxton" },
  // Round 4
  { category: "Gaelic and Ladies Football", question: "What county won the 2023 All-Ireland Senior Football Championship?", answer: "Dublin" },
  { category: "Gaelic and Ladies Football", question: "In what year was the All-Ireland Senior Football Championship first played?", answer: "1887" },
  { category: "Gaelic and Ladies Football", question: "What county are nicknamed The Tribesmen?", answer: "Galway" },
  { category: "Gaelic and Ladies Football", question: "What is the second tier All-Ireland football competition called?", answer: "Tailteann Cup" },
  { category: "Gaelic and Ladies Football", question: "What county won the 2025 Connacht Senior Football Championship?", answer: "Galway" },
  { category: "Gaelic and Ladies Football", question: "What Galway club won 3 in a row in the All-Ireland Ladies Senior Club Championship?", answer: "Kilkerrin-Clonberne" },
  { category: "Gaelic and Ladies Football", question: "What county is Dr Hyde Park in?", answer: "Roscommon" },
  { category: "Gaelic and Ladies Football", question: "What is the maximum number of substitutes allowed in a championship match?", answer: "5 (plus 1 blood sub)" },
  { category: "Gaelic and Ladies Football", question: "What Leinster county won the 2025 Leinster Senior Football Championship?", answer: "Louth" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Rebels?", answer: "Cork" },
  // Round 5
  { category: "Gaelic and Ladies Football", question: "What county is St Tiernach's Park in?", answer: "Monaghan (Clones)" },
  { category: "Gaelic and Ladies Football", question: "What is the O'Byrne Cup a pre-season competition in?", answer: "Leinster football" },
  { category: "Gaelic and Ladies Football", question: "What county won the 2022 All-Ireland Senior Football Championship?", answer: "Kerry" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Farmerettes in ladies football?", answer: "Meath" },
  { category: "Gaelic and Ladies Football", question: "Name the Kerry footballer widely regarded as the best current player.", answer: "David Clifford" },
  { category: "Gaelic and Ladies Football", question: "What county plays home games at Corrigan Park?", answer: "Antrim" },
  { category: "Gaelic and Ladies Football", question: "In what year did Dublin first win 6 All-Irelands in a row?", answer: "2020" },
  { category: "Gaelic and Ladies Football", question: "What county is Brewster Park in?", answer: "Fermanagh" },
  { category: "Gaelic and Ladies Football", question: "What county are nicknamed The Lilywhites?", answer: "Kildare" },
  { category: "Gaelic and Ladies Football", question: "What is the McGrath Cup a pre-season competition in?", answer: "Munster football" },
  // Round 6
  { category: "Gaelic and Ladies Football", question: "What county won the 2021 All-Ireland Senior Football Championship?", answer: "Tyrone" },
  { category: "Gaelic and Ladies Football", question: "Name the county that plays home games at Pearse Park, Longford.", answer: "Longford" },
  { category: "Gaelic and Ladies Football", question: "What is Rule 42 now commonly referred to as?", answer: "Opening Croke Park to other sports" },
  { category: "Gaelic and Ladies Football", question: "What Ulster county won the 2025 Ulster Senior Football Championship?", answer: "Donegal" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Saffrons?", answer: "Antrim" },
  { category: "Gaelic and Ladies Football", question: "What was the score in the 2025 All-Ireland Football Final?", answer: "Kerry 1-26, Donegal 0-19" },
  { category: "Gaelic and Ladies Football", question: "Name the first county to win the Tailteann Cup in 2022.", answer: "Westmeath" },
  { category: "Gaelic and Ladies Football", question: "What county are nicknamed The Dubs?", answer: "Dublin" },
  { category: "Gaelic and Ladies Football", question: "What county plays home games at Wexford Park?", answer: "Wexford" },
  { category: "Gaelic and Ladies Football", question: "What Munster county won the 2025 Munster Senior Football Championship?", answer: "Kerry" },
  // Round 7
  { category: "Gaelic and Ladies Football", question: "What is the Kerry senior football team nickname?", answer: "The Kingdom" },
  { category: "Gaelic and Ladies Football", question: "What county won the 2020 All-Ireland Senior Football Championship?", answer: "Dublin" },
  { category: "Gaelic and Ladies Football", question: "What Mayo player holds the record for most championship appearances?", answer: "Colm Boyle" },
  { category: "Gaelic and Ladies Football", question: "Name the stand at the Canal End of Croke Park.", answer: "Davin Stand" },
  { category: "Gaelic and Ladies Football", question: "What county plays home football games at O'Connor Park?", answer: "Offaly" },
  { category: "Gaelic and Ladies Football", question: "What county won the 2024 Tailteann Cup?", answer: "Down" },
  { category: "Gaelic and Ladies Football", question: "What inter-county football competition is sponsored by Allianz?", answer: "National Football League" },
  { category: "Gaelic and Ladies Football", question: "What is the minimum playing time in a senior inter-county football match?", answer: "70 minutes" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Mourne County?", answer: "Down" },
  { category: "Gaelic and Ladies Football", question: "How many divisions are in the National Football League?", answer: "4" },
  // Round 8
  { category: "Gaelic and Ladies Football", question: "What county plays home games at Cusack Park, Ennis?", answer: "Clare" },
  { category: "Gaelic and Ladies Football", question: "What county are nicknamed The Breffni?", answer: "Cavan" },
  { category: "Gaelic and Ladies Football", question: "Who captained Armagh to their 2024 All-Ireland win?", answer: "Aidan Forker" },
  { category: "Gaelic and Ladies Football", question: "What does the term 'puc fada' relate to in GAA?", answer: "Long puck/kick competition" },
  { category: "Gaelic and Ladies Football", question: "What county plays home games at O'Moore Park?", answer: "Laois" },
  { category: "Gaelic and Ladies Football", question: "In what year did Kerry last win 4 All-Irelands in a row before 2022?", answer: "1981 (they won 1978-81)" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Oak Leaf County?", answer: "Derry" },
  { category: "Gaelic and Ladies Football", question: "What county is Innovate Wexford Park in?", answer: "Wexford" },
  { category: "Gaelic and Ladies Football", question: "What is a '45' in Gaelic football?", answer: "A free kick from the 45 metre line" },
  { category: "Gaelic and Ladies Football", question: "Name the only county to have won All-Ireland Senior Football titles in 5 different decades.", answer: "Kerry" },
  // Round 9
  { category: "Gaelic and Ladies Football", question: "What county won the first All-Ireland Ladies Senior Football Championship?", answer: "Tipperary (1974)" },
  { category: "Gaelic and Ladies Football", question: "What Donegal player won Footballer of the Year in 2012?", answer: "Karl Lacey" },
  { category: "Gaelic and Ladies Football", question: "What is the Sigerson Cup?", answer: "Third-level colleges football competition" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Garden County?", answer: "Wicklow" },
  { category: "Gaelic and Ladies Football", question: "What is the width of a GAA goal in metres?", answer: "6.5 metres" },
  { category: "Gaelic and Ladies Football", question: "What county is Celtic Park in?", answer: "Derry" },
  { category: "Gaelic and Ladies Football", question: "Name the football competition for county teams knocked out of the provincial championships (pre-Tailteann).", answer: "Qualifiers (The Backdoor)" },
  { category: "Gaelic and Ladies Football", question: "What county are known as the Faithful County?", answer: "Offaly" },
  { category: "Gaelic and Ladies Football", question: "What year did the GAA introduce the black card in football?", answer: "2014" },
  { category: "Gaelic and Ladies Football", question: "What county won the 2019 All-Ireland Senior Football Championship?", answer: "Dublin" },
  // Round 10
  { category: "Gaelic and Ladies Football", question: "What county plays home games at TEG Cusack Park, Mullingar?", answer: "Westmeath" },
  { category: "Gaelic and Ladies Football", question: "Who is the all-time top scorer in All-Ireland Senior Football Championship history?", answer: "David Clifford" },
  { category: "Gaelic and Ladies Football", question: "What county is Semple Stadium in?", answer: "Tipperary (Thurles)" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Lake County?", answer: "Westmeath" },
  { category: "Gaelic and Ladies Football", question: "Name the penalty shootout format introduced in GAA.", answer: "Penalties from the 13m line" },
  { category: "Gaelic and Ladies Football", question: "What county plays home games at Páirc Esler?", answer: "Down" },
  { category: "Gaelic and Ladies Football", question: "What county won the 2023 Tailteann Cup?", answer: "Meath" },
  { category: "Gaelic and Ladies Football", question: "What does 'NFL' stand for in a GAA context?", answer: "National Football League" },
  { category: "Gaelic and Ladies Football", question: "What county is Markievicz Park in?", answer: "Sligo" },
  { category: "Gaelic and Ladies Football", question: "Name the trophy for the All-Ireland Under-20 Football Championship.", answer: "No specific cup name (medals)" },
  // Round 11
  { category: "Gaelic and Ladies Football", question: "What is the duration of an All-Ireland Minor Football Championship match?", answer: "60 minutes" },
  { category: "Gaelic and Ladies Football", question: "What county won back-to-back Sam Maguires in 2024 and 2025?", answer: "Kerry won 2025, Armagh 2024" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Premier County?", answer: "Tipperary" },
  { category: "Gaelic and Ladies Football", question: "In what ground is the Leinster Senior Football Final usually played?", answer: "Croke Park" },
  { category: "Gaelic and Ladies Football", question: "What county plays home games at Dr Cullen Park?", answer: "Carlow" },
  { category: "Gaelic and Ladies Football", question: "What is the function of the umpire in GAA?", answer: "Signal scores behind each goal" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Rossies?", answer: "Roscommon" },
  { category: "Gaelic and Ladies Football", question: "Name the competition for GAA clubs at All-Ireland level.", answer: "All-Ireland Club Championship" },
  { category: "Gaelic and Ladies Football", question: "What county is Austin Stack Park in?", answer: "Kerry (Tralee)" },
  { category: "Gaelic and Ladies Football", question: "How many white flags does an umpire wave for a goal?", answer: "One green flag for a goal" },
  // Round 12
  { category: "Gaelic and Ladies Football", question: "What county won the 2012 All-Ireland Senior Football Championship?", answer: "Donegal" },
  { category: "Gaelic and Ladies Football", question: "What is a 'mark' in Gaelic football?", answer: "Clean catch from a kick-out beyond the 45m" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Cats?", answer: "Kilkenny" },
  { category: "Gaelic and Ladies Football", question: "Name the Tyrone manager who led them to 2003, 2005, and 2008 All-Irelands.", answer: "Mickey Harte" },
  { category: "Gaelic and Ladies Football", question: "What county plays home games at Netwatch Cullen Park?", answer: "Carlow" },
  { category: "Gaelic and Ladies Football", question: "How many steps can a player take while carrying the ball?", answer: "4 steps" },
  { category: "Gaelic and Ladies Football", question: "What county won the 2015 All-Ireland Senior Football Championship?", answer: "Dublin" },
  { category: "Gaelic and Ladies Football", question: "What county are known as The Erne County?", answer: "Fermanagh" },
  { category: "Gaelic and Ladies Football", question: "What is the sin bin period for a black card in football?", answer: "10 minutes" },
  { category: "Gaelic and Ladies Football", question: "Name the trophy for the Connacht Senior Football Championship.", answer: "J.J. Nestor Cup" },

  // =====================
  // HURLING AND CAMOGIE
  // =====================
  // Round 3
  { category: "Hurling and Camogie", question: "What is the Lory Meagher Cup?", answer: "Fourth tier hurling competition" },
  { category: "Hurling and Camogie", question: "What county was Lory Meagher from?", answer: "Kilkenny" },
  { category: "Hurling and Camogie", question: "Name the 2023 All-Ireland Minor Hurling champions.", answer: "Kilkenny" },
  { category: "Hurling and Camogie", question: "What county did Brian Dowling manage in senior camogie in 2023?", answer: "Kilkenny" },
  { category: "Hurling and Camogie", question: "What is the weight of a sliotar?", answer: "100-130 grams" },
  { category: "Hurling and Camogie", question: "What county are known as The Déise?", answer: "Waterford" },
  { category: "Hurling and Camogie", question: "Name the Galway hurling manager for 2024.", answer: "Henry Shefflin" },
  { category: "Hurling and Camogie", question: "Mount Leinster Rangers and St Mullins are clubs in what county?", answer: "Carlow" },
  { category: "Hurling and Camogie", question: "What month was the 2023 All-Ireland Hurling Senior Final held?", answer: "July" },
  // Round 4
  { category: "Hurling and Camogie", question: "What is the name of the All-Ireland Camogie Senior Cup?", answer: "O'Duffy Cup" },
  { category: "Hurling and Camogie", question: "What county won the 2022 All-Ireland Senior Hurling Championship?", answer: "Limerick" },
  { category: "Hurling and Camogie", question: "Who is the all-time top scorer in championship hurling?", answer: "TJ Reid" },
  { category: "Hurling and Camogie", question: "What county did Matthew Twomey step down as Camogie manager of in 2023?", answer: "Cork" },
  { category: "Hurling and Camogie", question: "What Clare hurler was the 2023 Young Hurler of the Year?", answer: "Mark Rodgers" },
  { category: "Hurling and Camogie", question: "What is the role of the maor foirne?", answer: "Team attendant/water carrier" },
  { category: "Hurling and Camogie", question: "Name the trophy for the Munster Senior Hurling Championship.", answer: "Mick Mackey Cup" },
  { category: "Hurling and Camogie", question: "What county did Carlow beat in the final of the Christy Ring Cup 2023?", answer: "Offaly" },
  // Round 5
  { category: "Hurling and Camogie", question: "What is a 'puck-out' in hurling?", answer: "Restart from the goalmouth" },
  { category: "Hurling and Camogie", question: "What county are known as The Yellowbellies?", answer: "Wexford" },
  { category: "Hurling and Camogie", question: "Name the 2024 All-Ireland Senior Hurling Final opponents.", answer: "Clare v Kilkenny" },
  { category: "Hurling and Camogie", question: "What was special about the 2024 hurling final?", answer: "Clare won after a replay" },
  { category: "Hurling and Camogie", question: "What county is Cusack Park (Ennis) in?", answer: "Clare" },
  { category: "Hurling and Camogie", question: "What is the length of a hurley approximately?", answer: "About 90cm-100cm" },
  { category: "Hurling and Camogie", question: "What county won 4 consecutive All-Ireland Senior Hurling titles 2018-2021?", answer: "Limerick" },
  { category: "Hurling and Camogie", question: "Name the stand in Semple Stadium named after a Tipperary hurler.", answer: "Kinane Stand" },
  { category: "Hurling and Camogie", question: "What colour jersey does the Kilkenny hurling team wear?", answer: "Black and amber stripes" },
  // Round 6
  { category: "Hurling and Camogie", question: "What county plays senior hurling home games at Walsh Park?", answer: "Waterford" },
  { category: "Hurling and Camogie", question: "What is a 'hook' in hurling?", answer: "Blocking an opponent's swing from behind" },
  { category: "Hurling and Camogie", question: "What county won the 2021 All-Ireland Senior Hurling Championship?", answer: "Limerick" },
  { category: "Hurling and Camogie", question: "Name the Cork hurler famous for the 'thunder and lightning' final of 1939.", answer: "Jack Lynch" },
  { category: "Hurling and Camogie", question: "What British team plays in the Christy Ring Cup?", answer: "London" },
  { category: "Hurling and Camogie", question: "What is the Ashbourne Cup?", answer: "Third-level colleges camogie competition" },
  { category: "Hurling and Camogie", question: "What county are known as The Rebels in hurling?", answer: "Cork" },
  { category: "Hurling and Camogie", question: "Who was the Waterford senior hurling manager for 2024?", answer: "Davy Fitzgerald" },
  { category: "Hurling and Camogie", question: "What trophy is awarded to the Leinster Senior Hurling Champions?", answer: "Bob O'Keeffe Cup" },
  { category: "Hurling and Camogie", question: "What county is Pearse Stadium in?", answer: "Galway" },
  // Round 7
  { category: "Hurling and Camogie", question: "What record number of All-Stars did the Limerick hurlers win in 2021?", answer: "11" },
  { category: "Hurling and Camogie", question: "What county did Henry Shefflin play for?", answer: "Kilkenny" },
  { category: "Hurling and Camogie", question: "What is the Fitzgibbon Cup?", answer: "Third-level colleges hurling competition" },
  { category: "Hurling and Camogie", question: "Name the cup for the All-Ireland Intermediate Camogie Championship.", answer: "Jack McGrath Cup" },
  { category: "Hurling and Camogie", question: "What is a '65' in hurling?", answer: "A free from the 65m line" },
  { category: "Hurling and Camogie", question: "What county is Corrigan Park in?", answer: "Antrim" },
  { category: "Hurling and Camogie", question: "What Kilkenny club won the All-Ireland Camogie Senior Club Championship recently?", answer: "Dicksboro" },
  { category: "Hurling and Camogie", question: "How long is a senior inter-county hurling match?", answer: "70 minutes" },
  // Round 8
  { category: "Hurling and Camogie", question: "Name the legendary Kilkenny manager who won 11 All-Irelands.", answer: "Brian Cody" },
  { category: "Hurling and Camogie", question: "What county are known as The Model County?", answer: "Wexford" },
  { category: "Hurling and Camogie", question: "What year did Wexford last win the All-Ireland Senior Hurling Championship?", answer: "1996" },
  { category: "Hurling and Camogie", question: "What is the Poc Fada?", answer: "Long puck competition held on Cooley Mountains" },
  { category: "Hurling and Camogie", question: "What county is Páirc Uí Rinn in?", answer: "Cork" },
  { category: "Hurling and Camogie", question: "What year did Clare win their first All-Ireland Senior Hurling Championship?", answer: "1914" },
  { category: "Hurling and Camogie", question: "What is a 'shoulder' in hurling?", answer: "A legal body charge" },
  // Round 9
  { category: "Hurling and Camogie", question: "What county plays hurling home games at UPMC Nowlan Park?", answer: "Kilkenny" },
  { category: "Hurling and Camogie", question: "Name the famous Tipperary hurler known as 'Hell's Kitchen'.", answer: "John Doyle" },
  { category: "Hurling and Camogie", question: "What year was the helmet made compulsory in hurling?", answer: "2010" },
  { category: "Hurling and Camogie", question: "What county are known as The Noresiders?", answer: "Kilkenny" },
  { category: "Hurling and Camogie", question: "What is a 'ground hurling' stroke?", answer: "Striking the ball along the ground" },
  { category: "Hurling and Camogie", question: "What county won the 2020 All-Ireland Senior Hurling Championship?", answer: "Limerick" },
  { category: "Hurling and Camogie", question: "What is the four-step rule in hurling?", answer: "Player can take 4 steps before soloing or passing" },
  // Round 10
  { category: "Hurling and Camogie", question: "What county is known as The Treaty County?", answer: "Limerick" },
  { category: "Hurling and Camogie", question: "What is a 'clash' in hurling?", answer: "When two hurleys meet" },
  { category: "Hurling and Camogie", question: "Name the Cork dual player who won All-Ireland medals in both codes.", answer: "Teddy McCarthy (1990)" },
  { category: "Hurling and Camogie", question: "What year was the first All-Ireland Senior Hurling Championship?", answer: "1887" },
  { category: "Hurling and Camogie", question: "What is a sideline cut in hurling?", answer: "The ball is struck from the ground on the sideline" },
  { category: "Hurling and Camogie", question: "What county is home to the club Ballygunner?", answer: "Waterford" },
  // Round 11
  { category: "Hurling and Camogie", question: "What is the diameter of a sliotar approximately?", answer: "65-68mm" },
  { category: "Hurling and Camogie", question: "Name the Wexford hurling ground.", answer: "Chadwicks Wexford Park" },
  { category: "Hurling and Camogie", question: "What year did Waterford last win the All-Ireland Senior Hurling Championship?", answer: "1959" },
  { category: "Hurling and Camogie", question: "Name the hurling position between the half-backs and half-forwards.", answer: "Midfield" },
  { category: "Hurling and Camogie", question: "What is the 'hand pass' rule in hurling?", answer: "Must be a clear striking motion" },
  { category: "Hurling and Camogie", question: "What county are known as The Banner County in hurling?", answer: "Clare" },
  { category: "Hurling and Camogie", question: "What is the role of the sideline official in GAA?", answer: "Monitor substitutions and line balls" },
  // Round 12
  { category: "Hurling and Camogie", question: "What county won the All-Ireland Senior Hurling Championship in 2019?", answer: "Tipperary" },
  { category: "Hurling and Camogie", question: "Name the famous Thurles hurling club.", answer: "Thurles Sarsfields" },
  { category: "Hurling and Camogie", question: "What county is the Gaelic Grounds in?", answer: "Limerick" },
  { category: "Hurling and Camogie", question: "Who managed Clare to the 2024 All-Ireland Hurling title?", answer: "Brian Lohan" },
  { category: "Hurling and Camogie", question: "What is the 'advanced mark' in hurling?", answer: "Clean catch from a puck of 40m+ inside the 45m" },
  { category: "Hurling and Camogie", question: "What county has the most Camogie All-Ireland Senior titles?", answer: "Dublin" },
  { category: "Hurling and Camogie", question: "What is the penalty distance from goal in hurling?", answer: "20 metres" },
  { category: "Hurling and Camogie", question: "What county won 3 All-Ireland Hurling titles in a row 2006-2008?", answer: "Kilkenny" },
  { category: "Hurling and Camogie", question: "Name the Limerick hurler who was Hurler of the Year 2020, 2021 and 2022.", answer: "Cian Lynch (2021), Gearóid Hegarty (2020)" },

  // =====================
  // GENERAL GAA
  // =====================
  // Round 3
  { category: "General GAA", question: "What year was Croke Park opened?", answer: "1884 (Jones' Road) / 1913 renamed" },
  { category: "General GAA", question: "Name the 4 provincial councils of the GAA.", answer: "Connacht, Leinster, Munster, Ulster" },
  { category: "General GAA", question: "What does CLG stand for?", answer: "Cumann Lúthchleas Gael" },
  { category: "General GAA", question: "What county has the most GAA clubs?", answer: "Cork" },
  { category: "General GAA", question: "What is the All-Ireland Poc Fada?", answer: "Long puck competition on Cooley Mountains" },
  { category: "General GAA", question: "Name the GAA's development programme for young players.", answer: "Cúl Camps" },
  { category: "General GAA", question: "What is the official capacity of Croke Park?", answer: "82,300" },
  { category: "General GAA", question: "Who was the first GAA President?", answer: "Maurice Davin" },
  { category: "General GAA", question: "What county does London GAA play in for championship?", answer: "Connacht" },
  // Round 4
  { category: "General GAA", question: "What is the name of the GAA museum?", answer: "GAA Museum at Croke Park" },
  { category: "General GAA", question: "What sport does the GAA govern besides football, hurling and handball?", answer: "Rounders" },
  { category: "General GAA", question: "Name the four stars on the GAA crest.", answer: "Represent the four provinces" },
  { category: "General GAA", question: "What was Bloody Sunday in a GAA context?", answer: "British forces fired into Croke Park, 21 Nov 1920" },
  { category: "General GAA", question: "What year did the GAA allow soccer and rugby at Croke Park?", answer: "2007" },
  { category: "General GAA", question: "What is a dual player?", answer: "A player who plays both football and hurling for their county" },
  { category: "General GAA", question: "Name the GAA equivalent of an AGM.", answer: "County Convention" },
  { category: "General GAA", question: "What is Scór na bPáistí?", answer: "Scór competition for primary school children" },
  { category: "General GAA", question: "What county does New York play in for championship?", answer: "Connacht" },
  { category: "General GAA", question: "What is the role of the Ard Stiúrthóir?", answer: "Director General of the GAA" },
  // Round 5
  { category: "General GAA", question: "Who is the current Ard Stiúrthóir of the GAA?", answer: "Tom Ryan" },
  { category: "General GAA", question: "What is the official name for GAA headquarters?", answer: "Croke Park / Páirc an Chrócaigh" },
  { category: "General GAA", question: "What is the GPA?", answer: "Gaelic Players Association" },
  { category: "General GAA", question: "Name the first All-Ireland final broadcast on radio.", answer: "1926" },
  { category: "General GAA", question: "What does 'Tráth na gCeist' mean?", answer: "Quiz time / Time of Questions" },
  { category: "General GAA", question: "What is the Club Players Association?", answer: "Group advocating for club player rights" },
  { category: "General GAA", question: "Name the ground in Ruislip used by London GAA.", answer: "McGovern Park" },
  { category: "General GAA", question: "What year was Croke Park last renovated/rebuilt?", answer: "1990s-2000s (completed 2005)" },
  { category: "General GAA", question: "What is the Nicky Rackard Cup?", answer: "Fifth tier hurling competition" },
  { category: "General GAA", question: "What county is Gaelic Park, New York associated with?", answer: "New York GAA" },
  // Round 6
  { category: "General GAA", question: "How many players on a GAA handball team?", answer: "1 (singles) or 2 (doubles)" },
  { category: "General GAA", question: "What is Congress in GAA terms?", answer: "Annual general meeting of the GAA" },
  { category: "General GAA", question: "Name the stand at the railway end of Croke Park.", answer: "Cusack Stand" },
  { category: "General GAA", question: "What is the All Stars banquet?", answer: "Annual awards ceremony for best players" },
  { category: "General GAA", question: "What county was Michael Cusack from?", answer: "Clare" },
  { category: "General GAA", question: "What was the Ban on foreign games in the GAA?", answer: "Rule 27 - banned GAA members from playing/attending foreign games" },
  { category: "General GAA", question: "When was Rule 27 (the Ban) removed?", answer: "1971" },
  { category: "General GAA", question: "What is the meaning of 'Ard Chomhairle'?", answer: "Central Council" },
  { category: "General GAA", question: "What year did Croke Park host its first international rugby match?", answer: "2007" },
  { category: "General GAA", question: "Name the GAA competition for secondary schools football.", answer: "Hogan Cup" },
  // Round 7
  { category: "General GAA", question: "What secondary schools hurling competition is the equivalent of the Hogan Cup?", answer: "Croke Cup" },
  { category: "General GAA", question: "What is the Corn na Féile?", answer: "National underage GAA festival/tournament" },
  { category: "General GAA", question: "Name the first sports event televised from Croke Park.", answer: "1962 All-Ireland Final" },
  { category: "General GAA", question: "What county hosted the first All-Ireland Football Final?", answer: "Dublin (Clonskeagh)" },
  { category: "General GAA", question: "What is the role of the Provincial Council?", answer: "Administer GAA within each province" },
  { category: "General GAA", question: "Name the award for the best young footballer of the year.", answer: "Young Footballer of the Year" },
  { category: "General GAA", question: "What is the annual GAA calendar called?", answer: "Master Fixtures Plan" },
  { category: "General GAA", question: "What county has the largest GAA ground outside of Croke Park?", answer: "Cork (Páirc Uí Chaoimh)" },
  { category: "General GAA", question: "What is 'Go Games' in the GAA?", answer: "Modified games for underage players" },
  // Round 8
  { category: "General GAA", question: "What is the CCCC in GAA?", answer: "Central Competitions Control Committee" },
  { category: "General GAA", question: "Name the trophy for the All-Ireland Minor Football Championship.", answer: "Tom Markham Cup" },
  { category: "General GAA", question: "What does 'Coiste Bainistíochta' mean?", answer: "Management Committee" },
  { category: "General GAA", question: "What year were All-Stars first awarded?", answer: "1971" },
  { category: "General GAA", question: "What is the Hogan Stand named after?", answer: "Michael Hogan (killed Bloody Sunday 1920)" },
  { category: "General GAA", question: "What county is Breffni Park in?", answer: "Cavan" },
  { category: "General GAA", question: "What is the function of the GAA's Standing Committee on Playing Rules?", answer: "Review and recommend rule changes" },
  { category: "General GAA", question: "What is a 'Super 8s' format?", answer: "Former round-robin championship quarter-final format" },
  { category: "General GAA", question: "What year did the GAA introduce the Tailteann Cup?", answer: "2022" },
  // Round 9 (partial - user's paste cut off)
  { category: "General GAA", question: "What does 'Páirc' mean?", answer: "Park/Field" },
  { category: "General GAA", question: "What is the Hill 16 terrace made from?", answer: "Rubble from 1916 Rising (tradition/myth)" },
];

async function importQuestions() {
  await initDB();
  const client = await pool.connect();
  let imported = 0;
  let skipped = 0;

  try {
    await client.query("BEGIN");

    for (const q of questions) {
      // Check for duplicates (exact question text match)
      const { rows } = await client.query(
        "SELECT id FROM ai_questions WHERE question = $1 LIMIT 1",
        [q.question]
      );
      if (rows.length > 0) {
        skipped++;
        continue;
      }

      await client.query(
        "INSERT INTO ai_questions (category, question, answer, is_irish, rating) VALUES ($1, $2, $3, false, 0)",
        [q.category, q.question, q.answer]
      );
      imported++;
    }

    await client.query("COMMIT");
    console.log(`Import complete: ${imported} questions imported, ${skipped} duplicates skipped.`);
    console.log(`Total questions in script: ${questions.length}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Import failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

importQuestions();
