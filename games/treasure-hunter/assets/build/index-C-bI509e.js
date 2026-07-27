(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function i(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(n){if(n.ep)return;n.ep=!0;const s=i(n);fetch(n.href,s)}})();const wi="modulepreload",ki=function(e,t){return new URL(e,t).href},pt={},Ei=function(t,i,a){let n=Promise.resolve();if(i&&i.length>0){const r=document.getElementsByTagName("link"),o=document.querySelector("meta[property=csp-nonce]"),d=o?.nonce||o?.getAttribute("nonce");n=Promise.allSettled(i.map(c=>{if(c=ki(c,a),c in pt)return;pt[c]=!0;const u=c.endsWith(".css"),f=u?'[rel="stylesheet"]':"";if(!!a)for(let h=r.length-1;h>=0;h--){const y=r[h];if(y.href===c&&(!u||y.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${f}`))return;const p=document.createElement("link");if(p.rel=u?"stylesheet":wi,u||(p.as="script"),p.crossOrigin="",p.href=c,d&&p.setAttribute("nonce",d),document.head.appendChild(p),u)return new Promise((h,y)=>{p.addEventListener("load",h),p.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(r){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=r,window.dispatchEvent(o),!o.defaultPrevented)throw r}return n.then(r=>{for(const o of r||[])o.status==="rejected"&&s(o.reason);return t().catch(s)})},se={gameTitle:"Treasure Hunter",subtitle:"Find the lost. Prove the impossible.",defaultOrgName:"Independent Explorer"},Te=5,Si="treasure-hunter-saves",xi=1,be=3;function $i(e){let t=1779033703^e.length;for(let i=0;i<e.length;i++)t=Math.imul(t^e.charCodeAt(i),3432918353),t=t<<13|t>>>19;return()=>(t=Math.imul(t^t>>>16,2246822507),t=Math.imul(t^t>>>13,3266489909),(t^=t>>>16)>>>0)}function Ii(e){return function(){e|=0,e=e+1831565813|0;let i=Math.imul(e^e>>>15,1|e);return i=i+Math.imul(i^i>>>7,61|i)^i,((i^i>>>14)>>>0)/4294967296}}class Ci{constructor(t,i=0){this.seed=t,this.callCount=i;const a=$i(String(t));this._next=Ii(a());for(let n=0;n<i;n++)this._next()}float(){return this.callCount++,this._next()}range(t,i){return t+this.float()*(i-t)}int(t,i){return Math.floor(this.range(t,i+1))}bool(t=.5){return this.float()<t}pick(t){return t[this.int(0,t.length-1)]}weightedPick(t){const i=t.reduce((n,s)=>n+s.weight,0);let a=this.float()*i;for(const n of t)if(a-=n.weight,a<=0)return n.value;return t[t.length-1].value}shuffle(t){const i=t.slice();for(let a=i.length-1;a>0;a--){const n=this.int(0,a);[i[a],i[n]]=[i[n],i[a]]}return i}serialize(){return{seed:this.seed,callCount:this.callCount}}}function Mt(e,t=0){return new Ci(e,t)}function Ri(){return`${Date.now().toString(36)}-${Math.floor(Math.random()*1e9).toString(36)}`}function Ai(){return{saveVersion:Te,meta:{createdAt:Date.now(),lastSavedAt:null,slotId:null},rng:{seed:Ri(),callCount:0},settings:{soundEnabled:!0,musicEnabled:!0,reducedMotion:(typeof window<"u"&&window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)??!1,confirmExpensiveActions:!0,tutorialEnabled:!0,currencyLocale:"en-US",theme:"expedition",defaultExpeditionSpeed:1},tutorial:{active:!0,currentStep:0,dismissedSteps:[]},profile:{explorerName:"",orgName:"",difficulty:"adventurer"},date:{year:1,month:2,day:4,hour:8},finance:{cash:5e3,totalRevenue:0,totalExpenses:0,loans:[]},reputation:{publicFame:0,academicCredibility:0,fieldReputation:0,ethicalStanding:50},researchPoints:0,organization:{tier:1,tierName:"Garage Office",prestige:0},facilities:[],sponsors:[],player:{name:"",role:"Expedition Leader",skill:{leadership:2,survival:2,negotiation:1},experience:0,fatigue:0},staff:[],crewCandidates:[],vehicles:[],equipment:[],leads:{available:[],active:[],archived:[]},sites:[],activeExpedition:null,expeditionHistory:[],artifacts:[],contracts:[],rivals:[],museum:null,objectives:{main:null,optional:[]},milestones:{completed:[]},achievements:{unlocked:[]},alerts:[],stats:{expeditionsCompleted:0,expeditionsFailed:0,artifactsAuthenticated:0,leadsResolved:0}}}function g(e,t,i){return Math.min(i,Math.max(t,e))}const Ti=12,Mi=30,ht=24,Z=["Common","Notable","Rare","Exceptional","Historic","World-Class"],ee={explorer:{id:"explorer",label:"Explorer",description:"More starting cash, lower risk, forgiving research. A relaxed way to see everything the game offers.",startingCash:8e3,riskMultiplier:.75,equipmentWearMultiplier:.7,researchCostMultiplier:.8,permanentCrewLoss:!1},adventurer:{id:"adventurer",label:"Adventurer",description:"The intended, balanced experience.",startingCash:5e3,riskMultiplier:1,equipmentWearMultiplier:1,researchCostMultiplier:1,permanentCrewLoss:!1},pathfinder:{id:"pathfinder",label:"Pathfinder",description:"Less reliable leads, higher costs, greater wear, harsher consequences. For veterans.",startingCash:3500,riskMultiplier:1.35,equipmentWearMultiplier:1.3,researchCostMultiplier:1.2,permanentCrewLoss:!1}},Li=[{id:"lost-survey-camp",title:"The Lost Survey Camp",category:"lost-expedition",regionId:"black-mesa-desert",eraId:"late-frontier",cultureId:"continental-survey-corps",source:"Damaged field journal, found in a retired explorer's storage unit",sourceReliability:"uncertain",potentialDescription:"Historic instruments, documents, and mineral samples from a Continental Survey Corps expedition that vanished in 1891 while traversing Black Mesa.",knownRisks:["Extreme heat","Unstable terrain","Limited water"],startingConfidence:{siteLocation:.28,historical:.35,legal:.85},siteTemplateId:"black-mesa-camp-site",evidence:[{id:"damaged-map",category:"map",title:"Water-Stained Survey Map",text:"A hand-drawn map of the Black Mesa basin. The camp marker is smudged beyond recognition, but a faint dotted line traces a route north from the mesa base.",revealedByActionId:"study-historical-maps",supports:null},{id:"journal-entry",category:"document",title:"Journal Entry, Sept. 14, 1891",text:'"...made camp again near the wash, cottonwoods giving what shade they could. Water still running despite the season, though barely."',revealedByActionId:"search-public-records",supports:"B"},{id:"corps-report",category:"survey-report",title:"Continental Survey Corps Incident Report",text:'Filed by a search party in 1892: "No trace of the camp was found on the north ridge as expected. Search called off after eleven days."',revealedByActionId:"search-public-records",supports:"A-was-wrong"},{id:"witness-quote",category:"quote",title:"Rancher's Account (recorded 1938)",text:'"My grandfather always said the survey men were camped down in the draw, not up top where everyone went looking. Said you could see the tents from the quarry road if you knew where to look."',revealedByActionId:"interview-witnesses",supports:"B"},{id:"quarry-lease",category:"document",title:"Old Quarry Lease Record",text:"A mining lease for the abandoned quarry, dated 1889 — two years before the expedition. No mention of the survey corps, but proof the quarry was active nearby.",revealedByActionId:"interview-witnesses",supports:"C-red-herring"},{id:"expert-comparison",category:"survey-report",title:"Academic Terrain Comparison",text:'A hydrologist consulted on the case notes that the described "wash" and "cottonwoods" strongly match a seasonal riverbed formation, not a ridge or a quarry.',revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"North Ridge",description:"The location most searches focused on in 1892."},{id:"B",label:"Dry River Valley",description:"A seasonal wash south of the mesa base."},{id:"C",label:"Abandoned Quarry",description:"An active mining lease from the same period."}],correctConclusionId:"B"},{id:"vine-choked-temple",title:"The Vine-Choked Temple",category:"ancient-tomb",regionId:"thornwood-jungle",eraId:"highland-classical",cultureId:"kaelen-dynasty",source:"A missionary's diary, sold at estate auction decades after his disappearance",sourceReliability:"uncertain",potentialDescription:"Ceremonial masks, jade figures, and carved stelae from a lowland outpost of the Kaelen Dynasty, abandoned within a single generation and swallowed by jungle.",knownRisks:["Venomous wildlife","Unstable temple stonework","Heavy monsoon rain"],startingConfidence:{siteLocation:.24,historical:.3,legal:.55},siteTemplateId:"thornwood-temple-site",evidence:[{id:"missionary-map-sketch",category:"map",title:"Missionary's Sketch Map",text:'A hand-drawn map showing a trade path branching off the main river, ending at a mark labeled only "the ravine shrine."',revealedByActionId:"study-historical-maps",supports:null},{id:"diary-entry",category:"document",title:"Diary Entry, Undated",text:`"...the porters refused to go further than the ravine's edge, saying the temple below had been sealed on purpose. I went on alone."`,revealedByActionId:"search-public-records",supports:"B"},{id:"expedition-permit-record",category:"document",title:"Colonial Survey Office Record",text:`A rejected 1911 permit application to excavate "upper terrace ruins" — the applicant's notes claim the terraces were already stripped bare by looters decades earlier.`,revealedByActionId:"search-public-records",supports:"A-was-wrong"},{id:"porter-descendant-account",category:"quote",title:"Porter's Descendant Account (recorded 1962)",text:`"My grandfather carried for the foreign missionary. He said the real temple was down in the ravine, below the water line in the wet season — that's why no one else ever found it."`,revealedByActionId:"interview-witnesses",supports:"B"},{id:"trading-post-ledger",category:"document",title:"River-Mouth Trading Post Ledger",text:`A merchant's ledger listing jade purchases "from highland sources" — proof of trade, but no mention of a temple at the post itself.`,revealedByActionId:"interview-witnesses",supports:"C-red-herring"},{id:"glyph-analysis",category:"survey-report",title:"Academic Glyph Analysis",text:`An epigrapher notes that the diary's described carvings match a known Kaelen "ravine shrine" motif — a minor temple type deliberately built below the flood line to stay hidden.`,revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"Upper Terrace Ruins",description:"Long-known ruins, already picked over by looters."},{id:"B",label:"Buried Ravine Temple",description:"A minor shrine built deliberately below the flood line."},{id:"C",label:"River-Mouth Trading Post",description:"Where highland goods were known to change hands."}],correctConclusionId:"B"},{id:"vanished-corvane",title:"The Vanished Corvane",category:"shipwreck",regionId:"coral-strait",eraId:"age-of-sail",cultureId:"thalassan-fleet",source:"A salvager's logbook, recovered from a pawn shop lockbox",sourceReliability:"uncertain",potentialDescription:"The Corvane, flagship of the Thalassan Trading Fleet, went down with most of a season's cargo in a storm that claimed half the fleet at once.",knownRisks:["Strong currents","Decompression risk","Sharp coral and unstable debris"],startingConfidence:{siteLocation:.22,historical:.4,legal:.45},siteTemplateId:"coral-strait-wreck-site",evidence:[{id:"insurance-claim-record",category:"document",title:"Lloyd's-Style Insurance Claim",text:`A period insurance claim places the Corvane's last known position near the "north reef shelf" — the position the original search parties trusted.`,revealedByActionId:"search-public-records",supports:"A-was-wrong"},{id:"logbook-entry",category:"document",title:"Salvager's Logbook Entry",text:`"...current pulled us hard toward the channel drop-off. If she went down fighting the storm, that's where she'd have ended up, not the shelf."`,revealedByActionId:"search-public-records",supports:"B"},{id:"harbor-master-account",category:"quote",title:"Harbor Master's Account (recorded 1889)",text:'"Fishermen avoided the channel drop-off for a generation after the storm — said their nets kept catching on something big down there."',revealedByActionId:"interview-witnesses",supports:"B"},{id:"rival-dive-log",category:"document",title:"Rival Salvager's Dive Log",text:"A competing salvage outfit spent an entire season searching the harbor approach shoals and found nothing — a costly dead end.",revealedByActionId:"interview-witnesses",supports:"C-red-herring"},{id:"current-analysis",category:"survey-report",title:"Academic Current Analysis",text:"An oceanographer models the storm-season currents and concludes that anything lost during the wreck event would most likely settle at the channel drop-off, not the shelf or the shoals.",revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"North Reef Shelf",description:"Where the original insurance investigators searched."},{id:"B",label:"Middle Channel Drop-off",description:"A deep-water shelf edge fishermen learned to avoid."},{id:"C",label:"Harbor Approach Shoals",description:"Already searched extensively by a rival outfit."}],correctConclusionId:"B"},{id:"governors-manifest",title:"The Governor's Manifest",category:"royal-treasure",regionId:"coral-strait",eraId:"age-of-sail",cultureId:"thalassan-fleet",source:"A discrepancy noticed while cataloguing the Corvane's cargo manifest",sourceReliability:"credible",potentialDescription:"Fragments of ceremonial regalia meant for the Coral Strait's colonial governor, lost aboard a separate escort vessel — the Regent's Grace — in the same storm that claimed the Corvane.",knownRisks:["Sharp rock shelf near the surface","Sudden squalls with little warning"],startingConfidence:{siteLocation:.35,historical:.5,legal:.5},siteTemplateId:"sail-rock-shallows",evidence:[{id:"cargo-discrepancy-note",category:"document",title:"Manifest Discrepancy",text:`The Corvane's manifest lists a "sealed strongbox, regalia, for the Governor's household" as cargo of the escort vessel Regent's Grace — not the Corvane itself.`,revealedByActionId:"search-public-records",supports:null},{id:"escort-manifest-record",category:"document",title:"Escort Vessel Registry",text:`Records confirm the Regent's Grace sailed as escort and was lost in the same storm, "somewhere off the shallow shelf, having strayed from the channel."`,revealedByActionId:"search-public-records",supports:"B"},{id:"salvager-rumor",category:"quote",title:"Salvager's Rumor (recorded 1901)",text:'"Every diver in this strait knows Sail Rock is where the escort ship went down — you can still find scraps of rigging caught in the shelf."',revealedByActionId:"interview-witnesses",supports:"B"},{id:"rival-claim-filing",category:"document",title:"Abandoned Salvage Claim",text:"A rival outfit filed and later abandoned a salvage claim over the deepwater channel — years of searching turned up nothing.",revealedByActionId:"interview-witnesses",supports:"A-was-wrong"},{id:"tide-chart-analysis",category:"survey-report",title:"Tidal Drift Analysis",text:"A drift model using period tide charts places wreckage from a storm-driven sinking almost exactly over the shallow rock shelf.",revealedByActionId:"study-historical-maps",supports:"B"},{id:"academic-storm-reconstruction",category:"survey-report",title:"Academic Storm Reconstruction",text:"A maritime historian's reconstruction of the storm's path agrees: a vessel that strayed from the channel would have grounded on the shelf, not the deepwater channel or the harbor mouth.",revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"Deepwater Channel",description:"Where a rival spent years searching without success."},{id:"B",label:"Sail Rock Shelf",description:"A shallow rock shelf divers already half-know about."},{id:"C",label:"Harbor Mouth",description:"Close to shore, heavily trafficked ever since."}],correctConclusionId:"B"},{id:"last-diadem",title:"The Last Diadem",category:"royal-treasure",regionId:"coral-strait",eraId:"age-of-sail",cultureId:"thalassan-fleet",source:"A surviving crewman's deathbed confession, transcribed by a local priest",sourceReliability:"credible",potentialDescription:"The Regent's Diadem itself — salvaged from the wreck of the Regent's Grace by a crewman who hid it in sea caves rather than see it lost, and never returned for it.",knownRisks:["Rising tide cutting off the cave mouth","Loose rock in the upper galleries"],startingConfidence:{siteLocation:.4,historical:.55,legal:.6},siteTemplateId:"windward-blowhole-caves",evidence:[{id:"priest-transcription",category:"document",title:"Deathbed Confession",text:'"...I could not let it go down with her. I carried it to the caves at Windward Point and left it where the tide could not reach. God forgive me, I never went back."',revealedByActionId:"search-public-records",supports:"B"},{id:"tide-table-record",category:"document",title:"Period Tide Tables",text:"Tide records for the strait show a narrow daily window when the Windward Point caves are fully accessible on foot.",revealedByActionId:"search-public-records",supports:null},{id:"fisherman-account",category:"quote",title:"Local Fisherman's Account",text:`"We don't go into the blowhole caves at Windward Point. My father wouldn't say why, just that it wasn't worth what might be in there."`,revealedByActionId:"interview-witnesses",supports:"B"},{id:"treasure-hunter-diary",category:"document",title:"Earlier Treasure Hunter's Diary",text:'A diary describes a fruitless month searching the sea stacks further down the coast — "nothing but bird nests and bad footing."',revealedByActionId:"interview-witnesses",supports:"A-was-wrong"},{id:"cave-survey-report",category:"survey-report",title:"Cave System Survey",text:"A survey of the Windward Point caves finds a dry upper gallery well above the tideline — exactly the kind of place a hurried sailor could hide something and expect it to stay hidden.",revealedByActionId:"study-historical-maps",supports:"B"},{id:"academic-confession-analysis",category:"survey-report",title:"Academic Cross-Reference",text:"A historian cross-references the confession's landmarks against known coastal geography and concludes it can only describe the Windward Blowhole Caves.",revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"Sea Stack Hollow",description:"Already searched fruitlessly by an earlier treasure hunter."},{id:"B",label:"Windward Blowhole Caves",description:"A cave system locals have quietly avoided for generations."},{id:"C",label:"Harbor Grotto",description:"A well-known, well-visited sea cave near town."}],correctConclusionId:"B"}];function qi(e){return Li.find(t=>t.id===e)}const Di=[{id:"black-mesa-camp-site",name:"Black Mesa Basin",regionId:"black-mesa-desert",environment:"desert",terrain:"Cracked mesa flats cut by dry washes",travelCost:320,travelTimeHours:14,weatherProfile:"Extreme daytime heat, cold nights, rare flash flooding in washes",searchArea:"medium",accessDifficulty:"moderate",legalStatus:"Public land, excavation permit recommended",legalComplexity:.3,localSupport:"low",rivalPresence:"low",hiddenHazards:["Flash flooding in the wash","Loose mesa-edge scree"],artifactTemplateIds:["survey-transit","field-journal","brass-compass","mineral-case","presentation-watch","insignia-badge","ration-tin"],baseDiscoveryPotential:.62},{id:"thornwood-temple-site",name:"The Vine-Choked Temple",regionId:"thornwood-jungle",environment:"jungle",terrain:"Collapsed stepped temple complex under dense canopy",travelCost:620,travelTimeHours:22,weatherProfile:"Daily monsoon rain, high humidity, sudden flash floods in ravines",searchArea:"large",accessDifficulty:"difficult",legalStatus:"Protected cultural heritage site — export permit required",legalComplexity:.7,localSupport:"moderate",rivalPresence:"moderate",hiddenHazards:["Venomous wildlife in the undergrowth","Unstable temple stonework","Flash flooding in the ravine approach"],artifactTemplateIds:["ceremonial-mask","jade-figurine","obsidian-blade","stele-fragment","ceramic-vessel"],baseDiscoveryPotential:.58},{id:"coral-strait-wreck-site",name:"The Corvane Wreck",regionId:"coral-strait",environment:"coastal",terrain:"Shallow reef wreck, hull broken across a coral shelf",travelCost:780,travelTimeHours:18,weatherProfile:"Warm water, strong currents, squalls with little warning",searchArea:"medium",accessDifficulty:"difficult",legalStatus:"Disputed maritime salvage rights",legalComplexity:.6,localSupport:"low",rivalPresence:"high",hiddenHazards:["Strong currents near the reef shelf","Decompression risk on deeper dives","Sharp coral and unstable hull debris"],artifactTemplateIds:["ships-bell","navigational-astrolabe","cargo-manifest","trade-coin-hoard","figurehead-fragment"],baseDiscoveryPotential:.55},{id:"sail-rock-shallows",name:"Sail Rock Shallows",regionId:"coral-strait",environment:"coastal",terrain:"Scattered wreckage across a shallow rock shelf",travelCost:700,travelTimeHours:16,weatherProfile:"Warm water, moderate currents, clearer visibility than the main channel",searchArea:"medium",accessDifficulty:"moderate",legalStatus:"Disputed maritime salvage rights",legalComplexity:.6,localSupport:"low",rivalPresence:"moderate",hiddenHazards:["Sharp rock shelf near the surface","Sudden squalls with little warning"],artifactTemplateIds:["ships-bell","navigational-astrolabe","cargo-manifest","trade-coin-hoard","figurehead-fragment"],baseDiscoveryPotential:.6},{id:"windward-blowhole-caves",name:"The Windward Blowhole Caves",regionId:"coral-strait",environment:"coastal",terrain:"Sea caves carved into the cliffside, partly flooded at high tide",travelCost:750,travelTimeHours:20,weatherProfile:"Tidal flooding on a predictable but unforgiving schedule",searchArea:"small",accessDifficulty:"difficult",legalStatus:"Remote coastline, no active claim",legalComplexity:.4,localSupport:"low",rivalPresence:"high",hiddenHazards:["Rising tide cutting off the cave mouth","Loose rock in the upper galleries"],artifactTemplateIds:[],uniqueArtifactId:"regent-diadem",baseDiscoveryPotential:.7}];function Ni(e){return Di.find(t=>t.id===e)}const _i=[{leadId:"vine-choked-temple",siteId:"thornwood-temple-site"},{leadId:"vanished-corvane",siteId:"coral-strait-wreck-site"},{leadId:"governors-manifest",siteId:"sail-rock-shallows"},{leadId:"last-diadem",siteId:"windward-blowhole-caves"}];function Lt(e,t){const i=qi(e);return{instanceId:`lead-${i.id}`,templateId:i.id,title:i.title,category:i.category,regionId:i.regionId,eraId:i.eraId,cultureId:i.cultureId,source:i.source,sourceReliability:i.sourceReliability,potentialDescription:i.potentialDescription,knownRisks:[...i.knownRisks],discoveredHazards:[],confidence:{...i.startingConfidence},evidence:i.evidence.map(a=>({...a,revealed:!1})),conclusionOptions:i.conclusionOptions,conclusionChosenId:null,correctConclusionId:i.correctConclusionId,researchLog:[],status:"new",siteId:t,rivalInterest:0}}function Qe(e){const t=new Set([...e.leads.available,...e.leads.active,...e.leads.archived].map(s=>s.templateId)),i=_i.find(s=>!t.has(s.leadId));if(!i)return null;const a=qt(i.siteId);e.sites.push(a);const n=Lt(i.leadId,a.instanceId);return e.leads.available.push(n),n}function qt(e){const t=Ni(e);return{instanceId:`site-${t.id}`,templateId:t.id,...Pi(t)}}function Pi(e){return typeof structuredClone=="function"?structuredClone(e):JSON.parse(JSON.stringify(e))}function ye(e,t){return e.leads.available.find(i=>i.instanceId===t)||e.leads.active.find(i=>i.instanceId===t)||e.leads.archived.find(i=>i.instanceId===t)}function we(e,t){return e.sites.find(i=>i.instanceId===t)}function Hi(e,t){if(!e.conclusionOptions.some(i=>i.id===t))throw new Error(`Invalid conclusion ${t}`);return e.conclusionChosenId=t,e.status="ready",e.conclusionChosenId===e.correctConclusionId}function Fi(e){return e.evidence.filter(t=>t.revealed)}const Dt=[{id:"field-shovels",name:"Field Shovels",category:"basic",cost:120,operatingCost:0,weight:3,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","rural","battlefield"],effects:{excavationEfficiency:.08},maintenanceNote:"Rarely needs repair; cheap to replace."},{id:"excavation-brushes",name:"Excavation Brushes",category:"basic",cost:40,operatingCost:0,weight:.5,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","rural","cave","ruins"],effects:{discoveryQuality:.05,artifactDamageReduction:.1},maintenanceNote:"Wears out slowly with use."},{id:"climbing-rope",name:"Climbing Rope",category:"basic",cost:90,operatingCost:0,weight:2,conditionMax:100,requiredSkill:null,environments:["desert","mountain","cave","coastal","ruins"],effects:{hazardMitigation:.12},maintenanceNote:"Replace after heavy wear — frayed rope is a real hazard."},{id:"field-lanterns",name:"Field Lanterns",category:"basic",cost:60,operatingCost:5,weight:1.5,conditionMax:100,requiredSkill:null,environments:["desert","cave","forest","ruins","underground"],effects:{nightSurveyBonus:.1},maintenanceNote:"Consumes fuel/batteries as a supply during use."},{id:"basic-metal-detector",name:"Basic Metal Detector",category:"basic",cost:350,operatingCost:2,weight:4,conditionMax:100,requiredSkill:null,environments:["desert","forest","rural","coastal","battlefield"],effects:{discoveryChance:.12},maintenanceNote:"Battery-powered; degrades with rough handling."},{id:"field-camera",name:"Field Camera",category:"basic",cost:220,operatingCost:3,weight:1,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","cave","coastal","ruins","urban","rural","mountain","battlefield"],effects:{documentationBonus:.1,academicCredibilityGain:.5},maintenanceNote:"Fragile lens — handle with care in rough terrain."},{id:"first-aid-kit",name:"First-Aid Kit",category:"basic",cost:80,operatingCost:1,weight:1,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","cave","coastal","ruins","urban","rural","mountain","battlefield"],effects:{injuryRiskReduction:.15},maintenanceNote:"Restock consumable supplies between expeditions."},{id:"portable-radio",name:"Portable Radio",category:"basic",cost:150,operatingCost:2,weight:2,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","cave","coastal","ruins","urban","rural","mountain","battlefield"],effects:{eventWarning:.1,rivalAwarenessReduction:.05},maintenanceNote:"Reliable, but batteries drain fast in extreme heat."},{id:"advanced-metal-detector",name:"Advanced Metal Detector",category:"survey",cost:1400,operatingCost:4,weight:5,conditionMax:100,requiredSkill:{role:"surveyor",level:2},environments:["desert","forest","rural","coastal","battlefield"],effects:{discoveryChance:.22,discoveryQuality:.05},maintenanceNote:"Precision instrument — rough handling degrades accuracy."},{id:"ground-radar",name:"Ground-Penetrating Radar",category:"survey",cost:18e3,operatingCost:12,weight:6,conditionMax:100,requiredSkill:{role:"surveyor",level:3},environments:["desert","forest","urban","battlefield","ruins"],effects:{discoveryQuality:.15,riskReduction:.05},maintenanceNote:"Delicate array under the housing — expensive to fix if dropped."},{id:"magnetometer",name:"Magnetometer",category:"survey",cost:9e3,operatingCost:8,weight:4,conditionMax:100,requiredSkill:{role:"surveyor",level:2},environments:["desert","battlefield","rural","coastal"],effects:{discoveryChance:.1,discoveryQuality:.08},maintenanceNote:"Sensitive to nearby metal — store away from the truck bed."},{id:"survey-drone",name:"Survey Drone",category:"survey",cost:6500,operatingCost:6,weight:3,conditionMax:100,requiredSkill:{role:"surveyor",level:2},environments:["desert","forest","jungle","rural","coastal","mountain","battlefield"],effects:{eventWarning:.15,rivalAwarenessReduction:.1,discoveryChance:.05},maintenanceNote:"Batteries need replacing after heavy use in heat."},{id:"thermal-camera",name:"Thermal Camera",category:"survey",cost:4200,operatingCost:4,weight:2,conditionMax:100,requiredSkill:null,environments:["desert","cave","forest","jungle","ruins","underground"],effects:{nightSurveyBonus:.2,discoveryChance:.05},maintenanceNote:"Lens coating scratches easily in sandy conditions."},{id:"portable-generator",name:"Portable Generator",category:"excavation",cost:2200,operatingCost:10,weight:8,conditionMax:100,requiredSkill:null,environments:["desert","cave","forest","ruins","underground","mountain"],effects:{excavationEfficiency:.1},maintenanceNote:"Needs fuel as a supply during use."},{id:"hydraulic-tools",name:"Hydraulic Tools",category:"excavation",cost:5200,operatingCost:9,weight:10,conditionMax:100,requiredSkill:{role:"excavation-worker",level:2},environments:["desert","cave","ruins","underground","mountain","urban"],effects:{excavationEfficiency:.2,artifactDamageReduction:.1},maintenanceNote:"Hoses perish faster in extreme heat."},{id:"rock-drill",name:"Rock Drill",category:"excavation",cost:7800,operatingCost:14,weight:14,conditionMax:100,requiredSkill:{role:"excavation-worker",level:3},environments:["desert","cave","mountain","underground"],effects:{excavationEfficiency:.28,riskDelta:.03},maintenanceNote:"Bit wears down fast in dense rock — carry spares."},{id:"shoring-equipment",name:"Shoring Equipment",category:"excavation",cost:3400,operatingCost:3,weight:12,conditionMax:100,requiredSkill:null,environments:["desert","cave","ruins","underground","mountain"],effects:{hazardMitigation:.2},maintenanceNote:"Timber and braces — cheap to replace, bulky to carry."},{id:"diving-gear",name:"Diving Gear",category:"marine",cost:2800,operatingCost:6,weight:6,conditionMax:100,requiredSkill:{role:"diver",level:2},environments:["coastal"],effects:{hazardMitigation:.15,discoveryChance:.1},maintenanceNote:"Regulators need servicing after every deep dive."},{id:"sonar-array",name:"Sonar Array",category:"marine",cost:9500,operatingCost:10,weight:5,conditionMax:100,requiredSkill:{role:"diver",level:1},environments:["coastal"],effects:{discoveryChance:.2,discoveryQuality:.05},maintenanceNote:"Hull-mounted — vulnerable to reef strikes at low speed."},{id:"underwater-camera",name:"Underwater Camera",category:"marine",cost:3200,operatingCost:4,weight:2,conditionMax:100,requiredSkill:null,environments:["coastal"],effects:{documentationBonus:.12,academicCredibilityGain:.4},maintenanceNote:"Housing seals need replacing after deep dives."},{id:"remote-operated-vehicle",name:"Remotely Operated Vehicle",category:"marine",cost:22e3,operatingCost:18,weight:9,conditionMax:100,requiredSkill:{role:"diver",level:3},environments:["coastal"],effects:{discoveryQuality:.18,hazardMitigation:.1},maintenanceNote:"Tether and thrusters are delicate — expensive to repair."}];function G(e){return Dt.find(t=>t.id===e)}function Nt(e){return{instanceId:`equip-${e}-${Math.random().toString(36).slice(2,8)}`,templateId:e,condition:100}}function _t(e){return e>=85?"Operational":e>=55?"Worn":e>=25?"Damaged":"Broken"}function Pt(e){const t=G(e.templateId);return t?Math.round((100-e.condition)/100*t.cost*.25):0}function Oi(e){e.condition=100}function Ht(e){return{instanceId:`vehicle-${e}-${Math.random().toString(36).slice(2,8)}`,templateId:e,condition:100}}function Ft(e,t){if(e.finalAppraisedValue!=null)return e.finalAppraisedValue;const[i,a]=e.estimatedValueRange,n=(i+a)/2;return Math.round(n*.5)}function Bi(e,t){const i=Ft(e),a=!["Authentic","Modern Reproduction","Deliberate Forgery"].includes(e.authenticationOutcome)&&e.trueAuthenticity!=="authentic";return e.disposition="sold",e.saleValue=i,{saleValue:i,ethicalPenalty:a?3:0}}function Vi(e){e.disposition="stored"}function ji(e){e.disposition="displayed"}const Ot=[{id:"search-public-records",label:"Search Public Records",description:"Comb government and local archives for anything matching the lead.",cost:200,timeHours:8,confidenceEffects:{historical:.12}},{id:"study-historical-maps",label:"Study Historical Maps",description:"Compare period maps and survey routes against modern terrain.",cost:350,timeHours:12,confidenceEffects:{siteLocation:.15},hazardRevealChance:.6},{id:"interview-witnesses",label:"Interview Local Witnesses",description:"Track down descendants and locals who might remember something.",cost:150,timeHours:6,confidenceEffects:{siteLocation:.08,historical:.05}},{id:"consult-academic",label:"Consult an Academic",description:"Pay a specialist to review your evidence against the historical record.",cost:500,timeHours:16,confidenceEffects:{historical:.15,legal:.05},reputationEffects:{academicCredibility:.5}}],Ke={"fast-survey":{id:"fast-survey",label:"Fast Survey",description:"Lower cost and shorter duration, but you may miss things.",costMultiplier:.7,durationMultiplier:.6,discoveryModifier:-.12,riskModifier:.05,reputationModifier:0},standard:{id:"standard",label:"Standard Expedition",description:"A balanced, unremarkable approach.",costMultiplier:1,durationMultiplier:1,discoveryModifier:0,riskModifier:0,reputationModifier:0},methodical:{id:"methodical",label:"Methodical Search",description:"Slower and more expensive, with a much better discovery rate.",costMultiplier:1.35,durationMultiplier:1.4,discoveryModifier:.15,riskModifier:-.05,reputationModifier:0},discreet:{id:"discreet",label:"Discreet Operation",description:"Keeps rivals off your trail, but local assistance and legal cover suffer.",costMultiplier:1.1,durationMultiplier:1.1,discoveryModifier:-.05,riskModifier:.05,rivalAwarenessModifier:-.25},academic:{id:"academic",label:"Academic Partnership",description:"A university shares the credit and the cost. Lower financial reward, higher reputation.",costMultiplier:.85,durationMultiplier:1.15,discoveryModifier:.05,riskModifier:-.05,reputationModifier:1,valueMultiplier:.75}},qe={water:1.2,food:2,fuel:3.5,medical:6},Ui={water:6,food:3,fuel:4,medical:.5},Xe=["travel","survey","excavation","discovery","extraction"],Bt={travel:.22,survey:.24,excavation:.26,discovery:.14,extraction:.14},Wi=60,O={base:.32,leadQuality:-.28,equipmentSuitability:-.18,supplyPreparation:-.14,vehicleReliability:-.1,wrongConclusionPenalty:.18,noConclusionPenalty:.08,shortageThreshold:.7,shortagePenalty:.22},ke={leadQuality:.28,equipmentSuitability:.28,siteBasePotential:.22,leaderSkill:.14},zi=[{max:.28,tier:"Common"},{max:.48,tier:"Notable"},{max:.66,tier:"Rare"},{max:.82,tier:"Exceptional"},{max:.94,tier:"Historic"},{max:1.01,tier:"World-Class"}],ae=["Fragmentary","Poor","Fair","Good","Fine","Pristine"],De={"visual-inspection":{id:"visual-inspection",label:"Visual Inspection",cost:50,timeHours:4,confidenceGain:[.15,.35],description:"A trained eye compares the object against known reference material. Cheap, but far from conclusive."},"material-analysis":{id:"material-analysis",label:"Material Analysis",cost:400,timeHours:12,confidenceGain:[.25,.45],description:"Lab testing of composition and wear patterns against known references for the era."},"expert-consultation":{id:"expert-consultation",label:"Expert Consultation",cost:900,timeHours:20,confidenceGain:[.4,.65],description:"A recognized specialist reviews the piece in person. Expensive, but rarely wrong."},"radiocarbon-dating":{id:"radiocarbon-dating",label:"Radiocarbon Dating",cost:1200,timeHours:30,confidenceGain:[.35,.55],description:"Precise dating of organic material. Requires a Research Lab.",requiresFacility:"research-lab"}},Oe={stabilize:{id:"stabilize",label:"Stabilize",description:"Halts further decay without attempting real repair. Cheap and safe.",costFraction:.05,minCost:80,timeHours:6,conditionTiersGain:1,completenessGain:5,failureChance:0},standard:{id:"standard",label:"Standard Restoration",description:"A proper conservation pass that meaningfully improves condition and display quality.",costFraction:.15,minCost:300,timeHours:16,conditionTiersGain:2,completenessGain:15,failureChance:.05},"museum-grade":{id:"museum-grade",label:"Museum-Grade Conservation",description:"Slow and expensive, but maximizes historical integrity and academic value.",costFraction:.3,minCost:900,timeHours:40,conditionTiersGain:3,completenessGain:30,failureChance:.02,academicWeightBonus:.3},aggressive:{id:"aggressive",label:"Aggressive Restoration",description:"Fast, dramatic visual improvement — but real risk of damaging authenticity in the process.",costFraction:.1,minCost:150,timeHours:8,conditionTiersGain:2,completenessGain:20,failureChance:.22,damagesOnFailure:!0}},Gi=18,T={cost:4e4,prestigeRequired:30,defaultTicketPrice:12,baseDailyVisitors:20,publicFameVisitorWeight:2,academicCredibilityVisitorWeight:1,minTicketPrice:4,maxTicketPrice:40},Vt=100,Je=.12,Ne=[.75,1.6];function Yi(e,t){return e<.4?"Inconclusive":e<.75?t==="authentic"?"Probably Authentic":"Inconclusive":t==="authentic"?"Authentic":t==="reproduction"?"Modern Reproduction":"Deliberate Forgery"}const Qi=["Authentic","Modern Reproduction","Deliberate Forgery"];function Ki(e,t,i){const[a,n]=e.estimatedValueRange,s=(a+n)/2;return t==="Authentic"?Math.round(i.range(a,n)):t==="Modern Reproduction"?Math.round(s*i.range(.08,.2)):t==="Deliberate Forgery"?Math.round(s*i.range(.02,.08)):null}function Xi(e,t,i){const a=De[t];if(!a)throw new Error(`Unknown authentication method: ${t}`);const n=i.range(a.confidenceGain[0],a.confidenceGain[1]),s=e.authenticationConfidence||0,r=g(s+n,0,.97),o=Yi(r,e.trueAuthenticity);return e.authenticationConfidence=r,e.authenticationOutcome=o,e.authenticationStatus="inspected",Qi.includes(o)&&(e.finalAppraisedValue=Ki(e,o,i),e.authenticationStatus="authenticated"),{method:a,confidence:r,outcome:o}}function jt(e,t){const i=Oe[t],[a,n]=e.estimatedValueRange,s=(a+n)/2;return Math.max(i.minCost,Math.round(s*i.costFraction))}function Ji(e,t,i){const a=Oe[t];if(!a)throw new Error(`Unknown restoration method: ${t}`);const n=i.bool(a.failureChance),s=ae.indexOf(e.condition),r=n?Math.max(0,Math.floor(a.conditionTiersGain/2)):a.conditionTiersGain,o=g(s+r,0,ae.length-1);e.condition=ae[o],e.completeness=g(e.completeness+(n?a.completenessGain/2:a.completenessGain),0,100),e.restorationStatus=t;let d=!1;return n&&a.damagesOnFailure&&(d=!0,e.estimatedValueRange=e.estimatedValueRange.map(c=>Math.round(c*.85)),e.finalAppraisedValue!=null&&(e.finalAppraisedValue=Math.round(e.finalAppraisedValue*.85)),e.authenticationStatus==="authenticated"&&(e.authenticationStatus="inspected",e.authenticationConfidence=g((e.authenticationConfidence||0)-.2,0,.97))),a.academicWeightBonus&&!n&&(e.academicWeight=(e.academicWeight||1)+a.academicWeightBonus),{failed:n,authenticityDamaged:d}}let J=null,he=null,Ut=!0,mt=!1;function Wt(){if(!J){const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;J=new e}return J.state==="suspended"&&J.resume().catch(()=>{}),J}function ft({soundEnabled:e,musicEnabled:t}){Ut=e,t!==mt&&(mt=t,t?ea():ta())}function zt(e,t,{attack:i=.01,peak:a=.2,decay:n=.15,startAt:s}={}){const r=s??t.currentTime;e.gain.cancelScheduledValues(r),e.gain.setValueAtTime(0,r),e.gain.linearRampToValueAtTime(a,r+i),e.gain.exponentialRampToValueAtTime(1e-4,r+i+n)}function j(e,{freq:t,type:i="sine",duration:a=.18,delay:n=0,peak:s=.18}){const r=e.createOscillator(),o=e.createGain();r.type=i,r.frequency.value=t,r.connect(o),o.connect(e.destination);const d=e.currentTime+n;zt(o,e,{attack:.01,peak:s,decay:a,startAt:d}),r.start(d),r.stop(d+a+.05)}function vt(e,{from:t,to:i,duration:a=.5,type:n="sine",peak:s=.15,delay:r=0}){const o=e.createOscillator(),d=e.createGain();o.type=n,o.connect(d),d.connect(e.destination);const c=e.currentTime+r;o.frequency.setValueAtTime(t,c),o.frequency.exponentialRampToValueAtTime(i,c+a),zt(d,e,{attack:.02,peak:s,decay:a,startAt:c}),o.start(c),o.stop(c+a+.05)}function Ee(e,{delay:t=0,peak:i=.2}={}){const a=e.sampleRate*.03,n=e.createBuffer(1,a,e.sampleRate),s=n.getChannelData(0);for(let d=0;d<a;d++)s[d]=(Math.random()*2-1)*(1-d/a);const r=e.createBufferSource();r.buffer=n;const o=e.createGain();o.gain.value=i,r.connect(o),o.connect(e.destination),r.start(e.currentTime+t)}const Zi={click:e=>Ee(e,{peak:.12}),select:e=>j(e,{freq:420,type:"triangle",duration:.08,peak:.1}),success:e=>{j(e,{freq:523,duration:.14,peak:.15}),j(e,{freq:659,duration:.18,peak:.15,delay:.09})},error:e=>j(e,{freq:160,type:"sawtooth",duration:.22,peak:.14}),cashRegister:e=>{Ee(e,{peak:.15}),j(e,{freq:880,type:"square",duration:.06,peak:.08,delay:.03})},auctionHammer:e=>{Ee(e,{peak:.3}),j(e,{freq:140,type:"square",duration:.1,peak:.12,delay:.01})},cameraShutter:e=>Ee(e,{peak:.22}),vehicleDeparture:e=>vt(e,{from:90,to:140,type:"sawtooth",duration:.4,peak:.1}),discoveryReveal:e=>{vt(e,{from:220,to:660,duration:.6,peak:.12}),j(e,{freq:880,duration:.3,peak:.14,delay:.55})},achievement:e=>{[523,659,784,1046].forEach((t,i)=>j(e,{freq:t,duration:.22,peak:.13,delay:i*.09}))},alert:e=>j(e,{freq:700,type:"triangle",duration:.1,peak:.1})};function P(e){if(!Ut)return;const t=Wt();if(!t)return;const i=Zi[e];if(i)try{i(t)}catch{}}function ea(){const e=Wt();if(!e||he)return;const t=e.createGain();t.gain.value=0,t.connect(e.destination),t.gain.linearRampToValueAtTime(.035,e.currentTime+2);const i=e.createBiquadFilter();i.type="lowpass",i.frequency.value=500,i.connect(t);const a=[110,165,220].map(r=>{const o=e.createOscillator();return o.type="sine",o.frequency.value=r,o.connect(i),o.start(),o}),n=e.createOscillator();n.frequency.value=.05;const s=e.createGain();s.gain.value=200,n.connect(s),s.connect(i.frequency),n.start(),he={masterGain:t,filter:i,oscillators:a,lfo:n}}function ta(){if(!he||!J)return;const{masterGain:e,oscillators:t,lfo:i}=he,a=J.currentTime+1.2;e.gain.linearRampToValueAtTime(0,a),t.forEach(n=>n.stop(a)),i.stop(a),he=null}function ia(e,t){let i=e.hour+t,a=e.day,n=e.month,s=e.year;for(;i>=ht;)i-=ht,a+=1,a>Mi&&(a=1,n+=1,n>=Ti&&(n=0,s+=1));return e.year=s,e.month=n,e.day=a,e.hour=Math.round(i),e}function A(e,t){e.alerts.unshift({id:`alert-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,at:Date.now(),read:!1,...t}),e.alerts.length>30&&(e.alerts.length=30)}const aa=[{id:1,condition:e=>e.stats.expeditionsCompleted>=1,title:"Milestone: First Expedition Complete",message:"Artifact authentication is now available in your Collection."},{id:2,condition:e=>e.finance.totalRevenue>=15e3,title:"Milestone: $15,000 Earned",message:"Your organization has the standing to start hiring staff."},{id:3,condition:e=>e.reputation.fieldReputation>=10,title:"Milestone: Field Reputation 10",message:"Advanced equipment suppliers are starting to take you seriously."},{id:4,condition:e=>e.stats.artifactsAuthenticated>=10,title:"Milestone: Ten Artifacts Authenticated",message:"A dedicated conservation lab is within reach."},{id:5,condition:e=>e.stats.expeditionsCompleted>=5,title:"Milestone: Five Expeditions Complete",message:"International leads are starting to surface."},{id:6,condition:e=>e.organization.prestige>=30,title:"Milestone: Prestige 30",message:"You could support a private museum."},{id:7,condition:e=>e.vehicles.length>=3,title:"Milestone: Three Vehicles Owned",message:"Your fleet can now support simultaneous expeditions."},{id:8,condition:e=>e.artifacts.some(t=>t.rarity==="Historic"||t.rarity==="World-Class"),title:"Milestone: Historic-Tier Discovery",message:"Documentary studios have taken notice of your work."}];function We(e){const t=[];for(const i of aa)e.milestones.completed.includes(i.id)||i.condition(e)&&(e.milestones.completed.push(i.id),A(e,{type:"milestone",title:i.title,message:i.message}),P("achievement"),t.push(i.id));return t}const na={"first-find":e=>e.artifacts.length>=1,"proven-authentic":e=>e.stats.artifactsAuthenticated>=1,"worth-the-risk":e=>e.expeditionHistory.some(t=>t.finalRisk>=.55&&t.success),"returned-to-history":e=>e.artifacts.some(t=>t.disposition==="donated"),"expedition-leader":e=>e.stats.expeditionsCompleted>=5,"academic-respect":e=>e.reputation.academicCredibility>=20,"hundred-artifacts":e=>e.artifacts.length>=100,"world-class-discovery":e=>e.artifacts.some(t=>t.rarity==="World-Class"),"rival-beaten":e=>e.expeditionHistory.some(t=>t.success&&t.rivalInterestAtLaunch>=.5),"no-stone-unturned":e=>e.expeditionHistory.some(t=>t.fullyResearchedAtLaunch),"into-the-deep":e=>e.expeditionHistory.some(t=>t.success&&t.environment==="coastal"),"beneath-the-sand":e=>e.expeditionHistory.some(t=>t.success&&t.environment==="desert"),"museum-opening":e=>!!e.museum?.built,"sold-at-auction":e=>e.artifacts.some(t=>t.soldVia==="auction"),"fully-equipped":e=>{const t=new Set(e.equipment.map(i=>G(i.templateId)?.category).filter(Boolean));return["basic","survey","excavation","marine"].every(i=>t.has(i))},"legendary-explorer":e=>e.organization.prestige>=Vt};function X(e){const t=[];for(const[i,a]of Object.entries(na))e.achievements.unlocked.includes(i)||a(e)&&(e.achievements.unlocked.push(i),A(e,{type:"achievement",title:"Achievement Unlocked",message:i}),P("achievement"),t.push(i));return t}function Y(e){const t=e.reputation,i=Math.round(t.publicFame*.25+t.academicCredibility*.25+t.fieldReputation*.25+(t.ethicalStanding-50)*.1+e.stats.expeditionsCompleted*1.5);return e.organization.prestige=Math.min(Vt,Math.max(0,i)),e.organization.prestige}const Gt=[{id:"archaeologist",label:"Archaeologist",description:"Reads a site the way most people read a room.",salaryRange:[80,160],synergy:{discoveryBonus:.06,academicCredibilityGain:.3}},{id:"historian",label:"Historian",description:"Passively speeds up and cheapens research while on staff.",salaryRange:[70,140],synergy:{researchCostMultiplier:.9}},{id:"excavation-worker",label:"Excavation Worker",description:"Does the digging without wrecking what's underneath.",salaryRange:[50,100],synergy:{riskDelta:-.03,discoveryBonus:.02}},{id:"surveyor",label:"Surveyor",description:"Narrows down a search area fast and safely.",salaryRange:[60,120],synergy:{riskDelta:-.04}},{id:"mechanic",label:"Mechanic",description:"Keeps vehicles and equipment running longer.",salaryRange:[60,110],synergy:{vehicleReliabilityBonus:.08,equipmentWearReduction:.15}},{id:"medic",label:"Medic",description:"Lowers the odds anything in the field goes seriously wrong.",salaryRange:[70,130],synergy:{riskDelta:-.05}},{id:"translator",label:"Translator",description:"Passively speeds up research involving documents and inscriptions.",salaryRange:[60,120],synergy:{researchCostMultiplier:.92}},{id:"photographer",label:"Photographer",description:"Documentation that impresses academics and sponsors alike.",salaryRange:[55,100],synergy:{academicCredibilityGain:.4,discoveryBonus:.02}},{id:"logistics-coordinator",label:"Logistics Coordinator",description:"Stretches every unit of water, food, and fuel further.",salaryRange:[65,120],synergy:{supplyEfficiency:.1}},{id:"security-specialist",label:"Security Specialist",description:"Keeps rivals guessing and the crew safer when it matters.",salaryRange:[70,130],synergy:{rivalAwarenessReduction:.1,riskDelta:-.02}},{id:"diver",label:"Diver",description:"Makes underwater recovery work possible at all, and safer.",salaryRange:[90,170],synergy:{riskDelta:-.06,discoveryBonus:.03}},{id:"boat-captain",label:"Boat Captain",description:"Keeps the boat where it needs to be, even when the water doesn't cooperate.",salaryRange:[80,150],synergy:{vehicleReliabilityBonus:.1,riskDelta:-.02}}];function me(e){return Gt.find(t=>t.id===e)}const sa=["Elena","Marcus","Priya","Tomas","Naledi","Soren","Yuki","Diego","Freya","Kwame","Amara","Viktor","Lucia","Hana","Owen","Zara","Felix","Ingrid","Rashid","Colette"],ra=["Okafor","Reyes","Nakamura","Petrov","Dubois","Alvarez","Kowalski","Mensah","Larsen","Iyer","Costa","Haddad","Novak","Fontaine","Singh"],it=[{id:"careful",label:"Careful",description:"Reduces equipment damage and artifact damage risk."},{id:"resourceful",label:"Resourceful",description:"Occasionally resolves supply shortages without penalty."},{id:"fearless",label:"Fearless",description:"Immune to morale loss from hazard events."},{id:"methodical",label:"Methodical",description:"Improves discovery quality on thorough approaches."},{id:"local-expert",label:"Local Expert",description:"Reduces travel time and rival awareness in their home region."},{id:"multilingual",label:"Multilingual",description:"Improves translation and interview research actions."},{id:"mechanically-gifted",label:"Mechanically Gifted",description:"Reduces vehicle and equipment failure chance."},{id:"strong-swimmer",label:"Strong Swimmer",description:"Reduces risk on marine expeditions."},{id:"keen-eye",label:"Keen Eye",description:"Improves survey confidence gains."},{id:"calm-under-pressure",label:"Calm Under Pressure",description:"Improves outcomes on high-risk field event choices."}],Yt=[{id:"reckless",label:"Reckless",description:"Higher risk, but occasionally faster results."},{id:"superstitious",label:"Superstitious",description:"Morale drops sharply after ominous discoveries."},{id:"expensive",label:"Expensive",description:"Higher salary expectations."},{id:"argumentative",label:"Argumentative",description:"Occasionally lowers crew morale."},{id:"fame-seeking",label:"Fame-Seeking",description:"Wants media attention; upset when denied it."},{id:"claustrophobic",label:"Claustrophobic",description:"Morale penalty in caves and tight excavations."},{id:"seasick",label:"Seasick",description:"Performance penalty on boats."},{id:"injury-prone",label:"Injury-Prone",description:"Higher chance of temporary injury."},{id:"secretive",label:"Secretive",description:"Occasionally withholds useful information."},{id:"rival-connections",label:"Rival Connections",description:"Small chance of leaking intel to rivals."}];function oa(e){const t=e.pick(Gt),i=e.bool(.65)?e.pick(it):e.pick(Yt);return{instanceId:`crew-${t.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,name:`${e.pick(sa)} ${e.pick(ra)}`,roleId:t.id,salary:Math.round(e.range(t.salaryRange[0],t.salaryRange[1])),skillLevel:e.int(1,4),experience:0,morale:80,fatigue:0,reliability:Math.round(e.range(.5,.95)*100)/100,riskTolerance:Math.round(e.range(.2,.8)*100)/100,loyalty:Math.round(e.range(.4,.9)*100)/100,traitId:i.id}}function Qt(e,t=3){return Array.from({length:t},()=>oa(e))}function ca(e){return it.find(t=>t.id===e)||Yt.find(t=>t.id===e)}function la(e){return it.some(t=>t.id===e)}function da(e,t=1){e.experience+=t;const i=e.skillLevel*5;return e.experience>=i&&e.skillLevel<5?(e.skillLevel+=1,e.experience=0,!0):!1}function ua(e){let t=1;for(const i of e){const a=me(i.roleId);a?.synergy?.researchCostMultiplier&&(t*=a.synergy.researchCostMultiplier)}return g(t,.5,1)}const Ze=[{id:"sterling-cross",name:"Sterling Cross Expeditions",style:"Wealthy and aggressive, with excellent equipment and a weak academic reputation.",specialtyCategories:["lost-expedition","ancient-tomb"],specialtyEnvironments:["desert","jungle"]},{id:"meridian-research-group",name:"Meridian Research Group",style:"University-backed and methodical, with strong permit access and fast publication.",specialtyCategories:["ancient-tomb","hidden-archive"],specialtyEnvironments:["jungle","ruins"]},{id:"black-tide-recovery",name:"Black Tide Recovery",style:"Marine specialists who take big risks to win wreck sites.",specialtyCategories:["shipwreck"],specialtyEnvironments:["coastal"]},{id:"voss-antiquities",name:"Voss Antiquities",style:"A collector network with real market influence and questionable ethics.",specialtyCategories:["shipwreck","royal-treasure","missing-artwork"],specialtyEnvironments:["coastal","urban"]}];function pa(e,t,i){const a=Ze.filter(s=>s.specialtyCategories.includes(e)||s.specialtyEnvironments.includes(t)),n=a.length?a:Ze;return i.pick(n)}const ha={low:.6,moderate:1,high:1.5};function ma(e,t,i){const a=ha[t.rivalPresence]??1,n=i.range(.03,.08)*a;return e.rivalInterest=g((e.rivalInterest||0)+n,0,1),e.rivalInterest}function fa(e,t,i){if(e.rivalDisturbed||e.rivalInterest<.75||!i.bool(.25))return null;const a=pa(e.category,t.environment,i);return e.rivalDisturbed=!0,e.rivalId=a.id,t.baseDiscoveryPotential=g(t.baseDiscoveryPotential-.15,.2,1),a}function va(e){return e>=.75?"Critical":e>=.5?"High":e>=.25?"Moderate":"Low"}const Kt=[{id:"archive",name:"Archive",description:"Organized records cut the cost of every research action.",cost:2e3,minTier:1,effectKey:"researchCostMultiplier",effectValue:.9},{id:"workshop",name:"Workshop",description:"A proper bench and spare parts make repairs far cheaper.",cost:3e3,minTier:1,effectKey:"repairCostMultiplier",effectValue:.7},{id:"crew-quarters",name:"Crew Quarters",description:"Room to house more staff between expeditions.",cost:4e3,minTier:1,effectKey:"maxStaffBonus",effectValue:3},{id:"research-lab",name:"Research Lab",description:"Proper equipment for cross-referencing evidence — every research action goes further.",cost:12e3,minTier:2,effectKey:"researchConfidenceMultiplier",effectValue:1.15},{id:"vehicle-garage",name:"Vehicle Garage",description:"Covered storage and maintenance bays for a larger fleet, at a lower running cost.",cost:8e3,minTier:2,effectKey:"vehicleOperatingCostMultiplier",effectValue:.85,secondaryEffectKey:"maxVehiclesBonus",secondaryEffectValue:2}];function D(e){return Kt.find(t=>t.id===e)}const Xt=[{tier:1,name:"Garage Office",prestigeRequired:0,cost:0,baseMaxStaff:0,baseMaxVehicles:1,baseMaxFacilities:2},{tier:2,name:"Field Operations Center",prestigeRequired:12,cost:15e3,baseMaxStaff:3,baseMaxVehicles:2,baseMaxFacilities:2},{tier:3,name:"Research Warehouse",prestigeRequired:30,cost:55e3,baseMaxStaff:6,baseMaxVehicles:3,baseMaxFacilities:4},{tier:4,name:"Expedition Campus",prestigeRequired:55,cost:15e4,baseMaxStaff:10,baseMaxVehicles:5,baseMaxFacilities:6},{tier:5,name:"International Headquarters",prestigeRequired:85,cost:4e5,baseMaxStaff:16,baseMaxVehicles:8,baseMaxFacilities:9}];function Be(e){return Xt.find(t=>t.tier===e)}function Jt(e){return Xt.find(t=>t.tier===e+1)||null}function ga(e){const t=e.facilities.map(i=>i.templateId);return Kt.filter(i=>i.minTier<=e.organization.tier&&!t.includes(i.id))}function Ve(e,t){return e.facilities.some(i=>i.templateId===t)}function ba(e,t,i){const a=e.facilities.find(n=>D(n.templateId)?.effectKey===t);return a?D(a.templateId).effectValue:i}function ya(e,t,i){const a=e.facilities.find(n=>D(n.templateId)?.secondaryEffectKey===t);return a?D(a.templateId).secondaryEffectValue:i}function wa(e){return Ve(e,"archive")?D("archive").effectValue:1}function ka(e){return Ve(e,"research-lab")?D("research-lab").effectValue:1}function Zt(e){return Ve(e,"workshop")?D("workshop").effectValue:1}function Ea(e){return Ve(e,"vehicle-garage")?D("vehicle-garage").effectValue:1}function ei(e){const t=Be(e.organization.tier),i=ba(e,"maxStaffBonus",0);return t.baseMaxStaff+i}function ti(e){const t=Be(e.organization.tier),i=ya(e,"maxVehiclesBonus",0);return t.baseMaxVehicles+i}function ii(e){return Be(e.organization.tier).baseMaxFacilities}const ai=[{id:"aldergate-outdoor",name:"Aldergate Outdoor Co.",category:"Outdoor-equipment brand",description:"A gear manufacturer wants your expeditions wearing their logo. Good exposure, thin academic credibility.",signingBonus:2500,reputationEffects:{publicFame:5,academicCredibility:-3},perk:{key:"equipmentCostMultiplier",value:.9,label:"10% off all equipment purchases"}},{id:"meridewell-foundation",name:"Meridewell University Foundation",category:"Research foundation",description:"A research grant in exchange for first refusal on your finds — they expect a discount when you sell.",signingBonus:1500,reputationEffects:{academicCredibility:5},perk:{key:"saleValueMultiplier",value:.88,label:"Private sale values reduced 12% (first-refusal terms)"},perkSecondary:{key:"researchConfidenceMultiplier",value:1.08,label:"+8% research confidence gains"}},{id:"corvane-media",name:"Corvane Media Group",category:"Documentary studio",description:"A documentary deal brings a media splash — and coverage that oversells what you've actually confirmed.",signingBonus:4e3,reputationEffects:{publicFame:10,ethicalStanding:-5},perk:null}];function at(e){return ai.find(t=>t.id===e)}function Sa(e){return e.sponsors.map(t=>at(t.templateId)).filter(Boolean)}function nt(e,t,i){let a=i;for(const n of Sa(e))n.perk?.key===t&&(a*=n.perk.value),n.perkSecondary?.key===t&&(a*=n.perkSecondary.value);return a}function gt(e){return nt(e,"equipmentCostMultiplier",1)}function bt(e){return nt(e,"saleValueMultiplier",1)}function xa(e){return nt(e,"researchConfidenceMultiplier",1)}function $a(e){const t=new Set(e.sponsors.map(i=>i.templateId));return ai.filter(i=>!t.has(i.id))}const ni=[{id:"meridewell-grant",title:"Meridewell Research Grant",client:"Meridewell University",description:"Complete any successful expedition and share your findings for academic credit.",objectiveType:"complete-expedition",reward:{cash:2e3,reputationEffects:{academicCredibility:4}}},{id:"private-collector-request",title:"Private Collector Request",client:"Anonymous Private Collector",description:"Sell an artifact of Rare rarity or better.",objectiveType:"sell-rarity",minRarityIndex:Z.indexOf("Rare"),reward:{cash:3e3,reputationEffects:{fieldReputation:3}}},{id:"heritage-return-request",title:"Cultural Heritage Return",client:"Regional Heritage Office",description:"Donate any recovered artifact to a public institution.",objectiveType:"donate-artifact",reward:{cash:500,reputationEffects:{ethicalStanding:6,academicCredibility:2}}}];function _e(e){return ni.find(t=>t.id===e)}function Ia(e){const t=new Set(e.contracts.map(i=>i.templateId));return ni.filter(i=>!t.has(i.id))}function Ca(e,t,i,a){if(t.cash&&(e.finance.cash+=t.cash,e.finance.totalRevenue+=t.cash),t.reputationEffects)for(const[n,s]of Object.entries(t.reputationEffects))e.reputation[n]=g((e.reputation[n]||0)+s,0,100);i&&i(e,{type:"success",title:"Contract Fulfilled",message:a})}function Se(e,t,i,a){const n=[];for(const s of e.contracts){if(s.status!=="active")continue;const r=_e(s.templateId);if(r.objectiveType!==t)continue;let o=!1;t==="complete-expedition"&&i.success&&(o=!0),t==="sell-rarity"&&Z.indexOf(i.rarity)>=r.minRarityIndex&&(o=!0),t==="donate-artifact"&&(o=!0),o&&(s.status="completed",Ca(e,r.reward,a,r.title),n.push(s))}return n}const si=[{id:"frontier-expeditions",label:"Frontier Expeditions",description:"Instruments and records from the last great continental surveys.",cultureIds:["continental-survey-corps"]},{id:"highland-civilizations",label:"Highland Civilizations",description:"Ceremonial artifacts from a highland dynasty reclaimed by jungle.",cultureIds:["kaelen-dynasty"]},{id:"maritime-discoveries",label:"Maritime Discoveries",description:"Recovered cargo and instruments from an age of trading fleets.",cultureIds:["thalassan-fleet"]},{id:"unsolved-mysteries",label:"Unsolved Mysteries",description:"A catch-all gallery for anything that doesn't fit elsewhere yet — flexible, but never as striking as a focused room.",cultureIds:[]}];function st(e){return si.find(t=>t.id===e)}const ri={"continental-survey-corps":{id:"continental-survey-corps",label:"Continental Survey Corps",eraId:"late-frontier",regionIds:["black-mesa-desert"],description:"A government-chartered survey outfit that mapped the western frontier before mysteriously losing contact with several expeditions.",motifs:["engraved survey markers","compass rose stamps","corps insignia","hand-ruled coordinate tables"]},"kaelen-dynasty":{id:"kaelen-dynasty",label:"Kaelen Dynasty",eraId:"highland-classical",regionIds:["thornwood-jungle"],description:"A highland temple-building civilization whose lowland outposts were abandoned and reclaimed by jungle within a single generation.",motifs:["stepped temple reliefs","jaguar-headed glyphs","jade inlay","sunburst carvings"]},"thalassan-fleet":{id:"thalassan-fleet",label:"Thalassan Trading Fleet",eraId:"age-of-sail",regionIds:["coral-strait"],description:"A merchant trading company whose galleons ran the strait for a century before a single storm season ended most of the fleet.",motifs:["company crest medallions","carved figureheads","ledger seals","star-and-compass rigging marks"]}};function oi(e,t){return e.artifacts.filter(i=>t.artifactIds.includes(i.id))}function ci(e,t){const i=oi(t,e);if(!i.length)return 0;const a=st(e.themeId),n=i.reduce((d,c)=>d+Z.indexOf(c.rarity),0)/i.length/(Z.length-1),s=Math.min(i.length/5,1)*.2,o=a.cultureIds.length>0&&i.every(d=>a.cultureIds.some(c=>d.culture===Ra(c)))?.15:0;return g(n*.65+s+o,0,1)}function Ra(e){return ri[e]?.label}function Aa(e){if(!e.museum?.exhibits.length)return 0;const t=e.museum.exhibits.map(i=>ci(i,e));return t.reduce((i,a)=>i+a,0)/t.length}function Ta(e,t){if(!e.museum?.built||t<=0)return null;const a=.5+Aa(e)*1,n=e.reputation.publicFame*T.publicFameVisitorWeight+e.reputation.academicCredibility*T.academicCredibilityVisitorWeight,s=g(1-(e.museum.ticketPrice-10)*.02,.4,1.3),r=(T.baseDailyVisitors+n)*a*s,o=Math.round(r*(t/24)),d=Math.round(o*e.museum.ticketPrice);return e.museum.totalVisitors+=o,e.museum.totalRevenue+=d,e.finance.cash+=d,e.finance.totalRevenue+=d,{visitors:o,revenue:d}}function li(e){return Ot.find(t=>t.id===e)}function Ma(e,t,i,a,n=1){const s=li(i);if(!s)throw new Error(`Unknown research action: ${i}`);const r={...e.confidence};for(const[f,m]of Object.entries(s.confidenceEffects))e.confidence[f]=g((e.confidence[f]??0)+m*n,0,.97);const o=e.evidence.find(f=>f.revealedByActionId===i&&!f.revealed);o&&(o.revealed=!0);let d=null;if(s.hazardRevealChance&&t&&a.bool(s.hazardRevealChance)){const f=t.hiddenHazards.filter(m=>!e.discoveredHazards.includes(m));f.length&&(d=a.pick(f),e.discoveredHazards.push(d))}if(s.reputationEffects){e.pendingReputationEffects={...e.pendingReputationEffects||{}};for(const[f,m]of Object.entries(s.reputationEffects))e.pendingReputationEffects[f]=(e.pendingReputationEffects[f]||0)+m}const c=Object.entries(s.confidenceEffects).map(([f])=>{const m=f==="siteLocation"?"Site-location confidence":f==="historical"?"Historical confidence":"Legal confidence",p=Math.round((r[f]??0)*100),h=Math.round(e.confidence[f]*100);return`${m}: ${p}% → ${h}%`}),u={actionId:i,label:s.label,at:Date.now(),evidenceRevealedId:o?.id??null,hazardRevealed:d,deltaLines:c};return e.researchLog=e.researchLog||[],e.researchLog.push(u),e.status="researching",u}function di(e){const t=Object.values(e.confidence);return t.length?t.reduce((i,a)=>i+a,0)/t.length:0}const ui=[{id:"used-pickup-truck",name:"Used Pickup Truck",tier:1,cost:0,operatingCostPerTrip:180,crewCapacity:2,cargoCapacity:12,equipmentCapacity:8,range:"regional",reliability:.8,environments:["desert","rural","forest","battlefield"],description:"Dependable more often than not. The suspension has seen better decades."},{id:"off-road-vehicle",name:"Off-Road Expedition Vehicle",tier:2,cost:14e3,operatingCostPerTrip:220,crewCapacity:4,cargoCapacity:20,equipmentCapacity:14,range:"regional",reliability:.9,environments:["desert","rural","forest","mountain","battlefield","jungle"],description:"Built for terrain that ends most vehicles' expeditions early."},{id:"coastal-research-boat",name:"Coastal Research Boat",tier:2,cost:26e3,operatingCostPerTrip:300,crewCapacity:4,cargoCapacity:14,equipmentCapacity:10,range:"coastal",reliability:.82,environments:["coastal"],description:"Built for reef work and shallow wreck recovery, not open-ocean crossings."}];function fe(e){return ui.find(t=>t.id===e)}const rt=[{id:"survey-transit",objectType:"Surveyor's Transit",category:"instrument",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["brass","steel","glass"],possibleFeatures:["engraved corps insignia","a cracked leveling bubble","a hand-fitted replacement leg","faint sighting-scope etching"],possibleInscriptions:["Property of the Continental Survey Corps","Instrument No. 14 — Western Division",null],baseMarketValue:[1800,6500],academicWeight:1.4,rarityBias:{Common:2,Notable:3,Rare:2,Exceptional:1}},{id:"field-journal",objectType:"Field Journal",category:"document",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["paper","leather"],possibleFeatures:["water-damaged final pages","a pressed desert flower between leaves","coordinate tables in a second hand","a torn-out final entry"],possibleInscriptions:["Survey Log — Black Mesa Traverse","Personal property, return to family if found",null],baseMarketValue:[900,12e3],academicWeight:2.1,rarityBias:{Notable:3,Rare:3,Exceptional:2,Historic:1}},{id:"brass-compass",objectType:"Pocket Compass",category:"instrument",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["brass","glass"],possibleFeatures:["a spider-cracked glass face","an engraved presentation inscription","a needle frozen off true north"],possibleInscriptions:["To J.H. — safe travels","C.S.C. Issue Mk II",null],baseMarketValue:[600,3200],academicWeight:.8,rarityBias:{Common:4,Notable:3,Rare:1}},{id:"mineral-case",objectType:"Mineral Sample Case",category:"container",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["wood","iron","glass"],possibleFeatures:["hand-labeled sample slots","several samples still intact","a corps inventory sticker"],possibleInscriptions:["Sample Set 7 — Black Mesa Traverse",null],baseMarketValue:[500,4e3],academicWeight:1.6,rarityBias:{Common:3,Notable:3,Rare:2}},{id:"presentation-watch",objectType:"Engraved Pocket Watch",category:"personal-effect",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["silver","brass","glass"],possibleFeatures:["a stopped movement frozen at a specific hour","a hinged case with a hidden photograph","heavy corrosion around the winding stem"],possibleInscriptions:["For years of service — C.S.C.",'Initials "E.V." engraved on the case back',null],baseMarketValue:[1200,9e3],academicWeight:1,rarityBias:{Notable:2,Rare:3,Exceptional:2,Historic:1}},{id:"insignia-badge",objectType:"Corps Insignia Badge",category:"personal-effect",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["brass","iron"],possibleFeatures:["a bent pin clasp","traces of original enamel paint","a serial number stamped on the reverse"],possibleInscriptions:["Continental Survey Corps — Western Division",null],baseMarketValue:[300,1800],academicWeight:.6,rarityBias:{Common:5,Notable:2}},{id:"ration-tin",objectType:"Water Ration Tin",category:"tool",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["iron","steel"],possibleFeatures:["a dented, sand-scoured surface","a stenciled ration quantity","evidence it was reused as a tool"],possibleInscriptions:["C.S.C. Field Ration — 1 Quart",null],baseMarketValue:[80,400],academicWeight:.3,rarityBias:{Common:6,Notable:1}}];rt.push({id:"ceremonial-mask",objectType:"Ceremonial Mask",category:"ceremonial-object",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["jade","obsidian","gold"],possibleFeatures:["inlaid obsidian eyes","a cracked jaguar motif","traces of red pigment","a repaired hairline fracture"],possibleInscriptions:["A stepped-glyph dedication to a highland ancestor","A jaguar-headed maker's mark",null],baseMarketValue:[4e3,22e3],academicWeight:1.8,rarityBias:{Notable:2,Rare:3,Exceptional:2,Historic:1}},{id:"jade-figurine",objectType:"Jade Figurine",category:"ceremonial-object",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["jade"],possibleFeatures:["a finely polished surface","a chipped base","a drilled suspension hole"],possibleInscriptions:[null],baseMarketValue:[2500,14e3],academicWeight:1.2,rarityBias:{Common:2,Notable:3,Rare:2}},{id:"obsidian-blade",objectType:"Obsidian Ceremonial Blade",category:"tool",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["obsidian","gold"],possibleFeatures:["a knapped edge still sharp after centuries","a gold-wrapped handle","ceremonial notching along the spine"],possibleInscriptions:[null],baseMarketValue:[1800,9e3],academicWeight:1.1,rarityBias:{Common:3,Notable:3,Rare:1}},{id:"stele-fragment",objectType:"Carved Stele Fragment",category:"architecture",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["stone"],possibleFeatures:["a partial glyph sequence","weathering that obscures half the carving","a sunburst motif border"],possibleInscriptions:["A partial king-list glyph sequence","A dedication date glyph",null],baseMarketValue:[3e3,18e3],academicWeight:2.4,rarityBias:{Rare:2,Exceptional:3,Historic:2,"World-Class":1}},{id:"ceramic-vessel",objectType:"Painted Ceramic Vessel",category:"personal-effect",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["ceramic"],possibleFeatures:["a painted procession scene","a repaired break along the rim","soot staining from ritual use"],possibleInscriptions:[null],baseMarketValue:[900,6e3],academicWeight:1,rarityBias:{Common:4,Notable:3,Rare:1}});rt.push({id:"ships-bell",objectType:"Ship's Bell",category:"instrument",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["bronze"],possibleFeatures:["heavy coral encrustation","a legible cast ship name","a hairline crack from the wreck impact"],possibleInscriptions:["Cast with the vessel's name and launch year",null],baseMarketValue:[3e3,16e3],academicWeight:1.6,rarityBias:{Notable:3,Rare:3,Exceptional:1}},{id:"navigational-astrolabe",objectType:"Mariner's Astrolabe",category:"instrument",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["brass","bronze"],possibleFeatures:["a corroded but intact alidade","engraved degree markings","a company crest medallion"],possibleInscriptions:["Thalassan Fleet Instrument Register No. 4",null],baseMarketValue:[5e3,26e3],academicWeight:2,rarityBias:{Rare:2,Exceptional:3,Historic:2,"World-Class":1}},{id:"cargo-manifest",objectType:"Cargo Manifest",category:"document",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["paper"],possibleFeatures:["water-sealed pages preserved in an oilskin pouch","a torn final page","a wax ledger seal still intact"],possibleInscriptions:["A full cargo ledger in the purser's hand","A route log with a final, unfinished entry",null],baseMarketValue:[1200,15e3],academicWeight:2.2,rarityBias:{Notable:2,Rare:3,Exceptional:2,Historic:1}},{id:"trade-coin-hoard",objectType:"Trade Coin Hoard",category:"container",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["gold","silver"],possibleFeatures:["coins fused together by centuries underwater","a still-intact strongbox corner","visible mint stamps on the top layer"],possibleInscriptions:[null],baseMarketValue:[4e3,24e3],academicWeight:1.3,rarityBias:{Notable:2,Rare:3,Exceptional:2}},{id:"figurehead-fragment",objectType:"Carved Figurehead Fragment",category:"personal-effect",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["wood"],possibleFeatures:["surviving gilt paint in the carving's grooves","worm-worn wood stabilized by silt","a recognizable face beneath the damage"],possibleInscriptions:[null],baseMarketValue:[800,5500],academicWeight:.9,rarityBias:{Common:4,Notable:3,Rare:1}});function yt(e){return rt.find(t=>t.id===e)}const La={"late-frontier":{id:"late-frontier",label:"Late Frontier Era",yearRange:[1868,1899],description:"The tail end of continental survey expeditions, railroad expansion, and speculative mineral prospecting.",plausibleMaterials:["iron","brass","steel","glass","leather","paper","wood","silver"],plausibleObjectCategories:["instrument","document","tool","personal-effect","container"]},"highland-classical":{id:"highland-classical",label:"Highland Classical Period",yearRange:[-420,180],description:"The height of highland temple-building, jade working, and long-distance jungle trade routes.",plausibleMaterials:["jade","gold","obsidian","ceramic","stone","copper"],plausibleObjectCategories:["ceremonial-object","tool","personal-effect","architecture"]},"age-of-sail":{id:"age-of-sail",label:"Age of Sail",yearRange:[1650,1780],description:"The height of long-distance trading fleets, before steam power made sail-driven cargo routes obsolete.",plausibleMaterials:["bronze","brass","wood","iron","glass","gold","silver","ceramic"],plausibleObjectCategories:["instrument","document","weapon","personal-effect","container"]}},qa={"regent-diadem":{name:"The Regent's Diadem",objectType:"Ceremonial Diadem",culture:"Thalassan Trading Fleet",era:"Age of Sail",estimatedDateRange:[1668,1669],material:"gold and silver",feature:"a band of interlocking wave motifs surrounding a central star-compass medallion, salvaged from the escort wreck before it was hidden ashore",inscription:"For the Governor of the Coral Strait, from a grateful Fleet — 1669",condition:"Fine",completeness:92,rarity:"World-Class",academicWeight:3.2,trueAuthenticity:"authentic",estimatedValueRange:[65e3,12e4]}};function Da(e){return qa[e]}const Na={Common:[.55,.95],Notable:[.8,1.3],Rare:[1.1,1.8],Exceptional:[1.5,2.4],Historic:[2.1,3.3],"World-Class":[3,4.8]};function _a(e){const t=zi.find(i=>e<=i.max);return t?t.tier:"Common"}function Pa(e,t){const i=e.toLowerCase();return i.includes("engrav")||i.includes("inscription")||i.includes("insignia")?"Engraved":i.includes("crack")||i.includes("dent")||i.includes("scour")||i.includes("corrosion")||i.includes("corroded")?"Weathered":i.includes("stopped")||i.includes("frozen")?"Stopped":i.includes("hidden")||i.includes("secret")?"Concealed":t.charAt(0).toUpperCase()+t.slice(1)}function Ha({site:e,eraId:t,cultureId:i,discoveryQuality:a,seq:n,rng:s,discoveryDate:r,discoveringCrewName:o}){const d=La[t],c=ri[i],u=g(a+s.range(-.15,.15),0,.99),f=_a(u),m=e.artifactTemplateIds.map(yt).filter(de=>de.compatibleEras.includes(t)&&de.compatibleCultures.includes(i)),p=m.length?m:e.artifactTemplateIds.map(yt),h=s.weightedPick(p.map(de=>({value:de,weight:de.rarityBias[f]??.4}))),y=s.pick(h.compatibleMaterials),k=s.pick(h.possibleFeatures),$=s.pick(h.possibleInscriptions),x=g(a*.5+s.range(0,.5),0,.99),L=Math.min(ae.length-1,Math.floor(x*ae.length)),I=ae[L],C=g(s.range(.4,.95)*(.7+x*.3),.2,1),[H,ce]=Na[f],K=s.range(H,ce),[le,Ue]=h.baseMarketValue,ve=(le+Ue)/2*K*(.6+.4*x)*(.7+.3*C),ge=s.float(),N=ge<.9?"authentic":ge<.98?"reproduction":"forgery",te=`${Pa(k,y)} ${h.objectType}`,ut=d.yearRange[0]+Math.floor(s.range(0,(d.yearRange[1]-d.yearRange[0])*.4)),yi=ut+Math.floor(s.range(2,12));return{id:`artifact-${n}-${Date.now().toString(36)}`,name:te,objectType:h.objectType,templateId:h.id,culture:c.label,era:d.label,estimatedDateRange:[ut,yi],material:y,feature:k,inscription:$||null,condition:I,completeness:Math.round(C*100),rarity:f,academicWeight:h.academicWeight,trueAuthenticity:N,authenticationStatus:"unidentified",authenticationConfidence:null,authenticationOutcome:null,estimatedValueRange:[Math.round(ve*.7),Math.round(ve*1.3)],finalAppraisedValue:null,provenance:`Recovered from ${e.name} by ${o}`,discoveryLocation:e.name,discoveryDate:{...r},discoveringCrew:o,disposition:"none",restorationStatus:"none"}}function Fa(e,{site:t,seq:i,discoveryDate:a,discoveringCrewName:n}){const s=Da(e);if(!s)throw new Error(`Unknown unique artifact: ${e}`);return{id:`artifact-${i}-${e}`,name:s.name,objectType:s.objectType,templateId:e,culture:s.culture,era:s.era,estimatedDateRange:s.estimatedDateRange,material:s.material,feature:s.feature,inscription:s.inscription||null,condition:s.condition,completeness:s.completeness,rarity:s.rarity,academicWeight:s.academicWeight,trueAuthenticity:s.trueAuthenticity,authenticationStatus:"unidentified",authenticationConfidence:null,authenticationOutcome:null,estimatedValueRange:[...s.estimatedValueRange],finalAppraisedValue:null,provenance:`Recovered from ${t.name} by ${n}`,discoveryLocation:t.name,discoveryDate:{...a},discoveringCrew:n,disposition:"none",restorationStatus:"none"}}const Oa=[{id:"vehicle-trouble",phase:"travel",environments:["desert","rural","forest","mountain"],title:"Vehicle Trouble",description:"A rear axle bearing is grinding badly on the washboard road. Pushing on risks stranding the truck; stopping costs precious daylight.",choices:[{id:"A",label:"Push on carefully",description:"Slower pace, but you keep moving.",effects:{timeHours:3,riskDelta:.03}},{id:"B",label:"Stop and repair roadside",description:"Costs time and a little cash, but the vehicle is sound again.",effects:{timeHours:6,cash:-150,vehicleReliabilityDelta:.05}},{id:"C",label:"Radio for a tow and wait",description:"Safe, but expensive and slow — and visible to anyone listening.",effects:{timeHours:10,cash:-400,rivalAwarenessDelta:.1}}]},{id:"collapsing-passage",phase:"excavation",environments:["desert","cave","ruins","mountain","underground"],title:"Collapsing Passage",description:"The eastern passage into the buried structure is becoming unstable. Loose material is already sifting down from the ceiling.",choices:[{id:"A",label:"Reinforce with timber and supplies",description:"Costs time and supplies, but makes the passage safe to work.",effects:{timeHours:8,supplies:{spareParts:-2},riskDelta:-.08}},{id:"B",label:"Send a small team through quickly",description:"Fast, but dangerous if the ceiling gives further.",effects:{timeHours:2,riskDelta:.15,discoveryBonus:.05}},{id:"C",label:"Seal the passage and search elsewhere",description:"Safe, but you may be walking away from the best find here.",effects:{timeHours:4,riskDelta:-.1,discoveryBonus:-.15}}]},{id:"rival-sighting",phase:"survey",environments:["desert","forest","jungle","coastal","ruins"],title:"Rival Team Nearby",description:"Drone footage catches movement on the ridge — another outfit is scouting the same coordinates.",choices:[{id:"A",label:"Accelerate the survey",description:"Move faster to secure the site first, at the cost of thoroughness.",effects:{timeHours:-4,discoveryBonus:-.05,riskDelta:.05}},{id:"B",label:"Contact local authorities",description:"Establishes your legal standing, but reveals the site's location publicly.",effects:{timeHours:3,legalConfidenceDelta:.15,rivalAwarenessDelta:.2}},{id:"C",label:"Hide activity and continue carefully",description:"Keeps a low profile, but slows the work.",effects:{timeHours:5,rivalAwarenessDelta:-.1}}]},{id:"unknown-chamber",phase:"discovery",environments:["desert","cave","ruins","underground","mountain"],title:"A Sealed Chamber",description:"Beyond the exposed wall lies a sealed chamber no record mentions.",choices:[{id:"A",label:"Open it now",description:"Fast answers, but no chance to prepare for what's inside.",effects:{timeHours:2,riskDelta:.1,discoveryBonus:.15}},{id:"B",label:"Scan it first",description:"Safer and better-documented, but slower.",effects:{timeHours:6,riskDelta:-.05,discoveryBonus:.05,academicCredibilityGain:.5}},{id:"C",label:"Document and return with specialists",description:"The most cautious option — but you may lose the site to weather or rivals before you're back.",effects:{timeHours:12,riskDelta:-.15,discoveryBonus:-.2}}]}];function Ba(e,t){return Oa.filter(i=>i.phase===e&&i.environments.includes(t))}function Va(e,t,i,a){const n=Ba(e,t).filter(s=>!i.includes(s.id));return n.length?a.pick(n):null}function ja(e,t,i){const a=t.choices.find(s=>s.id===i);if(!a)throw new Error(`Unknown choice ${i} for event ${t.id}`);const n=a.effects||{};if(e.timeHours+=n.timeHours||0,e.riskDelta+=n.riskDelta||0,e.discoveryBonus+=n.discoveryBonus||0,e.cash+=n.cash||0,e.legalConfidenceDelta+=n.legalConfidenceDelta||0,e.rivalAwarenessDelta+=n.rivalAwarenessDelta||0,e.vehicleReliabilityDelta=(e.vehicleReliabilityDelta||0)+(n.vehicleReliabilityDelta||0),e.academicCredibilityGain=(e.academicCredibilityGain||0)+(n.academicCredibilityGain||0),n.supplies){e.supplies=e.supplies||{};for(const[s,r]of Object.entries(n.supplies))e.supplies[s]=(e.supplies[s]||0)+r}return e.log.push({eventId:t.id,title:t.title,choiceId:i,choiceLabel:a.label}),{accumulator:e,choice:a}}function Ua(){return{timeHours:0,riskDelta:0,discoveryBonus:0,cash:0,legalConfidenceDelta:0,rivalAwarenessDelta:0,vehicleReliabilityDelta:0,academicCredibilityGain:0,supplies:{},log:[]}}function Wa(e,t){return t?e.some(i=>i.roleId===t.role&&i.skillLevel>=t.level):!0}function za(e,t,i=[]){if(!e.length)return 0;let a=0;for(const n of e){const s=G(n.templateId);if(!s)continue;const r=s.environments.includes(t)?1:.3,o=n.condition/100,d=Wa(i,s.requiredSkill)?1:.5,c=Object.values(s.effects).reduce((u,f)=>u+f,0);a+=c*r*o*d}return g(a,0,1)}function Ga(e=[]){const t={riskDelta:0,discoveryBonus:0,vehicleReliabilityBonus:0,equipmentWearReduction:0,supplyEfficiency:0};for(const i of e){const a=me(i.roleId);if(!a?.synergy)continue;const n=g(i.skillLevel/5,.2,1);a.synergy.riskDelta&&(t.riskDelta+=a.synergy.riskDelta*n),a.synergy.discoveryBonus&&(t.discoveryBonus+=a.synergy.discoveryBonus*n),a.synergy.vehicleReliabilityBonus&&(t.vehicleReliabilityBonus+=a.synergy.vehicleReliabilityBonus*n),a.synergy.equipmentWearReduction&&(t.equipmentWearReduction+=a.synergy.equipmentWearReduction*n),a.synergy.supplyEfficiency&&(t.supplyEfficiency+=a.synergy.supplyEfficiency*n),a.synergy.rivalAwarenessReduction&&(t.riskDelta-=a.synergy.rivalAwarenessReduction*.3*n)}return t.equipmentWearReduction=g(t.equipmentWearReduction,0,.6),t.supplyEfficiency=g(t.supplyEfficiency,0,.4),t}function pi(e,t=1){const i=Math.max(1,e/24),a={};for(const[n,s]of Object.entries(Ui))a[n]=Math.ceil(s*t*i);return a}function Ya(e,t){const i=Object.keys(t);if(!i.length)return 1;const a=i.map(n=>{const s=t[n]||0;return s===0?1:g((e[n]||0)/s,0,1.3)});return g(a.reduce((n,s)=>n+Math.min(s,1),0)/a.length,0,1)}function hi({lead:e,site:t,equipmentInstances:i,vehicle:a,supplies:n,approachId:s,leaderSkill:r,riskMultiplier:o=1,crewInstances:d=[]}){const c=Ke[s]||Ke.standard,u=di(e),f=za(i,t.environment,d),m=Wi*c.durationMultiplier,p=pi(m,1+d.length),h=Ga(d),y={};for(const[N,F]of Object.entries(n))y[N]=F*(1+h.supplyEfficiency);const k=Ya(y,p),$=a?fe(a.templateId):null,x=$?$.environments.includes(t.environment):!1,L=($?$.reliability:.5)*(x?1:.45),I=g(L+h.vehicleReliabilityBonus,0,1);let C=O.noConclusionPenalty,H=0;e.conclusionChosenId&&(e.conclusionChosenId===e.correctConclusionId?(C=-.05,H=.1):(C=O.wrongConclusionPenalty,H=-.08));const ce=d.length?((r||2)+d.reduce((N,F)=>N+F.skillLevel,0))/(1+d.length):r||2;let K=O.base+O.leadQuality*u+O.equipmentSuitability*f+O.supplyPreparation*k+O.vehicleReliability*I+(c.riskModifier||0)+C+h.riskDelta;k<O.shortageThreshold&&(K+=O.shortagePenalty*(O.shortageThreshold-k)),K=g(K*o,.03,.97);let le=ke.leadQuality*u+ke.equipmentSuitability*f+ke.siteBasePotential*t.baseDiscoveryPotential+ke.leaderSkill*g(ce/5,0,1)+(c.discoveryModifier||0)+H+h.discoveryBonus;le=g(le,.02,.98);const Ue=i.reduce((N,F)=>{const te=G(F.templateId);return N+(te?te.operatingCost:0)},0),dt=Object.entries(n).reduce((N,[F,te])=>N+te*(qe[F]||0),0),ve=d.reduce((N,F)=>N+F.salary,0)*(m/24),ge=Math.round((t.travelCost+dt+Ue)*c.costMultiplier+ve);return{approach:c,leadQuality:u,equipmentSuitability:f,supplyPreparationScore:k,vehicleReliability:I,vehicleEnvironmentMatch:x,riskRating:K,successChance:g(1-K,.02,.98),discoveryQuality:le,estimatedDurationHours:m,recommendedSupplies:p,estimatedCost:ge,crewSynergy:h}}function Qa({id:e,plan:t,lead:i,site:a,vehicle:n,equipmentInstances:s,crewInstances:r=[],leaderSkill:o,leaderName:d,startDate:c,riskMultiplier:u=1}){const f=hi({lead:i,site:a,equipmentInstances:s,vehicle:n,supplies:t.supplies,approachId:t.approachId,leaderSkill:o,riskMultiplier:u,crewInstances:r}),m=Xe.map(p=>({phase:p,durationHours:f.estimatedDurationHours*Bt[p],eventResolved:null,pendingEvent:null,resolvedChoiceId:null}));return{id:e,plan:t,lead:i,site:a,vehicle:n,equipmentInstances:s,crewInstances:r,leaderSkill:o,leaderName:d,metrics:f,phases:m,currentPhaseIndex:0,accumulator:Ua(),usedEventIds:[],elapsedHours:0,startDate:c}}function mi(e){return e.phases[e.currentPhaseIndex]}function Ka(e,t,i=.7){const a=mi(e);if(a.eventResolved!==null||a.pendingEvent)return a.pendingEvent;if(!t.bool(i))return a.eventResolved="none",null;const n=Va(a.phase,e.site.environment,e.usedEventIds,t);return n?(a.pendingEvent=n,n):(a.eventResolved="none",null)}function Xa(e,t){const i=mi(e),a=i.pendingEvent,{choice:n}=ja(e.accumulator,a,t);return e.usedEventIds.push(a.id),i.eventResolved=a.id,i.resolvedChoiceId=t,i.pendingEvent=null,n}function Ja(e){return e.elapsedHours+=e.phases[e.currentPhaseIndex].durationHours,e.currentPhaseIndex<e.phases.length-1?(e.currentPhaseIndex++,!0):!1}function Za(e){const t=e.metrics,i=[{label:"Incomplete or inaccurate intelligence about the site made the search far harder than expected.",value:1-t.leadQuality},{label:"Equipment was poorly suited to the terrain and conditions encountered.",value:1-t.equipmentSuitability},{label:"Supplies ran short of what the expedition actually needed.",value:1-t.supplyPreparationScore},{label:"Transport proved unreliable when it mattered most.",value:1-t.vehicleReliability},{label:"Weather and terrain hazards in the field proved worse than anticipated.",value:.4+e.accumulator.riskDelta}];return i.sort((a,n)=>n.value-a.value),i[0].label}function en(e,t,i){const a=g(e.metrics.riskRating+e.accumulator.riskDelta,.03,.97);e.finalRisk=a;const n=g(1-a,.02,.98),s=t.bool(n),r=g(e.metrics.discoveryQuality+e.accumulator.discoveryBonus,.02,.98);let o=[],d=null;if(s&&e.site.uniqueArtifactId)o.push(Fa(e.site.uniqueArtifactId,{site:e.site,seq:i,discoveryDate:e.dateAtCompletion,discoveringCrewName:e.leaderName}));else if(s){const c=r>.72?t.int(2,3):r>.4?t.int(1,2):1,u=e.metrics.approach?.valueMultiplier??1;for(let f=0;f<c;f++){const m=Ha({site:e.site,eraId:e.lead.eraId,cultureId:e.lead.cultureId,discoveryQuality:r,seq:i+f,rng:t,discoveryDate:e.dateAtCompletion,discoveringCrewName:e.leaderName});u!==1&&(m.estimatedValueRange=m.estimatedValueRange.map(p=>Math.round(p*u))),o.push(m)}}else d=Za(e);return{success:s,finalRisk:a,successChance:n,finalDiscoveryQuality:r,artifacts:o,failureReason:d}}function tn(e,t,i=1,a=1){const n=[],s=(e.plan.supplies.fuel||0)+(e.accumulator.supplies.fuel||0),o=-(fe(e.vehicle.templateId).operatingCostPerTrip*a+s*qe.fuel);n.push({label:"Travel and fuel",amount:Math.round(o)});const d=e.crewInstances||[],c=e.metrics.estimatedDurationHours/24,u=-Math.round(d.reduce((I,C)=>I+C.salary,0)*c);n.push({label:"Crew wages",amount:u});const f=e.site.legalComplexity??.3,m=e.plan.approachId==="discreet"?0:-Math.round(400*f);n.push({label:"Permit fees",amount:m});const p=-Object.entries(e.plan.supplies).reduce((I,[C,H])=>{const ce=Math.max(0,H+(e.accumulator.supplies[C]||0));return I+ce*(qe[C]||0)},0);n.push({label:"Supplies",amount:Math.round(p)});const h=e.metrics.crewSynergy?.equipmentWearReduction||0;let y=0;for(const I of e.equipmentInstances){const C=G(I.templateId);if(!C)continue;const H=Math.round((5+e.finalRisk*Gi)*i*(1-h));I.condition=g(I.condition-H,0,100),y+=H/100*C.cost*.15}n.push({label:"Equipment damage",amount:-Math.round(y)});const k=Math.round(e.accumulator.cash);k!==0&&n.push({label:"Field event costs",amount:k});const $=t.artifacts.reduce((I,C)=>I+(C.estimatedValueRange[0]+C.estimatedValueRange[1])/2,0);t.artifacts.length&&n.push({label:"Recovered artifacts est.",amount:Math.round($),isEstimate:!0});const x=n.filter(I=>!I.isEstimate).reduce((I,C)=>I+C.amount,0),L=x+$;return{lines:n,actualCashDelta:Math.round(x),estimatedArtifactsValue:Math.round($),estimatedNetValue:Math.round(L)}}function Q(e,t){const i=Mt(e.rng.seed,e.rng.callCount),a=t(i);return e.rng=i.serialize(),a}function ze(e){return ee[e.profile.difficulty]||ee.adventurer}function ue(e,t){ia(e.date,t),Ta(e,t)}function q(e,t,i){if(e.finance.cash<t)throw new Error(i||`Not enough cash — need ${t}, have ${Math.round(e.finance.cash)}.`)}function _(e,t){e.finance.cash-=t,e.finance.totalExpenses+=t}function an({explorerName:e,orgName:t,difficulty:i,tutorialEnabled:a}){const n=Ai(),s=ee[i]||ee.adventurer;n.profile.explorerName=e,n.profile.orgName=t||se.defaultOrgName,n.profile.difficulty=s.id,n.finance.cash=s.startingCash,n.settings.tutorialEnabled=a,n.tutorial.active=a,n.player.name=e;const r=qt("black-mesa-camp-site");n.sites.push(r);const o=Lt("lost-survey-camp",r.instanceId);n.leads.available.push(o),n.equipment=["field-shovels","excavation-brushes","climbing-rope","field-lanterns","basic-metal-detector","field-camera","first-aid-kit","portable-radio"].map(Nt),n.vehicles=[Ht("used-pickup-truck")];const d=Mt(n.rng.seed,n.rng.callCount);return n.crewCandidates=Qt(d,3),n.rng=d.serialize(),n.objectives.main={id:"first-expedition",label:"Investigate The Lost Survey Camp and launch your first expedition."},n.objectives.optional=[{id:"research-lead",label:"Research the lead at least twice before launching."},{id:"authenticate-find",label:"Authenticate a recovered artifact."}],A(n,{type:"info",title:"Welcome to Treasure Hunter",message:"A storage-unit find has led you to your first lead. Check the Leads tab to begin investigating."}),n}const nn={RESEARCH_LEAD(e,{leadInstanceId:t,actionId:i}){const a=ye(e,t);if(!a)throw new Error("Lead not found.");const n=we(e,a.siteId),s=li(i);if(!s)throw new Error("Unknown research action.");const r=ze(e),o=wa(e),d=ua(e.staff),c=Math.round(s.cost*r.researchCostMultiplier*o*d);q(e,c,`Not enough cash to ${s.label.toLowerCase()} (needs ${c}).`),_(e,c),ue(e,s.timeHours);const u=ka(e)*xa(e),{record:f,disturbance:m}=Q(e,p=>{const h=Ma(a,n,i,p,u);ma(a,n,p);const y=fa(a,n,p);return{record:h,disturbance:y}});if(e.researchPoints+=1,a.pendingReputationEffects){for(const[p,h]of Object.entries(a.pendingReputationEffects))e.reputation[p]=g((e.reputation[p]||0)+h,0,100);a.pendingReputationEffects=null}return e.leads.available.includes(a)&&!e.leads.active.includes(a)&&(e.leads.available=e.leads.available.filter(p=>p!==a),e.leads.active.push(a)),m&&A(e,{type:"warning",title:"Rival Activity",message:`${m.name} has been through the site ahead of you — the best of it may already be gone.`}),{record:f,disturbance:m}},CHOOSE_LEAD_CONCLUSION(e,{leadInstanceId:t,conclusionId:i}){const a=ye(e,t);if(!a)throw new Error("Lead not found.");return{wasCorrect:Hi(a,i)}},LAUNCH_EXPEDITION(e,{leadInstanceId:t,plan:i}){if(e.activeExpedition)throw new Error("An expedition is already underway.");const a=ye(e,t);if(!a)throw new Error("Lead not found.");const n=we(e,a.siteId),s=e.vehicles.find(u=>u.instanceId===i.vehicleInstanceId)||e.vehicles[0];if(!s)throw new Error("No vehicle available for this expedition.");const r=e.equipment.filter(u=>i.equipmentInstanceIds.includes(u.instanceId)),o=e.staff.filter(u=>(i.crewInstanceIds||[]).includes(u.instanceId)),d=ze(e),c=Qa({id:`exp-${Date.now()}`,plan:i,lead:a,site:n,vehicle:s,equipmentInstances:r,crewInstances:o,leaderSkill:(e.player.skill.leadership+e.player.skill.survival)/2,leaderName:e.player.name,startDate:{...e.date},riskMultiplier:d.riskMultiplier});return q(e,Math.round(c.metrics.estimatedCost*.5),"You may not be able to afford this expedition — reduce scope or supplies."),c.metrics.approach?.rivalAwarenessModifier&&(a.rivalInterest=g((a.rivalInterest||0)+c.metrics.approach.rivalAwarenessModifier,0,1)),a.status="expedition-launched",e.activeExpedition={id:c.id,leadInstanceId:t,siteInstanceId:n.instanceId,vehicleInstanceId:s.instanceId,equipmentInstanceIds:i.equipmentInstanceIds,crewInstanceIds:i.crewInstanceIds||[],rivalInterestAtLaunch:a.rivalInterest||0,fullyResearchedAtLaunch:a.confidence.siteLocation>=.85&&a.confidence.historical>=.85&&a.confidence.legal>=.85,leaderName:e.player.name,leaderSkill:c.leaderSkill,plan:i,metrics:c.metrics,phases:c.phases,currentPhaseIndex:0,accumulator:c.accumulator,usedEventIds:[],elapsedHours:0,startDate:c.startDate},A(e,{type:"expedition",title:"Expedition Launched",message:`${e.player.name} is headed to ${n.name}.`}),{}},CHECK_PHASE_EVENT(e){const t=e.activeExpedition;if(!t)throw new Error("No active expedition.");const i=we(e,t.siteInstanceId),a={phases:t.phases,currentPhaseIndex:t.currentPhaseIndex,site:i,usedEventIds:t.usedEventIds};return{event:Q(e,s=>Ka(a,s,.7)),autosave:!1}},RESOLVE_EXPEDITION_EVENT(e,{choiceId:t}){const i=e.activeExpedition;if(!i)throw new Error("No active expedition.");const a={phases:i.phases,currentPhaseIndex:i.currentPhaseIndex,accumulator:i.accumulator,usedEventIds:i.usedEventIds};return{choice:Xa(a,t)}},ADVANCE_EXPEDITION_PHASE(e){const t=e.activeExpedition;if(!t)throw new Error("No active expedition.");const i=t.phases[t.currentPhaseIndex].durationHours,a=Ja(t);return ue(e,i),{hasNext:a}},COMPLETE_EXPEDITION(e){const t=e.activeExpedition;if(!t)throw new Error("No active expedition.");const i=ye(e,t.leadInstanceId),a=we(e,t.siteInstanceId),n=e.vehicles.find(h=>h.instanceId===t.vehicleInstanceId),s=e.equipment.filter(h=>t.equipmentInstanceIds.includes(h.instanceId)),r=e.staff.filter(h=>(t.crewInstanceIds||[]).includes(h.instanceId)),o=ze(e),d={metrics:t.metrics,accumulator:t.accumulator,lead:i,site:a,vehicle:n,equipmentInstances:s,crewInstances:r,leaderName:t.leaderName,plan:t.plan,dateAtCompletion:{...e.date}},c=e.stats.expeditionsCompleted*10+e.artifacts.length,u=Q(e,h=>en(d,h,c)),f=tn(d,u,o.equipmentWearMultiplier,Ea(e));e.finance.cash+=f.actualCashDelta;for(const h of f.lines)!h.isEstimate&&h.amount<0&&(e.finance.totalExpenses+=-h.amount);t.accumulator.academicCredibilityGain&&(e.reputation.academicCredibility=g(e.reputation.academicCredibility+t.accumulator.academicCredibilityGain,0,100)),u.success&&t.metrics.approach?.reputationModifier&&(e.reputation.academicCredibility=g(e.reputation.academicCredibility+t.metrics.approach.reputationModifier*2,0,100)),t.plan.approachId==="discreet"&&(a.legalComplexity??0)>.5&&(e.reputation.ethicalStanding=g(e.reputation.ethicalStanding-3,0,100));for(const h of r)da(h,u.success?2:1);e.artifacts.push(...u.artifacts),u.success?(e.stats.expeditionsCompleted+=1,e.reputation.fieldReputation=g(e.reputation.fieldReputation+1,0,100)):e.stats.expeditionsFailed+=1,i.status="resolved",e.leads.active=e.leads.active.filter(h=>h!==i),e.leads.archived.push(i),e.stats.leadsResolved+=1;const m=Qe(e);m&&A(e,{type:"info",title:"New Lead",message:`A new lead has surfaced: ${m.title}.`});const p={id:t.id,leadTitle:i.title,siteName:a.name,environment:a.environment,success:u.success,finalRisk:u.finalRisk,failureReason:u.failureReason,artifactIds:u.artifacts.map(h=>h.id),financials:f,rivalInterestAtLaunch:t.rivalInterestAtLaunch||0,fullyResearchedAtLaunch:t.fullyResearchedAtLaunch||!1,date:{...e.date}};return e.expeditionHistory.push(p),e.activeExpedition=null,A(e,{type:u.success?"success":"warning",title:u.success?"Expedition Successful":"Expedition Unsuccessful",message:u.success?`Recovered ${u.artifacts.length} item${u.artifacts.length===1?"":"s"} from ${a.name}.`:u.failureReason}),Y(e),We(e),X(e),Se(e,"complete-expedition",{success:u.success},A),{outcome:u,financials:f,historyRecord:p}},AUTHENTICATE_ARTIFACT(e,{artifactId:t,methodId:i}){const a=e.artifacts.find(r=>r.id===t);if(!a)throw new Error("Artifact not found.");const n=De[i];if(!n)throw new Error("Unknown authentication method.");if(n.requiresFacility&&!e.facilities.some(r=>r.templateId===n.requiresFacility))throw new Error(`${n.label} requires a ${D(n.requiresFacility).name}.`);q(e,n.cost,`Not enough cash for ${n.label}.`),_(e,n.cost),ue(e,n.timeHours);const s=Q(e,r=>Xi(a,i,r));return a.authenticationStatus==="authenticated"&&(e.stats.artifactsAuthenticated+=1),Y(e),X(e),{result:s}},RESTORE_ARTIFACT(e,{artifactId:t,methodId:i}){const a=e.artifacts.find(d=>d.id===t);if(!a)throw new Error("Artifact not found.");const n=Oe[i];if(!n)throw new Error("Unknown restoration method.");const s=jt(a,i);q(e,s,`Not enough cash for ${n.label}.`),_(e,s),ue(e,n.timeHours);const{failed:r,authenticityDamaged:o}=Q(e,d=>Ji(a,i,d));return Y(e),{failed:r,authenticityDamaged:o,cost:s}},SELL_ARTIFACT(e,{artifactId:t}){const i=e.artifacts.find(r=>r.id===t);if(!i)throw new Error("Artifact not found.");const{saleValue:a,ethicalPenalty:n}=Q(e,r=>Bi(i)),s=Math.round(a*bt(e));return i.saleValue=s,i.soldVia="private",e.finance.cash+=s,e.finance.totalRevenue+=s,n?e.reputation.ethicalStanding=g(e.reputation.ethicalStanding-n,0,100):e.reputation.fieldReputation=g(e.reputation.fieldReputation+1,0,100),Y(e),We(e),X(e),Se(e,"sell-rarity",{rarity:i.rarity},A),{saleValue:s,ethicalPenalty:n}},STORE_ARTIFACT(e,{artifactId:t}){const i=e.artifacts.find(a=>a.id===t);if(!i)throw new Error("Artifact not found.");return Vi(i),{}},DISPLAY_ARTIFACT(e,{artifactId:t}){const i=e.artifacts.find(a=>a.id===t);if(!i)throw new Error("Artifact not found.");return ji(i),e.reputation.publicFame=g(e.reputation.publicFame+1,0,100),Y(e),{}},DONATE_ARTIFACT(e,{artifactId:t}){const i=e.artifacts.find(a=>a.id===t);if(!i)throw new Error("Artifact not found.");if(i.disposition!=="none")throw new Error("This artifact has already been dealt with.");return i.disposition="donated",e.reputation.ethicalStanding=g(e.reputation.ethicalStanding+4,0,100),e.reputation.academicCredibility=g(e.reputation.academicCredibility+2,0,100),Y(e),X(e),A(e,{type:"success",title:"Artifact Donated",message:`${i.name} returned to the historical record.`}),Se(e,"donate-artifact",{},A),{}},REPAIR_EQUIPMENT(e,{instanceId:t}){const i=e.equipment.find(n=>n.instanceId===t);if(!i)throw new Error("Equipment not found.");const a=Math.round(Pt(i)*Zt(e));return q(e,a,"Not enough cash for this repair."),_(e,a),Oi(i),{cost:a}},PURCHASE_EQUIPMENT(e,{templateId:t}){const i=G(t);if(!i)throw new Error("Unknown equipment.");const a=Math.round(i.cost*gt(e));return q(e,a,`Not enough cash for the ${i.name}.`),_(e,a),e.equipment.push(Nt(t)),A(e,{type:"info",title:"Equipment Purchased",message:i.name}),X(e),{}},PURCHASE_VEHICLE(e,{templateId:t}){const i=fe(t);if(!i)throw new Error("Unknown vehicle.");const a=ti(e);if(e.vehicles.length>=a)throw new Error(`Your headquarters can only support ${a} vehicle${a===1?"":"s"} right now.`);const n=Math.round(i.cost*gt(e));return q(e,n,`Not enough cash for the ${i.name}.`),_(e,n),e.vehicles.push(Ht(t)),A(e,{type:"info",title:"Vehicle Purchased",message:i.name}),{}},HIRE_CREW(e,{candidateId:t}){const i=e.crewCandidates.findIndex(r=>r.instanceId===t);if(i===-1)throw new Error("Candidate not found — try refreshing the list.");const a=ei(e);if(e.staff.length>=a)throw new Error(`Your headquarters can only support ${a} staff right now — build Crew Quarters or upgrade your HQ.`);const n=e.crewCandidates[i],s=n.salary*2;return q(e,s,`Not enough cash to hire ${n.name} (needs ${s}).`),_(e,s),e.staff.push(n),e.crewCandidates.splice(i,1),A(e,{type:"info",title:"New Hire",message:`${n.name} has joined ${e.profile.orgName}.`}),{}},DISMISS_CREW(e,{crewInstanceId:t}){const i=e.staff.find(a=>a.instanceId===t);if(!i)throw new Error("Crew member not found.");return e.staff=e.staff.filter(a=>a!==i),{}},REFRESH_CREW_CANDIDATES(e){return q(e,200,"Not enough cash to search for new candidates."),_(e,200),ue(e,6),e.crewCandidates=Q(e,i=>Qt(i,3)),{}},BUILD_FACILITY(e,{facilityId:t}){const i=D(t);if(!i)throw new Error("Unknown facility.");if(e.facilities.some(a=>a.templateId===t))throw new Error("Already built.");if(i.minTier>e.organization.tier)throw new Error("Your headquarters needs to be larger to support this facility.");if(e.facilities.length>=ii(e))throw new Error("No room for more facilities — upgrade your headquarters first.");return q(e,i.cost,`Not enough cash for the ${i.name}.`),_(e,i.cost),e.facilities.push({instanceId:`facility-${t}`,templateId:t}),A(e,{type:"success",title:"Facility Built",message:`${i.name} is now operational.`}),{}},UPGRADE_HEADQUARTERS(e){const t=Jt(e.organization.tier);if(!t)throw new Error("Already at the highest headquarters tier.");if(e.organization.prestige<t.prestigeRequired)throw new Error(`Requires ${t.prestigeRequired} prestige (you have ${e.organization.prestige}).`);return q(e,t.cost,`Not enough cash to build the ${t.name} (needs ${t.cost}).`),_(e,t.cost),e.organization.tier=t.tier,e.organization.tierName=t.name,A(e,{type:"milestone",title:"Headquarters Upgraded",message:`Welcome to your new ${t.name}.`}),{}},ACCEPT_SPONSOR(e,{sponsorId:t}){if(e.sponsors.some(a=>a.templateId===t))throw new Error("Already accepted.");const i=at(t);if(!i)throw new Error("Unknown sponsor.");if(e.sponsors.push({instanceId:`sponsor-${t}`,templateId:t,acceptedDate:{...e.date}}),e.finance.cash+=i.signingBonus,e.finance.totalRevenue+=i.signingBonus,i.reputationEffects)for(const[a,n]of Object.entries(i.reputationEffects))e.reputation[a]=g((e.reputation[a]||0)+n,0,100);return Y(e),A(e,{type:"success",title:"Sponsorship Signed",message:i.name}),{}},ACCEPT_CONTRACT(e,{contractId:t}){if(e.contracts.some(a=>a.templateId===t))throw new Error("Already accepted.");const i=_e(t);if(!i)throw new Error("Unknown contract.");return e.contracts.push({instanceId:`contract-${t}`,templateId:t,status:"active",acceptedDate:{...e.date}}),A(e,{type:"info",title:"Contract Accepted",message:i.title}),{}},BUILD_MUSEUM(e){if(e.museum?.built)throw new Error("Museum already built.");if(e.organization.prestige<T.prestigeRequired)throw new Error(`Requires ${T.prestigeRequired} prestige (you have ${e.organization.prestige}).`);return q(e,T.cost,`Not enough cash to build a museum (needs ${T.cost}).`),_(e,T.cost),e.museum={built:!0,ticketPrice:T.defaultTicketPrice,exhibits:[],totalVisitors:0,totalRevenue:0},A(e,{type:"milestone",title:"Museum Opened",message:"Your private museum is open to the public."}),X(e),{}},CREATE_EXHIBIT(e,{themeId:t,name:i}){if(!e.museum?.built)throw new Error("Build a museum first.");const a=st(t);if(!a)throw new Error("Unknown exhibit theme.");return e.museum.exhibits.push({instanceId:`exhibit-${Date.now()}`,themeId:t,name:i||a.label,artifactIds:[]}),{}},ASSIGN_ARTIFACT_TO_EXHIBIT(e,{exhibitId:t,artifactId:i}){if(!e.museum?.built)throw new Error("Build a museum first.");const a=e.museum.exhibits.find(s=>s.instanceId===t);if(!a)throw new Error("Exhibit not found.");const n=e.artifacts.find(s=>s.id===i);if(!n)throw new Error("Artifact not found.");if(n.disposition!=="displayed")throw new Error("Only artifacts set to Display can join an exhibit.");for(const s of e.museum.exhibits)s.artifactIds=s.artifactIds.filter(r=>r!==i);return a.artifactIds.push(i),{}},REMOVE_ARTIFACT_FROM_EXHIBIT(e,{exhibitId:t,artifactId:i}){const a=e.museum?.exhibits.find(n=>n.instanceId===t);if(!a)throw new Error("Exhibit not found.");return a.artifactIds=a.artifactIds.filter(n=>n!==i),{}},SET_TICKET_PRICE(e,{price:t}){if(!e.museum?.built)throw new Error("Build a museum first.");return e.museum.ticketPrice=g(Math.round(t),T.minTicketPrice,T.maxTicketPrice),{}},SELL_ARTIFACT_AUCTION(e,{artifactId:t}){const i=e.artifacts.find(o=>o.id===t);if(!i)throw new Error("Artifact not found.");if(i.disposition!=="none")throw new Error("This artifact has already been dealt with.");const a=i.finalAppraisedValue??(i.estimatedValueRange[0]+i.estimatedValueRange[1])/2,n=Q(e,o=>{const d=o.range(Ne[0],Ne[1]),c=a*d*(1-Je);return Math.round(c*bt(e))});return i.disposition="sold",i.saleValue=n,i.soldVia="auction",e.finance.cash+=n,e.finance.totalRevenue+=n,!["Authentic","Modern Reproduction","Deliberate Forgery"].includes(i.authenticationOutcome)&&i.trueAuthenticity!=="authentic"?e.reputation.ethicalStanding=g(e.reputation.ethicalStanding-3,0,100):e.reputation.fieldReputation=g(e.reputation.fieldReputation+1,0,100),Y(e),We(e),X(e),Se(e,"sell-rarity",{rarity:i.rarity},A),A(e,{type:"success",title:"Sold at Auction",message:`${i.name} sold for $${n.toLocaleString()}.`}),{saleValue:n}},UPDATE_SETTINGS(e,t){return Object.assign(e.settings,t),{}},DISMISS_TUTORIAL_STEP(e,{step:t}){return e.tutorial.dismissedSteps.includes(t)||e.tutorial.dismissedSteps.push(t),e.tutorial.currentStep=t+1,{}},RESET_TUTORIAL(e){return e.tutorial={active:!0,currentStep:0,dismissedSteps:[]},e.settings.tutorialEnabled=!0,{}},END_TUTORIAL(e){return e.tutorial.active=!1,{}},DISMISS_ALERT(e,{alertId:t}){return e.alerts=e.alerts.filter(i=>i.id!==t),{autosave:!1}}};function sn(e,t,i){const a=nn[t];if(!a)throw new Error(`Unknown action: ${t}`);return a(e,i||{})}class rn{constructor(){this._state=null,this._listeners=new Set,this._autosaveHook=null}setState(t){this._state=t,this._emit()}getState(){return this._state}hasGame(){return this._state!==null}subscribe(t){return this._listeners.add(t),()=>this._listeners.delete(t)}setAutosaveHook(t){this._autosaveHook=t}dispatch(t,i){if(!this._state)throw new Error(`Cannot dispatch ${t} before a game is loaded`);const a=sn(this._state,t,i)||{};return this._emit(),this._autosaveHook&&a.autosave!==!1&&this._autosaveHook(this._state),a}_emit(){for(const t of this._listeners)t(this._state)}}const v=new rn,on={1:e=>({...e,crewCandidates:e.crewCandidates||[]}),2:e=>{const t={...e,stats:{...e.stats,leadsResolved:e.leads.archived.length}};for(let i=0;i<t.stats.leadsResolved;i++)Qe(t);return t},3:e=>({...e,sponsors:e.sponsors||[]}),4:e=>(e.leads.available.length===0&&e.leads.active.length===0&&Qe(e),e)};function wt(e){let t=e.saveVersion||1;if(t>Te)throw new Error("This save was created by a newer version of the game and cannot be loaded here.");let i=e;for(;t<Te;){const a=on[t];if(!a)throw new Error(`No migration path from save version ${t} to ${Te}.`);i=a(i),t+=1,i.saveVersion=t}return i}function fi(e){const t=document.createElement("template");return t.innerHTML=e.trim(),t.content.firstElementChild}function cn(e,t){return Array.from(e.querySelectorAll(t))}function re(e,t,i){cn(e,t).forEach(a=>{a.hasAttribute("role")||a.setAttribute("role","button"),a.hasAttribute("tabindex")||a.setAttribute("tabindex","0"),a.addEventListener("click",()=>i(a)),a.addEventListener("keydown",n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),i(a))})})}function l(e){return String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}let U=null;function ln(){return U&&document.body.contains(U)||(U=document.createElement("div"),U.className="toast-region",U.setAttribute("role","status"),U.setAttribute("aria-live","polite"),document.body.appendChild(U)),U}function S(e,{variant:t="default",duration:i=3200}={}){const a=fi(`<div class="toast${t!=="default"?` toast--${t}`:""}">${l(e)}</div>`);ln().appendChild(a),setTimeout(()=>{a.style.transition="opacity 180ms ease",a.style.opacity="0",setTimeout(()=>a.remove(),200)},i)}function E(e){P("error"),S(e,{variant:"error",duration:4200})}function kt(e){P("success"),S(e,{variant:"success"})}const Pe="saves";function dn(){return new Promise((e,t)=>{try{const i=indexedDB.open(Si,xi);i.onupgradeneeded=()=>{const a=i.result;a.objectStoreNames.contains(Pe)||a.createObjectStore(Pe,{keyPath:"slotId"})},i.onsuccess=()=>e(i.result),i.onerror=()=>t(i.error)}catch(i){t(i)}})}async function xe(e,t){const i=await dn();return new Promise((a,n)=>{const s=i.transaction(Pe,e),r=s.objectStore(Pe),o=t(r);s.oncomplete=()=>a(o?.result),s.onerror=()=>n(s.error),s.onabort=()=>n(s.error)})}class un{constructor(){this._available=typeof indexedDB<"u",this._pendingSave=null,this._saveTimer=null,this._autosaveFailureWarned=!1}isAvailable(){return this._available}async listSlots(){if(!this._available)return Array(be).fill(null);try{const t=await xe("readonly",a=>a.getAll()),i=Array(be).fill(null);for(const a of t||[])a.slotId>=0&&a.slotId<be&&(i[a.slotId]=a);return i}catch(t){return console.error("Failed to list save slots",t),Array(be).fill(null)}}async loadSlot(t){if(!this._available)return null;let i;try{i=await xe("readonly",a=>a.get(t))}catch(a){throw console.error("Failed to read save slot",t,a),new Error("This save could not be read from storage.")}if(!i)return null;try{return wt(i.state)}catch(a){throw a instanceof Error&&/save version|newer version/.test(a.message)?a:(console.error("Failed to migrate save slot",t,a),new Error("This save appears to be corrupted and could not be loaded."))}}async saveToSlot(t,i){if(!this._available)throw new Error("Saving is not available in this browser.");i.meta.slotId=t,i.meta.lastSavedAt=Date.now();const a={slotId:t,updatedAt:Date.now(),state:i};return await xe("readwrite",n=>n.put(a)),a}async deleteSlot(t){this._available&&await xe("readwrite",i=>i.delete(t))}scheduleAutosave(t,i=1200){t.meta.slotId!=null&&(this._pendingSave=t,this._saveTimer&&clearTimeout(this._saveTimer),this._saveTimer=setTimeout(()=>{const a=this._pendingSave;this._pendingSave=null,this.saveToSlot(a.meta.slotId,a).then(()=>{this._autosaveFailureWarned=!1}).catch(n=>{console.error("Autosave failed",n),this._autosaveFailureWarned||(this._autosaveFailureWarned=!0,E("Autosave failed — your progress may not be saved. Try exporting your save from Settings."))})},i))}exportSave(t){const i=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),a=URL.createObjectURL(i),n=`treasure-hunter-${(t.profile.orgName||"save").replace(/\s+/g,"-").toLowerCase()}-${Date.now()}.json`;return{url:a,filename:n}}async importSaveFromFile(t){const i=await t.text();let a;try{a=JSON.parse(i)}catch{throw new Error("That file is not valid save data (could not parse JSON).")}if(!a||typeof a!="object"||["profile","finance","reputation","date","settings","leads","sites","artifacts","equipment","vehicles","staff","organization","facilities","stats","achievements","milestones","alerts"].some(s=>!(s in a)))throw new Error("That file does not look like a complete Treasure Hunter save.");try{return wt(a)}catch(s){throw s instanceof Error&&/save version|newer version/.test(s.message)?s:(console.error("Failed to migrate imported save",s),new Error("That save file is corrupted and could not be imported."))}}}const B=new un,et=new Map;let Me=null,tt=null,ot=!1,$e=null;function M(e,t){et.set(e,t)}function Ie(e){ot=e}function pn(){const e=window.location.hash.replace(/^#\//,"")||"headquarters",[t,...i]=e.split("/");return{screen:t||"headquarters",param:i.join("/")||null}}function w(e,t){ot=!1;const i=`#/${e}${t?`/${t}`:""}`;window.location.hash===i?He():window.location.hash=i}function He(){if($e){try{$e()}catch(s){console.error("Screen cleanup failed",s)}$e=null}const{screen:e,param:t}=pn(),i=et.get(e)||et.get("headquarters");Me.innerHTML="";const a=document.createElement("div");a.className="screen",a.id="screen-root",Me.appendChild(a);const n=i(a,t);typeof n=="function"&&($e=n),tt&&tt(e,t),Me.scrollTop=0}function hn(){ot||He()}function mn(e,t){Me=e,tt=t,window.addEventListener("hashchange",He),He()}const fn=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}),vn=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2});function b(e,{precise:t=!1}={}){return(t?vn:fn).format(Math.round(e*100)/100)}function Et(e){const t=b(Math.abs(e));return e<0?`-${t}`:`+${t}`}function V(e,t=0){return`${(e*100).toFixed(t)}%`}const gn=["January","February","March","April","May","June","July","August","September","October","November","December"];function vi(e){const{year:t,month:i,day:a}=e;return`${a} ${gn[i]} ${t}`}function Fe(e){if(e<24)return`${Math.round(e)}h`;const t=Math.floor(e/24),i=Math.round(e%24);return i>0?`${t}d ${i}h`:`${t}d`}let ne=null,Le=null;function bn(e,t){if(t.key!=="Tab")return;const i=e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(!i.length)return;const a=i[0],n=i[i.length-1];t.shiftKey&&document.activeElement===a?(t.preventDefault(),n.focus()):!t.shiftKey&&document.activeElement===n&&(t.preventDefault(),a.focus())}function oe(){ne&&(ne.remove(),ne=null,document.removeEventListener("keydown",gi),Le&&Le.focus&&Le.focus())}function gi(e){e.key==="Escape"&&oe(),ne&&bn(ne,e)}function ct(e,{centered:t=!1,labelledBy:i,onMount:a}={}){oe(),Le=document.activeElement;const n=fi(`
    <div class="overlay" role="dialog" aria-modal="true" ${i?`aria-labelledby="${i}"`:""}>
      <div class="sheet${t?" modal-centered":""}">
        ${t?"":'<div class="sheet__handle"></div>'}
        ${e}
      </div>
    </div>
  `);n.addEventListener("click",o=>{o.target===n&&oe()}),document.body.appendChild(n),document.addEventListener("keydown",gi),ne=n;const s=n.querySelector(".sheet");return a&&a(s),s.querySelector("button, input, [tabindex]")?.focus(),s}function z({title:e,message:t,confirmLabel:i="Confirm",cancelLabel:a="Cancel",danger:n=!1}){return new Promise(s=>{let r=!1;const o=d=>{r||(r=!0,s(d),oe())};ct(`
      <h3 id="confirm-title">${l(e)}</h3>
      <p style="margin-top: var(--space-2);">${l(t)}</p>
      <div class="row" style="margin-top: var(--space-4);">
        <button class="btn btn--secondary" data-action="cancel" style="flex:1">${l(a)}</button>
        <button class="btn ${n?"btn--danger":"btn--primary"}" data-action="confirm" style="flex:1">${l(i)}</button>
      </div>
    `,{centered:!0,labelledBy:"confirm-title",onMount:d=>{d.querySelector('[data-action="confirm"]').addEventListener("click",()=>o(!0)),d.querySelector('[data-action="cancel"]').addEventListener("click",()=>o(!1))}})})}function yn(e){return new Promise(t=>{lt(e,t)})}async function lt(e,t){const i=await B.listSlots();e.innerHTML=`
    <div class="stack" style="padding: var(--space-5) var(--space-4); max-width: 520px; margin: 0 auto;">
      <div class="title-lockup">
        <h1>${l(se.gameTitle)}</h1>
        <p class="subtitle">${l(se.subtitle)}</p>
      </div>
      <div class="stack" id="slot-list"></div>
      <button class="btn btn--ghost btn--full" id="import-btn">Import Save File</button>
      <input type="file" id="import-input" accept="application/json" class="visually-hidden" />
    </div>
  `;const a=e.querySelector("#slot-list");i.forEach((n,s)=>{const r=document.createElement("div");if(r.className="card",n){const o=n.state;r.innerHTML=`
        <div class="row row--between">
          <div>
            <strong>${l(o.profile.orgName||"Unnamed Organization")}</strong>
            <div class="muted text-sm">${l(o.profile.explorerName)} · ${vi(o.date)} · ${b(o.finance.cash)}</div>
          </div>
        </div>
        <div class="row" style="margin-top: var(--space-3);">
          <button class="btn btn--primary" data-continue="${s}" style="flex:1">Continue</button>
          <button class="btn btn--secondary" data-newgame="${s}">New</button>
          <button class="btn btn--danger" data-delete="${s}">Delete</button>
        </div>
      `}else r.innerHTML=`
        <div class="row row--between">
          <span class="muted">Slot ${s+1} — Empty</span>
          <button class="btn btn--primary" data-newgame="${s}">Start New Game</button>
        </div>
      `;a.appendChild(r)}),a.addEventListener("click",async n=>{const s=n.target.closest("[data-continue]"),r=n.target.closest("[data-newgame]"),o=n.target.closest("[data-delete]");if(s){const d=Number(s.dataset.continue);try{const c=await B.loadSlot(d);v.setState(c),t()}catch(c){E(c.message)}}else if(r){const d=Number(r.dataset.newgame);wn(e,d,t)}else if(o){const d=Number(o.dataset.delete);await z({title:"Delete this save?",message:"This cannot be undone.",confirmLabel:"Delete",danger:!0})&&(await B.deleteSlot(d),lt(e,t))}}),e.querySelector("#import-btn").addEventListener("click",()=>e.querySelector("#import-input").click()),e.querySelector("#import-input").addEventListener("change",async n=>{const s=n.target.files[0];if(s)try{const r=await B.importSaveFromFile(s),o=i.findIndex(c=>!c);if(o===-1){const c=i[0]?.state;if(!await z({title:"All save slots are full",message:`Importing will overwrite "${c?.profile?.orgName||"Slot 1"}". This cannot be undone.`,confirmLabel:"Overwrite Slot 1",danger:!0}))return}const d=o===-1?0:o;await B.saveToSlot(d,r),v.setState(r),t()}catch(r){E(r.message)}})}function wn(e,t,i){const a={explorerName:"",orgName:"",difficulty:"adventurer",tutorialEnabled:!0,step:0};function n(){a.step===0?s():a.step===1?r():o()}function s(){e.innerHTML=`
      <div class="stack" style="padding: var(--space-5) var(--space-4); max-width: 480px; margin: 0 auto;">
        <span class="eyebrow">New Expedition</span>
        <h2>Who's leading this outfit?</h2>
        <div class="field">
          <label for="explorer-name">Explorer name</label>
          <input type="text" id="explorer-name" maxlength="30" placeholder="e.g. Mara Ashworth" value="${l(a.explorerName)}" />
        </div>
        <div class="field">
          <label for="org-name">Organization name</label>
          <input type="text" id="org-name" maxlength="40" placeholder="e.g. Ashworth Field Recovery" value="${l(a.orgName)}" />
        </div>
        <button class="btn btn--primary btn--full" id="next-btn">Continue</button>
        <button class="btn btn--ghost btn--full" id="back-btn">Back</button>
      </div>
    `,e.querySelector("#next-btn").addEventListener("click",()=>{const d=e.querySelector("#explorer-name").value.trim(),c=e.querySelector("#org-name").value.trim();if(!d){E("Enter an explorer name to continue.");return}a.explorerName=d,a.orgName=c,a.step=1,n()}),e.querySelector("#back-btn").addEventListener("click",()=>lt(e,i))}function r(){e.innerHTML=`
      <div class="stack" style="padding: var(--space-5) var(--space-4); max-width: 480px; margin: 0 auto;">
        <span class="eyebrow">New Expedition</span>
        <h2>Choose your difficulty</h2>
        <div class="stack" id="difficulty-list"></div>
        <div class="toggle-row">
          <label for="tutorial-toggle" style="margin:0;">Enable tutorial</label>
          <span class="switch">
            <input type="checkbox" id="tutorial-toggle" ${a.tutorialEnabled?"checked":""} />
            <span class="switch__track"></span>
          </span>
        </div>
        <button class="btn btn--primary btn--full" id="next-btn">Continue</button>
        <button class="btn btn--ghost btn--full" id="back-btn">Back</button>
      </div>
    `;const d=e.querySelector("#difficulty-list");Object.values(ee).forEach(c=>{const u=document.createElement("button");u.className="difficulty-option",u.setAttribute("aria-pressed",String(c.id===a.difficulty)),u.innerHTML=`<strong>${l(c.label)}</strong><div class="muted text-sm">${l(c.description)}</div>`,u.addEventListener("click",()=>{a.difficulty=c.id,d.querySelectorAll(".difficulty-option").forEach(f=>f.setAttribute("aria-pressed","false")),u.setAttribute("aria-pressed","true")}),d.appendChild(u)}),e.querySelector("#tutorial-toggle").addEventListener("change",c=>{a.tutorialEnabled=c.target.checked}),e.querySelector("#next-btn").addEventListener("click",()=>{a.step=2,n()}),e.querySelector("#back-btn").addEventListener("click",()=>{a.step=0,n()})}function o(){e.innerHTML=`
      <div class="stack" style="padding: var(--space-5) var(--space-4); max-width: 520px; margin: 0 auto;">
        <span class="eyebrow">Prologue</span>
        <h2>The Storage Unit</h2>
        <p class="premise-text">You paid $340 sight-unseen for the contents of a retired explorer's storage unit, mostly hoping for tools you could resell.</p>
        <p class="premise-text">Instead you found a water-damaged field journal, a hand-drawn map with the destination smudged away, and a folder of newspaper clippings about a Continental Survey Corps expedition that vanished in the Black Mesa Desert in 1891 — and was never found.</p>
        <p class="premise-text">Everyone else gave up on it. You have a truck, a shovel, and nothing better to do.</p>
        <button class="btn btn--primary btn--full" id="start-btn">Begin</button>
        <button class="btn btn--ghost btn--full" id="back-btn">Back</button>
      </div>
    `,e.querySelector("#start-btn").addEventListener("click",async()=>{const d=an(a);try{await B.saveToSlot(t,d)}catch{E("Could not save your new game — check available storage and try again.");return}v.setState(d),i()}),e.querySelector("#back-btn").addEventListener("click",()=>{a.step=1,n()})}n()}function Ce({label:e,value:t,accent:i=!1}){return`
    <div class="stat-card">
      <span class="stat-card__label">${l(e)}</span>
      <span class="stat-card__value${i?" stat-card__value--accent":""}">${t}</span>
    </div>
  `}function kn(){return`
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Your garage headquarters at dusk">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#182338" />
          <stop offset="100%" stop-color="#0b1220" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#sky)" />
      <rect x="0" y="170" width="400" height="50" fill="#141c2c" />
      <rect x="60" y="90" width="220" height="90" fill="#22304a" stroke="#3a4a6b" stroke-width="2" />
      <polygon points="55,90 170,45 285,90" fill="#1b2740" stroke="#3a4a6b" stroke-width="2" />
      <rect x="90" y="120" width="60" height="60" fill="#101828" stroke="#c9a15a" stroke-width="2" />
      <circle class="pulse-anim" cx="120" cy="105" r="4" fill="#e3c785" />
      <rect x="190" y="125" width="70" height="55" fill="#141c2c" stroke="#3a4a6b" stroke-width="1.5" />
      <rect x="200" y="140" width="16" height="16" fill="#c9a15a" opacity="0.5" />
      <rect x="225" y="140" width="16" height="16" fill="#c9a15a" opacity="0.5" />
      <!-- truck silhouette -->
      <g transform="translate(300,150)">
        <rect x="0" y="10" width="60" height="20" rx="3" fill="#2b2e36" />
        <rect x="8" y="-4" width="26" height="16" rx="2" fill="#2b2e36" />
        <circle cx="14" cy="32" r="7" fill="#0b1220" stroke="#8b93a5" />
        <circle cx="48" cy="32" r="7" fill="#0b1220" stroke="#8b93a5" />
      </g>
    </svg>
  `}function En(e){return{info:"ℹ",success:"✓",warning:"⚠",expedition:"➤",milestone:"★",achievement:"★"}[e]||"•"}function Sn(e){const t=v.getState(),i=t.reputation,a=Math.round((i.publicFame+i.academicCredibility+i.fieldReputation)/3),n=[...t.leads.available,...t.leads.active].slice(-1)[0],s=t.artifacts.slice(-1)[0];e.innerHTML=`
    <div class="hq-hero">
      ${kn()}
      <div class="hq-hero__caption">
        <span class="eyebrow">${l(t.organization.tierName)}</span>
        <h1>${l(t.profile.orgName)}</h1>
        <p class="text-sm">${l(t.player.name)} · ${vi(t.date)}</p>
      </div>
    </div>

    <div class="grid-2">
      ${Ce({label:"Cash",value:b(t.finance.cash),accent:!0})}
      ${Ce({label:"Overall Reputation",value:a})}
      ${Ce({label:"Research Points",value:t.researchPoints})}
      ${Ce({label:"Prestige",value:t.organization.prestige})}
    </div>

    <div class="card objective-card" id="objective-card">
      <span class="eyebrow">Current Objective</span>
      <h3>${l(t.objectives.main?.label||"Explore your options")}</h3>
      ${t.objectives.optional.length?`
        <ul class="stack text-sm muted" style="margin: var(--space-2) 0 0; padding-left: 18px;">
          ${t.objectives.optional.map(r=>`<li>${l(r.label)}</li>`).join("")}
        </ul>
      `:""}
    </div>

    ${t.activeExpedition?`
      <div class="card" style="border-color: var(--border-strong);">
        <span class="eyebrow">Active Expedition</span>
        <p>Underway — check in to continue making decisions in the field.</p>
        <button class="btn btn--primary btn--full" id="resume-expedition-btn" style="margin-top: var(--space-3);">Resume Expedition</button>
      </div>
    `:""}

    <div class="grid-2-tablet stack">
      ${n?`
        <div class="card card--interactive" id="recent-lead-card">
          <span class="eyebrow">Recent Lead</span>
          <h3>${l(n.title)}</h3>
          <p class="text-sm">${l(n.potentialDescription)}</p>
        </div>
      `:""}
      ${s?`
        <div class="card card--interactive" id="recent-artifact-card">
          <span class="eyebrow">Recent Find</span>
          <h3>${l(s.name)}</h3>
          <p class="text-sm">${l(s.condition)} condition · ${l(s.rarity)}</p>
        </div>
      `:""}
    </div>

    <div class="stack">
      <div class="row row--between">
        <h2>Alerts</h2>
      </div>
      ${t.alerts.length?`
        <div class="alert-list">
          ${t.alerts.slice(0,4).map(r=>`
            <div class="alert-item">
              <span class="alert-item__icon">${En(r.type)}</span>
              <div>
                <strong class="text-sm">${l(r.title)}</strong>
                <p class="text-sm">${l(r.message)}</p>
              </div>
            </div>
          `).join("")}
        </div>
      `:'<p class="empty-state">No alerts yet — go find something.</p>'}
    </div>
  `,e.querySelector("#resume-expedition-btn")?.addEventListener("click",()=>w("live-expedition")),re(e,"#recent-lead-card",()=>w("leads",n.instanceId)),re(e,"#recent-artifact-card",()=>w("artifact-detail",s.id))}function je({value:e,max:t=1,variant:i=""}){const a=Math.max(0,Math.min(100,e/t*100));return`
    <div class="progress" role="progressbar" aria-valuenow="${Math.round(a)}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress__fill${i?` progress__fill--${i}`:""}" style="width:${a}%"></div>
    </div>
  `}function xn(e,t){return`
    <div class="card card--interactive" data-lead="${e.instanceId}">
      <div class="row row--between">
        <span class="eyebrow">${l(e.category.replace(/-/g," "))}</span>
        <span class="badge reliability-tag">${l(e.sourceReliability)}</span>
      </div>
      <h3>${l(e.title)}</h3>
      <p class="text-sm">${l(e.potentialDescription)}</p>
      <div style="margin-top: var(--space-2);">
        ${je({value:t,max:1})}
        <span class="text-sm muted">Overall confidence: ${V(t)}</span>
      </div>
    </div>
  `}function $n(e,t){const i=[{title:"Active Investigations",leads:t.leads.active},{title:"Available Leads",leads:t.leads.available},{title:"Archived",leads:t.leads.archived}].filter(r=>r.leads.length),a=t.contracts.filter(r=>r.status==="active"),n=t.contracts.filter(r=>r.status==="completed"),s=Ia(t);e.innerHTML=`
    <h1>Leads</h1>
    ${i.length?i.map(r=>`
      <div class="stack">
        <h2>${r.title}</h2>
        <div class="stack">${r.leads.map(o=>xn(o,di(o))).join("")}</div>
      </div>
    `).join(""):'<p class="empty-state">No leads yet. Check back after your next expedition.</p>'}

    <div class="stack">
      <h2>Contracts</h2>
      ${a.length?`
        <div class="stack">
          ${a.map(r=>{const o=_e(r.templateId);return`<div class="card"><div class="row row--between"><strong>${l(o.title)}</strong><span class="badge badge--brass">Active</span></div><p class="text-sm muted">${l(o.client)} — ${l(o.description)}</p></div>`}).join("")}
        </div>
      `:""}
      ${n.length?`
        <div class="stack">
          ${n.map(r=>{const o=_e(r.templateId);return`<div class="card"><div class="row row--between"><strong>${l(o.title)}</strong><span class="badge badge--success">Fulfilled</span></div></div>`}).join("")}
        </div>
      `:""}
      ${s.length?`
        <div class="stack">
          ${s.map(r=>`
            <div class="card">
              <div class="row row--between">
                <strong>${l(r.title)}</strong>
                <span class="badge">${l(r.client)}</span>
              </div>
              <p class="text-sm muted">${l(r.description)}</p>
              <div class="row row--between" style="margin-top:var(--space-2);">
                <span class="text-sm muted">Reward: ${b(r.reward.cash)}</span>
                <button class="btn btn--secondary btn--sm" data-accept-contract="${r.id}">Accept</button>
              </div>
            </div>
          `).join("")}
        </div>
      `:""}
      ${!a.length&&!n.length&&!s.length?'<p class="empty-state">No contracts right now.</p>':""}
    </div>
  `,re(e,"[data-lead]",r=>w("leads",r.dataset.lead)),e.querySelectorAll("[data-accept-contract]").forEach(r=>{r.addEventListener("click",()=>{try{v.dispatch("ACCEPT_CONTRACT",{contractId:r.dataset.acceptContract}),S("Contract accepted.")}catch(o){E(o.message)}})})}function Ge(e,t){return`
    <div class="confidence-row">
      <div class="confidence-row__label"><span>${l(e)}</span><span>${V(t)}</span></div>
      ${je({value:t,max:1})}
    </div>
  `}function In(e,t,i){const a=ee[t.profile.difficulty],n=t.sites.find(r=>r.instanceId===i.siteId),s=i.confidence;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; All Leads</button>
    <div class="stack">
      <span class="eyebrow">${l(i.category.replace(/-/g," "))} · ${l(n?.regionId?.replace(/-/g," ")||"")}</span>
      <h1>${l(i.title)}</h1>
      <p>${l(i.potentialDescription)}</p>
      <p class="text-sm muted">Source: ${l(i.source)}</p>
    </div>

    <div class="card stack">
      <h3>Confidence</h3>
      ${Ge("Site location",s.siteLocation)}
      ${Ge("Historical",s.historical)}
      ${Ge("Legal",s.legal)}
    </div>

    <div class="card stack">
      <h3>Known Risks</h3>
      <div class="row row--wrap">
        ${i.knownRisks.map(r=>`<span class="badge badge--warning">${l(r)}</span>`).join("")}
        ${i.discoveredHazards.map(r=>`<span class="badge badge--danger">${l(r)}</span>`).join("")}
      </div>
    </div>

    ${(i.rivalInterest||0)>0?`
      <div class="card stack">
        <h3>Rival Activity</h3>
        <div class="row row--between">
          <span class="text-sm muted">Interest level</span>
          <span class="badge ${i.rivalInterest>=.75?"badge--danger":i.rivalInterest>=.5?"badge--warning":""}">${va(i.rivalInterest)}</span>
        </div>
        ${i.rivalDisturbed?`<p class="text-sm" style="color:var(--danger);">${l(Ze.find(r=>r.id===i.rivalId)?.name||"A rival")} has already been through this site — expect a weaker haul.</p>`:'<p class="text-sm muted">The longer this sits unresolved, the more likely someone else notices it too.</p>'}
      </div>
    `:""}

    <div class="stack">
      <h2>Research</h2>
      <div class="stack" id="research-list">
        ${Ot.map(r=>{const o=Math.round(r.cost*a.researchCostMultiplier),d=t.finance.cash>=o;return`
            <div class="card">
              <div class="row row--between">
                <div>
                  <strong>${l(r.label)}</strong>
                  <p class="text-sm">${l(r.description)}</p>
                </div>
              </div>
              <div class="row row--between" style="margin-top: var(--space-2);">
                <span class="text-sm muted">${b(o)} · ${Fe(r.timeHours)}</span>
                <button class="btn btn--secondary btn--sm" data-research="${r.id}" ${d?"":"disabled"}>Research</button>
              </div>
            </div>
          `}).join("")}
      </div>
      ${i.researchLog.length?`
        <h3>Field Notes</h3>
        <div class="stack">
          ${[...i.researchLog].reverse().map(r=>`
            <div class="card">
              <strong class="text-sm">${l(r.label)}</strong>
              <div class="text-sm muted">${r.deltaLines.map(l).join(" · ")}</div>
              ${r.hazardRevealed?`<div class="text-sm" style="color:var(--warning)">New hazard identified: ${l(r.hazardRevealed)}</div>`:""}
            </div>
          `).join("")}
        </div>
      `:""}
    </div>

    <button class="btn btn--secondary btn--full" id="evidence-btn">Open Evidence Board</button>
    <button class="btn btn--primary btn--full" id="plan-btn" ${t.activeExpedition?"disabled":""}>
      ${t.activeExpedition?"Expedition Already Underway":"Plan Expedition"}
    </button>
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("leads")),e.querySelector("#evidence-btn").addEventListener("click",()=>w("evidence",i.instanceId)),e.querySelector("#plan-btn").addEventListener("click",()=>{t.activeExpedition||w("planning",i.instanceId)}),e.querySelectorAll("[data-research]").forEach(r=>{r.addEventListener("click",()=>{try{v.dispatch("RESEARCH_LEAD",{leadInstanceId:i.instanceId,actionId:r.dataset.research}),S("Research complete — check your field notes.")}catch(o){E(o.message)}})})}function Cn(e,t){return e.leads.available.find(i=>i.instanceId===t)||e.leads.active.find(i=>i.instanceId===t)||e.leads.archived.find(i=>i.instanceId===t)}function Rn(e,t){const i=v.getState();if(t){const a=Cn(i,t);if(a){In(e,i,a);return}}$n(e,i)}function An(e,t){return e.leads.available.find(i=>i.instanceId===t)||e.leads.active.find(i=>i.instanceId===t)||e.leads.archived.find(i=>i.instanceId===t)}function Tn(e,t){const i=v.getState(),a=An(i,t);if(!a){e.innerHTML='<p class="empty-state">Lead not found.</p>';return}const n=Fi(a);e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; ${l(a.title)}</button>
    <h1>Evidence Board</h1>
    <p class="muted">Everything you've uncovered so far, gathered in one place.</p>
    <div class="evidence-grid">
      ${n.length?n.map(s=>`
        <div class="card evidence-card">
          <span class="evidence-card__category">${l(s.category.replace(/-/g," "))}</span>
          <h3>${l(s.title)}</h3>
          <p class="text-sm">${l(s.text)}</p>
        </div>
      `).join(""):'<p class="empty-state">No evidence uncovered yet — try researching this lead.</p>'}
    </div>

    <div class="card stack">
      <h2>Draw a Conclusion</h2>
      <p class="text-sm muted">Where was the site most likely located? Choose carefully — evidence supports one answer better than the others, but nothing here is certain.</p>
      <div class="stack" id="conclusion-options">
        ${a.conclusionOptions.map(s=>`
          <button class="conclusion-option" data-conclusion="${s.id}" aria-pressed="${a.conclusionChosenId===s.id}" ${a.conclusionChosenId?"disabled":""}>
            <strong>${l(s.label)}</strong>
            <div class="text-sm muted">${l(s.description)}</div>
          </button>
        `).join("")}
      </div>
      ${a.conclusionChosenId?`<p class="text-sm" style="color:var(--accent);">Conclusion locked in — this will shape your expedition's risk profile.</p>`:""}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("leads",a.instanceId)),e.querySelectorAll("[data-conclusion]").forEach(s=>{s.addEventListener("click",()=>{if(!a.conclusionChosenId)try{v.dispatch("CHOOSE_LEAD_CONCLUSION",{leadInstanceId:a.instanceId,conclusionId:s.dataset.conclusion}),S("Conclusion recorded.")}catch(r){E(r.message)}})})}function Mn(e,t){return e.leads.available.find(i=>i.instanceId===t)||e.leads.active.find(i=>i.instanceId===t)}function St(e,t){const i=[...t.leads.active,...t.leads.available];e.innerHTML=`
    <h1>Expeditions</h1>
    ${i.length?`
      <div class="stack">
        <h2>Ready to Plan</h2>
        <div class="stack">
          ${i.map(a=>`
            <div class="card card--interactive" data-lead="${a.instanceId}">
              <strong>${l(a.title)}</strong>
              <p class="text-sm muted">${l(a.potentialDescription)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `:'<p class="empty-state">No leads are ready for an expedition yet. Investigate one from the Leads tab first.</p>'}

    ${t.expeditionHistory.length?`
      <div class="stack">
        <h2>Expedition History</h2>
        <div class="stack">
          ${[...t.expeditionHistory].reverse().slice(0,6).map(a=>`
            <div class="card">
              <div class="row row--between">
                <strong>${l(a.leadTitle)}</strong>
                <span class="badge ${a.success?"badge--success":"badge--danger"}">${a.success?"Success":"Unsuccessful"}</span>
              </div>
              <p class="text-sm muted">${l(a.siteName)} · Net ${b(a.financials.estimatedNetValue)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `:""}
  `,re(e,"[data-lead]",a=>w("planning",a.dataset.lead))}function Ln(e,t,i){const a=t.sites.find(d=>d.instanceId===i.siteId),n=ee[t.profile.difficulty],s={approachId:"standard",equipmentInstanceIds:t.equipment.map(d=>d.instanceId),crewInstanceIds:[],supplies:pi(60,1),vehicleInstanceId:t.vehicles[0].instanceId,budgetReserve:500};function r(){const d=t.equipment.filter(f=>s.equipmentInstanceIds.includes(f.instanceId)),c=t.staff.filter(f=>s.crewInstanceIds.includes(f.instanceId)),u=t.vehicles.find(f=>f.instanceId===s.vehicleInstanceId)||t.vehicles[0];return hi({lead:i,site:a,equipmentInstances:d,vehicle:u,supplies:s.supplies,approachId:s.approachId,leaderSkill:(t.player.skill.leadership+t.player.skill.survival)/2,riskMultiplier:n.riskMultiplier,crewInstances:c})}function o(){const d=r();JSON.stringify(s.supplies)!==JSON.stringify(d.recommendedSupplies)&&!o._suppliesTouched&&(s.supplies=d.recommendedSupplies),e.innerHTML=`
      <button class="btn btn--ghost" id="back-btn">&larr; Expeditions</button>
      <h1>Plan: ${l(i.title)}</h1>
      <p class="muted">${l(a.name)} · ${l(a.terrain)}</p>

      <div class="stack">
        <h2>Approach</h2>
        <div class="stack">
          ${Object.values(Ke).map(c=>`
            <button class="approach-option" data-approach="${c.id}" aria-pressed="${s.approachId===c.id}">
              <strong>${l(c.label)}</strong>
              <div class="text-sm muted">${l(c.description)}</div>
            </button>
          `).join("")}
        </div>
      </div>

      ${t.vehicles.length>1?`
        <div class="stack">
          <h2>Vehicle</h2>
          <div class="stack">
            ${t.vehicles.map(c=>{const u=fe(c.templateId);return`
                <button class="approach-option" data-vehicle="${c.instanceId}" aria-pressed="${s.vehicleInstanceId===c.instanceId}">
                  <strong>${l(u.name)}</strong>
                  <div class="text-sm muted">${l(u.description)}</div>
                </button>
              `}).join("")}
          </div>
        </div>
      `:""}
      ${d.vehicleEnvironmentMatch?"":`<p class="text-sm" style="color:var(--warning);">Your vehicle isn't built for ${l(a.environment)} terrain — reliability suffers badly until you bring something better suited.</p>`}

      ${t.staff.length?`
        <div class="stack">
          <h2>Crew</h2>
          <div class="card">
            ${t.staff.map(c=>{const u=me(c.roleId),f=s.crewInstanceIds.includes(c.instanceId);return`
                <label class="equipment-pick">
                  <input type="checkbox" data-crew="${c.instanceId}" ${f?"checked":""} />
                  <span class="spacer">${l(c.name)} <span class="muted">· ${l(u?.label||c.roleId)}</span></span>
                  <span class="badge">${b(c.salary)}/day</span>
                </label>
              `}).join("")}
          </div>
        </div>
      `:""}

      <div class="stack">
        <h2>Equipment</h2>
        <div class="card">
          ${t.equipment.map(c=>{const u=G(c.templateId),f=s.equipmentInstanceIds.includes(c.instanceId),m=u.environments.includes(a.environment);return`
              <label class="equipment-pick">
                <input type="checkbox" data-equipment="${c.instanceId}" ${f?"checked":""} />
                <span class="spacer">${l(u.name)}</span>
                <span class="badge ${m?"badge--brass":""}">${_t(c.condition)}</span>
              </label>
            `}).join("")}
        </div>
      </div>

      <div class="stack">
        <h2>Supplies</h2>
        <div class="card stack">
          ${Object.entries(s.supplies).map(([c,u])=>{const f=d.recommendedSupplies[c],m=f?u/f:1;return`
              <div class="supply-row">
                <div>
                  <label style="margin:0; text-transform:capitalize;">${l(c)}</label>
                  <div class="text-sm muted">Recommended: ${f} · ${b(qe[c])}/unit</div>
                </div>
                <input type="number" min="0" data-supply="${c}" value="${u}" />
              </div>
              ${m<.7?'<div class="supply-warning supply-warning--high">Shortage risk: High</div>':m<1?'<div class="supply-warning">Shortage risk: Moderate</div>':""}
            `}).join("")}
        </div>
      </div>

      <div class="card estimate-panel">
        ${["Success Chance","Risk Rating","Discovery Quality","Estimated Cost"].map((c,u)=>{const f=[V(d.successChance),V(d.riskRating),V(d.discoveryQuality),b(d.estimatedCost)];return`<div class="stat-card"><span class="stat-card__label">${c}</span><span class="stat-card__value">${f[u]}</span></div>`}).join("")}
      </div>
      <p class="text-sm muted">Estimated duration: ${Fe(d.estimatedDurationHours)}</p>

      <button class="btn btn--primary btn--full" id="launch-btn" ${t.activeExpedition?"disabled":""}>Launch Expedition</button>
    `,e.querySelector("#back-btn").addEventListener("click",()=>w("expeditions")),e.querySelectorAll("[data-approach]").forEach(c=>{c.addEventListener("click",()=>{s.approachId=c.dataset.approach,o()})}),e.querySelectorAll("[data-vehicle]").forEach(c=>{c.addEventListener("click",()=>{s.vehicleInstanceId=c.dataset.vehicle,o()})}),e.querySelectorAll("[data-crew]").forEach(c=>{c.addEventListener("change",()=>{const u=c.dataset.crew;c.checked?s.crewInstanceIds.push(u):s.crewInstanceIds=s.crewInstanceIds.filter(f=>f!==u),o()})}),e.querySelectorAll("[data-equipment]").forEach(c=>{c.addEventListener("change",()=>{const u=c.dataset.equipment;c.checked?s.equipmentInstanceIds.push(u):s.equipmentInstanceIds=s.equipmentInstanceIds.filter(f=>f!==u),o()})}),e.querySelectorAll("[data-supply]").forEach(c=>{c.addEventListener("input",()=>{o._suppliesTouched=!0,s.supplies[c.dataset.supply]=Number(c.value)||0,o()})}),e.querySelector("#launch-btn").addEventListener("click",()=>{try{v.dispatch("LAUNCH_EXPEDITION",{leadInstanceId:i.instanceId,plan:{...s}}),P("vehicleDeparture"),w("live-expedition")}catch(c){E(c.message)}})}o()}function xt(e,t){const i=v.getState();if(i.activeExpedition){w("live-expedition");return}if(!t){St(e,i);return}const a=Mn(i,t);if(!a){St(e,i);return}Ln(e,i,a)}const $t={travel:"Travel",survey:"Survey",excavation:"Excavation",discovery:"Discovery",extraction:"Extraction"},bi={travel:"On the road toward the site.",survey:"Narrowing down the search area.",excavation:"Working to access the site.",discovery:"Uncovering whatever is down there.",extraction:"Getting everything safely back to the truck."},qn=130;function Dn(e,t){const i=t==="desert"?"#d97a3f":"#3f8a86";return`
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${l(bi[e])}">
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${i}" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#0b1220" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#scene-sky)" />
      <ellipse cx="200" cy="205" rx="220" ry="30" fill="#3a2a18" />
      <path d="M0 190 Q100 170 200 188 T400 180 V220 H0 Z" fill="#4a3520" />
      <path d="M0 200 Q120 185 220 198 T400 195 V220 H0 Z" fill="#5c4126" />
      ${e==="travel"?'<g transform="translate(60,150)"><rect x="0" y="8" width="46" height="16" rx="3" fill="#2b2e36"/><rect x="6" y="-4" width="20" height="14" rx="2" fill="#2b2e36"/><circle cx="10" cy="26" r="6" fill="#0b1220"/><circle cx="36" cy="26" r="6" fill="#0b1220"/></g>':""}
      ${e==="survey"?'<circle cx="220" cy="160" r="26" fill="none" stroke="#e3c785" stroke-width="2" opacity="0.6" class="pulse-anim"/>':""}
      ${e==="excavation"?'<path d="M180 195 q20 -30 60 0" fill="none" stroke="#c9a15a" stroke-width="3"/>':""}
      ${e==="discovery"?'<circle cx="210" cy="185" r="14" fill="#e3c785" opacity="0.85" class="pulse-anim"/>':""}
      ${e==="extraction"?'<g transform="translate(260,148)"><rect x="0" y="10" width="46" height="18" rx="3" fill="#2b2e36"/><circle cx="10" cy="30" r="6" fill="#0b1220"/><circle cx="36" cy="30" r="6" fill="#0b1220"/></g>':""}
    </svg>
  `}let It=0;function Nn(e){Ie(!0);const t=++It,i=v.getState();if(!i.activeExpedition){e.innerHTML='<p class="empty-state">No active expedition.</p><button class="btn btn--primary btn--full" id="go">Plan an Expedition</button>',e.querySelector("#go").addEventListener("click",()=>w("expeditions"));return}const a=i.settings.defaultExpeditionSpeed||1,n={speed:a,rafId:null,accumulatedMs:0,lastTs:null,paused:a===0};function s(){return t!==It}function r(){n.rafId&&cancelAnimationFrame(n.rafId),n.rafId=null}function o(){if(s())return;const p=v.getState().activeExpedition;if(!p)return;n.accumulatedMs=0,n.lastTs=null;const h=p.phases[p.currentPhaseIndex],y=v.getState().sites.find(k=>k.instanceId===p.siteInstanceId);if(d(p,h,y),h.pendingEvent){c(h.pendingEvent);return}if(h.eventResolved===null){const{event:k}=v.dispatch("CHECK_PHASE_EVENT",{});if(k){c(k);return}}u(h)}function d(p,h,y){const k=p.currentPhaseIndex;e.innerHTML=`
      <div class="expedition-scene">${Dn(h.phase,y.environment)}</div>
      <div class="phase-track" aria-hidden="true">
        ${Xe.map(($,x)=>`<div class="phase-pip ${x<k?"phase-pip--done":x===k?"phase-pip--active":""}"></div>`).join("")}
      </div>
      <div class="row row--between">
        <div>
          <span class="eyebrow">Phase ${k+1} of ${Xe.length}</span>
          <h2>${$t[h.phase]}</h2>
        </div>
        <div class="speed-controls" role="group" aria-label="Playback speed">
          <button class="btn btn--secondary btn--sm speed-btn" data-speed="0" aria-pressed="${n.speed===0}" aria-label="Pause">⏸</button>
          <button class="btn btn--secondary btn--sm speed-btn" data-speed="1" aria-pressed="${n.speed===1}">1x</button>
          <button class="btn btn--secondary btn--sm speed-btn" data-speed="2" aria-pressed="${n.speed===2}">2x</button>
          <button class="btn btn--secondary btn--sm speed-btn" data-speed="4" aria-pressed="${n.speed===4}">4x</button>
        </div>
      </div>
      <p class="text-sm muted">${bi[h.phase]}</p>
      <div class="progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" id="phase-progress">
        <div class="progress__fill" id="phase-progress-fill" style="width:0%"></div>
      </div>
      <div id="event-slot"></div>
      <div class="sr-live" aria-live="polite" id="sr-status"></div>
    `,e.querySelectorAll(".speed-btn").forEach($=>{$.addEventListener("click",()=>{const x=Number($.dataset.speed);n.speed=x,n.paused=x===0,e.querySelectorAll(".speed-btn").forEach(L=>L.setAttribute("aria-pressed",String(L===$)))})})}function c(p){const h=e.querySelector("#event-slot");if(!h)return;h.innerHTML=`
      <div class="card event-card">
        <span class="eyebrow">Field Decision</span>
        <h3>${l(p.title)}</h3>
        <p class="text-sm">${l(p.description)}</p>
        <div class="stack">
          ${p.choices.map(k=>`
            <button class="event-choice" data-choice="${k.id}">
              <strong>${l(k.label)}</strong>
              <div class="text-sm muted">${l(k.description)}</div>
            </button>
          `).join("")}
        </div>
      </div>
    `;const y=e.querySelector("#sr-status");y&&(y.textContent=`Field decision needed: ${p.title}. ${p.description}`),h.querySelector("[data-choice]")?.focus(),h.querySelectorAll("[data-choice]").forEach(k=>{k.addEventListener("click",()=>{const{choice:$}=v.dispatch("RESOLVE_EXPEDITION_EVENT",{choiceId:k.dataset.choice});S(`${$.label} — logged.`),h.innerHTML="";const x=v.getState().activeExpedition;u(x.phases[x.currentPhaseIndex])})})}function u(p){const h=qn*1e3*Bt[p.phase],y=e.querySelector("#phase-progress-fill"),k=e.querySelector("#phase-progress"),$=e.querySelector("#sr-status");function x(L){if(s())return;n.lastTs===null&&(n.lastTs=L);const I=L-n.lastTs;n.lastTs=L,n.paused||(n.accumulatedMs+=I*n.speed);const C=Math.min(100,n.accumulatedMs/h*100);if(y&&(y.style.width=`${C}%`),k&&k.setAttribute("aria-valuenow",String(Math.round(C))),C>=100){r(),f();return}n.rafId=requestAnimationFrame(x)}$&&($.textContent=`${$t[p.phase]} underway.`),n.rafId=requestAnimationFrame(x)}function f(){if(s())return;const{hasNext:p}=v.dispatch("ADVANCE_EXPEDITION_PHASE",{});if(p)P("select"),o();else{const{outcome:h}=v.dispatch("COMPLETE_EXPEDITION",{});r(),h.success&&h.artifacts.length?m(h.artifacts,0):(P(h.success?"success":"error"),Ie(!1),w("expedition-results"))}}function m(p,h){const y=p[h];P("discoveryReveal");const k=v.getState().settings.reducedMotion;e.innerHTML=`
      <div class="reveal-stage">
        <span class="eyebrow">Discovery ${h+1} of ${p.length}</span>
        <div class="reveal-silhouette ${k?"":"reveal-silhouette-anim"}">
          <svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" rx="10" fill="#0b1220" stroke="var(--accent)" stroke-width="2"/></svg>
        </div>
        <div id="reveal-details" class="stack"></div>
        <div class="sr-live" aria-live="polite" id="reveal-sr-status"></div>
        <button class="btn btn--primary btn--full" id="reveal-continue">Continue</button>
      </div>
    `;const $=e.querySelector("#reveal-details"),x=e.querySelector("#reveal-sr-status");x.textContent=`Discovery ${h+1} of ${p.length}. Clearing debris...`;const L=()=>{$.innerHTML=`
        <h2 class="${k?"":"reveal-detail-anim"}">${l(y.name)}</h2>
        <p class="text-sm ${k?"":"reveal-detail-anim"}">${l(y.material)} · ${l(y.era)} · ${l(y.condition)} condition</p>
      `,x.textContent=`${y.name}. ${y.material}, ${y.era}, ${y.condition} condition.`},I=()=>{Z.indexOf(y.rarity),$.innerHTML+=`
        <div class="row ${k?"":"reveal-rarity-anim"}" style="justify-content:center;">
          <span class="rarity-dot rarity-dot--${y.rarity}"></span>
          <span class="badge badge--brass">${l(y.rarity)}</span>
        </div>
        <p class="text-sm muted">Estimated value: $${y.estimatedValueRange[0].toLocaleString()}–$${y.estimatedValueRange[1].toLocaleString()}</p>
      `,x.textContent=`Rarity: ${y.rarity}. Estimated value: $${y.estimatedValueRange[0].toLocaleString()} to $${y.estimatedValueRange[1].toLocaleString()}.`};k?(L(),I()):(setTimeout(L,500),setTimeout(I,1100)),e.querySelector("#reveal-continue").addEventListener("click",()=>{h+1<p.length?m(p,h+1):(Ie(!1),w("expedition-results"))})}return o(),()=>{r(),Ie(!1)}}function _n(e){const t=v.getState(),i=t.expeditionHistory[t.expeditionHistory.length-1];if(!i){e.innerHTML='<p class="empty-state">No recent expedition results.</p><button class="btn btn--primary btn--full" id="go">Go to Headquarters</button>',e.querySelector("#go").addEventListener("click",()=>w("headquarters"));return}const a=t.artifacts.filter(n=>i.artifactIds.includes(n.id));e.innerHTML=`
    <div class="stack" style="text-align:center;">
      <span class="eyebrow">${i.success?"Success":"Unsuccessful"}</span>
      <h1>${l(i.leadTitle)}</h1>
      <p class="muted">${l(i.siteName)}</p>
    </div>

    ${i.success?`
      <div class="card">
        <h3>Recovered</h3>
        <div class="stack">
          ${a.map(n=>`
            <div class="row row--between">
              <div>
                <strong>${l(n.name)}</strong>
                <div class="text-sm muted">${l(n.rarity)} · ${l(n.condition)}</div>
              </div>
              <span class="badge badge--brass">$${n.estimatedValueRange[0].toLocaleString()}–$${n.estimatedValueRange[1].toLocaleString()}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `:`
      <div class="card" style="border-color: rgba(193,72,63,0.4);">
        <h3>What Happened</h3>
        <p>${l(i.failureReason)}</p>
        <p class="text-sm muted">Final risk was assessed at ${V(i.finalRisk)}. Better research, equipment, or supplies next time can bring that down.</p>
      </div>
    `}

    <div class="card">
      <h3>Expedition Financials</h3>
      <div class="stack" style="gap:0;">
        ${i.financials.lines.map(n=>`
          <div class="financial-line ${n.isEstimate?"financial-line--estimate":n.amount<0?"financial-line--negative":n.amount>0?"financial-line--positive":""}">
            <span>${l(n.label)}</span>
            <span>${n.isEstimate?b(n.amount):Et(n.amount)}</span>
          </div>
        `).join("")}
        <div class="financial-line financial-line--total">
          <span>Cash change</span>
          <span>${Et(i.financials.actualCashDelta)}</span>
        </div>
        ${i.financials.estimatedArtifactsValue?`
          <div class="financial-line text-sm muted">
            <span>Estimated net value (artifacts not yet sold)</span>
            <span>${b(i.financials.estimatedNetValue)}</span>
          </div>
        `:""}
      </div>
    </div>

    <button class="btn btn--primary btn--full" id="continue-btn">Continue</button>
  `,e.querySelector("#continue-btn").addEventListener("click",()=>{w(i.success?"collection":"headquarters")})}function Re(e){const t=e.disposition!=="none"?`<span class="badge">${l(e.disposition)}</span>`:e.authenticationStatus==="unidentified"?'<span class="badge badge--warning">Unidentified</span>':`<span class="badge badge--brass">${l(e.authenticationOutcome||"Inspected")}</span>`;return`
    <div class="card artifact-tile card--interactive" data-artifact="${e.id}">
      <div class="artifact-tile__thumb"><span class="rarity-dot rarity-dot--${e.rarity}"></span></div>
      <strong class="text-sm">${l(e.name)}</strong>
      <span class="text-sm muted">${l(e.rarity)}</span>
      ${t}
    </div>
  `}function Pn(e){const t=v.getState(),i=t.artifacts.filter(r=>r.disposition==="none"),a=t.artifacts.filter(r=>r.disposition==="stored"||r.disposition==="displayed"),n=t.artifacts.filter(r=>r.disposition==="sold"),s=t.artifacts.filter(r=>r.disposition==="donated");e.innerHTML=`
    <h1>Collection</h1>
    ${t.artifacts.length===0?'<p class="empty-state">Nothing recovered yet. Launch an expedition to start your collection.</p>':""}

    ${i.length?`
      <div class="stack">
        <h2>Needs Attention</h2>
        <div class="artifact-grid">${i.map(Re).join("")}</div>
      </div>
    `:""}

    ${a.length?`
      <div class="stack">
        <h2>Your Collection</h2>
        <div class="artifact-grid">${a.map(Re).join("")}</div>
      </div>
    `:""}

    ${n.length?`
      <div class="stack">
        <h2>Sold</h2>
        <div class="artifact-grid">${n.map(Re).join("")}</div>
      </div>
    `:""}

    ${s.length?`
      <div class="stack">
        <h2>Donated</h2>
        <div class="artifact-grid">${s.map(Re).join("")}</div>
      </div>
    `:""}
  `,re(e,"[data-artifact]",r=>w("artifact-detail",r.dataset.artifact))}function W(e,t){return`<div class="detail-row"><dt>${l(e)}</dt><dd>${t}</dd></div>`}function Hn(e,t){const i=v.getState(),a=i.artifacts.find(m=>m.id===t);if(!a){e.innerHTML='<p class="empty-state">Artifact not found.</p>';return}const n=["Authentic","Modern Reproduction","Deliberate Forgery"].includes(a.authenticationOutcome),s=a.disposition==="none",r=Ft(a),o=a.finalAppraisedValue??(a.estimatedValueRange[0]+a.estimatedValueRange[1])/2,d=Math.round(o*Ne[0]*(1-Je)),c=Math.round(o*Ne[1]*(1-Je)),u=Object.values(De).filter(m=>!m.requiresFacility||i.facilities.some(p=>p.templateId===m.requiresFacility)),f=Object.values(De).filter(m=>m.requiresFacility&&!i.facilities.some(p=>p.templateId===m.requiresFacility));e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Collection</button>
    <div class="row" style="align-items:flex-start;">
      <div class="artifact-tile__thumb" style="width:72px;height:72px;flex-shrink:0;">
        <span class="rarity-dot rarity-dot--${a.rarity}"></span>
      </div>
      <div>
        <span class="eyebrow">${l(a.rarity)} · ${l(a.objectType)}</span>
        <h1>${l(a.name)}</h1>
      </div>
    </div>

    <div class="card">
      <dl class="stack" style="gap:0;">
        ${W("Culture",l(a.culture))}
        ${W("Era",l(a.era))}
        ${W("Estimated date",`${a.estimatedDateRange[0]}–${a.estimatedDateRange[1]}`)}
        ${W("Material",l(a.material))}
        ${W("Notable feature",l(a.feature))}
        ${W("Inscription",a.inscription?l(a.inscription):"None visible")}
        ${W("Condition",`${l(a.condition)} (${a.completeness}% complete)`)}
        ${W("Provenance",l(a.provenance))}
        ${W("Discovered",`${l(a.discoveryLocation)}`)}
      </dl>
    </div>

    <div class="card">
      <h3>Authentication</h3>
      ${a.authenticationStatus==="unidentified"?`
        <p class="text-sm muted">Nothing has been verified yet. Each method costs more but tells you more.</p>
      `:`
        <p>Outcome: <strong>${l(a.authenticationOutcome)}</strong> (${V(a.authenticationConfidence)} confidence)</p>
        ${a.finalAppraisedValue!=null?`<p class="text-sm muted">Final appraised value: ${b(a.finalAppraisedValue)}</p>`:""}
      `}
      ${n?"":`
        <div class="stack" style="margin-top:var(--space-2);">
          ${u.map(m=>`
            <div class="row row--between">
              <div>
                <strong class="text-sm">${l(m.label)}</strong>
                <div class="text-sm muted">${b(m.cost)} · ${Fe(m.timeHours)}</div>
              </div>
              <button class="btn btn--secondary btn--sm" data-authenticate="${m.id}" ${i.finance.cash<m.cost?"disabled":""}>Run</button>
            </div>
          `).join("")}
          ${f.map(m=>`
            <div class="row row--between">
              <div>
                <strong class="text-sm muted">${l(m.label)}</strong>
                <div class="text-sm muted">Requires ${l(D(m.requiresFacility).name)}</div>
              </div>
              <span class="badge">Locked</span>
            </div>
          `).join("")}
        </div>
      `}
      <p class="text-sm muted" style="margin-top:var(--space-2);">Estimated market value: $${a.estimatedValueRange[0].toLocaleString()}–$${a.estimatedValueRange[1].toLocaleString()}</p>
    </div>

    <div class="card">
      <h3>Restoration</h3>
      <p class="text-sm muted">Condition: ${l(a.condition)} (${Math.round(a.completeness)}% complete)${a.restorationStatus!=="none"?` · Last treatment: ${l(a.restorationStatus)}`:""}</p>
      <div class="stack" style="margin-top:var(--space-2);">
        ${Object.values(Oe).map(m=>{const p=jt(a,m.id);return`
            <div class="row row--between">
              <div>
                <strong class="text-sm">${l(m.label)}</strong>
                <div class="text-sm muted">${l(m.description)}</div>
                <div class="text-sm muted">${b(p)} · ${Fe(m.timeHours)}${m.failureChance?` · ${V(m.failureChance)} failure risk`:""}</div>
              </div>
              <button class="btn btn--secondary btn--sm" data-restore="${m.id}" ${i.finance.cash<p?"disabled":""}>Restore</button>
            </div>
          `}).join("")}
      </div>
    </div>

    <div class="stack">
      <h3>Decision</h3>
      <div class="disposition-actions">
        <button class="btn btn--primary" id="sell-btn" ${s?"":"disabled"}>Sell Privately (${b(r)})</button>
        <button class="btn btn--secondary" id="auction-btn" ${s?"":"disabled"}>Sell at Auction (${b(d)}–${b(c)})</button>
        <button class="btn btn--secondary" id="store-btn" ${s?"":"disabled"}>Store</button>
        <button class="btn btn--secondary" id="display-btn" ${s?"":"disabled"}>Display</button>
        <button class="btn btn--secondary" id="donate-btn" ${s?"":"disabled"}>Donate</button>
      </div>
      <p class="text-sm muted">A private sale is predictable. An auction takes a cut and swings wider, but can pay off big. Donating earns no cash but strengthens academic and ethical standing.</p>
      ${!n&&a.trueAuthenticity!=="authentic"?'<p class="text-sm" style="color:var(--warning);">Selling before authentication carries risk if this turns out not to be genuine.</p>':""}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("collection")),e.querySelectorAll("[data-authenticate]").forEach(m=>{m.addEventListener("click",()=>{try{const{result:p}=v.dispatch("AUTHENTICATE_ARTIFACT",{artifactId:t,methodId:m.dataset.authenticate});S(`Result: ${p.outcome}`)}catch(p){E(p.message)}})}),e.querySelectorAll("[data-restore]").forEach(m=>{m.addEventListener("click",()=>{try{const{failed:p,authenticityDamaged:h}=v.dispatch("RESTORE_ARTIFACT",{artifactId:t,methodId:m.dataset.restore});h?E("The restoration went wrong — the piece may look better, but its authenticity is now in question."):p?S("The restoration underperformed, but did no harm."):kt("Restoration complete.")}catch(p){E(p.message)}})}),e.querySelector("#sell-btn")?.addEventListener("click",async()=>{if(await z({title:"Sell this artifact?",message:`You'll receive approximately ${b(r)}. This cannot be undone.`,confirmLabel:"Sell"}))try{const{saleValue:p}=v.dispatch("SELL_ARTIFACT",{artifactId:t});P("cashRegister"),S(`Sold for ${b(p)}.`,{variant:"success"}),w("collection")}catch(p){E(p.message)}}),e.querySelector("#auction-btn")?.addEventListener("click",async()=>{if(await z({title:"Sell at auction?",message:`Expect somewhere between ${b(d)} and ${b(c)} after fees. This cannot be undone.`,confirmLabel:"Sell at Auction"}))try{const{saleValue:p}=v.dispatch("SELL_ARTIFACT_AUCTION",{artifactId:t});P("auctionHammer"),S(`Sold at auction for ${b(p)}.`,{variant:"success"}),w("collection")}catch(p){E(p.message)}}),e.querySelector("#store-btn")?.addEventListener("click",()=>{v.dispatch("STORE_ARTIFACT",{artifactId:t}),S("Stored in the archive."),w("collection")}),e.querySelector("#display-btn")?.addEventListener("click",()=>{v.dispatch("DISPLAY_ARTIFACT",{artifactId:t}),S(i.museum?.built?"Reserved for display — add it to an exhibit from the Museum screen.":"Reserved for display — your museum will house it once built."),w("collection")}),e.querySelector("#donate-btn")?.addEventListener("click",async()=>{if(await z({title:"Donate this artifact?",message:"No cash, but a solid boost to academic credibility and ethical standing. This cannot be undone.",confirmLabel:"Donate"}))try{v.dispatch("DONATE_ARTIFACT",{artifactId:t}),kt("Donated — the historical record thanks you."),w("collection")}catch(p){E(p.message)}})}const Fn=[{id:"first-find",label:"First Find",description:"Recover your first artifact.",checkId:"first-find"},{id:"proven-authentic",label:"Proven Authentic",description:"Authenticate your first artifact.",checkId:"proven-authentic"},{id:"worth-the-risk",label:"Worth the Risk",description:"Complete an expedition rated high-risk.",checkId:"worth-the-risk"},{id:"no-stone-unturned",label:"No Stone Unturned",description:"Fully research a lead before launching an expedition.",checkId:"no-stone-unturned"},{id:"into-the-deep",label:"Into the Deep",description:"Complete a marine expedition.",checkId:"into-the-deep"},{id:"beneath-the-sand",label:"Beneath the Sand",description:"Complete a desert excavation.",checkId:"beneath-the-sand"},{id:"cold-case",label:"Cold Case",description:"Complete an arctic expedition.",checkId:"cold-case"},{id:"academic-respect",label:"Academic Respect",description:"Reach 20 academic credibility.",checkId:"academic-respect"},{id:"world-class-discovery",label:"World-Class Discovery",description:"Recover a World-Class rarity artifact.",checkId:"world-class-discovery"},{id:"fully-equipped",label:"Fully Equipped",description:"Own equipment from every category.",checkId:"fully-equipped"},{id:"expedition-leader",label:"Expedition Leader",description:"Complete five expeditions.",checkId:"expedition-leader"},{id:"museum-opening",label:"Museum Opening",description:"Open your private museum.",checkId:"museum-opening"},{id:"sold-at-auction",label:"Sold at Auction",description:"Sell an artifact at auction.",checkId:"sold-at-auction"},{id:"returned-to-history",label:"Returned to History",description:"Donate an artifact to an institution.",checkId:"returned-to-history"},{id:"rival-beaten",label:"Rival Beaten",description:"Reach a site before a rival.",checkId:"rival-beaten"},{id:"hundred-artifacts",label:"Hundred Artifacts",description:"Recover 100 artifacts.",checkId:"hundred-artifacts"},{id:"seven-seas",label:"Seven Seas",description:"Complete expeditions in seven different regions.",checkId:"seven-seas"},{id:"master-cartographer",label:"Master Cartographer",description:"Fully map ten sites.",checkId:"master-cartographer"},{id:"legendary-explorer",label:"Legendary Explorer",description:"Reach maximum organization prestige.",checkId:"legendary-explorer"}],On=[{key:"publicFame",label:"Public Fame",description:"Drives museum attendance, sponsor interest, and media opportunities."},{key:"academicCredibility",label:"Academic Credibility",description:"Unlocks university partnerships, experts, and better research leads."},{key:"fieldReputation",label:"Field Reputation",description:"Affects crew applicants, local guides, and rival respect."},{key:"ethicalStanding",label:"Ethical Standing",description:"Governs permits, community cooperation, and institutional trust."}];function pe(e,t,i){return`
    <div class="card card--interactive" data-hub="${e}">
      <div class="row row--between">
        <div>
          <strong>${l(t)}</strong>
          <div class="text-sm muted">${l(i)}</div>
        </div>
        <span aria-hidden="true">&rarr;</span>
      </div>
    </div>
  `}function Bn(e){const t=v.getState(),i=ti(t),a=t.vehicles.map(s=>s.templateId),n=ui.filter(s=>!a.includes(s.id));e.innerHTML=`
    <h1>Organization</h1>

    <div class="stack">
      ${pe("staff","Staff",`${t.staff.length} hired · ${t.crewCandidates.length} candidates available`)}
      ${pe("equipment","Equipment",`${t.equipment.length} items owned`)}
      ${pe("facilities","Headquarters & Facilities",`${t.organization.tierName} · ${t.facilities.length} facilities`)}
      ${pe("museum","Museum",t.museum?.built?`${t.museum.exhibits.length} exhibits · ${b(t.museum.totalRevenue)} earned`:"Not built yet")}
      ${pe("reports","Reports","Expeditions, finances, and collection at a glance")}
    </div>

    <div class="stack">
      <h2>Vehicles (${t.vehicles.length}/${i})</h2>
      <div class="stack">
        ${t.vehicles.map(s=>{const r=fe(s.templateId);return`<div class="card"><strong>${l(r.name)}</strong><div class="text-sm muted">${l(r.description)}</div></div>`}).join("")}
      </div>
      ${n.length?n.map(s=>{const r=t.vehicles.length>=i;return`
        <div class="card">
          <strong>${l(s.name)}</strong>
          <p class="text-sm muted">${l(s.description)}</p>
          <div class="row row--between" style="margin-top:var(--space-2);">
            <span class="text-sm muted">${b(s.cost)}</span>
            <button class="btn btn--primary btn--sm" data-buy-vehicle="${s.id}" ${t.finance.cash<s.cost||r?"disabled":""}>Buy</button>
          </div>
          ${r?'<p class="text-sm" style="color:var(--warning);">Needs a larger headquarters or a Vehicle Garage first.</p>':""}
        </div>
      `}).join(""):""}
    </div>

    <div class="stack">
      <h2>Reputation</h2>
      <div class="card stack">
        ${On.map(s=>`
          <div class="stack" style="gap:4px;">
            <div class="row row--between text-sm">
              <strong>${l(s.label)}</strong>
              <span>${Math.round(t.reputation[s.key])}</span>
            </div>
            ${je({value:t.reputation[s.key],max:100})}
            <span class="text-sm muted">${l(s.description)}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="stack">
      <h2>Sponsors</h2>
      ${t.sponsors.length?`
        <div class="stack">
          ${t.sponsors.map(s=>{const r=at(s.templateId);return`<div class="card"><strong>${l(r.name)}</strong><div class="text-sm muted">${l(r.category)}${r.perk?` · ${l(r.perk.label)}`:""}</div></div>`}).join("")}
        </div>
      `:""}
      <div class="stack">
        ${$a(t).map(s=>`
          <div class="card">
            <div class="row row--between">
              <strong>${l(s.name)}</strong>
              <span class="badge">${l(s.category)}</span>
            </div>
            <p class="text-sm muted">${l(s.description)}</p>
            ${s.perk?`<p class="text-sm muted">Perk: ${l(s.perk.label)}</p>`:""}
            <div class="row row--between" style="margin-top:var(--space-2);">
              <span class="text-sm muted">Signing bonus: ${b(s.signingBonus)}</span>
              <button class="btn btn--primary btn--sm" data-accept-sponsor="${s.id}">Accept</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="stack">
      <h2>Finances</h2>
      <div class="card">
        <div class="detail-row"><dt>Cash</dt><dd>${b(t.finance.cash)}</dd></div>
        <div class="detail-row"><dt>Total revenue</dt><dd>${b(t.finance.totalRevenue)}</dd></div>
        <div class="detail-row"><dt>Total expenses</dt><dd>${b(t.finance.totalExpenses)}</dd></div>
        <div class="detail-row"><dt>Prestige</dt><dd>${t.organization.prestige}</dd></div>
      </div>
    </div>

    <div class="stack">
      <h2>Achievements</h2>
      <div class="stack">
        ${Fn.map(s=>`
          <div class="row row--between card" style="padding: var(--space-3);">
            <div>
              <strong class="text-sm">${l(s.label)}</strong>
              <div class="text-sm muted">${l(s.description)}</div>
            </div>
            <span class="badge ${t.achievements.unlocked.includes(s.id)?"badge--brass":""}">${t.achievements.unlocked.includes(s.id)?"Unlocked":"Locked"}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <button class="btn btn--secondary btn--full" id="settings-btn">Settings</button>
  `,e.querySelector("#settings-btn").addEventListener("click",()=>w("settings")),re(e,"[data-hub]",s=>w(s.dataset.hub)),e.querySelectorAll("[data-buy-vehicle]").forEach(s=>{s.addEventListener("click",()=>{try{v.dispatch("PURCHASE_VEHICLE",{templateId:s.dataset.buyVehicle}),S("New vehicle added to your fleet.")}catch(r){E(r.message)}})}),e.querySelectorAll("[data-accept-sponsor]").forEach(s=>{s.addEventListener("click",()=>{try{v.dispatch("ACCEPT_SPONSOR",{sponsorId:s.dataset.acceptSponsor}),S("Sponsorship signed.")}catch(r){E(r.message)}})})}function Ct(e,{hireable:t=!1}={}){const i=me(e.roleId),a=ca(e.traitId),n=la(e.traitId)?"badge--success":"badge--warning";return`
    <div class="card stack" data-crew="${e.instanceId}">
      <div class="row row--between">
        <div>
          <strong>${l(e.name)}</strong>
          <div class="text-sm muted">${l(i?.label||e.roleId)} · Skill ${e.skillLevel}/5</div>
        </div>
        <span class="badge badge--brass">${b(e.salary)}/day</span>
      </div>
      <p class="text-sm muted">${l(i?.description||"")}</p>
      <div class="row row--wrap">
        <span class="badge ${n}">${l(a?.label||e.traitId)}</span>
      </div>
      <div class="row" style="margin-top: var(--space-2);">
        ${t?`<button class="btn btn--primary btn--full" data-hire="${e.instanceId}">Hire — ${b(e.salary*2)} signing fee</button>`:`<button class="btn btn--secondary btn--full" data-dismiss="${e.instanceId}">Dismiss</button>`}
      </div>
    </div>
  `}function Vn(e){const t=v.getState(),i=ei(t);e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Staff</h1>
    <p class="muted">${t.staff.length} / ${i} staff slots used</p>

    <div class="stack">
      <h2>Your Roster</h2>
      ${t.staff.length?`<div class="stack">${t.staff.map(a=>Ct(a)).join("")}</div>`:`<p class="empty-state">You're working alone for now. Hire your first specialist below.</p>`}
    </div>

    <div class="stack">
      <div class="row row--between">
        <h2>Candidates</h2>
        <button class="btn btn--secondary btn--sm" id="refresh-btn">Find New (${b(200)})</button>
      </div>
      ${t.crewCandidates.length?`<div class="stack">${t.crewCandidates.map(a=>Ct(a,{hireable:!0})).join("")}</div>`:'<p class="empty-state">No candidates right now — try finding new ones.</p>'}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("organization")),e.querySelector("#refresh-btn").addEventListener("click",()=>{try{v.dispatch("REFRESH_CREW_CANDIDATES",{}),S("New candidates found.")}catch(a){E(a.message)}}),e.querySelectorAll("[data-hire]").forEach(a=>{a.addEventListener("click",()=>{try{v.dispatch("HIRE_CREW",{candidateId:a.dataset.hire}),S("Welcome to the team.")}catch(n){E(n.message)}})}),e.querySelectorAll("[data-dismiss]").forEach(a=>{a.addEventListener("click",async()=>{await z({title:"Dismiss this crew member?",message:"They will need to be re-hired later if you change your mind.",confirmLabel:"Dismiss",danger:!0})&&(v.dispatch("DISMISS_CREW",{crewInstanceId:a.dataset.dismiss}),S("Crew member dismissed."))})})}const jn={basic:"Basic Field Gear",survey:"Survey Equipment",excavation:"Excavation Equipment",marine:"Marine Equipment"};function Un(e,t){const i=G(e.templateId),a=Math.round(Pt(e)*t);return`
    <div class="row row--between" style="padding: var(--space-2) 0; border-bottom: 1px solid var(--border-subtle);">
      <div>
        <strong class="text-sm">${l(i.name)}</strong>
        <div class="text-sm muted">${_t(e.condition)} (${Math.round(e.condition)}%)</div>
      </div>
      ${e.condition<100?`<button class="btn btn--secondary btn--sm" data-repair="${e.instanceId}">Repair — ${b(a)}</button>`:'<span class="badge badge--success">Ready</span>'}
    </div>
  `}function Wn(e,t,i){const a=e.requiredSkill?`Best with a ${e.requiredSkill.role.replace(/-/g," ")} (skill ${e.requiredSkill.level}+) — usable without, at half effect.`:"No specialist required.";return`
    <div class="card">
      <div class="row row--between">
        <strong>${l(e.name)}</strong>
        ${t?`<span class="badge">Owned ×${t}</span>`:""}
      </div>
      <p class="text-sm muted">${l(a)}</p>
      <div class="row row--between" style="margin-top: var(--space-2);">
        <span class="text-sm muted">${b(e.cost)} · ${b(e.operatingCost)}/use</span>
        <button class="btn btn--primary btn--sm" data-buy="${e.id}" ${i<e.cost?"disabled":""}>Buy</button>
      </div>
    </div>
  `}function zn(e){const t=v.getState(),i=Zt(t),a={};for(const s of t.equipment){const r=G(s.templateId);a[r.category]=a[r.category]||[],a[r.category].push(s)}const n={};for(const s of t.equipment)n[s.templateId]=(n[s.templateId]||0)+1;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Equipment</h1>

    ${Object.entries(a).map(([s,r])=>`
      <div class="stack">
        <h2>${jn[s]||s}</h2>
        <div class="card">${r.map(o=>Un(o,i)).join("")}</div>
      </div>
    `).join("")}

    <div class="stack">
      <h2>Shop</h2>
      <div class="stack">
        ${Dt.map(s=>Wn(s,n[s.id]||0,t.finance.cash)).join("")}
      </div>
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("organization")),e.querySelectorAll("[data-repair]").forEach(s=>{s.addEventListener("click",()=>{try{v.dispatch("REPAIR_EQUIPMENT",{instanceId:s.dataset.repair}),S("Equipment repaired.")}catch(r){E(r.message)}})}),e.querySelectorAll("[data-buy]").forEach(s=>{s.addEventListener("click",()=>{try{v.dispatch("PURCHASE_EQUIPMENT",{templateId:s.dataset.buy}),S("Equipment added to your inventory.")}catch(r){E(r.message)}})})}function Gn(e){const t=v.getState(),i=Be(t.organization.tier),a=Jt(t.organization.tier),n=ga(t),s=ii(t);e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Headquarters</h1>

    <div class="card stack">
      <span class="eyebrow">Current Tier</span>
      <h2>${l(i.name)}</h2>
      <p class="text-sm muted">Supports up to ${i.baseMaxStaff} staff and ${i.baseMaxVehicles} vehicles before facility bonuses.</p>
      ${a?`
        <div class="divider"></div>
        <span class="eyebrow">Next: ${l(a.name)}</span>
        <p class="text-sm muted">Requires ${a.prestigeRequired} prestige (you have ${t.organization.prestige}) and ${b(a.cost)}.</p>
        <button class="btn btn--primary btn--full" id="upgrade-btn" ${t.organization.prestige<a.prestigeRequired||t.finance.cash<a.cost?"disabled":""}>
          Upgrade to ${l(a.name)}
        </button>
      `:`<p class="text-sm muted">You've reached the highest headquarters tier.</p>`}
    </div>

    <div class="stack">
      <h2>Facilities (${t.facilities.length}/${s})</h2>
      ${t.facilities.length?`
        <div class="stack">
          ${t.facilities.map(r=>{const o=D(r.templateId);return`<div class="card"><strong>${l(o.name)}</strong><p class="text-sm muted">${l(o.description)}</p></div>`}).join("")}
        </div>
      `:'<p class="empty-state">No facilities built yet.</p>'}
    </div>

    ${n.length?`
      <div class="stack">
        <h2>Build</h2>
        <div class="stack">
          ${n.map(r=>`
            <div class="card">
              <strong>${l(r.name)}</strong>
              <p class="text-sm muted">${l(r.description)}</p>
              <div class="row row--between" style="margin-top: var(--space-2);">
                <span class="text-sm muted">${b(r.cost)}</span>
                <button class="btn btn--primary btn--sm" data-build="${r.id}" ${t.finance.cash<r.cost||t.facilities.length>=s?"disabled":""}>Build</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `:""}
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("organization")),e.querySelector("#upgrade-btn")?.addEventListener("click",()=>{try{v.dispatch("UPGRADE_HEADQUARTERS",{}),S("Headquarters upgraded!")}catch(r){E(r.message)}}),e.querySelectorAll("[data-build]").forEach(r=>{r.addEventListener("click",()=>{try{v.dispatch("BUILD_FACILITY",{facilityId:r.dataset.build}),S("Facility built.")}catch(o){E(o.message)}})})}function Yn(e,t){const i=t.finance.cash>=T.cost,a=t.organization.prestige>=T.prestigeRequired;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Museum</h1>
    <div class="card stack">
      <p>Turn displayed artifacts into curated exhibits that draw paying visitors — recurring income that doesn't depend on your next expedition.</p>
      <div class="detail-row"><dt>Cost</dt><dd>${b(T.cost)}</dd></div>
      <div class="detail-row"><dt>Prestige required</dt><dd>${T.prestigeRequired} (you have ${t.organization.prestige})</dd></div>
      <button class="btn btn--primary btn--full" id="build-museum-btn" ${i&&a?"":"disabled"}>Build Museum</button>
      ${a?i?"":'<p class="text-sm" style="color:var(--warning);">Not enough cash yet.</p>':'<p class="text-sm" style="color:var(--warning);">Needs more prestige — keep completing expeditions and building reputation.</p>'}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("organization")),e.querySelector("#build-museum-btn").addEventListener("click",()=>{try{v.dispatch("BUILD_MUSEUM",{}),S("Museum built!")}catch(n){E(n.message)}})}function Qn(e){const t=v.getState(),i=new Set(t.museum.exhibits.flatMap(s=>s.artifactIds)),a=t.artifacts.filter(s=>s.disposition==="displayed"),n=`
    <h2 id="picker-title">Add to Exhibit</h2>
    <div class="stack" style="margin-top: var(--space-3);">
      ${a.length?a.map(s=>`
        <div class="row row--between">
          <div>
            <strong class="text-sm">${l(s.name)}</strong>
            <div class="text-sm muted">${l(s.rarity)}${i.has(s.id)?" · already in an exhibit":""}</div>
          </div>
          <button class="btn btn--secondary btn--sm" data-pick="${s.id}">Add</button>
        </div>
      `).join(""):'<p class="empty-state">No displayed artifacts available. Set some aside from your Collection first.</p>'}
    </div>
  `;ct(n,{labelledBy:"picker-title",onMount:s=>{s.querySelectorAll("[data-pick]").forEach(r=>{r.addEventListener("click",()=>{try{v.dispatch("ASSIGN_ARTIFACT_TO_EXHIBIT",{exhibitId:e,artifactId:r.dataset.pick}),oe(),w("museum")}catch(o){E(o.message)}})})}})}function Kn(e,t){const i=t.museum,a=si;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Museum</h1>

    <div class="grid-2">
      <div class="stat-card"><span class="stat-card__label">Total Visitors</span><span class="stat-card__value">${i.totalVisitors.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-card__label">Total Revenue</span><span class="stat-card__value stat-card__value--accent">${b(i.totalRevenue)}</span></div>
    </div>

    <div class="card stack">
      <h3>Ticket Price</h3>
      <div class="row row--between">
        <input type="number" id="ticket-price" min="${T.minTicketPrice}" max="${T.maxTicketPrice}" value="${i.ticketPrice}" style="width:100px;" />
        <button class="btn btn--secondary btn--sm" id="set-price-btn">Update</button>
      </div>
      <p class="text-sm muted">Higher prices earn more per visitor, but fewer people come.</p>
    </div>

    <div class="stack">
      <div class="row row--between">
        <h2>Exhibits</h2>
        <button class="btn btn--secondary btn--sm" id="new-exhibit-btn">New Exhibit</button>
      </div>
      ${i.exhibits.length?i.exhibits.map(n=>{const s=st(n.themeId),r=ci(n,t),o=oi(t,n);return`
          <div class="card stack">
            <div class="row row--between">
              <div>
                <span class="eyebrow">${l(s.label)}</span>
                <h3>${l(n.name)}</h3>
              </div>
              <button class="btn btn--secondary btn--sm" data-add-artifact="${n.instanceId}">Add Piece</button>
            </div>
            ${je({value:r,max:1})}
            <span class="text-sm muted">Quality: ${V(r)}</span>
            ${o.length?`
              <div class="stack" style="gap: var(--space-1);">
                ${o.map(d=>`
                  <div class="row row--between">
                    <span class="text-sm">${l(d.name)}</span>
                    <button class="icon-btn" data-remove-artifact="${n.instanceId}:${d.id}" aria-label="Remove">✕</button>
                  </div>
                `).join("")}
              </div>
            `:'<p class="text-sm muted">No pieces yet.</p>'}
          </div>
        `}).join(""):'<p class="empty-state">No exhibits yet. Create one to start displaying your collection.</p>'}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("organization")),e.querySelector("#set-price-btn").addEventListener("click",()=>{const n=Number(e.querySelector("#ticket-price").value);try{v.dispatch("SET_TICKET_PRICE",{price:n}),S("Ticket price updated.")}catch(s){E(s.message)}}),e.querySelector("#new-exhibit-btn").addEventListener("click",()=>{const n=`
      <h2 id="theme-title">Choose a Theme</h2>
      <div class="stack" style="margin-top: var(--space-3);">
        ${a.map(s=>`
          <button class="approach-option" data-theme="${s.id}">
            <strong>${l(s.label)}</strong>
            <div class="text-sm muted">${l(s.description)}</div>
          </button>
        `).join("")}
      </div>
    `;ct(n,{labelledBy:"theme-title",onMount:s=>{s.querySelectorAll("[data-theme]").forEach(r=>{r.addEventListener("click",()=>{v.dispatch("CREATE_EXHIBIT",{themeId:r.dataset.theme}),oe(),w("museum")})})}})}),e.querySelectorAll("[data-add-artifact]").forEach(n=>{n.addEventListener("click",()=>Qn(n.dataset.addArtifact))}),e.querySelectorAll("[data-remove-artifact]").forEach(n=>{n.addEventListener("click",()=>{const[s,r]=n.dataset.removeArtifact.split(":");v.dispatch("REMOVE_ARTIFACT_FROM_EXHIBIT",{exhibitId:s,artifactId:r}),S("Removed from exhibit."),w("museum")})})}function Xn(e){const t=v.getState();t.museum?.built?Kn(e,t):Yn(e,t)}function ie(e,t){return`<div class="stack"><h2>${l(e)}</h2><div class="card">${t}</div></div>`}function R(e,t){return`<div class="detail-row"><dt>${l(e)}</dt><dd>${t}</dd></div>`}function Jn(e){const t=v.getState(),i=t.expeditionHistory,a=i.filter(c=>c.success).length,n=i.length?a/i.length:0,s=i.reduce((c,u)=>c+u.financials.actualCashDelta,0),r={};for(const c of Z)r[c]=0;for(const c of t.artifacts)r[c.rarity]=(r[c.rarity]||0)+1;const o={none:0,stored:0,displayed:0,sold:0,donated:0};let d=0;for(const c of t.artifacts)o[c.disposition]=(o[c.disposition]||0)+1,c.disposition==="none"&&(d+=(c.estimatedValueRange[0]+c.estimatedValueRange[1])/2);e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Reports</h1>

    ${ie("Expeditions",`
      ${R("Total launched",i.length)}
      ${R("Success rate",V(n))}
      ${R("Net financial impact",b(s))}
      ${R("Failed",t.stats.expeditionsFailed)}
    `)}

    ${i.length?ie("Recent Expeditions",`
      <div class="stack" style="gap:0;">
        ${[...i].reverse().slice(0,8).map(c=>`
          <div class="financial-line">
            <span>${l(c.leadTitle)} <span class="muted">(${l(c.siteName)})</span></span>
            <span class="${c.success?"financial-line--positive":"financial-line--negative"}">${c.success?"Success":"Failed"} · ${b(c.financials.actualCashDelta)}</span>
          </div>
        `).join("")}
      </div>
    `):""}

    ${ie("Finances",`
      ${R("Cash on hand",b(t.finance.cash))}
      ${R("Total revenue",b(t.finance.totalRevenue))}
      ${R("Total expenses",b(t.finance.totalExpenses))}
      ${R("Organization prestige",t.organization.prestige)}
    `)}

    ${ie("Collection",`
      ${R("Total artifacts",t.artifacts.length)}
      ${R("Awaiting a decision",o.none)}
      ${R("Stored",o.stored)}
      ${R("Displayed",o.displayed)}
      ${R("Sold",o.sold)}
      ${R("Donated",o.donated)}
      ${R("Unrealized value (undecided pieces)",b(d))}
      <div class="divider"></div>
      ${Z.filter(c=>r[c]>0).map(c=>R(c,r[c])).join("")}
    `)}

    ${t.staff.length?ie("Crew",`
      ${t.staff.map(c=>R(`${c.name} (${me(c.roleId)?.label||c.roleId})`,`Skill ${c.skillLevel}/5 · ${c.experience} XP`)).join("")}
    `):""}

    ${ie("Reputation",`
      ${R("Public Fame",Math.round(t.reputation.publicFame))}
      ${R("Academic Credibility",Math.round(t.reputation.academicCredibility))}
      ${R("Field Reputation",Math.round(t.reputation.fieldReputation))}
      ${R("Ethical Standing",Math.round(t.reputation.ethicalStanding))}
    `)}
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("organization"))}function Ae(e,t,i){return`
    <div class="toggle-row">
      <label for="${e}" style="margin:0;">${t}</label>
      <span class="switch">
        <input type="checkbox" id="${e}" ${i?"checked":""} />
        <span class="switch__track"></span>
      </span>
    </div>
  `}function Zn(e){const t=v.getState(),i=t.settings;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Settings</h1>

    <div class="card stack">
      <h3>Audio</h3>
      ${Ae("sound-toggle","Sound effects",i.soundEnabled)}
      ${Ae("music-toggle","Music",i.musicEnabled)}
    </div>

    <div class="card stack">
      <h3>Display</h3>
      ${Ae("motion-toggle","Reduced motion",i.reducedMotion)}
      <div class="field">
        <label for="theme-select">Theme</label>
        <select id="theme-select">
          <option value="expedition" ${i.theme==="expedition"?"selected":""}>Expedition (dark)</option>
          <option value="parchment" ${i.theme==="parchment"?"selected":""}>Parchment (light)</option>
        </select>
      </div>
      <div class="field">
        <label for="speed-select">Default expedition speed</label>
        <select id="speed-select">
          <option value="1" ${i.defaultExpeditionSpeed===1?"selected":""}>1x</option>
          <option value="2" ${i.defaultExpeditionSpeed===2?"selected":""}>2x</option>
          <option value="4" ${i.defaultExpeditionSpeed===4?"selected":""}>4x</option>
        </select>
      </div>
    </div>

    <div class="card stack">
      <h3>Gameplay</h3>
      ${Ae("confirm-toggle","Confirm expensive actions",i.confirmExpensiveActions)}
      <button class="btn btn--secondary btn--full" id="reset-tutorial-btn">Reset Tutorial</button>
    </div>

    <div class="card stack">
      <h3>Save Data</h3>
      <button class="btn btn--secondary btn--full" id="export-btn">Export Save</button>
      <button class="btn btn--secondary btn--full" id="import-btn">Import Save</button>
      <input type="file" id="import-input" accept="application/json" class="visually-hidden" />
      <p class="text-sm muted">Last saved: ${t.meta.lastSavedAt?new Date(t.meta.lastSavedAt).toLocaleString():"never"}</p>
    </div>

    <div class="card stack">
      <h3>About</h3>
      <p class="text-sm muted">${se.gameTitle} — ${se.subtitle}</p>
      <button class="btn btn--danger btn--full" id="quit-btn">Return to Title Screen</button>
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>w("organization"));const a=(n,s)=>{e.querySelector(`#${n}`).addEventListener("change",r=>{v.dispatch("UPDATE_SETTINGS",{[s]:r.target.checked})})};a("sound-toggle","soundEnabled"),a("music-toggle","musicEnabled"),a("motion-toggle","reducedMotion"),a("confirm-toggle","confirmExpensiveActions"),e.querySelector("#theme-select").addEventListener("change",n=>{v.dispatch("UPDATE_SETTINGS",{theme:n.target.value})}),e.querySelector("#speed-select").addEventListener("change",n=>{v.dispatch("UPDATE_SETTINGS",{defaultExpeditionSpeed:Number(n.target.value)})}),e.querySelector("#reset-tutorial-btn").addEventListener("click",async()=>{await z({title:"Reset tutorial?",message:"Coach marks will appear again as you play.",confirmLabel:"Reset"})&&(v.dispatch("RESET_TUTORIAL",{}),S("Tutorial reset."))}),e.querySelector("#export-btn").addEventListener("click",()=>{const{url:n,filename:s}=B.exportSave(v.getState()),r=document.createElement("a");r.href=n,r.download=s,r.click(),setTimeout(()=>URL.revokeObjectURL(n),2e3),S("Save exported.")}),e.querySelector("#import-btn").addEventListener("click",()=>e.querySelector("#import-input").click()),e.querySelector("#import-input").addEventListener("change",async n=>{const s=n.target.files[0];if(!(!s||!await z({title:"Import save?",message:"This replaces your current session with the imported save (your current slot on disk is untouched until you save again).",confirmLabel:"Import"})))try{const o=await B.importSaveFromFile(s),d=v.getState().meta.slotId;o.meta.slotId=d,v.setState(o),await B.saveToSlot(d,o),S("Save imported."),w("headquarters")}catch(o){E(o.message)}}),e.querySelector("#quit-btn").addEventListener("click",async()=>{await z({title:"Return to title screen?",message:"Your progress is already saved automatically.",confirmLabel:"Return to Title"})&&window.location.reload()})}const Ye=[{screen:"leads",title:"Your First Lead",message:"A storage-unit find led here. Open it to see what you know so far."},{screen:"leads",title:"Research the Lead",message:"Spend cash and time on research to improve your odds before committing to an expedition."},{screen:"evidence",title:"Weigh the Evidence",message:"Review what you've uncovered, then draw a conclusion about the most likely site."},{screen:"planning",title:"Prepare Your Expedition",message:"Pick an approach, pack equipment and supplies, then launch when the estimate looks reasonable."},{screen:"live-expedition",title:"In the Field",message:"Watch the expedition unfold. Field events will ask you to make a call — there's no single right answer."},{screen:"expedition-results",title:"Review the Outcome",message:"Financials are broken down clearly so you always know why an expedition went the way it did."},{screen:"collection",title:"Authenticate Your Find",message:"Open a recovered artifact and get a first opinion on whether it's genuine."},{screen:"artifact-detail",title:"Sell, Store, or Display",message:"Decide what to do with it — each choice trades cash against reputation."},{screen:"headquarters",title:"Keep Growing",message:"Earn revenue and reputation to unlock hiring, better equipment, and eventually a museum of your own."}];function es(e,t){if(!e)return;const i=v.getState();if(!i||!i.tutorial.active||!i.settings.tutorialEnabled){e.innerHTML="";return}const a=i.tutorial.currentStep,n=Ye[a];if(!n||n.screen!==t||i.tutorial.dismissedSteps.includes(a)){e.innerHTML="";return}e.innerHTML=`
    <div class="coach-mark" role="dialog" aria-label="Tutorial tip">
      <div class="row row--between">
        <span class="eyebrow">Tip ${a+1} of ${Ye.length}</span>
        <button class="icon-btn" id="dismiss-tutorial" aria-label="Dismiss tip">✕</button>
      </div>
      <h3>${l(n.title)}</h3>
      <p class="text-sm">${l(n.message)}</p>
      <button class="btn btn--primary btn--full" id="got-it-btn" style="margin-top:var(--space-2);">Got it</button>
    </div>
  `;const s=()=>{v.dispatch("DISMISS_TUTORIAL_STEP",{step:a}),a>=Ye.length-1&&v.dispatch("END_TUTORIAL",{}),e.innerHTML=""};e.querySelector("#got-it-btn").addEventListener("click",s),e.querySelector("#dismiss-tutorial").addEventListener("click",s)}const ts=[{id:"headquarters",label:"HQ",icon:"compass"},{id:"leads",label:"Leads",icon:"map"},{id:"expeditions",label:"Expeditions",icon:"route"},{id:"collection",label:"Collection",icon:"case"},{id:"organization",label:"Org",icon:"building"}],Rt={compass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 5-5 2 2-5z"/></svg>',map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M7.8 7.5C10 10 12 12 14 13.5c1.4 1 2.6 1.7 4 2"/></svg>',case:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="3" width="16" height="18"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/></svg>',bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>'};function At(e){document.documentElement.dataset.theme=e.settings.theme||"expedition",document.documentElement.dataset.reducedMotion=String(!!e.settings.reducedMotion)}function is(e){e.innerHTML=`
    <div class="app-shell">
      <header class="app-header">
        <div class="row" style="gap:8px;">
          <strong style="font-family:var(--font-display);">${se.gameTitle}</strong>
        </div>
        <button class="icon-btn" id="alerts-btn" aria-label="Alerts">${Rt.bell}<span id="alert-dot" class="visually-hidden"></span></button>
      </header>
      <main class="app-main" id="app-main"></main>
      <nav class="bottom-nav" aria-label="Primary">
        ${ts.map(r=>`
          <button class="bottom-nav__item" data-nav="${r.id}" aria-current="false">
            ${Rt[r.icon]}
            <span>${r.label}</span>
          </button>
        `).join("")}
      </nav>
    </div>
    <div id="tutorial-root"></div>
  `;const t=e.querySelector("#app-main"),i=e.querySelector(".bottom-nav");M("headquarters",Sn),M("leads",Rn),M("evidence",Tn),M("planning",xt),M("expeditions",xt),M("live-expedition",Nn),M("expedition-results",_n),M("collection",Pn),M("artifact-detail",Hn),M("organization",Bn),M("staff",Vn),M("equipment",zn),M("facilities",Gn),M("museum",Xn),M("reports",Jn),M("settings",Zn);const a=["settings","staff","equipment","facilities","museum","reports"],n=["expeditions","planning","live-expedition","expedition-results"];function s(r){const o=r==="evidence"?"leads":n.includes(r)?"expeditions":r==="artifact-detail"?"collection":a.includes(r)?"organization":r;i.querySelectorAll("[data-nav]").forEach(d=>{d.setAttribute("aria-current",d.dataset.nav===o?"page":"false")}),es(document.getElementById("tutorial-root"),r)}i.addEventListener("click",r=>{const o=r.target.closest("[data-nav]");o&&(P("click"),w(o.dataset.nav))}),e.querySelector("#alerts-btn").addEventListener("click",()=>{Ei(()=>import("./alerts-sheet-CzQQMov1.js"),[],import.meta.url).then(r=>r.openAlertsSheet())}),mn(t,s),v.subscribe(r=>{At(r),Tt(r),ft(r.settings),hn()}),v.setAutosaveHook(r=>B.scheduleAutosave(r)),At(v.getState()),Tt(v.getState()),ft(v.getState().settings)}function Tt(e){const t=document.getElementById("alerts-btn");if(!t)return;const i=e.alerts.length;t.style.position="relative";let a=t.querySelector(".alert-count-dot");i>0?a||(a=document.createElement("span"),a.className="alert-count-dot",a.style.cssText="position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--danger);",t.appendChild(a)):a&&a.remove()}async function as(){const e=document.getElementById("app-root");window.addEventListener("error",t=>{console.error(t.error||t.message)}),window.addEventListener("unhandledrejection",t=>{console.error(t.reason),t.reason?.message&&E(t.reason.message)}),await yn(e),is(e),w("headquarters")}as();export{l as e,ct as o,v as s};
