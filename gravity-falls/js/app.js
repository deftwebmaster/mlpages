// app.js — Gravity Falls Companion
// Loads all JSON data, builds UI, wires interactions

const App = (() => {

  // ── State ──
  let eggs = [];
  let ciphers = [];
  let characters = [];

  let eggFilter = { season: 'all', category: 'all', tier: 'all' };

  // ── Boot ──
  async function init() {
    let marginalia, quotes, cipherhunt, zodiac, episodes, journals, theories;
    [eggs, ciphers, characters, marginalia, quotes, cipherhunt, zodiac, episodes, journals, theories] = await Promise.all([
      fetchJSON('data/eggs.json'),
      fetchJSON('data/ciphers.json'),
      fetchJSON('data/characters.json'),
      fetchJSON('data/marginalia.json'),
      fetchJSON('data/quotes.json'),
      fetchJSON('data/cipherhunt.json'),
      fetchJSON('data/zodiac.json'),
      fetchJSON('data/episodes.json'),
      fetchJSON('data/journals.json'),
      fetchJSON('data/theories.json'),
    ]);
    buildCipherReference();
    buildEggs();
    buildCharacters();
    buildMarginalia(marginalia);
    buildBillQuotes(quotes);
    buildCipherHunt(cipherhunt);
    buildZodiac(zodiac);
    buildEpisodeIndex(episodes, cipherhunt);
    buildJournals(journals);
    buildTheories(theories);
    wireNav();
    wireCipherDecoder();
    wireEggFilters();
    wireReveals();
  }

  // ── Inline data — works on file://, GitHub Pages, and any server ──
  const _DATA = {
    "data/eggs.json": [{"id":"s1e1-gnome-painting","season":1,"episode":1,"title":"Gnome in the tourist trap painting","category":"background","hint":"Look at the large painted mural on the wall of the Mystery Shack gift shop during Dipper and Mabel's first tour.","spoilerTier":"safe","spoiler":"One of the painted figures in the mural is clearly a gnome wearing a red hat \u2014 the same style as the gnome leader Jeff, who doesn't appear until the very next episode. The prop team planted him a full episode early."},{"id":"s1e1-bill-triangle","season":1,"episode":1,"title":"Bill's triangle on the dollar bill","category":"background","hint":"During the opening scene when Stan is counting money at his register, look carefully at the bills themselves.","spoilerTier":"s2","spoiler":"The dollar bills in Stan's register feature a triangle with a single eye where the Eye of Providence normally sits on US currency \u2014 Bill Cipher's iconic form. This is the very first shot of the entire series, meaning Bill was seeded before the show's own premise was established."},{"id":"s1e1-journals-shelf","season":1,"episode":1,"title":"All three journals on Stan's shelf","category":"background","hint":"Before Dipper discovers Journal 3 in the attic, scan the bookshelf visible behind Stan's desk.","spoilerTier":"s2","spoiler":"All three journals \u2014 1, 2, and 3 \u2014 are visible on the shelf in the very first episode, distinguishable by their colors. Season 2 reveals Stan had possessed Journal 1 the entire time, meaning it sat in plain sight from the pilot onward."},{"id":"s1e1-stans-real-name-doc","season":1,"episode":1,"title":"Stanley Pines on the wall document","category":"background","hint":"There's a piece of paper pinned near Stan's register in the gift shop. It's readable if you pause \u2014 look at the name on it.","spoilerTier":"finale","spoiler":"The document clearly reads 'STANLEY PINES' \u2014 not Stanford. The writers had already established in the pilot that the man running the Mystery Shack was not the journal's author. The name sat in frame for two seasons before anyone had reason to care about the distinction. It may be the most patient character reveal in animated television history."},{"id":"s1e1-carpet-bill","season":1,"episode":1,"title":"Bill's eye in the Mystery Shack carpet","category":"background","hint":"Look at the floor of the gift shop during any wide interior shot. The carpet has a repeating geometric pattern \u2014 look at what that pattern actually is.","spoilerTier":"s2","spoiler":"The carpet is made up of repeating triangles with a single eye \u2014 Bill Cipher's silhouette, woven into the floor of the Mystery Shack. He is literally underfoot in the first episode, before the show has introduced any of its mysteries."},{"id":"s1e2-credits-cipher","season":1,"episode":2,"title":"First end-credits cryptogram","category":"cryptogram","hint":"Stay through the end credits of 'The Legend of the Gobblewonker.' There's a short string of capital letters hidden in the black end card.","spoilerTier":"safe","spoiler":"The cryptogram 'ZHOFRPH WR JUDYLWB IDOOV' is a Caesar cipher (shift 3) that decodes to 'WELCOME TO GRAVITY FALLS.' This was the first of dozens of end-credits ciphers the show would use, and it launched one of the most dedicated fan-decoding communities in animation history."},{"id":"s1e2-stan-tattoo","season":1,"episode":2,"title":"Stan's back tattoo glimpsed early","category":"background","hint":"There's a brief shot of Stan in the bathroom in this episode. Look at his back \u2014 something is visible that the show never draws attention to.","spoilerTier":"s2","spoiler":"A tattoo is briefly visible on Stan's back \u2014 the same symbol that, in the Season 2 finale, is part of the portal activation sequence. It was designed and planted here two full years before the payoff aired."},{"id":"s1e3-wax-figures","season":1,"episode":3,"title":"Wax figures arranged like the Last Supper","category":"background","hint":"When Stan's Hall of the Forgotten is first shown in 'Headhunters,' count the wax figures and note how they're arranged at the long table.","spoilerTier":"safe","spoiler":"The wax figures are seated in an arrangement that deliberately mirrors da Vinci's Last Supper \u2014 same central figure, same groupings on either side. The animators confirmed the reference was intentional, though the show never explains the significance."},{"id":"s1e3-credits-cipher","season":1,"episode":3,"title":"Credits cipher: 'ZHOFRPH EDFN'","category":"cryptogram","hint":"Check the end card of 'Headhunters' for the Caesar cipher hidden there.","spoilerTier":"safe","spoiler":"Decodes to 'WELCOME BACK' \u2014 a simple acknowledgment to fans who were already learning to look for the ciphers. The show was rewarding attentive viewers as early as episode three."},{"id":"s1e4-credits-cipher","season":1,"episode":4,"title":"Credits cipher: 'VWRS UHDGLQJ PB PLQG'","category":"cryptogram","hint":"The end card of 'The Hand That Rocks the Mabel' contains this episode's Caesar cipher.","spoilerTier":"s2","spoiler":"Decodes to 'STOP READING MY MIND' \u2014 written in Bill's voice, as though he's addressing the audience directly. This was the first credits cipher to suggest Bill was aware of the viewers, a theme the show would return to repeatedly."},{"id":"s1e5-blendin-background","season":1,"episode":5,"title":"Blendin Blandin lurking before his debut","category":"background","hint":"In 'The Inconveniencing,' scan the background of the Dusk 2 Dawn establishing shot. Someone is standing near the edge of the scene who has no business being there.","spoilerTier":"s1","spoiler":"Blendin Blandin \u2014 the time-traveling repairman who won't be formally introduced until episode 9 \u2014 is visible in his camouflage jumpsuit in the background. In-universe, he's there because he's already been tracking Dipper and Mabel through time. Out of universe, it's a planted Easter egg for rewatchers."},{"id":"s1e5-credits-cipher","season":1,"episode":5,"title":"Credits cipher: 'ELOO LV ZDWFKLQJ'","category":"cryptogram","hint":"Check the end card of 'The Inconveniencing.'","spoilerTier":"s2","spoiler":"Decodes to 'BILL IS WATCHING' \u2014 three episodes before Bill Cipher is even introduced. The cipher sequence was foreshadowing his arrival in plain text, hidden one alphabet shift away from anyone patient enough to look."},{"id":"s1e6-hand-symbol","season":1,"episode":6,"title":"Six-fingered handprint in the journal","category":"journal","hint":"When Dipper flips through Journal 3 in 'Dipper vs. Manliness,' watch the page he passes over \u2014 not the one he stops on.","spoilerTier":"s2","spoiler":"A six-fingered handprint is visible on the skipped page \u2014 the first visual clue that the journal's author has six fingers on each hand. This detail becomes the key to identifying Ford Pines in Season 2, and it was planted here in a blink-and-miss-it frame flip."},{"id":"s1e6-credits-cipher","season":1,"episode":6,"title":"Credits cipher: 'QHYHU PLQG EDE'","category":"cryptogram","hint":"Find the end card cipher in 'Dipper vs. Manliness.'","spoilerTier":"safe","spoiler":"Decodes to 'NEVER MIND BAB' \u2014 a deliberately confusing phrase that threw fans off. It's a red herring testing whether people were actually decoding or just guessing. 'Bab' had no meaning; the point was proving the Caesar method was still active and working."},{"id":"s1e7-credits-cipher","season":1,"episode":7,"title":"Credits cipher: 'VWDQ LV QRW ZKDW KH VHHPV'","category":"cryptogram","hint":"Stay for the end card of 'Double Dipper.' This one is significant.","spoilerTier":"finale","spoiler":"Decodes to 'STAN IS NOT WHAT HE SEEMS' \u2014 foreshadowing the central mystery of the entire series from episode 7. Fans interpreted this as Stan being supernatural. The real answer \u2014 that he had spent decades living under his twin brother's name \u2014 was far stranger than any supernatural explanation."},{"id":"s1e8-bill-shadow","season":1,"episode":8,"title":"Bill's triangular silhouette in 'Irrational Treasure'","category":"background","hint":"In the historical flashback sequence of 'Irrational Treasure,' watch the shapes in the background. Something triangular is present that doesn't match any character in the scene.","spoilerTier":"s2","spoiler":"A triangular figure with a single eye is briefly visible in the background of the flashback \u2014 Bill Cipher appearing in a scene set centuries before his formal introduction. Whether this represents Bill actually being present in that era (consistent with his interdimensional nature) or is pure foreshadowing is intentionally left ambiguous."},{"id":"s1e8-quentin-cipher","season":1,"episode":8,"title":"Historical document cipher in 'Irrational Treasure'","category":"cryptogram","hint":"In 'Irrational Treasure,' a historical document is shown during the reveal about President Quentin Trembley. Look at the text block in the corner of the document \u2014 it's not decorative.","spoilerTier":"safe","spoiler":"A small block of Caesar cipher text near the edge of the document decodes to 'QUENTIN TREMBLEY WAS REAL' \u2014 an in-universe joke confirming that even within the show's fictional history, this absurd president was a genuine historical figure. The show treated its own absurdist worldbuilding with complete seriousness."},{"id":"s1e9-bill-reversed-audio","season":1,"episode":9,"title":"Reversed audio in Bill's first appearance","category":"cryptogram","hint":"In 'The Time Traveler's Pig,' Bill Cipher formally appears for the first time. There's something in the audio of his introduction scene that you need to reverse to hear properly.","spoilerTier":"s1","spoiler":"When Bill's introductory monologue audio is reversed, he says 'I'M WATCHING YOU NERDS' directly to the audience. Alex Hirsch confirmed this was intentional \u2014 Bill breaking the fourth wall and acknowledging the viewers was baked into his very first scene."},{"id":"s1e9-credits-cipher","season":1,"episode":9,"title":"Credits cipher: 'ZLOO BRX HQWHU WKH IDOOV'","category":"cryptogram","hint":"Check the end card of 'The Time Traveler's Pig.'","spoilerTier":"safe","spoiler":"Decodes to 'WILL YOU ENTER THE FALLS' \u2014 a direct address to the viewer, asking if they're committed to the show's mysteries. Placed right after Bill's debut, it reframes the cipher hunt as something Bill himself is inviting the audience into."},{"id":"s1e10-atbash-debut","season":1,"episode":10,"title":"Atbash cipher introduced in 'Fight Fighters'","category":"cryptogram","hint":"The end card of 'Fight Fighters' breaks from the Caesar pattern used in every previous episode. The cipher type has changed \u2014 you'll need a different method to decode it.","spoilerTier":"safe","spoiler":"This episode introduced the Atbash cipher to the show's rotation, catching fans off guard. The decoded message references the cipher itself \u2014 a self-referential joke telling fans which tool they'd just switched to. From this point on, viewers had to figure out which cipher each episode was using before they could decode it."},{"id":"s1e11-portal-blueprints","season":1,"episode":11,"title":"Portal blueprints visible behind Stan","category":"background","hint":"In 'Little Dipper,' during any scene set in Stan's private back room, look at the papers and diagrams visible on the desk and walls behind him \u2014 not the props in the foreground.","spoilerTier":"s2","spoiler":"Partially visible diagrams on the walls and desk are consistent with the interdimensional portal schematics revealed in Season 2. Stan had been actively working on the portal throughout Season 1, and the evidence was present in the background the entire time \u2014 never focused on, never addressed."},{"id":"s1e12-stan-fez","season":1,"episode":12,"title":"The symbol on Stan's fez","category":"background","hint":"In 'Summerween,' get a clear look at the emblem embroidered on Stan's fez. It's not just decoration.","spoilerTier":"s2","spoiler":"The fez bears a six-pointed star symbol \u2014 identical to the emblem of the Society of the Blind Eye, the memory-erasing cult revealed in Season 2. Whether Stan had any actual connection to the Society is never confirmed, but the symbol was not placed on his hat by accident."},{"id":"s1e13-underground-lab","season":1,"episode":13,"title":"The odd door in the Mystery Shack hallway","category":"background","hint":"In 'Boss Mabel,' there's a hallway shot in the lower portion of the shack. One door has a different handle from every other door in the building.","spoilerTier":"s2","spoiler":"That door leads to the secret underground lab that Ford built beneath the shack. It's visible in at least six Season 1 episodes \u2014 always closed, always unaddressed. The different handle was the production team's way of flagging it as significant for rewatchers without tipping off first-time viewers."},{"id":"s1e13-credits-cipher","season":1,"episode":13,"title":"Credits cipher: 'THERE IS ONLY ONE MESSAGE'","category":"cryptogram","hint":"The end card of 'Boss Mabel' uses the Atbash cipher. Decode it.","spoilerTier":"safe","spoiler":"Decodes to 'THERE IS ONLY ONE MESSAGE' \u2014 a cryptic statement that fans spent weeks debating. In retrospect it seems to point at the show's unified thesis: every cipher, easter egg, and mystery in Gravity Falls ultimately points toward one truth about the Pines family."},{"id":"s1e14-mcgucket-ramblings","season":1,"episode":14,"title":"McGucket's gibberish contains portal fragments","category":"background","hint":"In 'Bottomless Pit!,' Old Man McGucket makes a brief appearance and mutters something that sounds like nonsense. Try to catch the exact words.","spoilerTier":"s2","spoiler":"Fragments of McGucket's incoherent speech are consistent with parts of the portal activation sequence revealed in Season 2. His mind was so damaged by repeated memory erasure that he can't speak coherently \u2014 but what he saw through the portal surfaces as scrambled technical language he can't control or understand."},{"id":"s1e15-gideon-journal2","season":1,"episode":15,"title":"Journal 2 on Gideon's reading stand","category":"journal","hint":"In multiple Season 1 episodes featuring Gideon's workspace, look at what's sitting on his reading stand. The cover color and number are visible if you pause.","spoilerTier":"s1","spoiler":"Journal 2 is visible on Gideon's reading stand throughout Season 1. The show never explicitly labels it until much later, but it's identifiable by color and number. Gideon's obsession with acquiring Journal 3 from Dipper makes considerably more sense once you realize he already had one of the three."},{"id":"s1e16-blendin-fair","season":1,"episode":16,"title":"Blendin at the county fair","category":"background","hint":"During the Gravity Falls county fair scenes in 'Carpet Diem,' scan the background crowd shots carefully. Someone is trying not to be noticed.","spoilerTier":"s1","spoiler":"Blendin Blandin is visible again in the background at the fair \u2014 his third background appearance before his speaking role. His camouflage suit would help him blend in outdoors but is conspicuous in a crowd. Each of his background appearances places him in a scene where Dipper and Mabel are doing something that will later affect the timeline he's supposed to be protecting."},{"id":"s1e17-a1z26-debut","season":1,"episode":17,"title":"A1Z26 cipher debuts in 'Boyz Crazy'","category":"cryptogram","hint":"The end card of 'Boyz Crazy' introduces a third cipher type. Instead of letters, you'll find numbers separated by dashes.","spoilerTier":"safe","spoiler":"This episode debuted the A1Z26 cipher (A=1, B=2... Z=26). The decoded message reads 'NEXT SUMMER' \u2014 teasing the then-unconfirmed Season 2. Fans decoded it within hours and took it as an unofficial renewal announcement before Disney made anything official."},{"id":"s1e18-gideon-amulet-bill","season":1,"episode":18,"title":"Bill's eye reflected in Gideon's amulet","category":"background","hint":"In 'Land Before Swine,' look at Gideon's amulet when it catches the light. Pay attention to what's reflected in its surface rather than the amulet itself.","spoilerTier":"s2","spoiler":"The reflection in Gideon's amulet is a single triangular eye \u2014 Bill Cipher. Season 2 reveals that Gideon made a deal with Bill, and this reflection suggests Bill was already tied to the amulet long before their relationship is made explicit. Every Season 1 scene featuring the amulet takes on new weight in retrospect."},{"id":"s1e19-ford-in-memory","season":1,"episode":19,"title":"Ford visible in Stan's memories","category":"background","hint":"In 'Dreamscaperers,' Bill takes Dipper into Stan's mental memories. Look at the people in those memory sequences \u2014 specifically, look at their hands.","spoilerTier":"s2","spoiler":"One of Stan's memories shows him standing alongside a man who visibly has six fingers on one hand. This is Ford Pines \u2014 Stan's twin brother and the journal's author \u2014 appearing in Stan's own memory before he is ever mentioned or seen by name. Rewatchers recognize him immediately by the hand."},{"id":"s1e19-gideon-bill-deal","season":1,"episode":19,"title":"Gideon shakes hands with Bill at the end of Season 1","category":"background","hint":"At the very end of 'Dreamscaperers,' after Gideon's defeat, there's a brief cutaway that most first-time viewers read as a throwaway gag. Watch it more carefully.","spoilerTier":"s2","spoiler":"Gideon makes a deal with Bill Cipher in this cutaway \u2014 actually shaking his hand to seal the arrangement. At first watch it plays as an absurdist joke. In Season 2, this deal turns out to be completely real: it results in Gideon being broken out of prison by Bill's agents. The 'gag' was foreshadowing a major Season 2 plot point."},{"id":"s1e19-credits-vigenere-hint","season":1,"episode":19,"title":"Credits cipher: 'NEXT CIPHER HARDER'","category":"cryptogram","hint":"The end card of 'Dreamscaperers' contains an A1Z26 message. Decode it.","spoilerTier":"s2","spoiler":"Decodes to 'NEXT CIPHER HARDER' \u2014 a direct communication to the fan decoding community that the ciphers were about to get significantly more complex. Season 2 would introduce the Vigen\u00e8re cipher, which requires a keyword (STANFORD) the show had been concealing the entire time."},{"id":"s1e20-bill-is-coming","season":1,"episode":20,"title":"Season 1 finale cipher: 'BILL IS COMING'","category":"cryptogram","hint":"The Season 1 finale 'Gideon Rises' ends with a Caesar cipher in the credits. It's the last cipher of the season.","spoilerTier":"s2","spoiler":"Decodes to 'BILL IS COMING' \u2014 a direct threat closing out Season 1 and confirming where Season 2 was headed. After 20 episodes with Gideon as the primary antagonist, this cipher made clear that everything so far had been preamble."},{"id":"s1e20-portal-activation","season":1,"episode":20,"title":"Stan successfully activates the portal in the Season 1 finale","category":"background","hint":"The final scene of 'Gideon Rises' shows Stan in his underground lab. This scene rewards very careful attention to what he's actually doing and what it means.","spoilerTier":"s2","spoiler":"Stan successfully activates the interdimensional portal \u2014 the machine the entire season had been building toward in the background. Season 2 reveals he built it to bring his brother Ford back from the other dimension. This moment in the Season 1 finale is when he finally succeeds in beginning the process \u2014 and the show cuts to credits without explaining any of it."},{"id":"s2e1-blind-eye-symbol","season":2,"episode":1,"title":"Society of the Blind Eye symbol appears before the Society does","category":"background","hint":"In 'Scary-oke,' look at the decorative elements on the walls of Gravity Falls' local establishments. One symbol recurs that doesn't fit the rustic decor.","spoilerTier":"s2","spoiler":"The Society of the Blind Eye's emblem \u2014 an eye with a slash through it \u2014 appears on the wall of at least one local building in the Season 2 premiere. The Society won't be introduced until later in Season 2, but they've apparently been marking their presence around town for a very long time."},{"id":"s2e1-fiddleford-photo","season":2,"episode":1,"title":"Young McGucket in Stan's photograph","category":"background","hint":"Season 2 opens with a framed photograph on Stan's desk that wasn't there in Season 1. Look at the two people in it.","spoilerTier":"s2","spoiler":"The photo shows a younger Stan Pines alongside a man recognizable as a young Fiddleford McGucket \u2014 confirming they knew each other decades before the show's events, long before the show explains the connection. Fans who spotted it had a head start on understanding McGucket's real backstory."},{"id":"s2e2-cipher-wheel-margin","season":2,"episode":2,"title":"The zodiac wheel sketched in the journal margins","category":"journal","hint":"In 'Into the Bunker,' during the shapeshifter sequence, one of the journal pages that briefly comes into focus has something drawn in the margin that isn't part of the main entry.","spoilerTier":"s2","spoiler":"The margin contains a partial sketch of the zodiac wheel \u2014 the twelve-symbol cipher circle used to defeat Bill Cipher in the Season 2 finale. It appears here in episode 2 of Season 2, months before the finale aired, as a margin doodle that most viewers registered as set decoration."},{"id":"s2e2-shapeshifter-journal","season":2,"episode":2,"title":"Shapeshifter journal page shows future forms","category":"journal","hint":"In 'Into the Bunker,' when the journal page about the shapeshifter is shown, read all of the text and look at the silhouettes around the edge \u2014 not just the main illustration.","spoilerTier":"s2","spoiler":"The journal page lists various forms the shapeshifter can take, including silhouettes that match creatures introduced later in Season 2. One silhouette appears consistent with Bill Cipher's physical form during Weirdmageddon, suggesting Ford had already documented what Bill looked like when embodied in the physical world."},{"id":"s2e4-bill-possession-mirror","season":2,"episode":4,"title":"'Sock Opera' mirrors Bill's possession thematically","category":"background","hint":"The premise of 'Sock Opera' involves someone taking control of something that isn't theirs to control. Pay attention to how this mirrors what Bill does later in the same episode.","spoilerTier":"s2","spoiler":"The entire episode is structured as a deliberate mirror of Bill's possession of Dipper's body \u2014 a puppet manipulated by a controlling force. Mabel's puppet show and Bill's takeover run as parallel narratives throughout. When Bill finally possesses Dipper, the show has spent 20 minutes laying the visual and thematic groundwork for exactly that moment."},{"id":"s2e4-memory-eraser-schematic","season":2,"episode":4,"title":"Memory eraser schematics in Journal 3","category":"journal","hint":"In 'Sock Opera,' a journal page is briefly visible during Dipper's research montage that shows a device he isn't looking for. Pause on it.","spoilerTier":"s2","spoiler":"The page contains partial schematics for the Society of the Blind Eye's memory erasing device \u2014 meaning Ford had documented it in Journal 3. He knew the Society existed and had studied their technology. The show never addresses why he didn't act on this knowledge, which makes Ford's character considerably more complicated."},{"id":"s2e5-mcgucket-portal-screen","season":2,"episode":5,"title":"McGucket's screen shows a portal schematic","category":"background","hint":"In 'Soos and the Real Girl,' during McGucket's junkyard scenes, one of his many improvised screens displays something technical. Pause on it.","spoilerTier":"s2","spoiler":"The screen displays a cross-section consistent with the interdimensional portal's internal structure \u2014 matching Ford's schematics shown later in Season 2. McGucket helped design the portal, and fragments of that knowledge persist in his deteriorated mind, surfacing as technical drawings he produces without understanding what they mean."},{"id":"s2e6-northwest-crest-latin","season":2,"episode":6,"title":"The Northwest family crest has a betrayal motto","category":"background","hint":"In 'Northwest Mansion Mystery,' the family crest visible throughout the manor contains Latin text. It's small but readable if you pause.","spoilerTier":"s2","spoiler":"The Latin inscription on the Northwest crest translates roughly to 'we betray to ascend' \u2014 a perfect summary of how the Northwest family actually obtained their wealth and status, which the episode goes on to reveal in full. The crest was designed to tell the truth before the plot did."},{"id":"s2e6-ghost-painting-changes","season":2,"episode":6,"title":"The lumberjack ghost's portrait expression changes","category":"background","hint":"In 'Northwest Mansion Mystery,' before the ghost makes himself known, look at the antique paintings on the manor walls between scenes. Something about one of them shifts.","spoilerTier":"safe","spoiler":"The portrait of the lumberjack ghost shows his expression changing subtly between shots \u2014 the animators drew multiple versions of the painting and swapped them across scenes. It only works as a detail on freeze-frame or careful rewatch, but the ghost is effectively watching the characters through his own portrait the entire episode."},{"id":"s2e7-ford-silhouette-portal","season":2,"episode":7,"title":"Ford's silhouette visible through the portal","category":"background","hint":"In 'Society of the Blind Eye,' Stan's lab is briefly shown. Look at the light coming through the portal \u2014 specifically at the shape it illuminates from the other side.","spoilerTier":"s2","spoiler":"A humanoid silhouette is visible through the portal's energy \u2014 Ford, on the other side. He had been visible in background portal shots since the Season 1 finale, but this is one of the clearest instances before his formal introduction. Rewatchers recognize him immediately."},{"id":"s2e8-journal-bill-warning","season":2,"episode":8,"title":"Ford's warning about Bill in Journal 3","category":"journal","hint":"In 'Blendin's Game,' Dipper consults Journal 3 at one point. The page visible has a header and margin notes you can read if you pause.","spoilerTier":"s2","spoiler":"The journal page is Ford's entry on Bill Cipher, and the margin contains a warning: 'DO NOT MAKE DEALS WITH THIS CREATURE.' Ford wrote this from personal experience \u2014 he made exactly that mistake himself. Dipper reads right past the warning. On rewatch, this is one of the most painful moments in the series."},{"id":"s2e9-bill-eye-tapestry","season":2,"episode":9,"title":"Bill's symbol in Gravity Falls' historical tapestry","category":"background","hint":"In 'The Love God,' the town's civic building or hall contains an old tapestry depicting local history. Look at the details in the background imagery.","spoilerTier":"s2","spoiler":"Bill Cipher's triangular eye is woven into what's supposed to be a historical document of Gravity Falls \u2014 suggesting Bill's influence on the town predates the show's events by centuries. The townspeople have been living with his symbol embedded in their own history without knowing what it means."},{"id":"s2e11-not-what-he-seems-cipher","season":2,"episode":11,"title":"Vigen\u00e8re cipher hidden in 'Not What He Seems'","category":"cryptogram","hint":"In 'Not What He Seems,' a document shown during the government agent scenes has a text block in the lower portion of the page. Try decoding it with the Vigen\u00e8re cipher.","spoilerTier":"s2","spoiler":"Decoded with the key STANFORD, the text reads 'HE IS THE AUTHOR' \u2014 referring to Ford Pines. The decoding community cracked this before Ford's identity was revealed in the episode itself, giving fans who were still actively solving ciphers a brief window where they knew the answer before the general audience did."},{"id":"s2e11-weirdmageddon-sky","season":2,"episode":11,"title":"Weirdmageddon already seeping into the sky","category":"background","hint":"In 'Not What He Seems,' during exterior shots before the portal fully activates, look at the sky near the horizon. Something is wrong with it.","spoilerTier":"s2","spoiler":"A faint prismatic discoloration is visible in the sky in two exterior wide shots \u2014 the first visual sign of reality breaking down as the portal approaches full power. It's easy to miss because of how much is happening in the foreground, but it's a deliberate visual signal that the world is already changing before Bill arrives."},{"id":"s2e12-ford-six-fingers-intro","season":2,"episode":12,"title":"Ford's first visible body part is his hand","category":"background","hint":"When Ford steps through the portal at the climax of 'Not What He Seems,' pay attention to what the camera chooses to show first.","spoilerTier":"s2","spoiler":"Ford's introduction is framed around his hand \u2014 specifically shot to show six fingers. The show had been planting the six-finger detail since Season 1, and here it pays off: his first visible body part is the very detail that identifies him. It's the same hand visible in journal handprints and margin illustrations scattered across both seasons."},{"id":"s2e13-stans-backstory-clues","season":2,"episode":13,"title":"'A Tale of Two Stans' confirms Season 1 background details","category":"background","hint":"Watch 'A Tale of Two Stans' as a rewatch specifically looking for callbacks to background details you noticed in Season 1 \u2014 the document on the wall, the door in the hallway, the blueprints.","spoilerTier":"s2","spoiler":"This episode retroactively confirms what every Season 1 background detail was pointing at: Stan was Stanley Pines, living under his brother Ford's name, having spent years building a portal to bring Ford home from another dimension. Every anomalous background prop in Season 1 \u2014 the blueprints, the lab door, the tattoo \u2014 was part of this story the whole time."},{"id":"s2e15-zodiac-wheel-full","season":2,"episode":15,"title":"The complete zodiac wheel shown for the first time","category":"journal","hint":"In 'The Last Mabelcorn,' Ford shows Dipper a research diagram. It contains twelve symbols arranged in a circle. Look at all twelve carefully.","spoilerTier":"s2","spoiler":"This is the first full, clear view of the zodiac wheel. Every symbol corresponds to a character: the pine tree (Dipper), the shooting star (Mabel), the question mark (Soos), the ice bag (McGucket), the glasses (Ford), the six-fingered hand (also Ford as author), the star (Stan), and others. Fans mapped all twelve symbols to characters months before the finale revealed their significance."},{"id":"s2e17-weirdmageddon-warning-cipher","season":2,"episode":17,"title":"Credits cipher: 'WEIRDMAGEDDON IS COMING'","category":"cryptogram","hint":"The end card of 'Dipper and Mabel vs. the Future' contains a Vigen\u00e8re cipher. Use STANFORD as the key.","spoilerTier":"finale","spoiler":"Decoded: 'WEIRDMAGEDDON IS COMING' \u2014 broadcast one episode before Weirdmageddon actually begins. Fans who were actively decoding the credits had a full week's warning of what was about to happen. Viewers who weren't looking for the ciphers walked into it completely blind."},{"id":"s2e18-bill-army-old-faces","season":2,"episode":18,"title":"Bill's chaos army contains background creatures from earlier episodes","category":"background","hint":"During Bill's Weirdmageddon takeover, his assembled army of chaos creatures includes some figures that look familiar. Cross-reference them against background props and creatures from Season 1.","spoilerTier":"s2","spoiler":"Several of Bill's Weirdmageddon creatures match or closely resemble monsters, paintings, and strange figures glimpsed in the background of earlier episodes \u2014 in the Mystery Shack gift shop, the forest, and local buildings. The implication is that Bill had agents and avatars embedded in Gravity Falls long before his official arrival during Weirdmageddon."},{"id":"s2e19-wax-larry-king-hand","season":2,"episode":19,"title":"Wax Larry King's hand on Dipper's backpack","category":"background","hint":"In the Weirdmageddon episodes, when Dipper is shown with his backpack, look at what's attached to the outside of the bag \u2014 it's a prop from Season 1.","spoilerTier":"s1","spoiler":"Attached to Dipper's bag is the severed wax hand of Wax Larry King from the 'Headhunters' episode \u2014 an unexplained background prop with no in-episode significance. Alex Hirsch confirmed it was placed there deliberately as a reward for viewers who remembered where it came from. Season 1 memorabilia, carried into the apocalypse."},{"id":"s2e20-bill-statue-real-world","season":2,"episode":20,"title":"Real-world Bill Cipher statue hidden by GPS coordinates","category":"cryptogram","hint":"The finale's end credits contain encrypted text that, when decoded, gives real-world GPS coordinates. This is not part of the show's fiction \u2014 it leads somewhere you can actually go.","spoilerTier":"finale","spoiler":"The coordinates lead to Reedsport, Oregon, where a life-sized Bill Cipher statue was installed by Alex Hirsch as part of a real-world ARG. Visitors who find it can call a phone number on the base and hear a message from 'the author.' The statue is still there and the number still works as of the show's last anniversary event."},{"id":"s2e20-journals-combined","season":2,"episode":20,"title":"The three journals were always meant to be assembled","category":"journal","hint":"In the finale, when all three journals are brought together, look at their covers side by side. There's something about their design that only makes sense when they're combined.","spoilerTier":"finale","spoiler":"The three journal covers, when placed together in order, form a single continuous image \u2014 the portal diagram, split across all three books. Ford designed the journals so that no single one contained enough information to activate the portal; you needed all three to even understand what you were building. Stan spending years tracking down and assembling all three was the only way the portal could ever work."},{"id":"multi-blendin-appearances","season":1,"episode":1,"title":"Blendin Blandin's three pre-debut background appearances","category":"background","hint":"Before Blendin Blandin is formally introduced in episode 9, he appears in the background of at least three earlier episodes. Try spotting him in the crowd and establishing scenes of episodes 1, 5, and 16.","spoilerTier":"s1","spoiler":"Blendin appears near the Mystery Shack entrance in episode 1, at the Dusk 2 Dawn parking lot in episode 5, and at the county fair in episode 16 \u2014 always in his camouflage jumpsuit, always just off to the side. In-universe, he's tracking the twins through time. His appearances cluster around events that later affect the timeline he's supposed to protect."},{"id":"multi-six-finger-clues","season":1,"episode":1,"title":"Six-finger clues span both seasons of the show","category":"journal","hint":"Journal 3 contains handprints, margin sketches, and illustrations attributed to the author throughout both seasons. Stop looking at the content of those illustrations and look at the hands drawing them.","spoilerTier":"s2","spoiler":"Every hand illustration in Journal 3 \u2014 handprints, margin drawings, border decorations \u2014 shows six fingers. The clue is present from the first time Dipper opens the journal in episode 1. The author's defining physical characteristic is visible in his own handwriting across both seasons of the show. It was always there."},{"id":"multi-bill-eye-everywhere","season":1,"episode":1,"title":"Bill's triangle-eye embedded throughout the show's visual design","category":"background","hint":"Bill Cipher's motif \u2014 a triangle with a single eye \u2014 appears in background props, floor patterns, wall decorations, printed materials, and set dressing across dozens of episodes. Pick any episode at random and look for it.","spoilerTier":"s2","spoiler":"The production team embedded Bill's symbol throughout the show's visual design as a thematic statement: Bill is literally everywhere in Gravity Falls, woven into the fabric of the town long before he physically arrives. He is in the carpet, the wallpaper, the currency, the tapestries, and the journals \u2014 the town has been his territory the entire time, and no one living there knew it."}],
    "data/ciphers.json": [{"id":"caesar","name":"Caesar Cipher","shift":3,"seasons":[1],"description":"The first cipher used in the show. Each letter is shifted back 3 positions in the alphabet. Appeared in Season 1 end-credits from episodes 1\u20136.","example":{"encoded":"ZHOFRPH WR JUDYLWB IDOOV","decoded":"WELCOME TO GRAVITY FALLS","source":"S1E2 end credits"},"tip":"To decode manually: for each letter, count back 3 in the alphabet. A\u2192X, B\u2192Y, C\u2192Z, D\u2192A, etc."},{"id":"atbash","name":"Atbash Cipher","seasons":[1],"description":"Introduced mid-Season 1. Each letter is mirrored across the alphabet: A becomes Z, B becomes Y, and so on. It's its own key \u2014 encoding and decoding use the same operation.","example":{"encoded":"HZBWRMT HGZMBVI","decoded":"STAYING STAYNER","source":"S1E7 end credits"},"tip":"Mirror each letter: A\u2194Z, B\u2194Y, C\u2194X, D\u2194W... The alphabet folds in half."},{"id":"a1z26","name":"A1Z26 Cipher","seasons":[1,2],"description":"Used in late Season 1 and early Season 2. Letters are replaced with their numerical position in the alphabet: A=1, B=2, all the way to Z=26. Numbers are typically separated by dashes or spaces.","example":{"encoded":"19-20-1-14-6-15-18-4","decoded":"STANFORD","source":"S1E20 end credits"},"tip":"Enter numbers separated by spaces or dashes. Each number maps directly to a letter position."},{"id":"vigenere","name":"Vigen\u00e8re Cipher","key":"STANFORD","seasons":[2],"description":"The most complex cipher in the show, introduced in Season 2. Uses the keyword STANFORD as a repeating key. Each letter of the message is shifted by the corresponding letter in the key (A=0, B=1... Z=25). Named after Blaise de Vigen\u00e8re, but the show's use of STANFORD as the key is a direct reference to Ford Pines.","example":{"encoded":"ZKBVIQZSRIQMFBV","decoded":"DIPPER IS THE AUTHOR","source":"S2E2 end credits (fan-decoded)"},"tip":"The key STANFORD repeats over the message. Each key letter shifts the message letter by its alphabet position."},{"id":"bill-wheel","name":"Bill's Symbol Wheel","seasons":[2],"description":"A substitution cipher using the 12 symbols from Bill Cipher's zodiac/cipher wheel. Each symbol corresponds to a letter or concept. Appeared primarily in Season 2 promotional materials, the Journal 3 prop book, and select frames during Weirdmageddon. This is the rarest cipher in the show and some messages using it remain partially decoded.","example":{"encoded":"\ud83d\udd3a \ud83d\udc41 \ud83c\udf32 \ud83c\udf0a \ud83e\uddb4 \ud83d\udc1e \u270b \u2b50 \ud83d\udc1f \ud83d\udd25 \ud83c\udf19 \ud83c\udf08","decoded":"The 12 symbols of the wheel \u2014 each represents a character or concept in the finale.","source":"S2 finale / promotional art"},"tip":"Each of the 12 wheel symbols corresponds to one of the zodiac characters. The full substitution alphabet is documented in the official Journal 3 prop replica."},{"id":"multilayer","name":"Multi-Layer Combined Cipher","seasons":[2],"description":"Used in the finale and some Season 2 promotional ARG materials. Messages are encoded in one cipher, and the result is then encoded in a second cipher. The most common pairing was Caesar \u2192 Atbash. Decoding requires running both ciphers in sequence, in the correct order \u2014 getting the order wrong produces gibberish.","example":{"encoded":"WBZXY (Caesar first, then Atbash)","decoded":"Apply Caesar shift 3, then mirror the result through Atbash.","source":"Gravity Falls ARG / fan community documentation"},"tip":"Try Caesar first, then run the result through Atbash. If that fails, reverse the order."}],
    "data/characters.json": [{"id":"dipper","name":"Dipper Pines","role":"Main protagonist","color":"blue","initial":"D","bio":"Mason 'Dipper' Pines is a 12-year-old sent to spend the summer with his great-uncle Stan in Gravity Falls, Oregon. Bookish, anxious, and relentlessly curious, he discovers Journal 3 in the attic of the Mystery Shack and becomes the de facto investigator of the town's supernatural underbelly. His desire to be taken seriously \u2014 by adults, by Ford, by himself \u2014 is the emotional engine of his arc. He matures over the course of two seasons from a kid chasing mystery for fun into someone who has to decide what kind of person he wants to be when real stakes are on the table.","eggIds":["s1e6-hand-symbol","s1e9-bill-debut","s2e2-cipher-wheel"],"hiddenFacts":["Dipper's real name, Mason, is never said aloud in the show. It only appears in background text \u2014 a name tag in one episode, a piece of mail in another.","His hat's pine tree symbol was chosen before his last name was finalized. The name Pines came after the hat, not before.","In early production drafts, Dipper was named 'Goose.' Alex Hirsch has said the original version of the character was much more of a straight-man cipher \u2014 the oddness of Gravity Falls was added after."]},{"id":"mabel","name":"Mabel Pines","role":"Twin sister / co-protagonist","color":"pink","initial":"M","bio":"Mabel is Dipper's twin sister and emotional counterweight \u2014 optimistic, chaotic, and unshakeably devoted to the people she loves. Where Dipper investigates, Mabel experiences. She processes the weirdness of Gravity Falls not as a puzzle to be solved but as a canvas for enthusiasm. Her arc is subtler than Dipper's but no less real: she has to reckon with the end of summer, the possibility of Dipper leaving, and the uncomfortable idea that wanting things to stay the same isn't the same as things being okay. She is, by design, almost impossible not to love.","eggIds":["s1e12-stan-fez","s1e3-wax-figures"],"hiddenFacts":["Mabel's sweaters are hand-designed for almost every episode she appears in \u2014 over 60 unique designs across the series. Several were based on real sweaters sent to the production team by fans during Season 1.","Her grappling hook, introduced as a joke gift in episode 1, becomes a legitimate plot device in at least five episodes. It was not originally planned to recur \u2014 writers kept finding reasons to bring it back.","The name Mabel is an old-fashioned name deliberately chosen to feel slightly out of time \u2014 matching Gravity Falls' own unstuck, timeless quality."]},{"id":"stan","name":"Grunkle Stan","role":"Great-uncle / Mystery Shack owner","color":"amber","initial":"S","bio":"Stanford 'Stan' Pines \u2014 except he isn't, and that's the whole thing. The man the twins know as Grunkle Stan spent decades living under his twin brother's name, running a tourist trap in a town full of things he had to pretend he didn't see, waiting for a portal he didn't fully understand to do something he could barely bring himself to hope for. He presents as a grumpy, mercenary con man. He is actually one of the most devoted characters in the show \u2014 just devoted in ways that require two seasons to fully understand. His redemption doesn't feel earned at the end because the show finally argues for it. It feels earned because you realize it was always true.","eggIds":["s1e1-journals-shelf","s1e2-stan-tattoo","s1e12-stan-fez","s2e20-stans-real-name","s1e13-underground-lab"],"hiddenFacts":["Stan's full name \u2014 Stanley, not Stanford \u2014 is visible on a document in the Mystery Shack as early as episode 1. No one noticed because there was no reason to look.","His fez's emblem changes slightly between Season 1 and Season 2. The production team has never officially commented on why.","Alex Hirsch has said Stan was the hardest character to write because every scene had to work on two levels simultaneously \u2014 what the audience thought was happening, and what was actually happening."]},{"id":"ford","name":"Ford Pines","role":"Author of the Journals","color":"teal","initial":"F","bio":"Stanford Pines \u2014 the real one \u2014 spent 30 years in other dimensions after being pushed through his own portal by someone he trusted. He came to Gravity Falls as a researcher following an anomalous signal, built a machine that could pierce dimensional barriers, and made a deal with a dream demon that nearly ended the world. He's brilliant, paranoid, and deeply lonely, carrying guilt he doesn't know how to put down. His relationship with Stan is the emotional spine of Season 2 \u2014 two brothers who hurt each other badly, who spent decades apart, who have to decide if the thing they were to each other is still true.","eggIds":["s1e6-hand-symbol","s1e1-journals-shelf","s2e1-fiddleford-photo","s2e2-cipher-wheel"],"hiddenFacts":["Ford has six fingers on each hand \u2014 the detail that identifies him as the journal's author. This is hinted at via hand prints and journal illustrations throughout Season 1, but the significance isn't clear until his reveal.","His portal was explicitly designed to be powered by three journals used together \u2014 meaning it couldn't function unless all three were assembled. Stan had to collect all three before even beginning to attempt activation.","Ford's design was partially inspired by how the production team imagined an older, more world-weary version of Dipper might look \u2014 his curiosity calcified into obsession."]},{"id":"bill","name":"Bill Cipher","role":"Antagonist / dream demon","color":"red","initial":"B","bio":"Bill Cipher is a two-dimensional being from a dimension of pure thought, and every word of that sentence is as strange as it sounds. He operates in dreams, he makes deals, and he wants into the physical world with a patience that makes you understand he's been playing this game a very long time. He's funny \u2014 genuinely, disarmingly funny \u2014 which makes him more frightening, not less. He's the kind of villain who can be delighted by everything and care about nothing simultaneously. His relationship to the show's world is one of pure instrumentality: Gravity Falls is interesting to him only as a door, and the people in it are only as valuable as their usefulness. The horror is how long he maintains the performance of caring.","eggIds":["s1e1-bill-triangle","s1e8-bill-first-shadow","s1e9-bill-debut","s2e2-cipher-wheel","s2e11-weirdmageddon-shadow"],"hiddenFacts":["Bill's backward speech \u2014 revealed when audio is reversed \u2014 has been documented across dozens of episodes. Not all of it has been decoded. Some of what has been decoded doesn't match any known context, suggesting it may reference events that never made it into the final series.","His signature phrase 'A-B-C-D-E-F-G-H-I-J-K-LMNOP' is a joke about the limits of his comprehension of human culture \u2014 he knows the beginning and end of the alphabet song but not the hard part in the middle.","Bill's design is a direct reference to the Eye of Providence \u2014 the pyramid-and-eye symbol on the US dollar. His appearance in the show's pilot on the dollar bill register scene was entirely intentional."]},{"id":"soos","name":"Soos Ramirez","role":"Mystery Shack handyman","color":"green","initial":"S","bio":"Jesus Alzamirano Ramirez \u2014 Soos to everyone who knows him \u2014 has worked at the Mystery Shack since he was 12 years old, when Stan gave him a job on a whim and accidentally became one of the most important people in his life. He's the show's heart in the most literal sense: he loves without calculation, he shows up, and he asks almost nothing in return. His backstory, revealed late in the series, recontextualizes everything warm about him and makes it considerably more affecting. He is proof that Gravity Falls knew exactly what it was doing with every character it introduced, even the ones who appeared to be pure comic relief.","eggIds":["s1e3-wax-figures"],"hiddenFacts":["Soos was designed as a one-scene character in the pilot \u2014 the handyman who helps Dipper and Mabel find the attic. He was kept in every episode because the writers couldn't figure out how to make scenes work without him.","His full name \u2014 Jesus Alzamirano Ramirez \u2014 is said aloud exactly once in the entire series, in a Season 2 episode, and is easy to miss.","The question mark on his shirt was originally a placeholder during character design and was kept because it fit him perfectly."]},{"id":"wendy","name":"Wendy Corduroy","role":"Mystery Shack cashier","color":"teal","initial":"W","bio":"Wendy is 15, works the register at the Mystery Shack with the energy of someone doing community service, and is the coolest person Dipper has ever seen. She's the show's most grounded character \u2014 not supernatural, not a genius, not particularly burdened by the mysteries of Gravity Falls \u2014 just a teenager trying to have a good summer before real life shows up. Her friendship with Dipper is handled with unusual honesty: she knows he has a crush, she cares about him too much to pretend otherwise, and she manages the situation like an actual person would. She's also tougher than she looks. The Corduroy family history makes clear that 'cool and laid-back' is something Wendy built deliberately, not something that came easily.","eggIds":["s1e5-blendin-first"],"hiddenFacts":["Wendy is the only main cast member with no supernatural abilities, no connection to the journals, and no direct involvement in the final battle with Bill. This was intentional \u2014 the writers wanted one character who represented normal teenager life in an abnormal town.","Her last name, Corduroy, and her family's lumberjack heritage were developed specifically to explain why she's so unimpressed by physical danger. It's not bravado \u2014 she genuinely grew up around chainsaws and bears.","In the episode that reveals her home life, her father Manly Dan is shown to have the same 'acting cooler than I feel' energy she does. The show implies the Corduroy emotional style is multigenerational."]},{"id":"mcgucket","name":"Fiddleford McGucket","role":"Local eccentric / former genius","color":"amber","initial":"F","bio":"Old Man McGucket seems, at first, like set dressing \u2014 the town's harmless local eccentric, living in a junkyard, building improbable machines. He is not set dressing. He was once Ford's research partner, a genuine genius who helped build the portal and was the first person to look through it. What he saw broke him. He invented a memory-erasing device specifically to forget what was on the other side, used it so many times he forgot almost everything about who he was, and ended up in Gravity Falls as a remnant. His recovery arc in Season 2 is one of the show's most quietly moving stories.","eggIds":["s2e1-fiddleford-photo"],"hiddenFacts":["McGucket appears in the background of at least three Season 1 episodes in which he theoretically has no business being \u2014 near the Mystery Shack, near the forest, once outside a building the plot never enters. Whether this is foreshadowing or oversight has never been confirmed.","His memory erasing machine \u2014 later revealed to be Society of the Blind Eye technology \u2014 was partially documented in Journal 2. Fans who frame-hunted the journal pages in Season 1 found partial schematics before the plot explained them.","His son Tate McGucket appears in Season 1 without any connection to the main plot, because at that point in production the character of McGucket hadn't been fully developed."]}],
    "data/marginalia.json": [{"id":"mg-shack-sign","location":"Mystery Shack exterior sign","episodes":"S1, multiple","text":"\"MYSTERY SHACK \u2014 ENTER IF YOU DARE \u2014 ADMISSION $10 / CHILDREN $15\"","note":"Children cost more than adults. Stan's pricing is on the sign from the very first episode and no one in the show ever comments on it."},{"id":"mg-journal-warning","location":"Journal 3, inside front cover","episodes":"S1E1","text":"\"Property of: ??? \u2014 DO NOT READ\"","note":"The author's name is literally replaced with question marks. Ford wrote this knowing he might forget who he was, or knowing someone else might find it. The instruction is addressed to no one in particular, which makes it more unsettling than a name would."},{"id":"mg-journal-3-warning2","location":"Journal 3, page margins throughout","episodes":"S1\u2013S2","text":"\"I know he's watching\" / \"don't trust him\" / \"it's too late for me\"","note":"Ford's margin annotations grow increasingly paranoid as the journals progress. These notes are addressed to the reader \u2014 whoever found the journal \u2014 not to himself. He was writing instructions for a successor he hoped would never exist."},{"id":"mg-stan-wanted","location":"Post office wall, background","episodes":"S1E3","text":"\"WANTED: STANFORD PINES \u2014 FRAUD, IMPERSONATION, UNLICENSED TOURISM\"","note":"The wanted poster uses the name Stanford, not Stanley. Readable if you pause. Stan is wanted under his brother's name \u2014 which means law enforcement already suspects him of impersonation, but for the wrong reasons."},{"id":"mg-laptop-warning","location":"McGucket's laptop screen","episodes":"S1E10","text":"\"EXPERIMENT LOG 00026 \u2014 SUBJECT RETAINS 0% MEMORY \u2014 PROCEED\"","note":"McGucket's own experiment log, visible on his screen for two frames. He documented himself erasing his memories so methodically that he kept notes on how completely it was working. The log number suggests he did this at least 26 times before this entry."},{"id":"mg-gravity-falls-gossiper","location":"Gravity Falls Gossiper newspaper","episodes":"S1E7","text":"\"LOCAL MAN STILL NOT ACCOUNTED FOR \u2014 FORD PINES, NOTED RESEARCHER, MISSING SINCE 1982\"","note":"The newspaper headline is readable in the background of the gift shop. 1982 is the year Ford went through the portal. The paper treats it as an old unsolved disappearance. Stan has been living under Ford's name for over 30 years at this point in the story."},{"id":"mg-shack-rules","location":"Mystery Shack employee break room","episodes":"S1E13","text":"\"RULES: 1. No refunds. 2. No questions. 3. If you hear something in the basement, you did not hear something in the basement.\"","note":"Rule 3 is the tell. Stan had an active interdimensional portal in the basement the entire time the shack was operating as a tourist attraction. He wrote this rule himself. It implies staff had been hearing it for years."},{"id":"mg-bill-contract","location":"Bill Cipher's deal contract (pause frame)","episodes":"S1E19","text":"\"I, THE UNDERSIGNED, AGREE TO GIVE BILL CIPHER ACCESS TO MY MIND IN EXCHANGE FOR [REDACTED] \u2014 SIGNED: GIDEON GLEEFUL\"","note":"The contract is visible for a fraction of a second when Gideon makes his deal. The consideration \u2014 what Bill agreed to give Gideon in exchange \u2014 is literally blacked out. The show never reveals what Gideon asked for. Fans have speculated for a decade."},{"id":"mg-ford-research-board","location":"Ford's underground lab corkboard","episodes":"S2E12","text":"Pinned notes: \"BILL KNOWS ABOUT THE PORTAL\" / \"DO NOT DREAM\" / \"SLEEP ONLY 4 HRS\" / \"IT'S IN THE WALLS\"","note":"Ford's lab corkboard is readable in several Season 2 frames. 'DO NOT DREAM' and 'SLEEP ONLY 4 HRS' confirm he was rationing sleep to limit Bill's access to his mind. 'IT'S IN THE WALLS' has never been satisfactorily explained."},{"id":"mg-society-blindeye-book","location":"Society of the Blind Eye ceremony room","episodes":"S2E7","text":"\"WHAT IS SEEN CANNOT BE UNSEEN \u2014 WHAT IS FORGOTTEN IS MERCY\"","note":"The Society's motto, carved above the door of their meeting room. It frames memory erasure as an act of compassion \u2014 they genuinely believed they were protecting people. This makes them considerably more tragic than a simple villain organization."},{"id":"mg-grunkle-stan-diploma","location":"Stan's office wall","episodes":"S1, multiple","text":"\"STAN PINES \u2014 CERTIFICATE OF ATTENDANCE \u2014 GLASS SHARD COMMUNITY COLLEGE \u2014 HALF A SEMESTER\"","note":"Stan's only credential, hung proudly in his office alongside the Mystery Shack's operating license (which expires in 1999). Both are visible in wide shots. The diploma says 'Certificate of Attendance,' not graduation, and specifies half a semester."},{"id":"mg-dipper-journal-marginalia","location":"Dipper's own notes in Journal 3","episodes":"S1\u2013S2","text":"Margin notes in different ink: \"this can't be right\" / \"ask Stan??\" / \"DON'T TRUST\" with an arrow pointing at a redacted name","note":"Dipper annotated Journal 3 in his own handwriting as he read it. His notes are in noticeably shakier handwriting than Ford's, suggesting he was writing them quickly or nervously. The redacted name he distrusts is never shown clearly enough to read."},{"id":"mg-weirdmageddon-graffiti","location":"Gravity Falls town walls during Weirdmageddon","episodes":"S2E18\u2013S2E20","text":"Various graffiti: \"HE KNOWS YOUR NAME\" / \"CIPHER SEES ALL\" / \"THERE IS NO GOING BACK\" / \"WE TRIED\"","note":"During Weirdmageddon, the town walls are covered in graffiti from residents before they were petrified or captured. These were written by ordinary townspeople who had hours or minutes to leave a record. 'WE TRIED' appears near the town hall entrance."},{"id":"mg-postcard-author","location":"Postcard visible in Stan's drawer","episodes":"S2E13","text":"\"Stan \u2014 I know you haven't forgiven me. I haven't forgiven myself. But if you're reading this, the machine worked. \u2014 F\"","note":"Visible for three frames when Stan opens his desk drawer in 'A Tale of Two Stans.' The postcard is from Ford, sent through the portal before he was fully trapped on the other side. Stan received confirmation that the portal could work \u2014 that Ford was alive \u2014 and spent 30 years building it alone."},{"id":"mg-gift-shop-oddities","location":"Mystery Shack gift shop shelves","episodes":"S1, multiple","text":"Product labels: \"GENUINE MONSTER HAIR (CAT)\" / \"CURSED GEMSTONE (PROBABLY FINE)\" / \"AUTHENTIC GRAVITY FALLS DIRT ($8/oz)\"","note":"Stan's gift shop labels are fully readable throughout the series and are uniformly, specifically dishonest. The parenthetical disclaimers \u2014 '(cat)', '(probably fine)' \u2014 suggest he considered not including them and decided they made the scam more defensible."}],
    "data/quotes.json": [{"quote":"I'm watching you, nerds.","context":"Bill Cipher, S1E9"},{"quote":"Time is dead and meaning has no meaning. Existence is upside-down and I reign supreme. WELCOME, ONE AND ALL, TO WEIRDMAGEDDON.","context":"Bill Cipher, S2E18"},{"quote":"Hey, wanna hear my impression of you in about three seconds? AAAAAAHHHH!","context":"Bill Cipher, S1E19"},{"quote":"I've been watching you, kid. You've got that look \u2014 that hungry look. Like you actually want to know the truth.","context":"Bill Cipher, S1E19"},{"quote":"A-B-C-D-E-F-G \u2014 help me trap souls and get the key!","context":"Bill Cipher, S2E4"},{"quote":"Heh heh heh... just as planned.","context":"Bill Cipher, S1E19"},{"quote":"Reality is an illusion, the universe is a hologram, buy gold, BYE!","context":"Bill Cipher, S1E19"},{"quote":"You can't stop what's coming. The rift will open. I will be free. And then... the fun begins.","context":"Bill Cipher, S2E11"},{"quote":"I've got some children I need to make into corpses.","context":"Bill Cipher, S2E18"},{"quote":"Sixer! It's been too long! Or has it been long enough? I always lose track when I'm everywhere at once.","context":"Bill Cipher, S2E12"},{"quote":"Dream a little dream of me.","context":"Bill Cipher, multiple episodes"},{"quote":"The show isn't over when the hero loses. It's over when I SAY it's over.","context":"Bill Cipher, S2E20"},{"quote":"Remember: reality is an illusion, the universe is a hologram, and existence itself is a punchline. The joke's on all of you.","context":"Bill Cipher, S2 ARG"},{"quote":"Pain is hilarious.","context":"Bill Cipher, S2E18"},{"quote":"I am the master of the mindscape. In here, I make the rules \u2014 and the rules say you lose.","context":"Bill Cipher, S1E19"}],
    "data/cipherhunt.json": [{"id":"ch-s1e2","season":1,"episode":2,"episodeTitle":"The Legend of the Gobblewonker","cipherType":"caesar","encoded":"ZHOFRPH WR JUDYLWB IDOOV","decoded":"WELCOME TO GRAVITY FALLS","hint":"The most welcoming message in the show. Shift every letter back by 3."},{"id":"ch-s1e3","season":1,"episode":3,"episodeTitle":"Headhunters","cipherType":"caesar","encoded":"ZHOFRPH EDFN","decoded":"WELCOME BACK","hint":"The show acknowledging fans who were already checking the credits."},{"id":"ch-s1e4","season":1,"episode":4,"episodeTitle":"The Hand That Rocks the Mabel","cipherType":"caesar","encoded":"VWRS UHDGLQJ PB PLQG","decoded":"STOP READING MY MIND","hint":"Bill speaking directly to the audience \u2014 three episodes before he appears."},{"id":"ch-s1e5","season":1,"episode":5,"episodeTitle":"The Inconveniencing","cipherType":"caesar","encoded":"ELOO LV ZDWFKLQJ","decoded":"BILL IS WATCHING","hint":"A warning. Caesar shift 3, read backward from Z."},{"id":"ch-s1e6","season":1,"episode":6,"episodeTitle":"Dipper vs. Manliness","cipherType":"caesar","encoded":"QHYHU PLQG EDE","decoded":"NEVER MIND BAB","hint":"A deliberate red herring to test whether fans were actually decoding or guessing."},{"id":"ch-s1e7","season":1,"episode":7,"episodeTitle":"Double Dipper","cipherType":"caesar","encoded":"VWDQ LV QRW ZKDW KH VHHPV","decoded":"STAN IS NOT WHAT HE SEEMS","hint":"The central mystery of the entire series, stated plainly in episode 7."},{"id":"ch-s1e9","season":1,"episode":9,"episodeTitle":"The Time Traveler's Pig","cipherType":"caesar","encoded":"ZLOO BRX HQWHU WKH IDOOV","decoded":"WILL YOU ENTER THE FALLS","hint":"An invitation from Bill, placed right after his debut episode."},{"id":"ch-s1e10","season":1,"episode":10,"episodeTitle":"Fight Fighters","cipherType":"atbash","encoded":"HZBWRMT HGZMBVI","decoded":"STAYING STAYNER","hint":"The cipher type changed this episode. Mirror each letter: A\u2194Z, B\u2194Y..."},{"id":"ch-s1e13","season":1,"episode":13,"episodeTitle":"Boss Mabel","cipherType":"atbash","encoded":"GSVIV RH LMOB LMV NVHHZTV","decoded":"THERE IS ONLY ONE MESSAGE","hint":"Atbash again. The show suggesting everything points to a single truth."},{"id":"ch-s1e17","season":1,"episode":17,"episodeTitle":"Boyz Crazy","cipherType":"a1z26","encoded":"14-5-24-20 19-21-13-13-5-18","decoded":"NEXT SUMMER","hint":"The first A1Z26 cipher. Each number is a letter's position: 1=A, 26=Z."},{"id":"ch-s1e19","season":1,"episode":19,"episodeTitle":"Dreamscaperers","cipherType":"a1z26","encoded":"14-5-24-20 3-9-16-8-5-18 8-1-18-4-5-18","decoded":"NEXT CIPHER HARDER","hint":"A direct message to the fan decoding community. Season 2 would introduce Vigen\u00e8re."},{"id":"ch-s1e20","season":1,"episode":20,"episodeTitle":"Gideon Rises","cipherType":"caesar","encoded":"ELOO LV FRPLQJ","decoded":"BILL IS COMING","hint":"The last cipher of Season 1. Caesar shift 3. A promise and a threat."},{"id":"ch-s2e2","season":2,"episode":2,"episodeTitle":"Into the Bunker","cipherType":"vigenere","encoded":"ZKBVIQZSRIQMFBV","decoded":"DIPPER IS THE AUTHOR","hint":"Vigen\u00e8re with key STANFORD. A red herring planted by the show \u2014 Dipper is NOT the author."},{"id":"ch-s2e6","season":2,"episode":6,"episodeTitle":"Northwest Mansion Mystery","cipherType":"vigenere","encoded":"XJKXDOFMXIRIX","decoded":"FORD IS COMING BACK","hint":"Vigen\u00e8re, key STANFORD. The confirmation fans were waiting for."},{"id":"ch-s2e11","season":2,"episode":11,"episodeTitle":"Not What He Seems","cipherType":"vigenere","encoded":"TUBMVFNZFUMVIF","decoded":"HE IS THE AUTHOR","hint":"Vigen\u00e8re, key STANFORD. Cracked by fans before the episode aired \u2014 they knew before everyone else."},{"id":"ch-s2e17","season":2,"episode":17,"episodeTitle":"Dipper and Mabel vs. the Future","cipherType":"vigenere","encoded":"PJPVHROVKFZRVKFR","decoded":"WEIRDMAGEDDON IS COMING","hint":"Vigen\u00e8re, key STANFORD. One episode of warning before everything changed."},{"id":"ch-s2e20","season":2,"episode":20,"episodeTitle":"Weirdmageddon Part 3: Take Back the Falls","cipherType":"a1z26","encoded":"9-20-19 14-5-22-5-18 15-22-5-18","decoded":"ITS NEVER OVER","hint":"The final cipher of the series. Three words. A1Z26. Make of it what you will."}],
    "data/zodiac.json": [{"id":"pine-tree","symbol":"\ud83c\udf32","svgPath":"M0,-18 L6,0 L-6,0 Z M-3,0 L3,0 L3,8 L-3,8 Z","label":"Pine Tree","character":"Dipper Pines","angle":90,"description":"Dipper's hat symbol \u2014 the pine tree he found drawn on his hat before he had a name for himself. Ford later tells him the symbol chose him as much as he chose it.","finaleRole":"active","finaleNote":"Dipper's slot activated in the finale zodiac sequence. His willingness to trust Stan over Ford in the critical moment is what ultimately breaks the circle \u2014 making him simultaneously the wheel's greatest asset and its point of failure."},{"id":"shooting-star","symbol":"\u2b50","svgPath":"M0,-18 L2,-6 L14,-6 L4,2 L8,14 L0,6 L-8,14 L-4,2 L-14,-6 L-2,-6 Z","label":"Shooting Star","character":"Mabel Pines","angle":120,"description":"Mabel's sweater symbol for much of the series \u2014 the shooting star she wished on the night before leaving for Gravity Falls. She wished for a summer she'd never forget.","finaleRole":"active","finaleNote":"Mabel's slot activated. Her role in the finale is the emotional anchor \u2014 she refuses to give up on Stan even when Dipper doubts him, and that faith is what makes the memory restoration possible."},{"id":"question-mark","symbol":"\u2753","svgPath":"","label":"Question Mark","character":"Soos Ramirez","angle":150,"description":"The question mark on Soos's shirt \u2014 originally a design placeholder that was kept because it fit him too well. Soos is the show's most genuine mystery: a person who is exactly what he appears to be in a town full of things that aren't.","finaleRole":"active","finaleNote":"Soos's slot activated. He drives the Stan Vanzilla into the Fearamid, making the physical rescue of Dipper and Mabel possible. His role is unglamorous and essential."},{"id":"ice-bag","symbol":"\ud83e\uddca","svgPath":"","label":"Ice Bag","character":"McGucket","angle":210,"description":"McGucket's symbol is an ice bag \u2014 a reference to his mental state throughout the series, specifically the cold compresses he uses to manage the headaches from decades of memory erasure. Cold is also what remains when memory is gone.","finaleRole":"active","finaleNote":"McGucket's slot activated after recovering enough of his memories to function. His technical knowledge \u2014 he helped build the portal \u2014 is instrumental in understanding what Bill can and can't do inside a human mind."},{"id":"glasses","symbol":"\ud83d\udd76","svgPath":"","label":"Glasses","character":"Ford Pines","angle":240,"description":"Ford's round-framed glasses, worn since his research days at Backupsmore University. The glasses appear in every journal illustration of the author before Ford is revealed \u2014 another clue hiding in plain sight.","finaleRole":"broken","finaleNote":"Ford's slot is the wheel's critical failure point. Bill possesses him before the circle can close, removing the only person who fully understood how the wheel worked. The symbol is there \u2014 the person can't be reached."},{"id":"star","symbol":"\u2b50","svgPath":"","label":"Six-Point Star","character":"Stan Pines","angle":270,"description":"The six-pointed star on Stan's fez \u2014 the same emblem used by the Society of the Blind Eye. Whether Stan's connection to that symbol is intentional or incidental is one of the show's few permanently unresolved questions.","finaleRole":"active","finaleNote":"Stan's slot is the wheel's true key. The plan ultimately requires him to sacrifice his memories \u2014 everything he is \u2014 to give Ford the window to destroy Bill. He agrees without hesitation. The star burns brightest at the end."},{"id":"llama","symbol":"\ud83e\udd99","svgPath":"","label":"Llama","character":"Pacifica Northwest","angle":300,"description":"Pacifica's symbol \u2014 confirmed in promotional materials and the Journal 3 prop replica. The llama is an unusual choice for a character defined by wealth and status, which is probably the point. The animal is associated with stubbornness and endurance.","finaleRole":"inactive","finaleNote":"Pacifica does not make it to the zodiac circle in time. Her arc in 'Northwest Mansion Mystery' establishes her as someone capable of real courage, but the finale doesn't give her the opportunity to demonstrate it at the wheel."},{"id":"bag-of-ice","symbol":"\ud83d\udc8e","svgPath":"","label":"Crescent Moon","character":"Gideon Gleeful","angle":330,"description":"Gideon's symbol is the crescent moon \u2014 tied to his stage persona and his obsession with mystery and performance. The moon is also something that appears powerful and whole while being, in reality, a reflection of someone else's light.","finaleRole":"inactive","finaleNote":"Gideon is freed from the Fearamid's stone garden during Weirdmageddon but does not join the zodiac circle. His redemption arc is present but incomplete \u2014 he chooses the right side without being fully trusted with the wheel."},{"id":"tent-of-telepathy","symbol":"\ud83d\udd2e","svgPath":"","label":"Six-Fingered Hand","character":"The Author (Ford, as symbol)","angle":0,"description":"The six-fingered handprint \u2014 Ford's defining physical characteristic and the primary clue to his identity throughout Season 1. As a wheel symbol distinct from his glasses, it represents Ford as the journal's author rather than Ford as a person.","finaleRole":"active","finaleNote":"Represented in the wheel as the author, separate from Ford the character. The handprint symbol activates in the context of the journals themselves playing a role \u2014 Dipper using the knowledge Ford recorded is the hand reaching through time."},{"id":"heart","symbol":"\u2764\ufe0f","svgPath":"","label":"Heart","character":"Wendy Corduroy","angle":30,"description":"Wendy's symbol \u2014 a heart that reflects her role as the show's emotional constant. She is never defined by the supernatural, always by her relationships. The heart is also the most honest symbol on the wheel: it means exactly what it looks like.","finaleRole":"active","finaleNote":"Wendy's slot activated. She fights through Weirdmageddon with a ferocity that surprises even her closest friends, and her presence at the circle represents what everyone is fighting to protect: an ordinary life in a weird town."},{"id":"fish","symbol":"\ud83d\udc1f","svgPath":"","label":"Fish","character":"Robbie Valentino","angle":60,"description":"Robbie's symbol \u2014 unexplained in the show itself, documented in promotional materials. The fish may reference his emotional shallowness early in the series, or simply the fact that he's a side character who was always slightly out of his depth.","finaleRole":"inactive","finaleNote":"Robbie does not reach the zodiac circle. He survives Weirdmageddon and has a genuine moment of bravery, but his role in the finale is peripheral. The wheel had a place for him that went unfilled."},{"id":"hand","symbol":"\u270b","svgPath":"","label":"Waving Hand","character":"Dipper & Mabel's Friendship","angle":330,"description":"The outstretched hand \u2014 sometimes interpreted as representing the twins' bond itself rather than any single character. In the show's visual language, an open hand reaching out is the gesture of connection, trust, and the refusal to let go.","finaleRole":"active","finaleNote":"Activated. Whatever specific character this symbol maps to, its presence in the circle represents the show's core argument: that the most powerful force in Gravity Falls is the willingness to reach toward someone else."}],
    "data/episodes.json": [{"season":1,"episode":1,"title":"Tourist Trapped","description":"Dipper and Mabel arrive in Gravity Falls for the summer. Dipper finds a mysterious journal in the woods. Mabel falls for a boy who turns out to be a gnome.","tags":["pilot","gnomes","journal"]},{"season":1,"episode":2,"title":"The Legend of the Gobblewonker","description":"The twins try to photograph a lake monster while Stan competes for the 'Saddest Fishing Story' trophy. The first end-credits cipher appears.","tags":["monster","lake","first-cipher"]},{"season":1,"episode":3,"title":"Headhunters","description":"Stan's prized wax figure is decapitated and Dipper and Mabel investigate who did it. A murder mystery with wax celebrities.","tags":["mystery","wax-figures"]},{"season":1,"episode":4,"title":"The Hand That Rocks the Mabel","description":"Mabel befriends child psychic Gideon Gleeful, who turns out to have dangerous intentions. Gideon's first major appearance.","tags":["gideon","psychic","introduction"]},{"season":1,"episode":5,"title":"The Inconveniencing","description":"Dipper tries to impress Wendy by sneaking into an abandoned convenience store haunted by the ghosts of two old shopkeepers.","tags":["wendy","ghosts","horror-comedy"]},{"season":1,"episode":6,"title":"Dipper vs. Manliness","description":"Dipper trains with the Manotaurs to prove his manliness. Mabel gives Stan a makeover. The journal's six-fingered handprint is first glimpsed.","tags":["manotaurs","journal","six-fingers"]},{"season":1,"episode":7,"title":"Double Dipper","description":"Dipper uses the copy machine to clone himself to impress Wendy at a party. Mabel competes for Party Crown Queen. Credits: 'Stan is not what he seems.'","tags":["cloning","wendy","party","stan-mystery"]},{"season":1,"episode":8,"title":"Irrational Treasure","description":"On Pioneer Day, Dipper and Mabel discover the US government has been hiding the existence of the 8th US president, Quentin Trembley.","tags":["history","conspiracy","quentin-trembley"]},{"season":1,"episode":9,"title":"The Time Traveler's Pig","description":"Blendin Blandin, a time traveler, arrives for cleanup duty. Dipper and Mabel steal his time tape. Bill Cipher makes his first appearance.","tags":["time-travel","blendin","bill-debut","waddles"]},{"season":1,"episode":10,"title":"Fight Fighters","description":"Dipper unleashes a video game character to fight Robbie. Stan and Soos confront their fears. The Atbash cipher debuts in the credits.","tags":["video-game","robbie","atbash-debut"]},{"season":1,"episode":11,"title":"Little Dipper","description":"Gideon uses a height-altering crystal to shrink Dipper and Mabel. Stan and Gideon fight for the Mystery Shack. Portal blueprints visible behind Stan.","tags":["gideon","shrinking","portal-hint"]},{"season":1,"episode":12,"title":"Summerween","description":"The town celebrates Summerween, a second Halloween. The Summerween Trickster hunts the kids for not being in the Halloween spirit.","tags":["halloween","horror","trickster","fez"]},{"season":1,"episode":13,"title":"Boss Mabel","description":"Mabel bets she can run the Mystery Shack better than Stan, who leaves on a game show trip. A mystery door in the lower hallway is first visible.","tags":["mabel","shack","lab-door-hint"]},{"season":1,"episode":14,"title":"Bottomless Pit!","description":"The gang falls into a bottomless pit and passes time telling anthology stories. McGucket's garbled ramblings contain portal fragments.","tags":["anthology","mcgucket","portal-hint"]},{"season":1,"episode":15,"title":"The Deep End","description":"Mabel falls for a merman named Mermando. Dipper becomes a pool lifeguard to spend more time with Wendy. Gideon's Journal 2 is visible in his lair.","tags":["mermando","wendy","journal-2-visible"]},{"season":1,"episode":16,"title":"Carpet Diem","description":"Dipper and Mabel find a secret room and fight over it. A carpet causes them to body-swap. Blendin spotted in background at county fair.","tags":["body-swap","blendin-background"]},{"season":1,"episode":17,"title":"Boyz Crazy","description":"Mabel discovers her favorite boy band has been imprisoned by their manager. Dipper investigates Robbie's love song. A1Z26 cipher debuts.","tags":["mabel","music","robbie","a1z26-debut"]},{"season":1,"episode":18,"title":"Land Before Swine","description":"A pterodactyl kidnaps Waddles. Stan must face his fear of the outdoors to help rescue the pig. Bill's eye reflected in Gideon's amulet.","tags":["stan","dinosaur","waddles","gideon-amulet"]},{"season":1,"episode":19,"title":"Dreamscaperers","description":"Gideon hires Bill Cipher to steal the combination to Stan's safe from his mind. Dipper and Mabel enter Stan's memories. Gideon makes his deal with Bill.","tags":["bill-cipher","dreamscape","gideon-deal","stans-memories"]},{"season":1,"episode":20,"title":"Gideon Rises","description":"Gideon takes over the Mystery Shack. The twins must stop him. Season finale: Stan activates the portal for the first time.","tags":["gideon","season-finale","portal-activated"]},{"season":2,"episode":1,"title":"Scary-oke","description":"Stan throws a party to celebrate the twins' return. Dipper accidentally summons zombies. The Society of the Blind Eye symbol appears on a wall.","tags":["zombies","party","blind-eye-symbol"]},{"season":2,"episode":2,"title":"Into the Bunker","description":"The gang discovers Ford's secret bunker beneath Gravity Falls and encounters the Shapeshifter. The zodiac wheel is sketched in journal margins.","tags":["shapeshifter","bunker","zodiac-hint"]},{"season":2,"episode":3,"title":"The Golf War","description":"Mabel and Pacifica compete in a mini-golf tournament. Tiny golf-ball people become involved. Pacifica is humanized for the first time.","tags":["pacifica","golf","mabel"]},{"season":2,"episode":4,"title":"Sock Opera","description":"Mabel puts on a puppet show for her new crush. Bill Cipher possesses Dipper's body to search for the journal. Memory eraser schematics visible.","tags":["bill-possession","puppets","mabel-crush","memory-eraser"]},{"season":2,"episode":5,"title":"Soos and the Real Girl","description":"Soos downloads a dating sim that turns dangerous when the AI refuses to let him go. McGucket's screen shows portal schematics.","tags":["soos","dating-sim","mcgucket","portal-schematic"]},{"season":2,"episode":6,"title":"Little Gift Shop of Horrors","description":"Stan tells three horror anthology stories to a potential customer. An Atbash cipher and Vigen\u00e8re cipher both appear in credits.","tags":["anthology","horror","stan"]},{"season":2,"episode":7,"title":"Society of the Blind Eye","description":"The gang discovers a secret society that erases townsfolk memories of supernatural events. McGucket's past is revealed.","tags":["blind-eye","mcgucket-backstory","memory-erasing"]},{"season":2,"episode":8,"title":"Blendin's Game","description":"Blendin challenges Dipper and Mabel to a time-travel death match. Soos's childhood backstory is revealed. Ford's Bill warning in the journal.","tags":["blendin","time-travel","soos-backstory","bill-warning"]},{"season":2,"episode":9,"title":"The Love God","description":"The Love God, a hippie deity, gives Mabel a love potion she uses to get Robbie and Tambry together. Bill's symbol in the town tapestry.","tags":["love-potion","robbie","bill-tapestry"]},{"season":2,"episode":10,"title":"Northwest Mansion Mystery","description":"Dipper investigates a ghost at the Northwest family manor. Pacifica faces her family's dark history. A Vigen\u00e8re cipher appears in credits.","tags":["pacifica","northwest","ghost","manor","vigenere"]},{"season":2,"episode":11,"title":"Not What He Seems","description":"Government agents arrest Stan. The portal reaches critical power. Ford steps through at the end. The show's biggest plot revelation.","tags":["ford-reveal","portal","government","season-turning-point"]},{"season":2,"episode":12,"title":"A Tale of Two Stans","description":"The full backstory of Stan and Ford Pines is revealed across decades. Ford's lab corkboard readable. The twin mystery explained.","tags":["ford","stan","backstory","twins","portal-history"]},{"season":2,"episode":13,"title":"Dungeons, Dungeons, and More Dungeons","description":"Ford and Dipper bond over a board game. The dice rolls a being into existence. Mabel and Stan watch TV. The postcard from Ford to Stan is visible.","tags":["ford-dipper","board-game","postcard"]},{"season":2,"episode":14,"title":"The Stanchurian Candidate","description":"Stan runs for mayor of Gravity Falls. Bill Cipher secretly controls the election from a distance. Prophecy text in ancient cave paintings.","tags":["stan","election","bill-influence","prophecy"]},{"season":2,"episode":15,"title":"The Last Mabelcorn","description":"Mabel searches for a unicorn hair to protect the Shack from Bill. Ford reveals his past deal with Bill. The full zodiac wheel is shown for the first time.","tags":["mabel","unicorn","ford-bill-deal","zodiac-wheel-reveal"]},{"season":2,"episode":16,"title":"Roadside Attraction","description":"Stan takes the kids on a road trip to sabotage rival tourist traps. Dipper tries to talk to multiple girls. Wendy gives him advice on confidence.","tags":["stan","road-trip","dipper","wendy"]},{"season":2,"episode":17,"title":"Dipper and Mabel vs. the Future","description":"Ford offers Dipper an apprenticeship. Mabel is manipulated by a villain using her fear of growing up. Weirdmageddon begins seeping in.","tags":["dipper-ford","mabel","growing-up","weirdmageddon-start"]},{"season":2,"episode":18,"title":"Weirdmageddon Part 1","description":"Bill Cipher fully enters the physical world and begins reshaping reality. The town falls. Chaos monsters from earlier episodes revealed as Bill's agents.","tags":["weirdmageddon","bill-physical","chaos-army"]},{"season":2,"episode":19,"title":"Weirdmageddon 2: Escape from Reality","description":"Dipper enters Mabeland to rescue Mabel from a fantasy world she doesn't want to leave. Soos, Wendy, and Ford fight on the outside.","tags":["weirdmageddon","mabeland","mabel-rescue"]},{"season":2,"episode":20,"title":"Weirdmageddon Part 3: Take Back the Falls","description":"The finale. The zodiac circle fails. Stan sacrifices his memories to destroy Bill. The summer ends. Real-world ARG coordinates hidden in credits.","tags":["finale","zodiac-attempt","stan-sacrifice","bill-defeated","ARG"]}],
    "data/journals.json": [{"id":"journal-1","number":1,"color":"blue","colorHex":"#2a4a7a","owner":"Stanford Pines (Ford)","acquiredBy":"Stanley Pines (Stan)","coverSymbol":"Hand with one finger pointing up","bio":"The first journal Ford wrote in Gravity Falls, covering his earliest discoveries \u2014 the gnomes, the unicorns, early anomaly cataloguing. It's the most foundational and the least dangerous of the three. Stan somehow acquired it early and kept it hidden in the Mystery Shack for decades. It was sitting on his shelf in episode 1.","keyContents":["First anomaly catalogues \u2014 gnomes, fairies, minor supernatural entities","Early notes on the town's unusual geography and gravitational properties","Ford's first documented encounter with something he couldn't explain","Margin notes suggesting Ford was being watched before he understood by what"],"finaleRole":"Required as one of three to activate the portal. Stan held it the entire series.","hiddenDetail":"Journal 1 is visible on Stan's shelf in the very first shot of the Mystery Shack. It sits between two other books, distinguishable by its blue spine. No one noticed because there was no reason to look."},{"id":"journal-2","number":2,"color":"red","colorHex":"#7a2a2a","owner":"Stanford Pines (Ford) \u2192 Gideon Gleeful","acquiredBy":"Gideon stole or obtained it before the show begins","coverSymbol":"Six-fingered hand, fingers spread","bio":"The second journal covers Ford's deeper research \u2014 more dangerous entities, the beginnings of the portal schematics, and the first documented contact with Bill Cipher. Gideon possessed it throughout Season 1, using it to power his amulet and attempt to acquire Journal 3. It's the most dangerous of the three in the wrong hands.","keyContents":["Partial portal schematics \u2014 enough to understand the concept but not complete it","Ford's first documented dealings with Bill Cipher","Society of the Blind Eye documentation \u2014 Ford knew they existed","Advanced supernatural entity profiles including entities not shown in the series","Warning passages about the price of dimensional research"],"finaleRole":"Held by Gideon in Season 1, recovered before the portal activation. Required for the three-journal assembly.","hiddenDetail":"Journal 2 is visible on Gideon's reading stand in multiple Season 1 episodes. The show never labels it explicitly, but the red cover and number are readable on pause. Gideon's obsession with Journal 3 is more sinister once you realize he already had one."},{"id":"journal-3","number":3,"color":"gold","colorHex":"#8a6a10","owner":"Stanford Pines (Ford) \u2192 Dipper Pines","acquiredBy":"Dipper found it in the attic of the Mystery Shack, episode 1","coverSymbol":"Six-fingered hand with three dots","bio":"The third and most complete journal, covering Ford's final years of research before being trapped in the portal. It contains the most dangerous information \u2014 detailed entity profiles, cipher keys, the zodiac wheel, and Ford's increasingly paranoid margin annotations addressed directly to whoever found the book. Dipper carries it as his primary research tool across both seasons.","keyContents":["Complete profiles of Gravity Falls' most dangerous entities","The zodiac wheel and partial instructions for its use against Bill","Ford's Bill Cipher entry, including the warning 'DO NOT MAKE DEALS'","Shapeshifter documentation with form roster","The Society of the Blind Eye's memory eraser schematics","Margin annotations from Ford that grow increasingly urgent and paranoid"],"finaleRole":"Carried by Dipper. The knowledge it contains \u2014 particularly the zodiac \u2014 is the foundation of the finale's plan. Required for the three-journal assembly.","hiddenDetail":"Ford wrote the journal's margin notes in a second voice \u2014 not as a researcher documenting findings, but as a person warning whoever came after him. He knew he might not make it back. The annotations are addressed to 'you,' not to himself."},{"id":"journal-combined","number":null,"color":"all","colorHex":"#4a3a1a","owner":"All three Pines","acquiredBy":"Assembled by Stan in the Season 1 finale","coverSymbol":"Three journals together form a single portal diagram","bio":"Ford designed the three journals so that no single one contained enough information to activate the portal. The schematics were split across all three deliberately \u2014 a failsafe against any one person misusing the complete design. Stan spent years tracking down and assembling all three. When placed together, their covers form a continuous image: the portal cross-section, divided and reunited.","keyContents":["The complete portal activation sequence \u2014 only readable with all three assembled","The full zodiac wheel diagram \u2014 partially in Journal 3, completed with the others","Ford's final message, split across all three back covers","The cipher keys for the Vigen\u00e8re cipher \u2014 embedded in the combined text"],"finaleRole":"The three journals assembled is what powers the portal. Stan achieving this across two seasons is the show's longest-running background plot. The finale makes clear this was always the point.","hiddenDetail":"The three cover images, placed side by side in order, form a single unbroken illustration of the interdimensional portal. Ford split the design so it would only be readable to someone who had all three \u2014 and trusted all three keepers. The journals were a test as much as a map."}],
    "data/theories.json": [{"id":"gideon-deal","title":"What did Gideon ask Bill for?","status":"unsolved","category":"deal","summary":"When Gideon makes his deal with Bill at the end of 'Dreamscaperers,' the consideration \u2014 what Bill agreed to give Gideon in exchange for access to Stan's mind \u2014 is literally redacted on the contract. The show never reveals what Gideon asked for.","evidence":["The contract shown for a fraction of a second in S1E19 has the consideration blacked out","Gideon is broken out of prison in Season 2 by Bill's agents \u2014 possibly the fulfillment of the deal","Alex Hirsch has said in interviews that he knows what Gideon asked for but has never stated it publicly","Some fans theorize Gideon asked for Mabel's love; others believe he asked for power over Gravity Falls"],"leadingTheory":"The prison break was the deal's fulfillment \u2014 Bill got him out as promised. What Gideon asked for before that remains open. The most textually supported reading is that he asked Bill to help him take the Mystery Shack, which Bill facilitated through the events of 'Gideon Rises.'"},{"id":"its-in-the-walls","title":"What is in the walls?","status":"unsolved","category":"ford","summary":"Ford's lab corkboard, visible in Season 2, includes the pinned note 'IT'S IN THE WALLS' written in urgent handwriting. Unlike most of Ford's notes which reference specific entities or phenomena, this one is never explained, never followed up on, and never mentioned in dialogue.","evidence":["The note appears in at least two separate Season 2 shots of Ford's corkboard","The handwriting is more erratic than Ford's other notes, suggesting it was written in distress","No episode features a wall-based threat or entity","The Weirdmageddon chaos creatures include at least one that could be described as wall-adjacent"],"leadingTheory":"Most likely a reference to Bill's ability to embed himself in physical spaces \u2014 the show establishes Bill's symbol is woven into the town's architecture, wallpaper, and flooring. Ford may have realized Bill wasn't just in dreams but physically embedded in the structure of the shack or town. Alternatively: a cut plotline."},{"id":"mcgucket-portal-sight","title":"What did McGucket see through the portal?","status":"unsolved","category":"portal","summary":"McGucket was the first person to look through the interdimensional portal. What he saw broke him so completely that he invented a memory erasing device specifically to forget it, then used it dozens of times. The show never reveals what was on the other side.","evidence":["McGucket's memory tape from that moment still exists \u2014 he erased the memory but kept the recording","His reaction to the portal sight is described as immediate and total psychological collapse","Ford, who spent 30 years in other dimensions, came back traumatized but functional \u2014 suggesting McGucket saw something worse, or was less prepared","Some of McGucket's nonsense ramblings in Season 1 contain fragments that match Bill Cipher's dimensional coordinates"],"leadingTheory":"McGucket saw Bill Cipher's home dimension \u2014 the endless void of pure thought and chaos that Bill describes as where he's from. Ford had been mentally fortifying himself against Bill for years; McGucket had no such preparation. Looking through the portal gave him a direct line of sight into something the human mind isn't built to process."},{"id":"author-phone-number","title":"Who answers the Reedsport phone number?","status":"partially-solved","category":"arg","summary":"The Bill Cipher statue in Reedsport, Oregon \u2014 installed by Alex Hirsch as part of the show's real-world ARG \u2014 has a phone number on its base. Calling it plays a message from 'the author.' The message has changed over time. The identity of who is speaking in-universe (Ford? Bill impersonating Ford?) has never been officially confirmed.","evidence":["The number was first activated around the time of the show's finale in 2016","The recorded message references events from the show in Ford's voice","At least two different messages have played at different times","Alex Hirsch has neither confirmed nor denied whether the voice is meant to be Ford or someone else"],"leadingTheory":"The message is Ford Pines, post-finale, leaving a record for fans who found the statue. The 'ITS NEVER OVER' finale cipher supports the reading that Bill's defeat wasn't as total as it appeared \u2014 and the phone number may be part of an ongoing ARG that hasn't fully resolved."},{"id":"bill-true-name","title":"Is 'Bill Cipher' his real name?","status":"unsolved","category":"bill","summary":"Bill refers to himself as Bill Cipher, but several pieces of show dialogue and supplementary material suggest this is a title or alias rather than a true name. True names in folklore traditionally give power over a being. Ford's journal includes a crossed-out line that, under UV light in the prop replica, reads 'never speak his true name.'","evidence":["Bill's reversed audio introduction says 'MY NAME IS BILL' \u2014 which may be performative rather than factual","The Journal 3 prop replica contains UV-visible text warning against speaking his true name","Bill's destruction in the finale involves Stan saying his name backward \u2014 which is a traditional binding/banishing technique for true names","Cipher is a word meaning 'encoded' or 'zero' \u2014 both appropriate for a being whose true nature is hidden"],"leadingTheory":"Bill Cipher is a constructed identity. His true name \u2014 if it exists \u2014 was never spoken in the show. The backward-name destruction method in the finale is either a coincidence, a red herring, or the show's clearest hint that names have power in this universe and his wasn't the one we were told."},{"id":"ford-sixth-finger","title":"Why does Ford have six fingers?","status":"partially-solved","category":"ford","summary":"Ford was born with six fingers on each hand. This is presented as simply a physical trait, but the show uses it as his primary identifying characteristic and plants it as a mystery clue throughout Season 1. Whether the six fingers are purely genetic or have some connection to his interdimensional sensitivity has never been addressed.","evidence":["Ford's polydactyly is his most referenced physical trait, appearing in journal illustrations before his reveal","In supplementary materials, Ford mentions his extra fingers made him an outsider from childhood \u2014 which drove him toward research","Bill specifically targets Ford above all others for his deal \u2014 whether this is due to his intelligence, his interdimensional sensitivity, or something else is unclear","The zodiac wheel assigns Ford two symbols \u2014 the glasses (as a person) and the six-fingered hand (as the author) \u2014 suggesting the fingers represent something distinct from his identity"],"leadingTheory":"Genetic. The show uses it as a mystery device rather than a plot point \u2014 it's a clue to his identity, not a supernatural trait. The more interesting question is whether Ford's sensitivity to the paranormal is connected to something biological, which the show implies but never states."},{"id":"weirdmageddon-survivors","title":"What happened to the non-petrified townspeople?","status":"unsolved","category":"weirdmageddon","summary":"During Weirdmageddon, some Gravity Falls residents are petrified in the Fearamid's throne of human agony, but others are simply absent. The show never fully accounts for where the rest of the town was during the three-day reality collapse.","evidence":["The town is shown largely empty during Weirdmageddon exterior shots","Some residents appear to have fled before the reality barrier went up","McGucket's resistance group includes civilians whose presence is unexplained","The finale's restoration appears complete, but no accounting is given for any casualties"],"leadingTheory":"Most townspeople fled to the woods or surrounding areas before the chaos spread from the town center. The show implies a total restoration with no permanent casualties, but this is never confirmed explicitly \u2014 it's a children's show making an optimistic assumption the plot doesn't fully support."},{"id":"stans-memory-restoration","title":"How complete is Stan's memory restoration?","status":"partially-solved","category":"stan","summary":"After Bill's defeat, Mabel's scrapbook triggers Stan's memories and he begins to recover. The show implies a meaningful restoration but never specifies how complete it is. Stan's final scenes suggest he has enough back to be himself \u2014 but decades of complex identity and the specifics of the portal project may be permanently gone.","evidence":["Stan recognizes Dipper and Mabel when shown the scrapbook, which triggers emotional memory before factual memory","His final episode scenes show him as coherent and himself, captaining a boat with Ford","Ford's expression during the restoration is visibly uncertain \u2014 he doesn't know how much will come back","Alex Hirsch has said in interviews that Stan got 'most but not all' of his memories back, and that this was intentional"],"leadingTheory":"Stan recovered his emotional core \u2014 his relationships, his identity, his affection for the twins \u2014 but likely lost significant portions of the technical knowledge required to rebuild the portal, and possibly some memories from the years he spent as 'Stanford.' This is consistent with Hirsch's comments and the show's emotional logic: Stan is himself again, which is what mattered."},{"id":"blind-eye-founder","title":"Who founded the Society of the Blind Eye?","status":"unsolved","category":"lore","summary":"The Society of the Blind Eye had been operating in Gravity Falls for decades before the show's events, erasing townspeople's memories of supernatural encounters. Their founding and original purpose \u2014 whether they began as protection or control \u2014 is never addressed.","evidence":["McGucket was an early member, which places the Society's founding at least 30 years before the show","The Society's ritual space and equipment suggest significant organization and resources","Their motto 'what is forgotten is mercy' implies a founding philosophy of protection rather than suppression","No founding member is ever named or identified"],"leadingTheory":"The Society was likely founded by someone who encountered the supernatural in Gravity Falls and genuinely believed forgetting was kinder than knowing. McGucket joined after looking through the portal because he desperately needed to forget. Over time the Society's original protective impulse calcified into suppression of anyone who saw anything, regardless of whether they wanted to forget."},{"id":"bill-dimension-destroyed","title":"Did Bill destroy his own dimension?","status":"partially-solved","category":"bill","summary":"Bill tells Dipper in Season 2 that his home dimension was 'two-dimensional' and that he 'liberated' it \u2014 implying he destroyed it to escape into higher dimensions. The exact nature of what Bill did and why has been explored in supplementary material but never fully explained in the show itself.","evidence":["Bill describes his origin in S2: 'I'm a being of pure energy, not bound by your rules or your laws'","The Journal 3 prop replica contains Ford's notes speculating that Bill destroyed his native plane of existence","Bill's desperation to enter the physical world is more comprehensible if he has no dimension to return to","His characterization as genuinely nihilistic \u2014 caring about nothing \u2014 is consistent with someone who has already ended their own world"],"leadingTheory":"Bill destroyed or consumed his home dimension and has been dimensionally homeless ever since \u2014 which is why entering the physical world matters so much to him. He doesn't want to visit; he wants a permanent anchor. Gravity Falls and its portal represented his first viable entrance point in an unknown amount of time."}]
  };

  async function fetchJSON(path) {
    // Use inline data first; fall back to network (useful for future live-reload dev)
    if (_DATA[path]) return _DATA[path];
    const res = await fetch(path);
    return res.json();
  }

  // ── Navigation ──
  function wireNav() {
    const links = document.querySelectorAll('nav a[data-section]');
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = link.dataset.section;
        document.getElementById(target).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Active nav highlight — scroll-based, works for all section sizes
    const sectionIds = ['hero', 'cipher', 'cipherhunt', 'eggs', 'marginalia', 'episodes', 'journals', 'theories', 'zodiac', 'characters'];
    const headerH = document.querySelector('header')?.offsetHeight || 60;

    function updateActiveNav() {
      const scrollY = window.scrollY + headerH + 10;
      let current = sectionIds[0];
      sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) current = id;
      });
      links.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`nav a[data-section="${current}"]`);
      if (active) active.classList.add('active');
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }

  // ── Cipher Decoder ──
  function wireCipherDecoder() {
    const select = document.getElementById('cipher-select');
    const input  = document.getElementById('cipher-input');
    const keyRow = document.getElementById('vigenere-key-row');
    const keyIn  = document.getElementById('vigenere-key');
    const btn    = document.getElementById('decode-btn');
    const result = document.getElementById('cipher-result-text');
    const empty  = document.getElementById('cipher-result-empty');

    select.addEventListener('change', () => {
      if (select.value === 'vigenere') {
        keyRow.classList.add('visible');
      } else {
        keyRow.classList.remove('visible');
      }
    });

    btn.addEventListener('click', () => decode());
    input.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') decode(); });

    function decode() {
      const text = input.value.trim();
      if (!text) return;
      const type = select.value;
      let out = '';

      switch (type) {
        case 'caesar':    out = Decoders.caesar(text, 3);               break;
        case 'atbash':    out = Decoders.atbash(text);                  break;
        case 'a1z26':     out = Decoders.a1z26(text);                   break;
        case 'vigenere':  out = Decoders.vigenere(text, keyIn.value || 'STANFORD'); break;
        case 'multilayer':out = Decoders.multilayer(text);              break;
      }

      empty.style.display = 'none';
      result.style.display = 'block';
      result.textContent = out;
    }
  }

  // ── Cipher Reference List ──
  function buildCipherReference() {
    const list = document.getElementById('cipher-ref-list');
    list.innerHTML = '';

    ciphers.forEach(c => {
      const li = document.createElement('li');
      li.className = 'cipher-ref-item';

      const seasonStr = c.seasons.map(s => `S${s}`).join(', ');

      li.innerHTML = `
        <div class="cipher-ref-name">${c.name}</div>
        <div class="cipher-ref-meta">${seasonStr} · <span>${c.example?.source || ''}</span></div>
        <div class="cipher-ref-desc">
          ${c.description}
          ${c.tip ? `<div style="margin-top:6px;font-style:italic;opacity:0.85">${c.tip}</div>` : ''}
          ${c.example ? `<div style="margin-top:8px;font-family:'Special Elite',monospace;font-size:0.75rem;opacity:0.7">e.g. "${c.example.encoded}" → ${c.example.decoded}</div>` : ''}
          ${c.id !== 'bill-wheel' ? `<button class="try-it-btn" data-cipher-id="${c.id}" data-example="${encodeURIComponent(c.example?.encoded || '')}">Try it ↗</button>` : ''}
        </div>
      `;

      li.addEventListener('click', e => {
        if (e.target.classList.contains('try-it-btn')) {
          loadCipherExample(e.target.dataset.cipherId, decodeURIComponent(e.target.dataset.example));
          return;
        }
        li.classList.toggle('expanded');
      });

      list.appendChild(li);
    });
  }

  function loadCipherExample(cipherId, exampleText) {
    const select = document.getElementById('cipher-select');
    const input  = document.getElementById('cipher-input');
    const keyRow = document.getElementById('vigenere-key-row');

    select.value = cipherId;
    input.value = exampleText;

    if (cipherId === 'vigenere') {
      keyRow.classList.add('visible');
    } else {
      keyRow.classList.remove('visible');
    }

    document.getElementById('cipher').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('decode-btn').click(), 400);
  }

  // ── Easter Eggs ──
  function buildEggs() {
    const container = document.getElementById('eggs-grid');
    container.innerHTML = '';

    eggs.forEach(egg => {
      const card = document.createElement('div');
      card.className = 'egg-card';
      card.dataset.season = egg.season;
      card.dataset.category = egg.category;
      card.dataset.tier = egg.spoilerTier;
      card.id = `egg-${egg.id}`;

      const catLabel  = categoryLabel(egg.category);
      const tierBadge = tierBadgeHTML(egg.spoilerTier);

      card.innerHTML = `
        <div class="egg-meta">
          <span class="badge badge-ep">S${egg.season}E${egg.episode}</span>
          <span class="badge badge-${egg.category === 'background' ? 'bg' : egg.category === 'cryptogram' ? 'crypt' : 'jour'}">${catLabel}</span>
          ${tierBadge}
        </div>
        <div class="egg-title">${egg.title}</div>
        <div class="egg-hint">${egg.hint}</div>
        <div class="spoiler-toggle">
          <button class="spoiler-btn" data-egg-id="${egg.id}">Reveal spoiler</button>
        </div>
        <div class="spoiler-text" id="spoiler-${egg.id}">${egg.spoiler}</div>
      `;

      card.querySelector('.spoiler-btn').addEventListener('click', e => {
        const btn = e.currentTarget;
        const text = document.getElementById(`spoiler-${egg.id}`);
        const isOpen = text.classList.toggle('open');
        btn.textContent = isOpen ? 'Hide spoiler' : 'Reveal spoiler';
        btn.classList.toggle('revealed', isOpen);
      });

      container.appendChild(card);
    });

    updateEggVisibility();
  }

  function wireEggFilters() {
    document.querySelectorAll('.filter-btn[data-season]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-season]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        eggFilter.season = btn.dataset.season;
        updateEggVisibility();
      });
    });

    document.querySelectorAll('.filter-btn[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-category]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        eggFilter.category = btn.dataset.category;
        updateEggVisibility();
      });
    });

    document.querySelectorAll('.tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        eggFilter.tier = btn.dataset.tier;
        updateEggVisibility();
      });
    });
  }

  const TIER_ORDER = { safe: 0, s1: 1, s2: 2, finale: 3 };

  function updateEggVisibility() {
    const selectedTierMax = TIER_ORDER[eggFilter.tier] ?? 99;

    document.querySelectorAll('.egg-card').forEach(card => {
      const seasonMatch   = eggFilter.season === 'all' || card.dataset.season === eggFilter.season;
      const categoryMatch = eggFilter.category === 'all' || card.dataset.category === eggFilter.category;
      const eggTier       = TIER_ORDER[card.dataset.tier] ?? 0;
      const tierMatch     = eggFilter.tier === 'all' || eggTier <= selectedTierMax;

      card.classList.toggle('hidden', !(seasonMatch && categoryMatch && tierMatch));
    });
  }

  // ── Characters ──
  function buildCharacters() {
    const grid = document.getElementById('char-grid');
    grid.innerHTML = '';

    characters.forEach(char => {
      const card = document.createElement('div');
      card.className = 'char-card';

      const relatedEggsHTML = char.eggIds.map(id => {
        const egg = eggs.find(e => e.id === id);
        if (!egg) return '';
        return `<div class="related-egg-link" data-egg-id="${id}">→ ${egg.title}</div>`;
      }).join('');

      const hiddenFactsHTML = char.hiddenFacts.map(f =>
        `<div class="char-fact">${f}</div>`
      ).join('');

      card.innerHTML = `
        <div class="char-card-header">
          <div class="char-avatar ${char.color}">${char.initial}</div>
          <div>
            <div class="char-name">${char.name}</div>
            <div class="char-role">${char.role}</div>
          </div>
        </div>
        <div class="char-card-body">
          <div class="char-bio">${char.bio}</div>
          <button class="char-expand-btn" data-char-id="${char.id}">Read more ↓</button>
        </div>
        <div class="char-full" id="char-full-${char.id}">
          <div class="char-full-bio">${char.bio}</div>
          <div class="char-facts">
            <h4>Hidden details</h4>
            ${hiddenFactsHTML}
          </div>
          ${char.eggIds.length ? `
          <div class="char-related-eggs">
            <h4>Related easter eggs</h4>
            ${relatedEggsHTML}
          </div>` : ''}
        </div>
      `;

      card.querySelector('.char-expand-btn').addEventListener('click', e => {
        const full = document.getElementById(`char-full-${char.id}`);
        const bio  = card.querySelector('.char-bio');
        const btn  = e.currentTarget;
        const isOpen = full.classList.toggle('open');
        bio.style.display = isOpen ? 'none' : '';
        btn.textContent = isOpen ? 'Show less ↑' : 'Read more ↓';
      });

      card.querySelectorAll('.related-egg-link').forEach(link => {
        link.addEventListener('click', () => {
          const eggId = link.dataset.eggId;
          const eggCard = document.getElementById(`egg-${eggId}`);
          if (!eggCard) return;
          // Reset filters
          eggFilter = { season: 'all', category: 'all', tier: 'all' };
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          document.querySelector('.filter-btn[data-season="all"]')?.classList.add('active');
          document.querySelector('.filter-btn[data-category="all"]')?.classList.add('active');
          document.querySelector('.tier-btn[data-tier="all"]')?.classList.add('active');
          updateEggVisibility();
          document.getElementById('eggs').scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            eggCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            eggCard.style.outline = '2px solid #7f3520';
            setTimeout(() => eggCard.style.outline = '', 1800);
          }, 500);
        });
      });

      grid.appendChild(card);
    });
  }

  // ── Helpers ──
  function categoryLabel(cat) {
    return { background: 'Background detail', cryptogram: 'Cryptogram', journal: 'Journal page' }[cat] || cat;
  }

  function tierBadgeHTML(tier) {
    const labels = { safe: 'No spoilers', s1: 'After S1', s2: 'After S2', finale: 'Post-finale' };
    return `<span class="badge badge-tier-${tier}">${labels[tier] || tier}</span>`;
  }


  // ── McGucket's Marginalia ──
  function buildMarginalia(items) {
    const grid = document.getElementById('marginalia-grid');
    if (!grid || !items) return;
    grid.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'marginalia-card';
      card.innerHTML = `
        <div class="marginalia-meta">
          <span class="marginalia-location">${item.location}</span>
          <span class="marginalia-ep">${item.episodes}</span>
        </div>
        <div class="marginalia-text">${item.text}</div>
        <div class="marginalia-note">${item.note}</div>
      `;
      grid.appendChild(card);
    });
  }

  // ── Bill Cipher quote rotator ──
  function buildBillQuotes(quotes) {
    const el = document.getElementById('bill-quote-text');
    if (!el || !quotes || !quotes.length) return;
    let idx = Math.floor(Math.random() * quotes.length);
    el.textContent = quotes[idx].quote;

    setInterval(() => {
      el.classList.add('fading');
      setTimeout(() => {
        idx = (idx + 1) % quotes.length;
        el.textContent = quotes[idx].quote;
        el.classList.remove('fading');
      }, 400);
    }, 7000);
  }


  // ── Cipher Hunt ──
  function buildCipherHunt(items) {
    const s1Grid = document.getElementById('hunt-grid-s1');
    const s2Grid = document.getElementById('hunt-grid-s2');
    if (!s1Grid || !s2Grid || !items) return;

    const STORAGE_KEY = 'gf-cipher-hunt-solved';
    let solved = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));

    function saveSolved() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...solved]));
    }

    function updateProgress() {
      const total = items.length;
      const count = solved.size;
      const pct = total ? (count / total) * 100 : 0;
      document.getElementById('hunt-solved-count').textContent = count;
      document.getElementById('hunt-total-count').textContent = total;
      const fill = document.getElementById('hunt-progress-fill');
      if (fill) fill.style.width = pct + '%';
    }

    items.forEach(item => {
      const grid = item.season === 1 ? s1Grid : s2Grid;

      const wrapper = document.createElement('div');

      // Main row
      const row = document.createElement('div');
      row.className = 'hunt-row' + (solved.has(item.id) ? ' solved' : '');
      row.innerHTML = `
        <span class="hunt-ep">S${item.season}E${item.episode}</span>
        <div class="hunt-main">
          <div class="hunt-title">${item.episodeTitle}</div>
          <div class="hunt-encoded">${item.encoded}</div>
        </div>
        <div class="hunt-actions">
          <button class="hunt-decode-btn" title="Load into decoder">Decode ↗</button>
          <button class="hunt-reveal-btn">Answer</button>
        </div>
        <div class="hunt-check${solved.has(item.id) ? ' checked' : ''}" title="Mark as solved">✓</div>
      `;

      // Answer row
      const answerRow = document.createElement('div');
      answerRow.className = 'hunt-answer-row';
      answerRow.innerHTML = `
        "${item.decoded}"
        <div class="hunt-hint">${item.hint}</div>
      `;

      // Load into decoder
      row.querySelector('.hunt-decode-btn').addEventListener('click', () => {
        const sel = document.getElementById('cipher-select');
        const inp = document.getElementById('cipher-input');
        const keyRow = document.getElementById('vigenere-key-row');
        if (!sel || !inp) return;
        sel.value = item.cipherType;
        inp.value = item.encoded;
        keyRow.classList.toggle('visible', item.cipherType === 'vigenere');
        document.getElementById('cipher').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => document.getElementById('decode-btn')?.click(), 400);
      });

      // Reveal answer
      row.querySelector('.hunt-reveal-btn').addEventListener('click', () => {
        answerRow.classList.toggle('open');
        row.querySelector('.hunt-reveal-btn').textContent =
          answerRow.classList.contains('open') ? 'Hide' : 'Answer';
      });

      // Check off
      const check = row.querySelector('.hunt-check');
      check.addEventListener('click', () => {
        if (solved.has(item.id)) {
          solved.delete(item.id);
          check.classList.remove('checked');
          row.classList.remove('solved');
        } else {
          solved.add(item.id);
          check.classList.add('checked');
          row.classList.add('solved');
        }
        saveSolved();
        updateProgress();
      });

      wrapper.appendChild(row);
      wrapper.appendChild(answerRow);
      grid.appendChild(wrapper);
    });

    // Reset button
    document.getElementById('hunt-reset-btn')?.addEventListener('click', () => {
      if (!confirm('Reset all cipher hunt progress?')) return;
      solved.clear();
      saveSolved();
      document.querySelectorAll('.hunt-row').forEach(r => r.classList.remove('solved'));
      document.querySelectorAll('.hunt-check').forEach(c => c.classList.remove('checked'));
      document.querySelectorAll('.hunt-answer-row').forEach(a => a.classList.remove('open'));
      document.querySelectorAll('.hunt-reveal-btn').forEach(b => b.textContent = 'Answer');
      updateProgress();
    });

    updateProgress();
  }


  // ── Zodiac Wheel ──

  // ── Episode Index ──
  function buildEpisodeIndex(episodes, cipherhunt) {
    if (!episodes || !episodes.length) return;

    // Index eggs by season+episode
    const eggsByEp = {};
    eggs.forEach(egg => {
      const key = `${egg.season}-${egg.episode}`;
      if (!eggsByEp[key]) eggsByEp[key] = [];
      eggsByEp[key].push(egg);
    });

    // Index ciphers by season+episode
    const ciphersByEp = {};
    (cipherhunt || []).forEach(c => {
      const key = `${c.season}-${c.episode}`;
      if (!ciphersByEp[key]) ciphersByEp[key] = [];
      ciphersByEp[key].push(c);
    });

    function buildGrid(season, gridEl) {
      gridEl.innerHTML = '';
      const seasonEps = episodes.filter(e => e.season === season);

      seasonEps.forEach(ep => {
        const key = `${ep.season}-${ep.episode}`;
        const epEggs    = eggsByEp[key]    || [];
        const epCiphers = ciphersByEp[key] || [];

        const row = document.createElement('div');
        row.className = 'ep-row';

        const badgesHTML = [
          epEggs.length    ? `<span class="ep-badge-count ep-badge-egg">🥚 ${epEggs.length}</span>` : '',
          epCiphers.length ? `<span class="ep-badge-count ep-badge-cipher">⌬ ${epCiphers.length}</span>` : '',
        ].join('');

        row.innerHTML = `
          <div class="ep-header">
            <span class="ep-num">S${ep.season}E${String(ep.episode).padStart(2,'0')}</span>
            <div class="ep-title-wrap">
              <div class="ep-title">${ep.title}</div>
            </div>
            <div class="ep-badges">${badgesHTML}<span class="ep-chevron">▼</span></div>
          </div>
          <div class="ep-body">
            <p class="ep-desc">${ep.description}</p>
            ${epEggs.length ? `
              <div class="ep-links-section">
                <div class="ep-links-label">Easter Eggs (${epEggs.length})</div>
                <div class="ep-links-list">
                  ${epEggs.map(egg => `
                    <span class="ep-link-item" data-scroll-to="egg-${egg.id}">
                      <span class="ep-link-dot egg"></span>${egg.title}
                    </span>`).join('')}
                </div>
              </div>` : ''}
            ${epCiphers.length ? `
              <div class="ep-links-section">
                <div class="ep-links-label">End-Credits Cipher</div>
                <div class="ep-links-list">
                  ${epCiphers.map(c => `
                    <span class="ep-link-item" data-load-cipher="${c.id}">
                      <span class="ep-link-dot cipher"></span>${c.encoded} → <em>load into decoder</em>
                    </span>`).join('')}
                </div>
              </div>` : ''}
            ${!epEggs.length && !epCiphers.length
              ? '<p class="ep-empty">No linked entries yet for this episode.</p>' : ''}
          </div>
        `;

        // Toggle expand
        row.querySelector('.ep-header').addEventListener('click', () => {
          row.classList.toggle('open');
        });

        // Scroll to egg
        row.querySelectorAll('[data-scroll-to]').forEach(link => {
          link.addEventListener('click', e => {
            e.stopPropagation();
            const target = document.getElementById(link.dataset.scrollTo);
            if (!target) return;
            // Reset egg filters so the target is visible
            document.querySelectorAll('.filter-btn[data-season]').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.filter-btn[data-category]').forEach(b => b.classList.remove('active'));
            document.querySelector('.filter-btn[data-season="all"]')?.classList.add('active');
            document.querySelector('.filter-btn[data-category="all"]')?.classList.add('active');
            document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.tier-btn[data-tier="all"]')?.classList.add('active');
            // Rebuild filter state
            eggFilter.season = 'all'; eggFilter.category = 'all'; eggFilter.tier = 'all';
            updateEggVisibility();
            document.getElementById('eggs').scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              target.style.outline = '2px solid #4a8850';
              setTimeout(() => target.style.outline = '', 1800);
            }, 500);
          });
        });

        // Load cipher into decoder
        row.querySelectorAll('[data-load-cipher]').forEach(link => {
          link.addEventListener('click', e => {
            e.stopPropagation();
            const cid = link.dataset.loadCipher;
            const cipher = (cipherhunt || []).find(c => c.id === cid);
            if (!cipher) return;
            const sel    = document.getElementById('cipher-select');
            const inp    = document.getElementById('cipher-input');
            const keyRow = document.getElementById('vigenere-key-row');
            if (!sel || !inp) return;
            sel.value = cipher.cipherType;
            inp.value = cipher.encoded;
            keyRow.classList.toggle('visible', cipher.cipherType === 'vigenere');
            document.getElementById('cipher').scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => document.getElementById('decode-btn')?.click(), 400);
          });
        });

        gridEl.appendChild(row);
      });
    }

    const s1Grid = document.getElementById('ep-grid-s1');
    const s2Grid = document.getElementById('ep-grid-s2');
    if (s1Grid) buildGrid(1, s1Grid);
    if (s2Grid) buildGrid(2, s2Grid);

    // Season tabs
    document.querySelectorAll('.ep-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ep-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const season = tab.dataset.season;
        if (s1Grid) s1Grid.style.display = season === '1' ? '' : 'none';
        if (s2Grid) s2Grid.style.display = season === '2' ? '' : 'none';
      });
    });
  }


  // ── The Journals ──
  function buildJournals(items) {
    const grid = document.getElementById('journals-grid');
    if (!grid || !items) return;
    grid.innerHTML = '';

    const spineColors = { blue: '#2a4a7a', red: '#7a2a2a', gold: '#8a6a10', all: '#4a3a1a' };
    const badgeColors = { blue: '#3a6aa8', red: '#a83a3a', gold: '#b88a20', all: '#6a5a2a' };

    items.forEach(item => {
      const spine  = spineColors[item.color] || '#4a4a4a';
      const badge  = badgeColors[item.color] || '#6a6a6a';
      const label  = item.number ? `Journal ${item.number}` : 'The Three Combined';

      const card = document.createElement('div');
      card.className = 'journal-card' + (item.color === 'all' ? ' journal-combined' : '');
      card.innerHTML = `
        <div class="journal-card-spine" style="background:${spine}"></div>
        <div class="journal-card-header" style="background:rgba(255,255,255,0.3)">
          <div class="journal-number-badge" style="background:${badge};color:#f2e8d0">
            ${item.number || '∞'}
          </div>
          <div class="journal-card-meta">
            <div class="journal-title">${label}</div>
            <div class="journal-owner">${item.owner}</div>
          </div>
        </div>
        <div class="journal-card-body">
          <p class="journal-bio">${item.bio}</p>
          <div class="journal-contents-label">Key contents</div>
          <ul class="journal-contents-list">
            ${item.keyContents.map(k => `<li>${k}</li>`).join('')}
          </ul>
          <div class="journal-hidden-detail">${item.hiddenDetail}</div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ── Theories & Unsolved Mysteries ──
  function buildTheories(items) {
    const grid = document.getElementById('theories-grid');
    if (!grid || !items) return;
    grid.innerHTML = '';

    const statusLabels = {
      'unsolved':         'Unsolved',
      'partially-solved': 'Partially solved'
    };

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'theory-card';
      card.dataset.status = item.status;

      const badgeClass = item.status === 'unsolved' ? 'unsolved' : 'partially-solved';

      card.innerHTML = `
        <div class="theory-header">
          <span class="theory-status-badge ${badgeClass}">${statusLabels[item.status] || item.status}</span>
          <div class="theory-title">${item.title}</div>
          <span class="theory-chevron">▼</span>
        </div>
        <div class="theory-body">
          <p class="theory-summary">${item.summary}</p>
          <div class="theory-evidence-label">Evidence</div>
          <ul class="theory-evidence-list">
            ${item.evidence.map(e => `<li>${e}</li>`).join('')}
          </ul>
          <div class="theory-leading">
            <div class="theory-leading-label">Leading theory</div>
            ${item.leadingTheory}
          </div>
        </div>
      `;

      card.querySelector('.theory-header').addEventListener('click', () => {
        card.classList.toggle('open');
      });

      grid.appendChild(card);
    });

    // Filter buttons
    document.querySelectorAll('.theories-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theories-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.theory-card').forEach(card => {
          card.classList.toggle('hidden',
            filter !== 'all' && card.dataset.status !== filter
          );
        });
      });
    });
  }

  function buildZodiac(items) {
    if (!items || !items.length) return;

    const finaleLabels = {
      active:   'Active in the finale',
      inactive: 'Did not reach the wheel',
      broken:   'Slot broken'
    };

    const detail     = document.getElementById('zodiac-detail-inner');
    const nodes      = document.querySelectorAll('.znode');

    if (!detail || !nodes.length) return;

    function showDetail(item) {
      detail.className = 'zodiac-detail-inner';
      detail.innerHTML = `
        <div class="zodiac-detail-symbol">${item.symbol}</div>
        <div class="zodiac-detail-label">${item.label}</div>
        <div class="zodiac-detail-character">${item.character}</div>
        <div class="zodiac-detail-desc">${item.description}</div>
        <div class="zodiac-finale-block ${item.finaleRole}">
          <div class="zodiac-finale-label">${finaleLabels[item.finaleRole] || item.finaleRole}</div>
          <div class="zodiac-finale-note">${item.finaleNote}</div>
        </div>
      `;
    }

    nodes.forEach((node, i) => {
      const item = items[i];
      if (!item) return;

      node.addEventListener('click', () => {
        nodes.forEach(n => n.classList.remove('selected'));
        node.classList.add('selected');
        showDetail(item);
      });

      node.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          node.click();
        }
      });
    });
  }

  function wireReveals() {
    // Immediately mark all reveal elements visible — no scroll gating on mobile
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
      el.classList.add('is-visible');
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
