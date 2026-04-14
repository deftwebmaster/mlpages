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
    [eggs, ciphers, characters] = await Promise.all([
      fetchJSON('data/eggs.json'),
      fetchJSON('data/ciphers.json'),
      fetchJSON('data/characters.json'),
    ]);
    buildCipherReference();
    buildEggs();
    buildCharacters();
    wireNav();
    wireCipherDecoder();
    wireEggFilters();
    wireReveals();
  }

  // ── Inline data — works on file://, GitHub Pages, and any server ──
  const _DATA = {
    'data/eggs.json':       [{"id": "s1e1-gnome-painting", "season": 1, "episode": 1, "title": "Gnome in the tourist trap painting", "category": "background", "hint": "Look at the large painted mural on the wall of the Mystery Shack gift shop during Dipper and Mabel's first tour.", "spoilerTier": "safe", "spoiler": "One of the painted figures in the mural is clearly a gnome wearing a red hat \u2014 the same style as the gnome leader Jeff, who doesn't appear until the very next episode. The prop team planted him a full episode early."}, {"id": "s1e1-bill-triangle", "season": 1, "episode": 1, "title": "Bill's triangle on the dollar bill", "category": "background", "hint": "During the opening scene when Stan is counting money at his register, look carefully at the bills themselves.", "spoilerTier": "s2", "spoiler": "The dollar bills in Stan's register feature a triangle with a single eye where the Eye of Providence normally sits on US currency \u2014 Bill Cipher's iconic form. This is the very first shot of the entire series, meaning Bill was seeded before the show's own premise was established."}, {"id": "s1e1-journals-shelf", "season": 1, "episode": 1, "title": "All three journals on Stan's shelf", "category": "background", "hint": "Before Dipper discovers Journal 3 in the attic, scan the bookshelf visible behind Stan's desk.", "spoilerTier": "s2", "spoiler": "All three journals \u2014 1, 2, and 3 \u2014 are visible on the shelf in the very first episode, distinguishable by their colors. Season 2 reveals Stan had possessed Journal 1 the entire time, meaning it sat in plain sight from the pilot onward."}, {"id": "s1e1-stans-real-name-doc", "season": 1, "episode": 1, "title": "Stanley Pines on the wall document", "category": "background", "hint": "There's a piece of paper pinned near Stan's register in the gift shop. It's readable if you pause \u2014 look at the name on it.", "spoilerTier": "finale", "spoiler": "The document clearly reads 'STANLEY PINES' \u2014 not Stanford. The writers had already established in the pilot that the man running the Mystery Shack was not the journal's author. The name sat in frame for two seasons before anyone had reason to care about the distinction. It may be the most patient character reveal in animated television history."}, {"id": "s1e1-carpet-bill", "season": 1, "episode": 1, "title": "Bill's eye in the Mystery Shack carpet", "category": "background", "hint": "Look at the floor of the gift shop during any wide interior shot. The carpet has a repeating geometric pattern \u2014 look at what that pattern actually is.", "spoilerTier": "s2", "spoiler": "The carpet is made up of repeating triangles with a single eye \u2014 Bill Cipher's silhouette, woven into the floor of the Mystery Shack. He is literally underfoot in the first episode, before the show has introduced any of its mysteries."}, {"id": "s1e2-credits-cipher", "season": 1, "episode": 2, "title": "First end-credits cryptogram", "category": "cryptogram", "hint": "Stay through the end credits of 'The Legend of the Gobblewonker.' There's a short string of capital letters hidden in the black end card.", "spoilerTier": "safe", "spoiler": "The cryptogram 'ZHOFRPH WR JUDYLWB IDOOV' is a Caesar cipher (shift 3) that decodes to 'WELCOME TO GRAVITY FALLS.' This was the first of dozens of end-credits ciphers the show would use, and it launched one of the most dedicated fan-decoding communities in animation history."}, {"id": "s1e2-stan-tattoo", "season": 1, "episode": 2, "title": "Stan's back tattoo glimpsed early", "category": "background", "hint": "There's a brief shot of Stan in the bathroom in this episode. Look at his back \u2014 something is visible that the show never draws attention to.", "spoilerTier": "s2", "spoiler": "A tattoo is briefly visible on Stan's back \u2014 the same symbol that, in the Season 2 finale, is part of the portal activation sequence. It was designed and planted here two full years before the payoff aired."}, {"id": "s1e3-wax-figures", "season": 1, "episode": 3, "title": "Wax figures arranged like the Last Supper", "category": "background", "hint": "When Stan's Hall of the Forgotten is first shown in 'Headhunters,' count the wax figures and note how they're arranged at the long table.", "spoilerTier": "safe", "spoiler": "The wax figures are seated in an arrangement that deliberately mirrors da Vinci's Last Supper \u2014 same central figure, same groupings on either side. The animators confirmed the reference was intentional, though the show never explains the significance."}, {"id": "s1e3-credits-cipher", "season": 1, "episode": 3, "title": "Credits cipher: 'ZHOFRPH EDFN'", "category": "cryptogram", "hint": "Check the end card of 'Headhunters' for the Caesar cipher hidden there.", "spoilerTier": "safe", "spoiler": "Decodes to 'WELCOME BACK' \u2014 a simple acknowledgment to fans who were already learning to look for the ciphers. The show was rewarding attentive viewers as early as episode three."}, {"id": "s1e4-credits-cipher", "season": 1, "episode": 4, "title": "Credits cipher: 'VWRS UHDGLQJ PB PLQG'", "category": "cryptogram", "hint": "The end card of 'The Hand That Rocks the Mabel' contains this episode's Caesar cipher.", "spoilerTier": "s2", "spoiler": "Decodes to 'STOP READING MY MIND' \u2014 written in Bill's voice, as though he's addressing the audience directly. This was the first credits cipher to suggest Bill was aware of the viewers, a theme the show would return to repeatedly."}, {"id": "s1e5-blendin-background", "season": 1, "episode": 5, "title": "Blendin Blandin lurking before his debut", "category": "background", "hint": "In 'The Inconveniencing,' scan the background of the Dusk 2 Dawn establishing shot. Someone is standing near the edge of the scene who has no business being there.", "spoilerTier": "s1", "spoiler": "Blendin Blandin \u2014 the time-traveling repairman who won't be formally introduced until episode 9 \u2014 is visible in his camouflage jumpsuit in the background. In-universe, he's there because he's already been tracking Dipper and Mabel through time. Out of universe, it's a planted Easter egg for rewatchers."}, {"id": "s1e5-credits-cipher", "season": 1, "episode": 5, "title": "Credits cipher: 'ELOO LV ZDWFKLQJ'", "category": "cryptogram", "hint": "Check the end card of 'The Inconveniencing.'", "spoilerTier": "s2", "spoiler": "Decodes to 'BILL IS WATCHING' \u2014 three episodes before Bill Cipher is even introduced. The cipher sequence was foreshadowing his arrival in plain text, hidden one alphabet shift away from anyone patient enough to look."}, {"id": "s1e6-hand-symbol", "season": 1, "episode": 6, "title": "Six-fingered handprint in the journal", "category": "journal", "hint": "When Dipper flips through Journal 3 in 'Dipper vs. Manliness,' watch the page he passes over \u2014 not the one he stops on.", "spoilerTier": "s2", "spoiler": "A six-fingered handprint is visible on the skipped page \u2014 the first visual clue that the journal's author has six fingers on each hand. This detail becomes the key to identifying Ford Pines in Season 2, and it was planted here in a blink-and-miss-it frame flip."}, {"id": "s1e6-credits-cipher", "season": 1, "episode": 6, "title": "Credits cipher: 'QHYHU PLQG EDE'", "category": "cryptogram", "hint": "Find the end card cipher in 'Dipper vs. Manliness.'", "spoilerTier": "safe", "spoiler": "Decodes to 'NEVER MIND BAB' \u2014 a deliberately confusing phrase that threw fans off. It's a red herring testing whether people were actually decoding or just guessing. 'Bab' had no meaning; the point was proving the Caesar method was still active and working."}, {"id": "s1e7-credits-cipher", "season": 1, "episode": 7, "title": "Credits cipher: 'VWDQ LV QRW ZKDW KH VHHPV'", "category": "cryptogram", "hint": "Stay for the end card of 'Double Dipper.' This one is significant.", "spoilerTier": "finale", "spoiler": "Decodes to 'STAN IS NOT WHAT HE SEEMS' \u2014 foreshadowing the central mystery of the entire series from episode 7. Fans interpreted this as Stan being supernatural. The real answer \u2014 that he had spent decades living under his twin brother's name \u2014 was far stranger than any supernatural explanation."}, {"id": "s1e8-bill-shadow", "season": 1, "episode": 8, "title": "Bill's triangular silhouette in 'Irrational Treasure'", "category": "background", "hint": "In the historical flashback sequence of 'Irrational Treasure,' watch the shapes in the background. Something triangular is present that doesn't match any character in the scene.", "spoilerTier": "s2", "spoiler": "A triangular figure with a single eye is briefly visible in the background of the flashback \u2014 Bill Cipher appearing in a scene set centuries before his formal introduction. Whether this represents Bill actually being present in that era (consistent with his interdimensional nature) or is pure foreshadowing is intentionally left ambiguous."}, {"id": "s1e8-quentin-cipher", "season": 1, "episode": 8, "title": "Historical document cipher in 'Irrational Treasure'", "category": "cryptogram", "hint": "In 'Irrational Treasure,' a historical document is shown during the reveal about President Quentin Trembley. Look at the text block in the corner of the document \u2014 it's not decorative.", "spoilerTier": "safe", "spoiler": "A small block of Caesar cipher text near the edge of the document decodes to 'QUENTIN TREMBLEY WAS REAL' \u2014 an in-universe joke confirming that even within the show's fictional history, this absurd president was a genuine historical figure. The show treated its own absurdist worldbuilding with complete seriousness."}, {"id": "s1e9-bill-reversed-audio", "season": 1, "episode": 9, "title": "Reversed audio in Bill's first appearance", "category": "cryptogram", "hint": "In 'The Time Traveler's Pig,' Bill Cipher formally appears for the first time. There's something in the audio of his introduction scene that you need to reverse to hear properly.", "spoilerTier": "s1", "spoiler": "When Bill's introductory monologue audio is reversed, he says 'I'M WATCHING YOU NERDS' directly to the audience. Alex Hirsch confirmed this was intentional \u2014 Bill breaking the fourth wall and acknowledging the viewers was baked into his very first scene."}, {"id": "s1e9-credits-cipher", "season": 1, "episode": 9, "title": "Credits cipher: 'ZLOO BRX HQWHU WKH IDOOV'", "category": "cryptogram", "hint": "Check the end card of 'The Time Traveler's Pig.'", "spoilerTier": "safe", "spoiler": "Decodes to 'WILL YOU ENTER THE FALLS' \u2014 a direct address to the viewer, asking if they're committed to the show's mysteries. Placed right after Bill's debut, it reframes the cipher hunt as something Bill himself is inviting the audience into."}, {"id": "s1e10-atbash-debut", "season": 1, "episode": 10, "title": "Atbash cipher introduced in 'Fight Fighters'", "category": "cryptogram", "hint": "The end card of 'Fight Fighters' breaks from the Caesar pattern used in every previous episode. The cipher type has changed \u2014 you'll need a different method to decode it.", "spoilerTier": "safe", "spoiler": "This episode introduced the Atbash cipher to the show's rotation, catching fans off guard. The decoded message references the cipher itself \u2014 a self-referential joke telling fans which tool they'd just switched to. From this point on, viewers had to figure out which cipher each episode was using before they could decode it."}, {"id": "s1e11-portal-blueprints", "season": 1, "episode": 11, "title": "Portal blueprints visible behind Stan", "category": "background", "hint": "In 'Little Dipper,' during any scene set in Stan's private back room, look at the papers and diagrams visible on the desk and walls behind him \u2014 not the props in the foreground.", "spoilerTier": "s2", "spoiler": "Partially visible diagrams on the walls and desk are consistent with the interdimensional portal schematics revealed in Season 2. Stan had been actively working on the portal throughout Season 1, and the evidence was present in the background the entire time \u2014 never focused on, never addressed."}, {"id": "s1e12-stan-fez", "season": 1, "episode": 12, "title": "The symbol on Stan's fez", "category": "background", "hint": "In 'Summerween,' get a clear look at the emblem embroidered on Stan's fez. It's not just decoration.", "spoilerTier": "s2", "spoiler": "The fez bears a six-pointed star symbol \u2014 identical to the emblem of the Society of the Blind Eye, the memory-erasing cult revealed in Season 2. Whether Stan had any actual connection to the Society is never confirmed, but the symbol was not placed on his hat by accident."}, {"id": "s1e13-underground-lab", "season": 1, "episode": 13, "title": "The odd door in the Mystery Shack hallway", "category": "background", "hint": "In 'Boss Mabel,' there's a hallway shot in the lower portion of the shack. One door has a different handle from every other door in the building.", "spoilerTier": "s2", "spoiler": "That door leads to the secret underground lab that Ford built beneath the shack. It's visible in at least six Season 1 episodes \u2014 always closed, always unaddressed. The different handle was the production team's way of flagging it as significant for rewatchers without tipping off first-time viewers."}, {"id": "s1e13-credits-cipher", "season": 1, "episode": 13, "title": "Credits cipher: 'THERE IS ONLY ONE MESSAGE'", "category": "cryptogram", "hint": "The end card of 'Boss Mabel' uses the Atbash cipher. Decode it.", "spoilerTier": "safe", "spoiler": "Decodes to 'THERE IS ONLY ONE MESSAGE' \u2014 a cryptic statement that fans spent weeks debating. In retrospect it seems to point at the show's unified thesis: every cipher, easter egg, and mystery in Gravity Falls ultimately points toward one truth about the Pines family."}, {"id": "s1e14-mcgucket-ramblings", "season": 1, "episode": 14, "title": "McGucket's gibberish contains portal fragments", "category": "background", "hint": "In 'Bottomless Pit!,' Old Man McGucket makes a brief appearance and mutters something that sounds like nonsense. Try to catch the exact words.", "spoilerTier": "s2", "spoiler": "Fragments of McGucket's incoherent speech are consistent with parts of the portal activation sequence revealed in Season 2. His mind was so damaged by repeated memory erasure that he can't speak coherently \u2014 but what he saw through the portal surfaces as scrambled technical language he can't control or understand."}, {"id": "s1e15-gideon-journal2", "season": 1, "episode": 15, "title": "Journal 2 on Gideon's reading stand", "category": "journal", "hint": "In multiple Season 1 episodes featuring Gideon's workspace, look at what's sitting on his reading stand. The cover color and number are visible if you pause.", "spoilerTier": "s1", "spoiler": "Journal 2 is visible on Gideon's reading stand throughout Season 1. The show never explicitly labels it until much later, but it's identifiable by color and number. Gideon's obsession with acquiring Journal 3 from Dipper makes considerably more sense once you realize he already had one of the three."}, {"id": "s1e16-blendin-fair", "season": 1, "episode": 16, "title": "Blendin at the county fair", "category": "background", "hint": "During the Gravity Falls county fair scenes in 'Carpet Diem,' scan the background crowd shots carefully. Someone is trying not to be noticed.", "spoilerTier": "s1", "spoiler": "Blendin Blandin is visible again in the background at the fair \u2014 his third background appearance before his speaking role. His camouflage suit would help him blend in outdoors but is conspicuous in a crowd. Each of his background appearances places him in a scene where Dipper and Mabel are doing something that will later affect the timeline he's supposed to be protecting."}, {"id": "s1e17-a1z26-debut", "season": 1, "episode": 17, "title": "A1Z26 cipher debuts in 'Boyz Crazy'", "category": "cryptogram", "hint": "The end card of 'Boyz Crazy' introduces a third cipher type. Instead of letters, you'll find numbers separated by dashes.", "spoilerTier": "safe", "spoiler": "This episode debuted the A1Z26 cipher (A=1, B=2... Z=26). The decoded message reads 'NEXT SUMMER' \u2014 teasing the then-unconfirmed Season 2. Fans decoded it within hours and took it as an unofficial renewal announcement before Disney made anything official."}, {"id": "s1e18-gideon-amulet-bill", "season": 1, "episode": 18, "title": "Bill's eye reflected in Gideon's amulet", "category": "background", "hint": "In 'Land Before Swine,' look at Gideon's amulet when it catches the light. Pay attention to what's reflected in its surface rather than the amulet itself.", "spoilerTier": "s2", "spoiler": "The reflection in Gideon's amulet is a single triangular eye \u2014 Bill Cipher. Season 2 reveals that Gideon made a deal with Bill, and this reflection suggests Bill was already tied to the amulet long before their relationship is made explicit. Every Season 1 scene featuring the amulet takes on new weight in retrospect."}, {"id": "s1e19-ford-in-memory", "season": 1, "episode": 19, "title": "Ford visible in Stan's memories", "category": "background", "hint": "In 'Dreamscaperers,' Bill takes Dipper into Stan's mental memories. Look at the people in those memory sequences \u2014 specifically, look at their hands.", "spoilerTier": "s2", "spoiler": "One of Stan's memories shows him standing alongside a man who visibly has six fingers on one hand. This is Ford Pines \u2014 Stan's twin brother and the journal's author \u2014 appearing in Stan's own memory before he is ever mentioned or seen by name. Rewatchers recognize him immediately by the hand."}, {"id": "s1e19-gideon-bill-deal", "season": 1, "episode": 19, "title": "Gideon shakes hands with Bill at the end of Season 1", "category": "background", "hint": "At the very end of 'Dreamscaperers,' after Gideon's defeat, there's a brief cutaway that most first-time viewers read as a throwaway gag. Watch it more carefully.", "spoilerTier": "s2", "spoiler": "Gideon makes a deal with Bill Cipher in this cutaway \u2014 actually shaking his hand to seal the arrangement. At first watch it plays as an absurdist joke. In Season 2, this deal turns out to be completely real: it results in Gideon being broken out of prison by Bill's agents. The 'gag' was foreshadowing a major Season 2 plot point."}, {"id": "s1e19-credits-vigenere-hint", "season": 1, "episode": 19, "title": "Credits cipher: 'NEXT CIPHER HARDER'", "category": "cryptogram", "hint": "The end card of 'Dreamscaperers' contains an A1Z26 message. Decode it.", "spoilerTier": "s2", "spoiler": "Decodes to 'NEXT CIPHER HARDER' \u2014 a direct communication to the fan decoding community that the ciphers were about to get significantly more complex. Season 2 would introduce the Vigen\u00e8re cipher, which requires a keyword (STANFORD) the show had been concealing the entire time."}, {"id": "s1e20-bill-is-coming", "season": 1, "episode": 20, "title": "Season 1 finale cipher: 'BILL IS COMING'", "category": "cryptogram", "hint": "The Season 1 finale 'Gideon Rises' ends with a Caesar cipher in the credits. It's the last cipher of the season.", "spoilerTier": "s2", "spoiler": "Decodes to 'BILL IS COMING' \u2014 a direct threat closing out Season 1 and confirming where Season 2 was headed. After 20 episodes with Gideon as the primary antagonist, this cipher made clear that everything so far had been preamble."}, {"id": "s1e20-portal-activation", "season": 1, "episode": 20, "title": "Stan successfully activates the portal in the Season 1 finale", "category": "background", "hint": "The final scene of 'Gideon Rises' shows Stan in his underground lab. This scene rewards very careful attention to what he's actually doing and what it means.", "spoilerTier": "s2", "spoiler": "Stan successfully activates the interdimensional portal \u2014 the machine the entire season had been building toward in the background. Season 2 reveals he built it to bring his brother Ford back from the other dimension. This moment in the Season 1 finale is when he finally succeeds in beginning the process \u2014 and the show cuts to credits without explaining any of it."}, {"id": "s2e1-blind-eye-symbol", "season": 2, "episode": 1, "title": "Society of the Blind Eye symbol appears before the Society does", "category": "background", "hint": "In 'Scary-oke,' look at the decorative elements on the walls of Gravity Falls' local establishments. One symbol recurs that doesn't fit the rustic decor.", "spoilerTier": "s2", "spoiler": "The Society of the Blind Eye's emblem \u2014 an eye with a slash through it \u2014 appears on the wall of at least one local building in the Season 2 premiere. The Society won't be introduced until later in Season 2, but they've apparently been marking their presence around town for a very long time."}, {"id": "s2e1-fiddleford-photo", "season": 2, "episode": 1, "title": "Young McGucket in Stan's photograph", "category": "background", "hint": "Season 2 opens with a framed photograph on Stan's desk that wasn't there in Season 1. Look at the two people in it.", "spoilerTier": "s2", "spoiler": "The photo shows a younger Stan Pines alongside a man recognizable as a young Fiddleford McGucket \u2014 confirming they knew each other decades before the show's events, long before the show explains the connection. Fans who spotted it had a head start on understanding McGucket's real backstory."}, {"id": "s2e2-cipher-wheel-margin", "season": 2, "episode": 2, "title": "The zodiac wheel sketched in the journal margins", "category": "journal", "hint": "In 'Into the Bunker,' during the shapeshifter sequence, one of the journal pages that briefly comes into focus has something drawn in the margin that isn't part of the main entry.", "spoilerTier": "s2", "spoiler": "The margin contains a partial sketch of the zodiac wheel \u2014 the twelve-symbol cipher circle used to defeat Bill Cipher in the Season 2 finale. It appears here in episode 2 of Season 2, months before the finale aired, as a margin doodle that most viewers registered as set decoration."}, {"id": "s2e2-shapeshifter-journal", "season": 2, "episode": 2, "title": "Shapeshifter journal page shows future forms", "category": "journal", "hint": "In 'Into the Bunker,' when the journal page about the shapeshifter is shown, read all of the text and look at the silhouettes around the edge \u2014 not just the main illustration.", "spoilerTier": "s2", "spoiler": "The journal page lists various forms the shapeshifter can take, including silhouettes that match creatures introduced later in Season 2. One silhouette appears consistent with Bill Cipher's physical form during Weirdmageddon, suggesting Ford had already documented what Bill looked like when embodied in the physical world."}, {"id": "s2e4-bill-possession-mirror", "season": 2, "episode": 4, "title": "'Sock Opera' mirrors Bill's possession thematically", "category": "background", "hint": "The premise of 'Sock Opera' involves someone taking control of something that isn't theirs to control. Pay attention to how this mirrors what Bill does later in the same episode.", "spoilerTier": "s2", "spoiler": "The entire episode is structured as a deliberate mirror of Bill's possession of Dipper's body \u2014 a puppet manipulated by a controlling force. Mabel's puppet show and Bill's takeover run as parallel narratives throughout. When Bill finally possesses Dipper, the show has spent 20 minutes laying the visual and thematic groundwork for exactly that moment."}, {"id": "s2e4-memory-eraser-schematic", "season": 2, "episode": 4, "title": "Memory eraser schematics in Journal 3", "category": "journal", "hint": "In 'Sock Opera,' a journal page is briefly visible during Dipper's research montage that shows a device he isn't looking for. Pause on it.", "spoilerTier": "s2", "spoiler": "The page contains partial schematics for the Society of the Blind Eye's memory erasing device \u2014 meaning Ford had documented it in Journal 3. He knew the Society existed and had studied their technology. The show never addresses why he didn't act on this knowledge, which makes Ford's character considerably more complicated."}, {"id": "s2e5-mcgucket-portal-screen", "season": 2, "episode": 5, "title": "McGucket's screen shows a portal schematic", "category": "background", "hint": "In 'Soos and the Real Girl,' during McGucket's junkyard scenes, one of his many improvised screens displays something technical. Pause on it.", "spoilerTier": "s2", "spoiler": "The screen displays a cross-section consistent with the interdimensional portal's internal structure \u2014 matching Ford's schematics shown later in Season 2. McGucket helped design the portal, and fragments of that knowledge persist in his deteriorated mind, surfacing as technical drawings he produces without understanding what they mean."}, {"id": "s2e6-northwest-crest-latin", "season": 2, "episode": 6, "title": "The Northwest family crest has a betrayal motto", "category": "background", "hint": "In 'Northwest Mansion Mystery,' the family crest visible throughout the manor contains Latin text. It's small but readable if you pause.", "spoilerTier": "s2", "spoiler": "The Latin inscription on the Northwest crest translates roughly to 'we betray to ascend' \u2014 a perfect summary of how the Northwest family actually obtained their wealth and status, which the episode goes on to reveal in full. The crest was designed to tell the truth before the plot did."}, {"id": "s2e6-ghost-painting-changes", "season": 2, "episode": 6, "title": "The lumberjack ghost's portrait expression changes", "category": "background", "hint": "In 'Northwest Mansion Mystery,' before the ghost makes himself known, look at the antique paintings on the manor walls between scenes. Something about one of them shifts.", "spoilerTier": "safe", "spoiler": "The portrait of the lumberjack ghost shows his expression changing subtly between shots \u2014 the animators drew multiple versions of the painting and swapped them across scenes. It only works as a detail on freeze-frame or careful rewatch, but the ghost is effectively watching the characters through his own portrait the entire episode."}, {"id": "s2e7-ford-silhouette-portal", "season": 2, "episode": 7, "title": "Ford's silhouette visible through the portal", "category": "background", "hint": "In 'Society of the Blind Eye,' Stan's lab is briefly shown. Look at the light coming through the portal \u2014 specifically at the shape it illuminates from the other side.", "spoilerTier": "s2", "spoiler": "A humanoid silhouette is visible through the portal's energy \u2014 Ford, on the other side. He had been visible in background portal shots since the Season 1 finale, but this is one of the clearest instances before his formal introduction. Rewatchers recognize him immediately."}, {"id": "s2e8-journal-bill-warning", "season": 2, "episode": 8, "title": "Ford's warning about Bill in Journal 3", "category": "journal", "hint": "In 'Blendin's Game,' Dipper consults Journal 3 at one point. The page visible has a header and margin notes you can read if you pause.", "spoilerTier": "s2", "spoiler": "The journal page is Ford's entry on Bill Cipher, and the margin contains a warning: 'DO NOT MAKE DEALS WITH THIS CREATURE.' Ford wrote this from personal experience \u2014 he made exactly that mistake himself. Dipper reads right past the warning. On rewatch, this is one of the most painful moments in the series."}, {"id": "s2e9-bill-eye-tapestry", "season": 2, "episode": 9, "title": "Bill's symbol in Gravity Falls' historical tapestry", "category": "background", "hint": "In 'The Love God,' the town's civic building or hall contains an old tapestry depicting local history. Look at the details in the background imagery.", "spoilerTier": "s2", "spoiler": "Bill Cipher's triangular eye is woven into what's supposed to be a historical document of Gravity Falls \u2014 suggesting Bill's influence on the town predates the show's events by centuries. The townspeople have been living with his symbol embedded in their own history without knowing what it means."}, {"id": "s2e11-not-what-he-seems-cipher", "season": 2, "episode": 11, "title": "Vigen\u00e8re cipher hidden in 'Not What He Seems'", "category": "cryptogram", "hint": "In 'Not What He Seems,' a document shown during the government agent scenes has a text block in the lower portion of the page. Try decoding it with the Vigen\u00e8re cipher.", "spoilerTier": "s2", "spoiler": "Decoded with the key STANFORD, the text reads 'HE IS THE AUTHOR' \u2014 referring to Ford Pines. The decoding community cracked this before Ford's identity was revealed in the episode itself, giving fans who were still actively solving ciphers a brief window where they knew the answer before the general audience did."}, {"id": "s2e11-weirdmageddon-sky", "season": 2, "episode": 11, "title": "Weirdmageddon already seeping into the sky", "category": "background", "hint": "In 'Not What He Seems,' during exterior shots before the portal fully activates, look at the sky near the horizon. Something is wrong with it.", "spoilerTier": "s2", "spoiler": "A faint prismatic discoloration is visible in the sky in two exterior wide shots \u2014 the first visual sign of reality breaking down as the portal approaches full power. It's easy to miss because of how much is happening in the foreground, but it's a deliberate visual signal that the world is already changing before Bill arrives."}, {"id": "s2e12-ford-six-fingers-intro", "season": 2, "episode": 12, "title": "Ford's first visible body part is his hand", "category": "background", "hint": "When Ford steps through the portal at the climax of 'Not What He Seems,' pay attention to what the camera chooses to show first.", "spoilerTier": "s2", "spoiler": "Ford's introduction is framed around his hand \u2014 specifically shot to show six fingers. The show had been planting the six-finger detail since Season 1, and here it pays off: his first visible body part is the very detail that identifies him. It's the same hand visible in journal handprints and margin illustrations scattered across both seasons."}, {"id": "s2e13-stans-backstory-clues", "season": 2, "episode": 13, "title": "'A Tale of Two Stans' confirms Season 1 background details", "category": "background", "hint": "Watch 'A Tale of Two Stans' as a rewatch specifically looking for callbacks to background details you noticed in Season 1 \u2014 the document on the wall, the door in the hallway, the blueprints.", "spoilerTier": "s2", "spoiler": "This episode retroactively confirms what every Season 1 background detail was pointing at: Stan was Stanley Pines, living under his brother Ford's name, having spent years building a portal to bring Ford home from another dimension. Every anomalous background prop in Season 1 \u2014 the blueprints, the lab door, the tattoo \u2014 was part of this story the whole time."}, {"id": "s2e15-zodiac-wheel-full", "season": 2, "episode": 15, "title": "The complete zodiac wheel shown for the first time", "category": "journal", "hint": "In 'The Last Mabelcorn,' Ford shows Dipper a research diagram. It contains twelve symbols arranged in a circle. Look at all twelve carefully.", "spoilerTier": "s2", "spoiler": "This is the first full, clear view of the zodiac wheel. Every symbol corresponds to a character: the pine tree (Dipper), the shooting star (Mabel), the question mark (Soos), the ice bag (McGucket), the glasses (Ford), the six-fingered hand (also Ford as author), the star (Stan), and others. Fans mapped all twelve symbols to characters months before the finale revealed their significance."}, {"id": "s2e17-weirdmageddon-warning-cipher", "season": 2, "episode": 17, "title": "Credits cipher: 'WEIRDMAGEDDON IS COMING'", "category": "cryptogram", "hint": "The end card of 'Dipper and Mabel vs. the Future' contains a Vigen\u00e8re cipher. Use STANFORD as the key.", "spoilerTier": "finale", "spoiler": "Decoded: 'WEIRDMAGEDDON IS COMING' \u2014 broadcast one episode before Weirdmageddon actually begins. Fans who were actively decoding the credits had a full week's warning of what was about to happen. Viewers who weren't looking for the ciphers walked into it completely blind."}, {"id": "s2e18-bill-army-old-faces", "season": 2, "episode": 18, "title": "Bill's chaos army contains background creatures from earlier episodes", "category": "background", "hint": "During Bill's Weirdmageddon takeover, his assembled army of chaos creatures includes some figures that look familiar. Cross-reference them against background props and creatures from Season 1.", "spoilerTier": "s2", "spoiler": "Several of Bill's Weirdmageddon creatures match or closely resemble monsters, paintings, and strange figures glimpsed in the background of earlier episodes \u2014 in the Mystery Shack gift shop, the forest, and local buildings. The implication is that Bill had agents and avatars embedded in Gravity Falls long before his official arrival during Weirdmageddon."}, {"id": "s2e19-wax-larry-king-hand", "season": 2, "episode": 19, "title": "Wax Larry King's hand on Dipper's backpack", "category": "background", "hint": "In the Weirdmageddon episodes, when Dipper is shown with his backpack, look at what's attached to the outside of the bag \u2014 it's a prop from Season 1.", "spoilerTier": "s1", "spoiler": "Attached to Dipper's bag is the severed wax hand of Wax Larry King from the 'Headhunters' episode \u2014 an unexplained background prop with no in-episode significance. Alex Hirsch confirmed it was placed there deliberately as a reward for viewers who remembered where it came from. Season 1 memorabilia, carried into the apocalypse."}, {"id": "s2e20-bill-statue-real-world", "season": 2, "episode": 20, "title": "Real-world Bill Cipher statue hidden by GPS coordinates", "category": "cryptogram", "hint": "The finale's end credits contain encrypted text that, when decoded, gives real-world GPS coordinates. This is not part of the show's fiction \u2014 it leads somewhere you can actually go.", "spoilerTier": "finale", "spoiler": "The coordinates lead to Reedsport, Oregon, where a life-sized Bill Cipher statue was installed by Alex Hirsch as part of a real-world ARG. Visitors who find it can call a phone number on the base and hear a message from 'the author.' The statue is still there and the number still works as of the show's last anniversary event."}, {"id": "s2e20-journals-combined", "season": 2, "episode": 20, "title": "The three journals were always meant to be assembled", "category": "journal", "hint": "In the finale, when all three journals are brought together, look at their covers side by side. There's something about their design that only makes sense when they're combined.", "spoilerTier": "finale", "spoiler": "The three journal covers, when placed together in order, form a single continuous image \u2014 the portal diagram, split across all three books. Ford designed the journals so that no single one contained enough information to activate the portal; you needed all three to even understand what you were building. Stan spending years tracking down and assembling all three was the only way the portal could ever work."}, {"id": "multi-blendin-appearances", "season": 1, "episode": 1, "title": "Blendin Blandin's three pre-debut background appearances", "category": "background", "hint": "Before Blendin Blandin is formally introduced in episode 9, he appears in the background of at least three earlier episodes. Try spotting him in the crowd and establishing scenes of episodes 1, 5, and 16.", "spoilerTier": "s1", "spoiler": "Blendin appears near the Mystery Shack entrance in episode 1, at the Dusk 2 Dawn parking lot in episode 5, and at the county fair in episode 16 \u2014 always in his camouflage jumpsuit, always just off to the side. In-universe, he's tracking the twins through time. His appearances cluster around events that later affect the timeline he's supposed to protect."}, {"id": "multi-six-finger-clues", "season": 1, "episode": 1, "title": "Six-finger clues span both seasons of the show", "category": "journal", "hint": "Journal 3 contains handprints, margin sketches, and illustrations attributed to the author throughout both seasons. Stop looking at the content of those illustrations and look at the hands drawing them.", "spoilerTier": "s2", "spoiler": "Every hand illustration in Journal 3 \u2014 handprints, margin drawings, border decorations \u2014 shows six fingers. The clue is present from the first time Dipper opens the journal in episode 1. The author's defining physical characteristic is visible in his own handwriting across both seasons of the show. It was always there."}, {"id": "multi-bill-eye-everywhere", "season": 1, "episode": 1, "title": "Bill's triangle-eye embedded throughout the show's visual design", "category": "background", "hint": "Bill Cipher's motif \u2014 a triangle with a single eye \u2014 appears in background props, floor patterns, wall decorations, printed materials, and set dressing across dozens of episodes. Pick any episode at random and look for it.", "spoilerTier": "s2", "spoiler": "The production team embedded Bill's symbol throughout the show's visual design as a thematic statement: Bill is literally everywhere in Gravity Falls, woven into the fabric of the town long before he physically arrives. He is in the carpet, the wallpaper, the currency, the tapestries, and the journals \u2014 the town has been his territory the entire time, and no one living there knew it."}],
    'data/ciphers.json':    [{"id": "caesar", "name": "Caesar Cipher", "shift": 3, "seasons": [1], "description": "The first cipher used in the show. Each letter is shifted back 3 positions in the alphabet. Appeared in Season 1 end-credits from episodes 1\u20136.", "example": {"encoded": "ZHOFRPH WR JUDYLWB IDOOV", "decoded": "WELCOME TO GRAVITY FALLS", "source": "S1E2 end credits"}, "tip": "To decode manually: for each letter, count back 3 in the alphabet. A\u2192X, B\u2192Y, C\u2192Z, D\u2192A, etc."}, {"id": "atbash", "name": "Atbash Cipher", "seasons": [1], "description": "Introduced mid-Season 1. Each letter is mirrored across the alphabet: A becomes Z, B becomes Y, and so on. It's its own key \u2014 encoding and decoding use the same operation.", "example": {"encoded": "HZBWRMT HGZMBVI", "decoded": "STAYING STAYNER", "source": "S1E7 end credits"}, "tip": "Mirror each letter: A\u2194Z, B\u2194Y, C\u2194X, D\u2194W... The alphabet folds in half."}, {"id": "a1z26", "name": "A1Z26 Cipher", "seasons": [1, 2], "description": "Used in late Season 1 and early Season 2. Letters are replaced with their numerical position in the alphabet: A=1, B=2, all the way to Z=26. Numbers are typically separated by dashes or spaces.", "example": {"encoded": "19-20-1-14-6-15-18-4", "decoded": "STANFORD", "source": "S1E20 end credits"}, "tip": "Enter numbers separated by spaces or dashes. Each number maps directly to a letter position."}, {"id": "vigenere", "name": "Vigen\u00e8re Cipher", "key": "STANFORD", "seasons": [2], "description": "The most complex cipher in the show, introduced in Season 2. Uses the keyword STANFORD as a repeating key. Each letter of the message is shifted by the corresponding letter in the key (A=0, B=1... Z=25). Named after Blaise de Vigen\u00e8re, but the show's use of STANFORD as the key is a direct reference to Ford Pines.", "example": {"encoded": "ZKBVIQZSRIQMFBV", "decoded": "DIPPER IS THE AUTHOR", "source": "S2E2 end credits (fan-decoded)"}, "tip": "The key STANFORD repeats over the message. Each key letter shifts the message letter by its alphabet position."}, {"id": "bill-wheel", "name": "Bill's Symbol Wheel", "seasons": [2], "description": "A substitution cipher using the 12 symbols from Bill Cipher's zodiac/cipher wheel. Each symbol corresponds to a letter or concept. Appeared primarily in Season 2 promotional materials, the Journal 3 prop book, and select frames during Weirdmageddon. This is the rarest cipher in the show and some messages using it remain partially decoded.", "example": {"encoded": "\ud83d\udd3a \ud83d\udc41 \ud83c\udf32 \ud83c\udf0a \ud83e\uddb4 \ud83d\udc1e \u270b \u2b50 \ud83d\udc1f \ud83d\udd25 \ud83c\udf19 \ud83c\udf08", "decoded": "The 12 symbols of the wheel \u2014 each represents a character or concept in the finale.", "source": "S2 finale / promotional art"}, "tip": "Each of the 12 wheel symbols corresponds to one of the zodiac characters. The full substitution alphabet is documented in the official Journal 3 prop replica."}, {"id": "multilayer", "name": "Multi-Layer Combined Cipher", "seasons": [2], "description": "Used in the finale and some Season 2 promotional ARG materials. Messages are encoded in one cipher, and the result is then encoded in a second cipher. The most common pairing was Caesar \u2192 Atbash. Decoding requires running both ciphers in sequence, in the correct order \u2014 getting the order wrong produces gibberish.", "example": {"encoded": "WBZXY (Caesar first, then Atbash)", "decoded": "Apply Caesar shift 3, then mirror the result through Atbash.", "source": "Gravity Falls ARG / fan community documentation"}, "tip": "Try Caesar first, then run the result through Atbash. If that fails, reverse the order."}],
    'data/characters.json': [{"id": "dipper", "name": "Dipper Pines", "role": "Main protagonist", "color": "blue", "initial": "D", "bio": "Mason 'Dipper' Pines is a 12-year-old sent to spend the summer with his great-uncle Stan in Gravity Falls, Oregon. Bookish, anxious, and relentlessly curious, he discovers Journal 3 in the attic of the Mystery Shack and becomes the de facto investigator of the town's supernatural underbelly. His desire to be taken seriously \u2014 by adults, by Ford, by himself \u2014 is the emotional engine of his arc. He matures over the course of two seasons from a kid chasing mystery for fun into someone who has to decide what kind of person he wants to be when real stakes are on the table.", "eggIds": ["s1e6-hand-symbol", "s1e9-bill-debut", "s2e2-cipher-wheel"], "hiddenFacts": ["Dipper's real name, Mason, is never said aloud in the show. It only appears in background text \u2014 a name tag in one episode, a piece of mail in another.", "His hat's pine tree symbol was chosen before his last name was finalized. The name Pines came after the hat, not before.", "In early production drafts, Dipper was named 'Goose.' Alex Hirsch has said the original version of the character was much more of a straight-man cipher \u2014 the oddness of Gravity Falls was added after."]}, {"id": "mabel", "name": "Mabel Pines", "role": "Twin sister / co-protagonist", "color": "pink", "initial": "M", "bio": "Mabel is Dipper's twin sister and emotional counterweight \u2014 optimistic, chaotic, and unshakeably devoted to the people she loves. Where Dipper investigates, Mabel experiences. She processes the weirdness of Gravity Falls not as a puzzle to be solved but as a canvas for enthusiasm. Her arc is subtler than Dipper's but no less real: she has to reckon with the end of summer, the possibility of Dipper leaving, and the uncomfortable idea that wanting things to stay the same isn't the same as things being okay. She is, by design, almost impossible not to love.", "eggIds": ["s1e12-stan-fez", "s1e3-wax-figures"], "hiddenFacts": ["Mabel's sweaters are hand-designed for almost every episode she appears in \u2014 over 60 unique designs across the series. Several were based on real sweaters sent to the production team by fans during Season 1.", "Her grappling hook, introduced as a joke gift in episode 1, becomes a legitimate plot device in at least five episodes. It was not originally planned to recur \u2014 writers kept finding reasons to bring it back.", "The name Mabel is an old-fashioned name deliberately chosen to feel slightly out of time \u2014 matching Gravity Falls' own unstuck, timeless quality."]}, {"id": "stan", "name": "Grunkle Stan", "role": "Great-uncle / Mystery Shack owner", "color": "amber", "initial": "S", "bio": "Stanford 'Stan' Pines \u2014 except he isn't, and that's the whole thing. The man the twins know as Grunkle Stan spent decades living under his twin brother's name, running a tourist trap in a town full of things he had to pretend he didn't see, waiting for a portal he didn't fully understand to do something he could barely bring himself to hope for. He presents as a grumpy, mercenary con man. He is actually one of the most devoted characters in the show \u2014 just devoted in ways that require two seasons to fully understand. His redemption doesn't feel earned at the end because the show finally argues for it. It feels earned because you realize it was always true.", "eggIds": ["s1e1-journals-shelf", "s1e2-stan-tattoo", "s1e12-stan-fez", "s2e20-stans-real-name", "s1e13-underground-lab"], "hiddenFacts": ["Stan's full name \u2014 Stanley, not Stanford \u2014 is visible on a document in the Mystery Shack as early as episode 1. No one noticed because there was no reason to look.", "His fez's emblem changes slightly between Season 1 and Season 2. The production team has never officially commented on why.", "Alex Hirsch has said Stan was the hardest character to write because every scene had to work on two levels simultaneously \u2014 what the audience thought was happening, and what was actually happening."]}, {"id": "ford", "name": "Ford Pines", "role": "Author of the Journals", "color": "teal", "initial": "F", "bio": "Stanford Pines \u2014 the real one \u2014 spent 30 years in other dimensions after being pushed through his own portal by someone he trusted. He came to Gravity Falls as a researcher following an anomalous signal, built a machine that could pierce dimensional barriers, and made a deal with a dream demon that nearly ended the world. He's brilliant, paranoid, and deeply lonely, carrying guilt he doesn't know how to put down. His relationship with Stan is the emotional spine of Season 2 \u2014 two brothers who hurt each other badly, who spent decades apart, who have to decide if the thing they were to each other is still true.", "eggIds": ["s1e6-hand-symbol", "s1e1-journals-shelf", "s2e1-fiddleford-photo", "s2e2-cipher-wheel"], "hiddenFacts": ["Ford has six fingers on each hand \u2014 the detail that identifies him as the journal's author. This is hinted at via hand prints and journal illustrations throughout Season 1, but the significance isn't clear until his reveal.", "His portal was explicitly designed to be powered by three journals used together \u2014 meaning it couldn't function unless all three were assembled. Stan had to collect all three before even beginning to attempt activation.", "Ford's design was partially inspired by how the production team imagined an older, more world-weary version of Dipper might look \u2014 his curiosity calcified into obsession."]}, {"id": "bill", "name": "Bill Cipher", "role": "Antagonist / dream demon", "color": "red", "initial": "B", "bio": "Bill Cipher is a two-dimensional being from a dimension of pure thought, and every word of that sentence is as strange as it sounds. He operates in dreams, he makes deals, and he wants into the physical world with a patience that makes you understand he's been playing this game a very long time. He's funny \u2014 genuinely, disarmingly funny \u2014 which makes him more frightening, not less. He's the kind of villain who can be delighted by everything and care about nothing simultaneously. His relationship to the show's world is one of pure instrumentality: Gravity Falls is interesting to him only as a door, and the people in it are only as valuable as their usefulness. The horror is how long he maintains the performance of caring.", "eggIds": ["s1e1-bill-triangle", "s1e8-bill-first-shadow", "s1e9-bill-debut", "s2e2-cipher-wheel", "s2e11-weirdmageddon-shadow"], "hiddenFacts": ["Bill's backward speech \u2014 revealed when audio is reversed \u2014 has been documented across dozens of episodes. Not all of it has been decoded. Some of what has been decoded doesn't match any known context, suggesting it may reference events that never made it into the final series.", "His signature phrase 'A-B-C-D-E-F-G-H-I-J-K-LMNOP' is a joke about the limits of his comprehension of human culture \u2014 he knows the beginning and end of the alphabet song but not the hard part in the middle.", "Bill's design is a direct reference to the Eye of Providence \u2014 the pyramid-and-eye symbol on the US dollar. His appearance in the show's pilot on the dollar bill register scene was entirely intentional."]}, {"id": "soos", "name": "Soos Ramirez", "role": "Mystery Shack handyman", "color": "green", "initial": "S", "bio": "Jesus Alzamirano Ramirez \u2014 Soos to everyone who knows him \u2014 has worked at the Mystery Shack since he was 12 years old, when Stan gave him a job on a whim and accidentally became one of the most important people in his life. He's the show's heart in the most literal sense: he loves without calculation, he shows up, and he asks almost nothing in return. His backstory, revealed late in the series, recontextualizes everything warm about him and makes it considerably more affecting. He is proof that Gravity Falls knew exactly what it was doing with every character it introduced, even the ones who appeared to be pure comic relief.", "eggIds": ["s1e3-wax-figures"], "hiddenFacts": ["Soos was designed as a one-scene character in the pilot \u2014 the handyman who helps Dipper and Mabel find the attic. He was kept in every episode because the writers couldn't figure out how to make scenes work without him.", "His full name \u2014 Jesus Alzamirano Ramirez \u2014 is said aloud exactly once in the entire series, in a Season 2 episode, and is easy to miss.", "The question mark on his shirt was originally a placeholder during character design and was kept because it fit him perfectly."]}, {"id": "wendy", "name": "Wendy Corduroy", "role": "Mystery Shack cashier", "color": "teal", "initial": "W", "bio": "Wendy is 15, works the register at the Mystery Shack with the energy of someone doing community service, and is the coolest person Dipper has ever seen. She's the show's most grounded character \u2014 not supernatural, not a genius, not particularly burdened by the mysteries of Gravity Falls \u2014 just a teenager trying to have a good summer before real life shows up. Her friendship with Dipper is handled with unusual honesty: she knows he has a crush, she cares about him too much to pretend otherwise, and she manages the situation like an actual person would. She's also tougher than she looks. The Corduroy family history makes clear that 'cool and laid-back' is something Wendy built deliberately, not something that came easily.", "eggIds": ["s1e5-blendin-first"], "hiddenFacts": ["Wendy is the only main cast member with no supernatural abilities, no connection to the journals, and no direct involvement in the final battle with Bill. This was intentional \u2014 the writers wanted one character who represented normal teenager life in an abnormal town.", "Her last name, Corduroy, and her family's lumberjack heritage were developed specifically to explain why she's so unimpressed by physical danger. It's not bravado \u2014 she genuinely grew up around chainsaws and bears.", "In the episode that reveals her home life, her father Manly Dan is shown to have the same 'acting cooler than I feel' energy she does. The show implies the Corduroy emotional style is multigenerational."]}, {"id": "mcgucket", "name": "Fiddleford McGucket", "role": "Local eccentric / former genius", "color": "amber", "initial": "F", "bio": "Old Man McGucket seems, at first, like set dressing \u2014 the town's harmless local eccentric, living in a junkyard, building improbable machines. He is not set dressing. He was once Ford's research partner, a genuine genius who helped build the portal and was the first person to look through it. What he saw broke him. He invented a memory-erasing device specifically to forget what was on the other side, used it so many times he forgot almost everything about who he was, and ended up in Gravity Falls as a remnant. His recovery arc in Season 2 is one of the show's most quietly moving stories.", "eggIds": ["s2e1-fiddleford-photo"], "hiddenFacts": ["McGucket appears in the background of at least three Season 1 episodes in which he theoretically has no business being \u2014 near the Mystery Shack, near the forest, once outside a building the plot never enters. Whether this is foreshadowing or oversight has never been confirmed.", "His memory erasing machine \u2014 later revealed to be Society of the Blind Eye technology \u2014 was partially documented in Journal 2. Fans who frame-hunted the journal pages in Season 1 found partial schematics before the plot explained them.", "His son Tate McGucket appears in Season 1 without any connection to the main plot, because at that point in production the character of McGucket hadn't been fully developed."]}]
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

    // Active state on scroll
    const sections = ['cipher', 'eggs', 'characters'];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const active = document.querySelector(`nav a[data-section="${entry.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
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

  function wireReveals() {
    const targets = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!targets.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px' });

    targets.forEach(target => observer.observe(target));
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
