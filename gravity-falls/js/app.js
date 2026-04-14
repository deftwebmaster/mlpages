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
    'data/eggs.json':       [{"id": "s1e1-gnome-painting", "season": 1, "episode": 1, "title": "Gnome in the tourist trap painting", "category": "background", "hint": "Look at the large painted mural on the wall of the Mystery Shack gift shop during Dipper and Mabel's first tour.", "spoilerTier": "safe", "spoiler": "One of the painted figures in the mural is clearly a gnome wearing a hat \u2014 the same style as the gnome leader Jeff, who doesn't appear until the next episode. The prop team planted him a full episode early."}, {"id": "s1e1-bill-triangle", "season": 1, "episode": 1, "title": "Bill's shape on the dollar bill", "category": "background", "hint": "During the opening scene when Stan is counting money at his register, look at the bills themselves.", "spoilerTier": "s2", "spoiler": "The dollar bills shown in the register feature a triangle with a single eye \u2014 Bill Cipher's iconic form \u2014 printed where the pyramid normally appears on US currency. This is the very first shot of the entire series, meaning Bill was introduced before the show's premise was."}, {"id": "s1e1-journals-shelf", "season": 1, "episode": 1, "title": "The three journals on Stan's shelf", "category": "background", "hint": "Before Dipper discovers Journal 3 in the attic, pan your eye across the bookshelf visible behind Stan's desk.", "spoilerTier": "s2", "spoiler": "All three journals (1, 2, and 3) are visible on the shelf, distinguishable by color. Season 2 reveals Stan had possessed Journal 1 the entire time \u2014 meaning it was sitting in plain sight from episode one."}, {"id": "s1e2-stan-tattoo", "season": 1, "episode": 2, "title": "Stan's tattoo in the shower scene", "category": "background", "hint": "When Stan is shown in the bathroom in episode 2, there's a glimpse of something on his back.", "spoilerTier": "s2", "spoiler": "A tattoo is briefly visible \u2014 the same tattoo that, in the Season 2 finale, is revealed to be part of the portal activation sequence. It was designed and planted in Season 1, two years before the payoff aired."}, {"id": "s1e2-credits-cipher", "season": 1, "episode": 2, "title": "First end-credits cryptogram", "category": "cryptogram", "hint": "Stay through the credits of 'The Legend of the Gobblewonker.' There's a short string of letters hidden in the black card.", "spoilerTier": "safe", "spoiler": "The cryptogram reads 'ZHOFRPH WR JUDYLWB IDOOV' \u2014 a Caesar cipher (shift 3) that decodes to 'WELCOME TO GRAVITY FALLS.' This was the first of many end-credits ciphers that fans decoded in real time, kicking off one of the most active fan-decoding communities in animation history."}, {"id": "s1e3-wax-figures", "season": 1, "episode": 3, "title": "The wax figures' hidden arrangement", "category": "background", "hint": "When the wax figures are first shown in the Hall of the Forgotten, count them and note their positions carefully.", "spoilerTier": "safe", "spoiler": "There are exactly 10 wax figures at the start of the episode. The arrangement mirrors the seating at the last supper \u2014 a detail the animators confirmed was intentional, though they never explained why."}, {"id": "s1e5-blendin-first", "season": 1, "episode": 5, "title": "Blendin Blandin in the background", "category": "background", "hint": "In 'The Inconveniencing,' look in the background near the Dusk 2 Dawn parking lot during the establishing shot.", "spoilerTier": "s1", "spoiler": "A figure in a camouflage jumpsuit is barely visible near the treeline \u2014 Blendin Blandin, the time traveler who won't be formally introduced until episode 9. He's there because, in-universe, he had already been tracking Dipper and Mabel through time."}, {"id": "s1e6-hand-symbol", "season": 1, "episode": 6, "title": "Six-fingered hand in the journal", "category": "journal", "hint": "When Dipper consults Journal 3 in 'Dipper vs. Manliness,' the page he flips past \u2014 not the one he reads \u2014 has something unusual on it.", "spoilerTier": "s2", "spoiler": "The page shows a six-fingered hand print. This is the first visual clue that the journal's author has six fingers \u2014 a detail that becomes central to identifying Ford Pines in Season 2. It was hidden in a blink-and-miss-it frame flip."}, {"id": "s1e8-bill-first-shadow", "season": 1, "episode": 8, "title": "Bill's silhouette in the dreamscape", "category": "background", "hint": "In 'Irrational Treasure,' there's a brief dream sequence. Watch the shadows on the wall behind the main action.", "spoilerTier": "s1", "spoiler": "A triangular shadow passes across the wall for approximately four frames \u2014 almost certainly Bill Cipher, observing before his formal introduction in episode 9. Most viewers don't catch it until a rewatch after finishing Season 1."}, {"id": "s1e9-bill-debut", "season": 1, "episode": 9, "title": "Bill's true name hidden in his introduction", "category": "cryptogram", "hint": "During Bill's debut in 'Little Dipper,' he introduces himself. Listen to the syllables of his speech \u2014 something is encoded in the rhythm.", "spoilerTier": "s2", "spoiler": "Fans who slowed down the audio discovered that the background music during Bill's introduction plays a reversed message: 'MY NAME IS BILL.' Alex Hirsch confirmed this was deliberate \u2014 Bill was introducing himself twice, once openly and once in a layer only rewatchers would find."}, {"id": "s1e12-stan-fez", "season": 1, "episode": 12, "title": "Stan's fez and the symbols", "category": "background", "hint": "Look closely at the emblem on Stan's fez when he's shown from the front in 'Summerween.'", "spoilerTier": "s2", "spoiler": "The fez symbol is a six-pointed star \u2014 the same symbol used in the Society of the Blind Eye. Stan's membership in (or awareness of) this group is never explicitly confirmed, but the symbol placement was not accidental according to the show's production notes."}, {"id": "s1e13-underground-lab", "season": 1, "episode": 13, "title": "The basement door in the shack", "category": "background", "hint": "In 'Boss Mabel,' there's a shot of the Mystery Shack's lower hallway. One door in the background has a different handle than the others.", "spoilerTier": "s2", "spoiler": "The door leads to Ford's underground lab \u2014 introduced formally in Season 2. It's visible in at least six Season 1 episodes, always closed, always with a subtly different handle design than every other door in the shack."}, {"id": "s2e1-fiddleford-photo", "season": 2, "episode": 1, "title": "Fiddleford in Stan's old photo", "category": "background", "hint": "Season 2, episode 1: a framed photo is visible on Stan's desk that wasn't there in Season 1. Look closely at the people in it.", "spoilerTier": "s2", "spoiler": "The photo shows a younger Stan alongside a man fans would recognize as Fiddleford McGucket \u2014 decades before the events of the show. It confirms their connection long before the show directly addresses it, and eagle-eyed fans spotted it before the plot caught up."}, {"id": "s2e2-cipher-wheel", "season": 2, "episode": 2, "title": "The cipher wheel in the journal margins", "category": "journal", "hint": "In 'Into the Bunker,' the pages of Journal 3 visible during the shapeshifter scene include something in the margin that isn't part of the main text.", "spoilerTier": "s2", "spoiler": "The margin shows a partial version of what fans call the 'cipher wheel' or 'zodiac wheel' \u2014 the same wheel used in the Season 2 finale to defeat Bill. It appears here months before the finale, in a margin doodle most viewers dismissed as set decoration."}, {"id": "s2e11-weirdmageddon-shadow", "season": 2, "episode": 11, "title": "Weirdmageddon in the sky \u2014 episode 11", "category": "background", "hint": "In 'Not What He Seems,' during the outdoor scenes before the finale events, look at the horizon in wide shots.", "spoilerTier": "s2", "spoiler": "A subtle discoloration in the sky \u2014 a faint prismatic shimmer \u2014 is visible in the distance in two separate wide shots. In retrospect it's the beginning of Weirdmageddon, already seeping through the barrier before Bill fully enters the physical world."}, {"id": "s2e20-stans-real-name", "season": 2, "episode": 20, "title": "Stanley vs. Stanford \u2014 the name clue in Season 1", "category": "background", "hint": "Go back to Season 1, episode 1. Stan's full name is briefly visible on a legal document pinned to the wall behind his register.", "spoilerTier": "finale", "spoiler": "The document reads 'STANLEY PINES' \u2014 not Stanford. The show's writers had already decided in Season 1 that Stan was not the journal's author. The name was in frame as early as the pilot, but no one noticed because there was no reason to care about the distinction yet. It's the longest-planted twin twist in modern animation."}],
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
