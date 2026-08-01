(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function i(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(s){if(s.ep)return;s.ep=!0;const n=i(s);fetch(s.href,n)}})();const xi="modulepreload",$i=function(e,t){return new URL(e,t).href},mt={},Ci=function(t,i,a){let s=Promise.resolve();if(i&&i.length>0){const r=document.getElementsByTagName("link"),c=document.querySelector("meta[property=csp-nonce]"),d=c?.nonce||c?.getAttribute("nonce");s=Promise.allSettled(i.map(l=>{if(l=$i(l,a),l in mt)return;mt[l]=!0;const p=l.endsWith(".css"),f=p?'[rel="stylesheet"]':"";if(!!a)for(let v=r.length-1;v>=0;v--){const g=r[v];if(g.href===l&&(!p||g.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${l}"]${f}`))return;const u=document.createElement("link");if(u.rel=p?"stylesheet":xi,p||(u.as="script"),u.crossOrigin="",u.href=l,d&&u.setAttribute("nonce",d),document.head.appendChild(u),p)return new Promise((v,g)=>{u.addEventListener("load",v),u.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${l}`)))})}))}function n(r){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=r,window.dispatchEvent(c),!c.defaultPrevented)throw r}return s.then(r=>{for(const c of r||[])c.status==="rejected"&&n(c.reason);return t().catch(n)})},se={gameTitle:"Treasure Hunter",subtitle:"Find the lost. Prove the impossible.",defaultOrgName:"Independent Explorer"},Te=5,Ii="treasure-hunter-saves",Ai=1,we=3;function Ri(e){let t=1779033703^e.length;for(let i=0;i<e.length;i++)t=Math.imul(t^e.charCodeAt(i),3432918353),t=t<<13|t>>>19;return()=>(t=Math.imul(t^t>>>16,2246822507),t=Math.imul(t^t>>>13,3266489909),(t^=t>>>16)>>>0)}function Ti(e){return function(){e|=0,e=e+1831565813|0;let i=Math.imul(e^e>>>15,1|e);return i=i+Math.imul(i^i>>>7,61|i)^i,((i^i>>>14)>>>0)/4294967296}}class Mi{constructor(t,i=0){this.seed=t,this.callCount=i;const a=Ri(String(t));this._next=Ti(a());for(let s=0;s<i;s++)this._next()}float(){return this.callCount++,this._next()}range(t,i){return t+this.float()*(i-t)}int(t,i){return Math.floor(this.range(t,i+1))}bool(t=.5){return this.float()<t}pick(t){return t[this.int(0,t.length-1)]}weightedPick(t){const i=t.reduce((s,n)=>s+n.weight,0);let a=this.float()*i;for(const s of t)if(a-=s.weight,a<=0)return s.value;return t[t.length-1].value}shuffle(t){const i=t.slice();for(let a=i.length-1;a>0;a--){const s=this.int(0,a);[i[a],i[s]]=[i[s],i[a]]}return i}serialize(){return{seed:this.seed,callCount:this.callCount}}}function _t(e,t=0){return new Mi(e,t)}function Li(){return`${Date.now().toString(36)}-${Math.floor(Math.random()*1e9).toString(36)}`}function qi(){return{saveVersion:Te,meta:{createdAt:Date.now(),lastSavedAt:null,slotId:null},rng:{seed:Li(),callCount:0},settings:{soundEnabled:!0,musicEnabled:!0,reducedMotion:(typeof window<"u"&&window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)??!1,confirmExpensiveActions:!0,tutorialEnabled:!0,currencyLocale:"en-US",theme:"expedition",defaultExpeditionSpeed:1},tutorial:{active:!0,currentStep:0,dismissedSteps:[]},profile:{explorerName:"",orgName:"",difficulty:"adventurer"},date:{year:1,month:2,day:4,hour:8},finance:{cash:5e3,totalRevenue:0,totalExpenses:0,loans:[]},reputation:{publicFame:0,academicCredibility:0,fieldReputation:0,ethicalStanding:50},researchPoints:0,organization:{tier:1,tierName:"Garage Office",prestige:0},facilities:[],sponsors:[],player:{name:"",role:"Expedition Leader",skill:{leadership:2,survival:2,negotiation:1},experience:0,fatigue:0},staff:[],crewCandidates:[],vehicles:[],equipment:[],leads:{available:[],active:[],archived:[]},sites:[],activeExpedition:null,expeditionHistory:[],artifacts:[],contracts:[],rivals:[],museum:null,objectives:{main:null,optional:[]},milestones:{completed:[]},achievements:{unlocked:[]},alerts:[],stats:{expeditionsCompleted:0,expeditionsFailed:0,artifactsAuthenticated:0,leadsResolved:0}}}function b(e,t,i){return Math.min(i,Math.max(t,e))}const Di=12,_i=30,vt=24,J=["Common","Notable","Rare","Exceptional","Historic","World-Class"],ee={explorer:{id:"explorer",label:"Explorer",description:"More starting cash, lower risk, forgiving research. A relaxed way to see everything the game offers.",startingCash:8e3,riskMultiplier:.75,equipmentWearMultiplier:.7,researchCostMultiplier:.8,permanentCrewLoss:!1},adventurer:{id:"adventurer",label:"Adventurer",description:"The intended, balanced experience.",startingCash:5e3,riskMultiplier:1,equipmentWearMultiplier:1,researchCostMultiplier:1,permanentCrewLoss:!1},pathfinder:{id:"pathfinder",label:"Pathfinder",description:"Less reliable leads, higher costs, greater wear, harsher consequences. For veterans.",startingCash:3500,riskMultiplier:1.35,equipmentWearMultiplier:1.3,researchCostMultiplier:1.2,permanentCrewLoss:!1}},Hi=[{id:"lost-survey-camp",title:"The Lost Survey Camp",category:"lost-expedition",regionId:"black-mesa-desert",eraId:"late-frontier",cultureId:"continental-survey-corps",source:"Damaged field journal, found in a retired explorer's storage unit",sourceReliability:"uncertain",potentialDescription:"Historic instruments, documents, and mineral samples from a Continental Survey Corps expedition that vanished in 1891 while traversing Black Mesa.",knownRisks:["Extreme heat","Unstable terrain","Limited water"],startingConfidence:{siteLocation:.28,historical:.35,legal:.85},siteTemplateId:"black-mesa-camp-site",evidence:[{id:"damaged-map",category:"map",title:"Water-Stained Survey Map",text:"A hand-drawn map of the Black Mesa basin. The camp marker is smudged beyond recognition, but a faint dotted line traces a route north from the mesa base.",revealedByActionId:"study-historical-maps",supports:null},{id:"journal-entry",category:"document",title:"Journal Entry, Sept. 14, 1891",text:'"...made camp again near the wash, cottonwoods giving what shade they could. Water still running despite the season, though barely."',revealedByActionId:"search-public-records",supports:"B"},{id:"corps-report",category:"survey-report",title:"Continental Survey Corps Incident Report",text:'Filed by a search party in 1892: "No trace of the camp was found on the north ridge as expected. Search called off after eleven days."',revealedByActionId:"search-public-records",supports:"A-was-wrong"},{id:"witness-quote",category:"quote",title:"Rancher's Account (recorded 1938)",text:'"My grandfather always said the survey men were camped down in the draw, not up top where everyone went looking. Said you could see the tents from the quarry road if you knew where to look."',revealedByActionId:"interview-witnesses",supports:"B"},{id:"quarry-lease",category:"document",title:"Old Quarry Lease Record",text:"A mining lease for the abandoned quarry, dated 1889 — two years before the expedition. No mention of the survey corps, but proof the quarry was active nearby.",revealedByActionId:"interview-witnesses",supports:"C-red-herring"},{id:"expert-comparison",category:"survey-report",title:"Academic Terrain Comparison",text:'A hydrologist consulted on the case notes that the described "wash" and "cottonwoods" strongly match a seasonal riverbed formation, not a ridge or a quarry.',revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"North Ridge",description:"The location most searches focused on in 1892."},{id:"B",label:"Dry River Valley",description:"A seasonal wash south of the mesa base."},{id:"C",label:"Abandoned Quarry",description:"An active mining lease from the same period."}],correctConclusionId:"B"},{id:"vine-choked-temple",title:"The Vine-Choked Temple",category:"ancient-tomb",regionId:"thornwood-jungle",eraId:"highland-classical",cultureId:"kaelen-dynasty",source:"A missionary's diary, sold at estate auction decades after his disappearance",sourceReliability:"uncertain",potentialDescription:"Ceremonial masks, jade figures, and carved stelae from a lowland outpost of the Kaelen Dynasty, abandoned within a single generation and swallowed by jungle.",knownRisks:["Venomous wildlife","Unstable temple stonework","Heavy monsoon rain"],startingConfidence:{siteLocation:.24,historical:.3,legal:.55},siteTemplateId:"thornwood-temple-site",evidence:[{id:"missionary-map-sketch",category:"map",title:"Missionary's Sketch Map",text:'A hand-drawn map showing a trade path branching off the main river, ending at a mark labeled only "the ravine shrine."',revealedByActionId:"study-historical-maps",supports:null},{id:"diary-entry",category:"document",title:"Diary Entry, Undated",text:`"...the porters refused to go further than the ravine's edge, saying the temple below had been sealed on purpose. I went on alone."`,revealedByActionId:"search-public-records",supports:"B"},{id:"expedition-permit-record",category:"document",title:"Colonial Survey Office Record",text:`A rejected 1911 permit application to excavate "upper terrace ruins" — the applicant's notes claim the terraces were already stripped bare by looters decades earlier.`,revealedByActionId:"search-public-records",supports:"A-was-wrong"},{id:"porter-descendant-account",category:"quote",title:"Porter's Descendant Account (recorded 1962)",text:`"My grandfather carried for the foreign missionary. He said the real temple was down in the ravine, below the water line in the wet season — that's why no one else ever found it."`,revealedByActionId:"interview-witnesses",supports:"B"},{id:"trading-post-ledger",category:"document",title:"River-Mouth Trading Post Ledger",text:`A merchant's ledger listing jade purchases "from highland sources" — proof of trade, but no mention of a temple at the post itself.`,revealedByActionId:"interview-witnesses",supports:"C-red-herring"},{id:"glyph-analysis",category:"survey-report",title:"Academic Glyph Analysis",text:`An epigrapher notes that the diary's described carvings match a known Kaelen "ravine shrine" motif — a minor temple type deliberately built below the flood line to stay hidden.`,revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"Upper Terrace Ruins",description:"Long-known ruins, already picked over by looters."},{id:"B",label:"Buried Ravine Temple",description:"A minor shrine built deliberately below the flood line."},{id:"C",label:"River-Mouth Trading Post",description:"Where highland goods were known to change hands."}],correctConclusionId:"B"},{id:"vanished-corvane",title:"The Vanished Corvane",category:"shipwreck",regionId:"coral-strait",eraId:"age-of-sail",cultureId:"thalassan-fleet",source:"A salvager's logbook, recovered from a pawn shop lockbox",sourceReliability:"uncertain",potentialDescription:"The Corvane, flagship of the Thalassan Trading Fleet, went down with most of a season's cargo in a storm that claimed half the fleet at once.",knownRisks:["Strong currents","Decompression risk","Sharp coral and unstable debris"],startingConfidence:{siteLocation:.22,historical:.4,legal:.45},siteTemplateId:"coral-strait-wreck-site",evidence:[{id:"insurance-claim-record",category:"document",title:"Lloyd's-Style Insurance Claim",text:`A period insurance claim places the Corvane's last known position near the "north reef shelf" — the position the original search parties trusted.`,revealedByActionId:"search-public-records",supports:"A-was-wrong"},{id:"logbook-entry",category:"document",title:"Salvager's Logbook Entry",text:`"...current pulled us hard toward the channel drop-off. If she went down fighting the storm, that's where she'd have ended up, not the shelf."`,revealedByActionId:"search-public-records",supports:"B"},{id:"harbor-master-account",category:"quote",title:"Harbor Master's Account (recorded 1889)",text:'"Fishermen avoided the channel drop-off for a generation after the storm — said their nets kept catching on something big down there."',revealedByActionId:"interview-witnesses",supports:"B"},{id:"rival-dive-log",category:"document",title:"Rival Salvager's Dive Log",text:"A competing salvage outfit spent an entire season searching the harbor approach shoals and found nothing — a costly dead end.",revealedByActionId:"interview-witnesses",supports:"C-red-herring"},{id:"current-analysis",category:"survey-report",title:"Academic Current Analysis",text:"An oceanographer models the storm-season currents and concludes that anything lost during the wreck event would most likely settle at the channel drop-off, not the shelf or the shoals.",revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"North Reef Shelf",description:"Where the original insurance investigators searched."},{id:"B",label:"Middle Channel Drop-off",description:"A deep-water shelf edge fishermen learned to avoid."},{id:"C",label:"Harbor Approach Shoals",description:"Already searched extensively by a rival outfit."}],correctConclusionId:"B"},{id:"governors-manifest",title:"The Governor's Manifest",category:"royal-treasure",regionId:"coral-strait",eraId:"age-of-sail",cultureId:"thalassan-fleet",source:"A discrepancy noticed while cataloguing the Corvane's cargo manifest",sourceReliability:"credible",potentialDescription:"Fragments of ceremonial regalia meant for the Coral Strait's colonial governor, lost aboard a separate escort vessel — the Regent's Grace — in the same storm that claimed the Corvane.",knownRisks:["Sharp rock shelf near the surface","Sudden squalls with little warning"],startingConfidence:{siteLocation:.35,historical:.5,legal:.5},siteTemplateId:"sail-rock-shallows",evidence:[{id:"cargo-discrepancy-note",category:"document",title:"Manifest Discrepancy",text:`The Corvane's manifest lists a "sealed strongbox, regalia, for the Governor's household" as cargo of the escort vessel Regent's Grace — not the Corvane itself.`,revealedByActionId:"search-public-records",supports:null},{id:"escort-manifest-record",category:"document",title:"Escort Vessel Registry",text:`Records confirm the Regent's Grace sailed as escort and was lost in the same storm, "somewhere off the shallow shelf, having strayed from the channel."`,revealedByActionId:"search-public-records",supports:"B"},{id:"salvager-rumor",category:"quote",title:"Salvager's Rumor (recorded 1901)",text:'"Every diver in this strait knows Sail Rock is where the escort ship went down — you can still find scraps of rigging caught in the shelf."',revealedByActionId:"interview-witnesses",supports:"B"},{id:"rival-claim-filing",category:"document",title:"Abandoned Salvage Claim",text:"A rival outfit filed and later abandoned a salvage claim over the deepwater channel — years of searching turned up nothing.",revealedByActionId:"interview-witnesses",supports:"A-was-wrong"},{id:"tide-chart-analysis",category:"survey-report",title:"Tidal Drift Analysis",text:"A drift model using period tide charts places wreckage from a storm-driven sinking almost exactly over the shallow rock shelf.",revealedByActionId:"study-historical-maps",supports:"B"},{id:"academic-storm-reconstruction",category:"survey-report",title:"Academic Storm Reconstruction",text:"A maritime historian's reconstruction of the storm's path agrees: a vessel that strayed from the channel would have grounded on the shelf, not the deepwater channel or the harbor mouth.",revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"Deepwater Channel",description:"Where a rival spent years searching without success."},{id:"B",label:"Sail Rock Shelf",description:"A shallow rock shelf divers already half-know about."},{id:"C",label:"Harbor Mouth",description:"Close to shore, heavily trafficked ever since."}],correctConclusionId:"B"},{id:"last-diadem",title:"The Last Diadem",category:"royal-treasure",regionId:"coral-strait",eraId:"age-of-sail",cultureId:"thalassan-fleet",source:"A surviving crewman's deathbed confession, transcribed by a local priest",sourceReliability:"credible",potentialDescription:"The Regent's Diadem itself — salvaged from the wreck of the Regent's Grace by a crewman who hid it in sea caves rather than see it lost, and never returned for it.",knownRisks:["Rising tide cutting off the cave mouth","Loose rock in the upper galleries"],startingConfidence:{siteLocation:.4,historical:.55,legal:.6},siteTemplateId:"windward-blowhole-caves",evidence:[{id:"priest-transcription",category:"document",title:"Deathbed Confession",text:'"...I could not let it go down with her. I carried it to the caves at Windward Point and left it where the tide could not reach. God forgive me, I never went back."',revealedByActionId:"search-public-records",supports:"B"},{id:"tide-table-record",category:"document",title:"Period Tide Tables",text:"Tide records for the strait show a narrow daily window when the Windward Point caves are fully accessible on foot.",revealedByActionId:"search-public-records",supports:null},{id:"fisherman-account",category:"quote",title:"Local Fisherman's Account",text:`"We don't go into the blowhole caves at Windward Point. My father wouldn't say why, just that it wasn't worth what might be in there."`,revealedByActionId:"interview-witnesses",supports:"B"},{id:"treasure-hunter-diary",category:"document",title:"Earlier Treasure Hunter's Diary",text:'A diary describes a fruitless month searching the sea stacks further down the coast — "nothing but bird nests and bad footing."',revealedByActionId:"interview-witnesses",supports:"A-was-wrong"},{id:"cave-survey-report",category:"survey-report",title:"Cave System Survey",text:"A survey of the Windward Point caves finds a dry upper gallery well above the tideline — exactly the kind of place a hurried sailor could hide something and expect it to stay hidden.",revealedByActionId:"study-historical-maps",supports:"B"},{id:"academic-confession-analysis",category:"survey-report",title:"Academic Cross-Reference",text:"A historian cross-references the confession's landmarks against known coastal geography and concludes it can only describe the Windward Blowhole Caves.",revealedByActionId:"consult-academic",supports:"B"}],conclusionOptions:[{id:"A",label:"Sea Stack Hollow",description:"Already searched fruitlessly by an earlier treasure hunter."},{id:"B",label:"Windward Blowhole Caves",description:"A cave system locals have quietly avoided for generations."},{id:"C",label:"Harbor Grotto",description:"A well-known, well-visited sea cave near town."}],correctConclusionId:"B"}];function Ni(e){return Hi.find(t=>t.id===e)}const Pi=[{id:"black-mesa-camp-site",name:"Black Mesa Basin",regionId:"black-mesa-desert",environment:"desert",terrain:"Cracked mesa flats cut by dry washes",travelCost:320,travelTimeHours:14,weatherProfile:"Extreme daytime heat, cold nights, rare flash flooding in washes",searchArea:"medium",accessDifficulty:"moderate",legalStatus:"Public land, excavation permit recommended",legalComplexity:.3,localSupport:"low",rivalPresence:"low",hiddenHazards:["Flash flooding in the wash","Loose mesa-edge scree"],artifactTemplateIds:["survey-transit","field-journal","brass-compass","mineral-case","presentation-watch","insignia-badge","ration-tin"],baseDiscoveryPotential:.62},{id:"thornwood-temple-site",name:"The Vine-Choked Temple",regionId:"thornwood-jungle",environment:"jungle",terrain:"Collapsed stepped temple complex under dense canopy",travelCost:620,travelTimeHours:22,weatherProfile:"Daily monsoon rain, high humidity, sudden flash floods in ravines",searchArea:"large",accessDifficulty:"difficult",legalStatus:"Protected cultural heritage site — export permit required",legalComplexity:.7,localSupport:"moderate",rivalPresence:"moderate",hiddenHazards:["Venomous wildlife in the undergrowth","Unstable temple stonework","Flash flooding in the ravine approach"],artifactTemplateIds:["ceremonial-mask","jade-figurine","obsidian-blade","stele-fragment","ceramic-vessel"],baseDiscoveryPotential:.58},{id:"coral-strait-wreck-site",name:"The Corvane Wreck",regionId:"coral-strait",environment:"coastal",terrain:"Shallow reef wreck, hull broken across a coral shelf",travelCost:780,travelTimeHours:18,weatherProfile:"Warm water, strong currents, squalls with little warning",searchArea:"medium",accessDifficulty:"difficult",legalStatus:"Disputed maritime salvage rights",legalComplexity:.6,localSupport:"low",rivalPresence:"high",hiddenHazards:["Strong currents near the reef shelf","Decompression risk on deeper dives","Sharp coral and unstable hull debris"],artifactTemplateIds:["ships-bell","navigational-astrolabe","cargo-manifest","trade-coin-hoard","figurehead-fragment"],baseDiscoveryPotential:.55},{id:"sail-rock-shallows",name:"Sail Rock Shallows",regionId:"coral-strait",environment:"coastal",terrain:"Scattered wreckage across a shallow rock shelf",travelCost:700,travelTimeHours:16,weatherProfile:"Warm water, moderate currents, clearer visibility than the main channel",searchArea:"medium",accessDifficulty:"moderate",legalStatus:"Disputed maritime salvage rights",legalComplexity:.6,localSupport:"low",rivalPresence:"moderate",hiddenHazards:["Sharp rock shelf near the surface","Sudden squalls with little warning"],artifactTemplateIds:["ships-bell","navigational-astrolabe","cargo-manifest","trade-coin-hoard","figurehead-fragment"],baseDiscoveryPotential:.6},{id:"windward-blowhole-caves",name:"The Windward Blowhole Caves",regionId:"coral-strait",environment:"coastal",terrain:"Sea caves carved into the cliffside, partly flooded at high tide",travelCost:750,travelTimeHours:20,weatherProfile:"Tidal flooding on a predictable but unforgiving schedule",searchArea:"small",accessDifficulty:"difficult",legalStatus:"Remote coastline, no active claim",legalComplexity:.4,localSupport:"low",rivalPresence:"high",hiddenHazards:["Rising tide cutting off the cave mouth","Loose rock in the upper galleries"],artifactTemplateIds:[],uniqueArtifactId:"regent-diadem",baseDiscoveryPotential:.7}];function Bi(e){return Pi.find(t=>t.id===e)}const Fi=[{leadId:"vine-choked-temple",siteId:"thornwood-temple-site"},{leadId:"vanished-corvane",siteId:"coral-strait-wreck-site"},{leadId:"governors-manifest",siteId:"sail-rock-shallows"},{leadId:"last-diadem",siteId:"windward-blowhole-caves"}];function Ht(e,t){const i=Ni(e);return{instanceId:`lead-${i.id}`,templateId:i.id,title:i.title,category:i.category,regionId:i.regionId,eraId:i.eraId,cultureId:i.cultureId,source:i.source,sourceReliability:i.sourceReliability,potentialDescription:i.potentialDescription,knownRisks:[...i.knownRisks],discoveredHazards:[],confidence:{...i.startingConfidence},evidence:i.evidence.map(a=>({...a,revealed:!1})),conclusionOptions:i.conclusionOptions,conclusionChosenId:null,correctConclusionId:i.correctConclusionId,researchLog:[],status:"new",siteId:t,rivalInterest:0}}function Ke(e){const t=new Set([...e.leads.available,...e.leads.active,...e.leads.archived].map(n=>n.templateId)),i=Fi.find(n=>!t.has(n.leadId));if(!i)return null;const a=Nt(i.siteId);e.sites.push(a);const s=Ht(i.leadId,a.instanceId);return e.leads.available.push(s),s}function Nt(e){const t=Bi(e);return{instanceId:`site-${t.id}`,templateId:t.id,...Oi(t)}}function Oi(e){return typeof structuredClone=="function"?structuredClone(e):JSON.parse(JSON.stringify(e))}function ue(e,t){return e.leads.available.find(i=>i.instanceId===t)||e.leads.active.find(i=>i.instanceId===t)||e.leads.archived.find(i=>i.instanceId===t)}function pe(e,t){return e.sites.find(i=>i.instanceId===t)}function Vi(e,t){if(!e.conclusionOptions.some(i=>i.id===t))throw new Error(`Invalid conclusion ${t}`);return e.conclusionChosenId=t,e.status="ready",e.conclusionChosenId===e.correctConclusionId}function ji(e){return e.evidence.filter(t=>t.revealed)}const Pt=[{id:"field-shovels",name:"Field Shovels",category:"basic",cost:120,operatingCost:0,weight:3,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","rural","battlefield"],effects:{excavationEfficiency:.08},maintenanceNote:"Rarely needs repair; cheap to replace."},{id:"excavation-brushes",name:"Excavation Brushes",category:"basic",cost:40,operatingCost:0,weight:.5,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","rural","cave","ruins"],effects:{discoveryQuality:.05,artifactDamageReduction:.1},maintenanceNote:"Wears out slowly with use."},{id:"climbing-rope",name:"Climbing Rope",category:"basic",cost:90,operatingCost:0,weight:2,conditionMax:100,requiredSkill:null,environments:["desert","mountain","cave","coastal","ruins"],effects:{hazardMitigation:.12},maintenanceNote:"Replace after heavy wear — frayed rope is a real hazard."},{id:"field-lanterns",name:"Field Lanterns",category:"basic",cost:60,operatingCost:5,weight:1.5,conditionMax:100,requiredSkill:null,environments:["desert","cave","forest","ruins","underground"],effects:{nightSurveyBonus:.1},maintenanceNote:"Consumes fuel/batteries as a supply during use."},{id:"basic-metal-detector",name:"Basic Metal Detector",category:"basic",cost:350,operatingCost:2,weight:4,conditionMax:100,requiredSkill:null,environments:["desert","forest","rural","coastal","battlefield"],effects:{discoveryChance:.12},maintenanceNote:"Battery-powered; degrades with rough handling."},{id:"field-camera",name:"Field Camera",category:"basic",cost:220,operatingCost:3,weight:1,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","cave","coastal","ruins","urban","rural","mountain","battlefield"],effects:{documentationBonus:.1,academicCredibilityGain:.5},maintenanceNote:"Fragile lens — handle with care in rough terrain."},{id:"first-aid-kit",name:"First-Aid Kit",category:"basic",cost:80,operatingCost:1,weight:1,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","cave","coastal","ruins","urban","rural","mountain","battlefield"],effects:{injuryRiskReduction:.15},maintenanceNote:"Restock consumable supplies between expeditions."},{id:"portable-radio",name:"Portable Radio",category:"basic",cost:150,operatingCost:2,weight:2,conditionMax:100,requiredSkill:null,environments:["desert","forest","jungle","cave","coastal","ruins","urban","rural","mountain","battlefield"],effects:{eventWarning:.1,rivalAwarenessReduction:.05},maintenanceNote:"Reliable, but batteries drain fast in extreme heat."},{id:"advanced-metal-detector",name:"Advanced Metal Detector",category:"survey",cost:1400,operatingCost:4,weight:5,conditionMax:100,requiredSkill:{role:"surveyor",level:2},environments:["desert","forest","rural","coastal","battlefield"],effects:{discoveryChance:.22,discoveryQuality:.05},maintenanceNote:"Precision instrument — rough handling degrades accuracy."},{id:"ground-radar",name:"Ground-Penetrating Radar",category:"survey",cost:18e3,operatingCost:12,weight:6,conditionMax:100,requiredSkill:{role:"surveyor",level:3},environments:["desert","forest","urban","battlefield","ruins"],effects:{discoveryQuality:.15,riskReduction:.05},maintenanceNote:"Delicate array under the housing — expensive to fix if dropped."},{id:"magnetometer",name:"Magnetometer",category:"survey",cost:9e3,operatingCost:8,weight:4,conditionMax:100,requiredSkill:{role:"surveyor",level:2},environments:["desert","battlefield","rural","coastal"],effects:{discoveryChance:.1,discoveryQuality:.08},maintenanceNote:"Sensitive to nearby metal — store away from the truck bed."},{id:"survey-drone",name:"Survey Drone",category:"survey",cost:6500,operatingCost:6,weight:3,conditionMax:100,requiredSkill:{role:"surveyor",level:2},environments:["desert","forest","jungle","rural","coastal","mountain","battlefield"],effects:{eventWarning:.15,rivalAwarenessReduction:.1,discoveryChance:.05},maintenanceNote:"Batteries need replacing after heavy use in heat."},{id:"thermal-camera",name:"Thermal Camera",category:"survey",cost:4200,operatingCost:4,weight:2,conditionMax:100,requiredSkill:null,environments:["desert","cave","forest","jungle","ruins","underground"],effects:{nightSurveyBonus:.2,discoveryChance:.05},maintenanceNote:"Lens coating scratches easily in sandy conditions."},{id:"portable-generator",name:"Portable Generator",category:"excavation",cost:2200,operatingCost:10,weight:8,conditionMax:100,requiredSkill:null,environments:["desert","cave","forest","ruins","underground","mountain"],effects:{excavationEfficiency:.1},maintenanceNote:"Needs fuel as a supply during use."},{id:"hydraulic-tools",name:"Hydraulic Tools",category:"excavation",cost:5200,operatingCost:9,weight:10,conditionMax:100,requiredSkill:{role:"excavation-worker",level:2},environments:["desert","cave","ruins","underground","mountain","urban"],effects:{excavationEfficiency:.2,artifactDamageReduction:.1},maintenanceNote:"Hoses perish faster in extreme heat."},{id:"rock-drill",name:"Rock Drill",category:"excavation",cost:7800,operatingCost:14,weight:14,conditionMax:100,requiredSkill:{role:"excavation-worker",level:3},environments:["desert","cave","mountain","underground"],effects:{excavationEfficiency:.28,riskDelta:.03},maintenanceNote:"Bit wears down fast in dense rock — carry spares."},{id:"shoring-equipment",name:"Shoring Equipment",category:"excavation",cost:3400,operatingCost:3,weight:12,conditionMax:100,requiredSkill:null,environments:["desert","cave","ruins","underground","mountain"],effects:{hazardMitigation:.2},maintenanceNote:"Timber and braces — cheap to replace, bulky to carry."},{id:"diving-gear",name:"Diving Gear",category:"marine",cost:2800,operatingCost:6,weight:6,conditionMax:100,requiredSkill:{role:"diver",level:2},environments:["coastal"],effects:{hazardMitigation:.15,discoveryChance:.1},maintenanceNote:"Regulators need servicing after every deep dive."},{id:"sonar-array",name:"Sonar Array",category:"marine",cost:9500,operatingCost:10,weight:5,conditionMax:100,requiredSkill:{role:"diver",level:1},environments:["coastal"],effects:{discoveryChance:.2,discoveryQuality:.05},maintenanceNote:"Hull-mounted — vulnerable to reef strikes at low speed."},{id:"underwater-camera",name:"Underwater Camera",category:"marine",cost:3200,operatingCost:4,weight:2,conditionMax:100,requiredSkill:null,environments:["coastal"],effects:{documentationBonus:.12,academicCredibilityGain:.4},maintenanceNote:"Housing seals need replacing after deep dives."},{id:"remote-operated-vehicle",name:"Remotely Operated Vehicle",category:"marine",cost:22e3,operatingCost:18,weight:9,conditionMax:100,requiredSkill:{role:"diver",level:3},environments:["coastal"],effects:{discoveryQuality:.18,hazardMitigation:.1},maintenanceNote:"Tether and thrusters are delicate — expensive to repair."}];function Q(e){return Pt.find(t=>t.id===e)}function Bt(e){return{instanceId:`equip-${e}-${Math.random().toString(36).slice(2,8)}`,templateId:e,condition:100}}function Ft(e){return e>=85?"Operational":e>=55?"Worn":e>=25?"Damaged":"Broken"}function Ot(e){const t=Q(e.templateId);return t?Math.round((100-e.condition)/100*t.cost*.25):0}function Ui(e){e.condition=100}function Vt(e){return{instanceId:`vehicle-${e}-${Math.random().toString(36).slice(2,8)}`,templateId:e,condition:100}}function jt(e,t){if(e.finalAppraisedValue!=null)return e.finalAppraisedValue;const[i,a]=e.estimatedValueRange,s=(i+a)/2;return Math.round(s*.5)}function Wi(e,t){const i=jt(e),a=!["Authentic","Modern Reproduction","Deliberate Forgery"].includes(e.authenticationOutcome)&&e.trueAuthenticity!=="authentic";return e.disposition="sold",e.saleValue=i,{saleValue:i,ethicalPenalty:a?3:0}}function zi(e){e.disposition="stored"}function Gi(e){e.disposition="displayed"}const Ut=[{id:"search-public-records",label:"Search Public Records",description:"Comb government and local archives for anything matching the lead.",cost:200,timeHours:8,confidenceEffects:{historical:.12}},{id:"study-historical-maps",label:"Study Historical Maps",description:"Compare period maps and survey routes against modern terrain.",cost:350,timeHours:12,confidenceEffects:{siteLocation:.15},hazardRevealChance:.6},{id:"interview-witnesses",label:"Interview Local Witnesses",description:"Track down descendants and locals who might remember something.",cost:150,timeHours:6,confidenceEffects:{siteLocation:.08,historical:.05}},{id:"consult-academic",label:"Consult an Academic",description:"Pay a specialist to review your evidence against the historical record.",cost:500,timeHours:16,confidenceEffects:{historical:.15,legal:.05},reputationEffects:{academicCredibility:.5}}],Xe={"fast-survey":{id:"fast-survey",label:"Fast Survey",description:"Lower cost and shorter duration, but you may miss things.",costMultiplier:.7,durationMultiplier:.6,discoveryModifier:-.12,riskModifier:.05,reputationModifier:0},standard:{id:"standard",label:"Standard Expedition",description:"A balanced, unremarkable approach.",costMultiplier:1,durationMultiplier:1,discoveryModifier:0,riskModifier:0,reputationModifier:0},methodical:{id:"methodical",label:"Methodical Search",description:"Slower and more expensive, with a much better discovery rate.",costMultiplier:1.35,durationMultiplier:1.4,discoveryModifier:.15,riskModifier:-.05,reputationModifier:0},discreet:{id:"discreet",label:"Discreet Operation",description:"Keeps rivals off your trail, but local assistance and legal cover suffer.",costMultiplier:1.1,durationMultiplier:1.1,discoveryModifier:-.05,riskModifier:.05,rivalAwarenessModifier:-.25},academic:{id:"academic",label:"Academic Partnership",description:"A university shares the credit and the cost. Lower financial reward, higher reputation.",costMultiplier:.85,durationMultiplier:1.15,discoveryModifier:.05,riskModifier:-.05,reputationModifier:1,valueMultiplier:.75}},qe={water:1.2,food:2,fuel:3.5,medical:6},Qi={water:6,food:3,fuel:4,medical:.5},Ze=["travel","survey","excavation","discovery","extraction"],Wt={travel:.22,survey:.24,excavation:.26,discovery:.14,extraction:.14},Yi=60,O={base:.32,leadQuality:-.28,equipmentSuitability:-.18,supplyPreparation:-.14,vehicleReliability:-.1,wrongConclusionPenalty:.18,noConclusionPenalty:.08,shortageThreshold:.7,shortagePenalty:.22},ke={leadQuality:.28,equipmentSuitability:.28,siteBasePotential:.22,leaderSkill:.14},Ki=[{max:.28,tier:"Common"},{max:.48,tier:"Notable"},{max:.66,tier:"Rare"},{max:.82,tier:"Exceptional"},{max:.94,tier:"Historic"},{max:1.01,tier:"World-Class"}],ae=["Fragmentary","Poor","Fair","Good","Fine","Pristine"],De={"visual-inspection":{id:"visual-inspection",label:"Visual Inspection",cost:50,timeHours:4,confidenceGain:[.15,.35],description:"A trained eye compares the object against known reference material. Cheap, but far from conclusive."},"material-analysis":{id:"material-analysis",label:"Material Analysis",cost:400,timeHours:12,confidenceGain:[.25,.45],description:"Lab testing of composition and wear patterns against known references for the era."},"expert-consultation":{id:"expert-consultation",label:"Expert Consultation",cost:900,timeHours:20,confidenceGain:[.4,.65],description:"A recognized specialist reviews the piece in person. Expensive, but rarely wrong."},"radiocarbon-dating":{id:"radiocarbon-dating",label:"Radiocarbon Dating",cost:1200,timeHours:30,confidenceGain:[.35,.55],description:"Precise dating of organic material. Requires a Research Lab.",requiresFacility:"research-lab"}},Fe={stabilize:{id:"stabilize",label:"Stabilize",description:"Halts further decay without attempting real repair. Cheap and safe.",costFraction:.05,minCost:80,timeHours:6,conditionTiersGain:1,completenessGain:5,failureChance:0},standard:{id:"standard",label:"Standard Restoration",description:"A proper conservation pass that meaningfully improves condition and display quality.",costFraction:.15,minCost:300,timeHours:16,conditionTiersGain:2,completenessGain:15,failureChance:.05},"museum-grade":{id:"museum-grade",label:"Museum-Grade Conservation",description:"Slow and expensive, but maximizes historical integrity and academic value.",costFraction:.3,minCost:900,timeHours:40,conditionTiersGain:3,completenessGain:30,failureChance:.02,academicWeightBonus:.3},aggressive:{id:"aggressive",label:"Aggressive Restoration",description:"Fast, dramatic visual improvement — but real risk of damaging authenticity in the process.",costFraction:.1,minCost:150,timeHours:8,conditionTiersGain:2,completenessGain:20,failureChance:.22,damagesOnFailure:!0}},Xi=18,M={cost:4e4,prestigeRequired:30,defaultTicketPrice:12,baseDailyVisitors:20,publicFameVisitorWeight:2,academicCredibilityVisitorWeight:1,minTicketPrice:4,maxTicketPrice:40},zt=100,Je=.12,_e=[.75,1.6];function Zi(e,t){return e<.4?"Inconclusive":e<.75?t==="authentic"?"Probably Authentic":"Inconclusive":t==="authentic"?"Authentic":t==="reproduction"?"Modern Reproduction":"Deliberate Forgery"}const Ji=["Authentic","Modern Reproduction","Deliberate Forgery"];function ea(e,t,i){const[a,s]=e.estimatedValueRange,n=(a+s)/2;return t==="Authentic"?Math.round(i.range(a,s)):t==="Modern Reproduction"?Math.round(n*i.range(.08,.2)):t==="Deliberate Forgery"?Math.round(n*i.range(.02,.08)):null}function ta(e,t,i){const a=De[t];if(!a)throw new Error(`Unknown authentication method: ${t}`);const s=i.range(a.confidenceGain[0],a.confidenceGain[1]),n=e.authenticationConfidence||0,r=b(n+s,0,.97),c=Zi(r,e.trueAuthenticity);return e.authenticationConfidence=r,e.authenticationOutcome=c,e.authenticationStatus="inspected",Ji.includes(c)&&(e.finalAppraisedValue=ea(e,c,i),e.authenticationStatus="authenticated"),{method:a,confidence:r,outcome:c}}function Gt(e,t){const i=Fe[t],[a,s]=e.estimatedValueRange,n=(a+s)/2;return Math.max(i.minCost,Math.round(n*i.costFraction))}function ia(e,t,i){const a=Fe[t];if(!a)throw new Error(`Unknown restoration method: ${t}`);const s=i.bool(a.failureChance),n=ae.indexOf(e.condition),r=s?Math.max(0,Math.floor(a.conditionTiersGain/2)):a.conditionTiersGain,c=b(n+r,0,ae.length-1);e.condition=ae[c],e.completeness=b(e.completeness+(s?a.completenessGain/2:a.completenessGain),0,100),e.restorationStatus=t;let d=!1;return s&&a.damagesOnFailure&&(d=!0,e.estimatedValueRange=e.estimatedValueRange.map(l=>Math.round(l*.85)),e.finalAppraisedValue!=null&&(e.finalAppraisedValue=Math.round(e.finalAppraisedValue*.85)),e.authenticationStatus==="authenticated"&&(e.authenticationStatus="inspected",e.authenticationConfidence=b((e.authenticationConfidence||0)-.2,0,.97))),a.academicWeightBonus&&!s&&(e.academicWeight=(e.academicWeight||1)+a.academicWeightBonus),{failed:s,authenticityDamaged:d}}let Z=null,me=null,Qt=!0,gt=!1;function Yt(){if(!Z){const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;Z=new e}return Z.state==="suspended"&&Z.resume().catch(()=>{}),Z}function bt({soundEnabled:e,musicEnabled:t}){Qt=e,t!==gt&&(gt=t,t?na():sa())}function Kt(e,t,{attack:i=.01,peak:a=.2,decay:s=.15,startAt:n}={}){const r=n??t.currentTime;e.gain.cancelScheduledValues(r),e.gain.setValueAtTime(0,r),e.gain.linearRampToValueAtTime(a,r+i),e.gain.exponentialRampToValueAtTime(1e-4,r+i+s)}function j(e,{freq:t,type:i="sine",duration:a=.18,delay:s=0,peak:n=.18}){const r=e.createOscillator(),c=e.createGain();r.type=i,r.frequency.value=t,r.connect(c),c.connect(e.destination);const d=e.currentTime+s;Kt(c,e,{attack:.01,peak:n,decay:a,startAt:d}),r.start(d),r.stop(d+a+.05)}function yt(e,{from:t,to:i,duration:a=.5,type:s="sine",peak:n=.15,delay:r=0}){const c=e.createOscillator(),d=e.createGain();c.type=s,c.connect(d),d.connect(e.destination);const l=e.currentTime+r;c.frequency.setValueAtTime(t,l),c.frequency.exponentialRampToValueAtTime(i,l+a),Kt(d,e,{attack:.02,peak:n,decay:a,startAt:l}),c.start(l),c.stop(l+a+.05)}function Ee(e,{delay:t=0,peak:i=.2}={}){const a=e.sampleRate*.03,s=e.createBuffer(1,a,e.sampleRate),n=s.getChannelData(0);for(let d=0;d<a;d++)n[d]=(Math.random()*2-1)*(1-d/a);const r=e.createBufferSource();r.buffer=s;const c=e.createGain();c.gain.value=i,r.connect(c),c.connect(e.destination),r.start(e.currentTime+t)}const aa={click:e=>Ee(e,{peak:.12}),select:e=>j(e,{freq:420,type:"triangle",duration:.08,peak:.1}),success:e=>{j(e,{freq:523,duration:.14,peak:.15}),j(e,{freq:659,duration:.18,peak:.15,delay:.09})},error:e=>j(e,{freq:160,type:"sawtooth",duration:.22,peak:.14}),cashRegister:e=>{Ee(e,{peak:.15}),j(e,{freq:880,type:"square",duration:.06,peak:.08,delay:.03})},auctionHammer:e=>{Ee(e,{peak:.3}),j(e,{freq:140,type:"square",duration:.1,peak:.12,delay:.01})},cameraShutter:e=>Ee(e,{peak:.22}),vehicleDeparture:e=>yt(e,{from:90,to:140,type:"sawtooth",duration:.4,peak:.1}),discoveryReveal:e=>{yt(e,{from:220,to:660,duration:.6,peak:.12}),j(e,{freq:880,duration:.3,peak:.14,delay:.55})},achievement:e=>{[523,659,784,1046].forEach((t,i)=>j(e,{freq:t,duration:.22,peak:.13,delay:i*.09}))},alert:e=>j(e,{freq:700,type:"triangle",duration:.1,peak:.1})};function P(e){if(!Qt)return;const t=Yt();if(!t)return;const i=aa[e];if(i)try{i(t)}catch{}}function na(){const e=Yt();if(!e||me)return;const t=e.createGain();t.gain.value=0,t.connect(e.destination),t.gain.linearRampToValueAtTime(.035,e.currentTime+2);const i=e.createBiquadFilter();i.type="lowpass",i.frequency.value=500,i.connect(t);const a=[110,165,220].map(r=>{const c=e.createOscillator();return c.type="sine",c.frequency.value=r,c.connect(i),c.start(),c}),s=e.createOscillator();s.frequency.value=.05;const n=e.createGain();n.gain.value=200,s.connect(n),n.connect(i.frequency),s.start(),me={masterGain:t,filter:i,oscillators:a,lfo:s}}function sa(){if(!me||!Z)return;const{masterGain:e,oscillators:t,lfo:i}=me,a=Z.currentTime+1.2;e.gain.linearRampToValueAtTime(0,a),t.forEach(s=>s.stop(a)),i.stop(a),me=null}function ra(e,t){let i=e.hour+t,a=e.day,s=e.month,n=e.year;for(;i>=vt;)i-=vt,a+=1,a>_i&&(a=1,s+=1,s>=Di&&(s=0,n+=1));return e.year=n,e.month=s,e.day=a,e.hour=Math.round(i),e}function R(e,t){e.alerts.unshift({id:`alert-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,at:Date.now(),read:!1,...t}),e.alerts.length>30&&(e.alerts.length=30)}const oa=[{id:1,condition:e=>e.stats.expeditionsCompleted>=1,title:"Milestone: First Expedition Complete",message:"Artifact authentication is now available in your Collection."},{id:2,condition:e=>e.finance.totalRevenue>=15e3,title:"Milestone: $15,000 Earned",message:"Your organization has the standing to start hiring staff."},{id:3,condition:e=>e.reputation.fieldReputation>=10,title:"Milestone: Field Reputation 10",message:"Advanced equipment suppliers are starting to take you seriously."},{id:4,condition:e=>e.stats.artifactsAuthenticated>=10,title:"Milestone: Ten Artifacts Authenticated",message:"A dedicated conservation lab is within reach."},{id:5,condition:e=>e.stats.expeditionsCompleted>=5,title:"Milestone: Five Expeditions Complete",message:"International leads are starting to surface."},{id:6,condition:e=>e.organization.prestige>=30,title:"Milestone: Prestige 30",message:"You could support a private museum."},{id:7,condition:e=>e.vehicles.length>=3,title:"Milestone: Three Vehicles Owned",message:"Your fleet can now support simultaneous expeditions."},{id:8,condition:e=>e.artifacts.some(t=>t.rarity==="Historic"||t.rarity==="World-Class"),title:"Milestone: Historic-Tier Discovery",message:"Documentary studios have taken notice of your work."}];function ze(e){const t=[];for(const i of oa)e.milestones.completed.includes(i.id)||i.condition(e)&&(e.milestones.completed.push(i.id),R(e,{type:"milestone",title:i.title,message:i.message}),P("achievement"),t.push(i.id));return t}const ca={"first-find":e=>e.artifacts.length>=1,"proven-authentic":e=>e.stats.artifactsAuthenticated>=1,"worth-the-risk":e=>e.expeditionHistory.some(t=>t.finalRisk>=.55&&t.success),"returned-to-history":e=>e.artifacts.some(t=>t.disposition==="donated"),"expedition-leader":e=>e.stats.expeditionsCompleted>=5,"academic-respect":e=>e.reputation.academicCredibility>=20,"hundred-artifacts":e=>e.artifacts.length>=100,"world-class-discovery":e=>e.artifacts.some(t=>t.rarity==="World-Class"),"rival-beaten":e=>e.expeditionHistory.some(t=>t.success&&t.rivalInterestAtLaunch>=.5),"no-stone-unturned":e=>e.expeditionHistory.some(t=>t.fullyResearchedAtLaunch),"into-the-deep":e=>e.expeditionHistory.some(t=>t.success&&t.environment==="coastal"),"beneath-the-sand":e=>e.expeditionHistory.some(t=>t.success&&t.environment==="desert"),"museum-opening":e=>!!e.museum?.built,"sold-at-auction":e=>e.artifacts.some(t=>t.soldVia==="auction"),"fully-equipped":e=>{const t=new Set(e.equipment.map(i=>Q(i.templateId)?.category).filter(Boolean));return["basic","survey","excavation","marine"].every(i=>t.has(i))},"legendary-explorer":e=>e.organization.prestige>=zt};function X(e){const t=[];for(const[i,a]of Object.entries(ca))e.achievements.unlocked.includes(i)||a(e)&&(e.achievements.unlocked.push(i),R(e,{type:"achievement",title:"Achievement Unlocked",message:i}),P("achievement"),t.push(i));return t}function Y(e){const t=e.reputation,i=Math.round(t.publicFame*.25+t.academicCredibility*.25+t.fieldReputation*.25+(t.ethicalStanding-50)*.1+e.stats.expeditionsCompleted*1.5);return e.organization.prestige=Math.min(zt,Math.max(0,i)),e.organization.prestige}const Xt=[{id:"archaeologist",label:"Archaeologist",description:"Reads a site the way most people read a room.",salaryRange:[80,160],synergy:{discoveryBonus:.06,academicCredibilityGain:.3}},{id:"historian",label:"Historian",description:"Passively speeds up and cheapens research while on staff.",salaryRange:[70,140],synergy:{researchCostMultiplier:.9}},{id:"excavation-worker",label:"Excavation Worker",description:"Does the digging without wrecking what's underneath.",salaryRange:[50,100],synergy:{riskDelta:-.03,discoveryBonus:.02}},{id:"surveyor",label:"Surveyor",description:"Narrows down a search area fast and safely.",salaryRange:[60,120],synergy:{riskDelta:-.04}},{id:"mechanic",label:"Mechanic",description:"Keeps vehicles and equipment running longer.",salaryRange:[60,110],synergy:{vehicleReliabilityBonus:.08,equipmentWearReduction:.15}},{id:"medic",label:"Medic",description:"Lowers the odds anything in the field goes seriously wrong.",salaryRange:[70,130],synergy:{riskDelta:-.05}},{id:"translator",label:"Translator",description:"Passively speeds up research involving documents and inscriptions.",salaryRange:[60,120],synergy:{researchCostMultiplier:.92}},{id:"photographer",label:"Photographer",description:"Documentation that impresses academics and sponsors alike.",salaryRange:[55,100],synergy:{academicCredibilityGain:.4,discoveryBonus:.02}},{id:"logistics-coordinator",label:"Logistics Coordinator",description:"Stretches every unit of water, food, and fuel further.",salaryRange:[65,120],synergy:{supplyEfficiency:.1}},{id:"security-specialist",label:"Security Specialist",description:"Keeps rivals guessing and the crew safer when it matters.",salaryRange:[70,130],synergy:{rivalAwarenessReduction:.1,riskDelta:-.02}},{id:"diver",label:"Diver",description:"Makes underwater recovery work possible at all, and safer.",salaryRange:[90,170],synergy:{riskDelta:-.06,discoveryBonus:.03}},{id:"boat-captain",label:"Boat Captain",description:"Keeps the boat where it needs to be, even when the water doesn't cooperate.",salaryRange:[80,150],synergy:{vehicleReliabilityBonus:.1,riskDelta:-.02}}];function ve(e){return Xt.find(t=>t.id===e)}const la=["Elena","Marcus","Priya","Tomas","Naledi","Soren","Yuki","Diego","Freya","Kwame","Amara","Viktor","Lucia","Hana","Owen","Zara","Felix","Ingrid","Rashid","Colette"],da=["Okafor","Reyes","Nakamura","Petrov","Dubois","Alvarez","Kowalski","Mensah","Larsen","Iyer","Costa","Haddad","Novak","Fontaine","Singh"],nt=[{id:"careful",label:"Careful",description:"Reduces equipment damage and artifact damage risk."},{id:"resourceful",label:"Resourceful",description:"Occasionally resolves supply shortages without penalty."},{id:"fearless",label:"Fearless",description:"Immune to morale loss from hazard events."},{id:"methodical",label:"Methodical",description:"Improves discovery quality on thorough approaches."},{id:"local-expert",label:"Local Expert",description:"Reduces travel time and rival awareness in their home region."},{id:"multilingual",label:"Multilingual",description:"Improves translation and interview research actions."},{id:"mechanically-gifted",label:"Mechanically Gifted",description:"Reduces vehicle and equipment failure chance."},{id:"strong-swimmer",label:"Strong Swimmer",description:"Reduces risk on marine expeditions."},{id:"keen-eye",label:"Keen Eye",description:"Improves survey confidence gains."},{id:"calm-under-pressure",label:"Calm Under Pressure",description:"Improves outcomes on high-risk field event choices."}],Zt=[{id:"reckless",label:"Reckless",description:"Higher risk, but occasionally faster results."},{id:"superstitious",label:"Superstitious",description:"Morale drops sharply after ominous discoveries."},{id:"expensive",label:"Expensive",description:"Higher salary expectations."},{id:"argumentative",label:"Argumentative",description:"Occasionally lowers crew morale."},{id:"fame-seeking",label:"Fame-Seeking",description:"Wants media attention; upset when denied it."},{id:"claustrophobic",label:"Claustrophobic",description:"Morale penalty in caves and tight excavations."},{id:"seasick",label:"Seasick",description:"Performance penalty on boats."},{id:"injury-prone",label:"Injury-Prone",description:"Higher chance of temporary injury."},{id:"secretive",label:"Secretive",description:"Occasionally withholds useful information."},{id:"rival-connections",label:"Rival Connections",description:"Small chance of leaking intel to rivals."}];function ua(e){const t=e.pick(Xt),i=e.bool(.65)?e.pick(nt):e.pick(Zt);return{instanceId:`crew-${t.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,name:`${e.pick(la)} ${e.pick(da)}`,roleId:t.id,salary:Math.round(e.range(t.salaryRange[0],t.salaryRange[1])),skillLevel:e.int(1,4),experience:0,morale:80,fatigue:0,reliability:Math.round(e.range(.5,.95)*100)/100,riskTolerance:Math.round(e.range(.2,.8)*100)/100,loyalty:Math.round(e.range(.4,.9)*100)/100,traitId:i.id}}function Jt(e,t=3){return Array.from({length:t},()=>ua(e))}function pa(e){return nt.find(t=>t.id===e)||Zt.find(t=>t.id===e)}function ha(e){return nt.some(t=>t.id===e)}function fa(e,t=1){e.experience+=t;const i=e.skillLevel*5;return e.experience>=i&&e.skillLevel<5?(e.skillLevel+=1,e.experience=0,!0):!1}function ma(e){let t=1;for(const i of e){const a=ve(i.roleId);a?.synergy?.researchCostMultiplier&&(t*=a.synergy.researchCostMultiplier)}return b(t,.5,1)}const et=[{id:"sterling-cross",name:"Sterling Cross Expeditions",style:"Wealthy and aggressive, with excellent equipment and a weak academic reputation.",specialtyCategories:["lost-expedition","ancient-tomb"],specialtyEnvironments:["desert","jungle"]},{id:"meridian-research-group",name:"Meridian Research Group",style:"University-backed and methodical, with strong permit access and fast publication.",specialtyCategories:["ancient-tomb","hidden-archive"],specialtyEnvironments:["jungle","ruins"]},{id:"black-tide-recovery",name:"Black Tide Recovery",style:"Marine specialists who take big risks to win wreck sites.",specialtyCategories:["shipwreck"],specialtyEnvironments:["coastal"]},{id:"voss-antiquities",name:"Voss Antiquities",style:"A collector network with real market influence and questionable ethics.",specialtyCategories:["shipwreck","royal-treasure","missing-artwork"],specialtyEnvironments:["coastal","urban"]}];function va(e,t,i){const a=et.filter(n=>n.specialtyCategories.includes(e)||n.specialtyEnvironments.includes(t)),s=a.length?a:et;return i.pick(s)}const ga={low:.6,moderate:1,high:1.5};function ba(e,t,i){const a=ga[t.rivalPresence]??1,s=i.range(.03,.08)*a;return e.rivalInterest=b((e.rivalInterest||0)+s,0,1),e.rivalInterest}function ya(e,t,i){if(e.rivalDisturbed||e.rivalInterest<.75||!i.bool(.25))return null;const a=va(e.category,t.environment,i);return e.rivalDisturbed=!0,e.rivalId=a.id,t.baseDiscoveryPotential=b(t.baseDiscoveryPotential-.15,.2,1),a}function wa(e){return e>=.75?"Critical":e>=.5?"High":e>=.25?"Moderate":"Low"}const ei=[{id:"archive",name:"Archive",description:"Organized records cut the cost of every research action.",cost:2e3,minTier:1,effectKey:"researchCostMultiplier",effectValue:.9},{id:"workshop",name:"Workshop",description:"A proper bench and spare parts make repairs far cheaper.",cost:3e3,minTier:1,effectKey:"repairCostMultiplier",effectValue:.7},{id:"crew-quarters",name:"Crew Quarters",description:"Room to house more staff between expeditions.",cost:4e3,minTier:1,effectKey:"maxStaffBonus",effectValue:3},{id:"research-lab",name:"Research Lab",description:"Proper equipment for cross-referencing evidence — every research action goes further.",cost:12e3,minTier:2,effectKey:"researchConfidenceMultiplier",effectValue:1.15},{id:"vehicle-garage",name:"Vehicle Garage",description:"Covered storage and maintenance bays for a larger fleet, at a lower running cost.",cost:8e3,minTier:2,effectKey:"vehicleOperatingCostMultiplier",effectValue:.85,secondaryEffectKey:"maxVehiclesBonus",secondaryEffectValue:2}];function _(e){return ei.find(t=>t.id===e)}const ti=[{tier:1,name:"Garage Office",prestigeRequired:0,cost:0,baseMaxStaff:0,baseMaxVehicles:1,baseMaxFacilities:2},{tier:2,name:"Field Operations Center",prestigeRequired:12,cost:15e3,baseMaxStaff:3,baseMaxVehicles:2,baseMaxFacilities:2},{tier:3,name:"Research Warehouse",prestigeRequired:30,cost:55e3,baseMaxStaff:6,baseMaxVehicles:3,baseMaxFacilities:4},{tier:4,name:"Expedition Campus",prestigeRequired:55,cost:15e4,baseMaxStaff:10,baseMaxVehicles:5,baseMaxFacilities:6},{tier:5,name:"International Headquarters",prestigeRequired:85,cost:4e5,baseMaxStaff:16,baseMaxVehicles:8,baseMaxFacilities:9}];function Oe(e){return ti.find(t=>t.tier===e)}function ii(e){return ti.find(t=>t.tier===e+1)||null}function ka(e){const t=e.facilities.map(i=>i.templateId);return ei.filter(i=>i.minTier<=e.organization.tier&&!t.includes(i.id))}function Ve(e,t){return e.facilities.some(i=>i.templateId===t)}function Ea(e,t,i){const a=e.facilities.find(s=>_(s.templateId)?.effectKey===t);return a?_(a.templateId).effectValue:i}function Sa(e,t,i){const a=e.facilities.find(s=>_(s.templateId)?.secondaryEffectKey===t);return a?_(a.templateId).secondaryEffectValue:i}function xa(e){return Ve(e,"archive")?_("archive").effectValue:1}function $a(e){return Ve(e,"research-lab")?_("research-lab").effectValue:1}function ai(e){return Ve(e,"workshop")?_("workshop").effectValue:1}function Ca(e){return Ve(e,"vehicle-garage")?_("vehicle-garage").effectValue:1}function ni(e){const t=Oe(e.organization.tier),i=Ea(e,"maxStaffBonus",0);return t.baseMaxStaff+i}function si(e){const t=Oe(e.organization.tier),i=Sa(e,"maxVehiclesBonus",0);return t.baseMaxVehicles+i}function ri(e){return Oe(e.organization.tier).baseMaxFacilities}const oi=[{id:"aldergate-outdoor",name:"Aldergate Outdoor Co.",category:"Outdoor-equipment brand",description:"A gear manufacturer wants your expeditions wearing their logo. Good exposure, thin academic credibility.",signingBonus:2500,reputationEffects:{publicFame:5,academicCredibility:-3},perk:{key:"equipmentCostMultiplier",value:.9,label:"10% off all equipment purchases"}},{id:"meridewell-foundation",name:"Meridewell University Foundation",category:"Research foundation",description:"A research grant in exchange for first refusal on your finds — they expect a discount when you sell.",signingBonus:1500,reputationEffects:{academicCredibility:5},perk:{key:"saleValueMultiplier",value:.88,label:"Private sale values reduced 12% (first-refusal terms)"},perkSecondary:{key:"researchConfidenceMultiplier",value:1.08,label:"+8% research confidence gains"}},{id:"corvane-media",name:"Corvane Media Group",category:"Documentary studio",description:"A documentary deal brings a media splash — and coverage that oversells what you've actually confirmed.",signingBonus:4e3,reputationEffects:{publicFame:10,ethicalStanding:-5},perk:null}];function st(e){return oi.find(t=>t.id===e)}function Ia(e){return e.sponsors.map(t=>st(t.templateId)).filter(Boolean)}function rt(e,t,i){let a=i;for(const s of Ia(e))s.perk?.key===t&&(a*=s.perk.value),s.perkSecondary?.key===t&&(a*=s.perkSecondary.value);return a}function wt(e){return rt(e,"equipmentCostMultiplier",1)}function kt(e){return rt(e,"saleValueMultiplier",1)}function Aa(e){return rt(e,"researchConfidenceMultiplier",1)}function Ra(e){const t=new Set(e.sponsors.map(i=>i.templateId));return oi.filter(i=>!t.has(i.id))}const ci=[{id:"meridewell-grant",title:"Meridewell Research Grant",client:"Meridewell University",description:"Complete any successful expedition and share your findings for academic credit.",objectiveType:"complete-expedition",reward:{cash:2e3,reputationEffects:{academicCredibility:4}}},{id:"private-collector-request",title:"Private Collector Request",client:"Anonymous Private Collector",description:"Sell an artifact of Rare rarity or better.",objectiveType:"sell-rarity",minRarityIndex:J.indexOf("Rare"),reward:{cash:3e3,reputationEffects:{fieldReputation:3}}},{id:"heritage-return-request",title:"Cultural Heritage Return",client:"Regional Heritage Office",description:"Donate any recovered artifact to a public institution.",objectiveType:"donate-artifact",reward:{cash:500,reputationEffects:{ethicalStanding:6,academicCredibility:2}}}];function He(e){return ci.find(t=>t.id===e)}function Ta(e){const t=new Set(e.contracts.map(i=>i.templateId));return ci.filter(i=>!t.has(i.id))}function Ma(e,t,i,a){if(t.cash&&(e.finance.cash+=t.cash,e.finance.totalRevenue+=t.cash),t.reputationEffects)for(const[s,n]of Object.entries(t.reputationEffects))e.reputation[s]=b((e.reputation[s]||0)+n,0,100);i&&i(e,{type:"success",title:"Contract Fulfilled",message:a})}function Se(e,t,i,a){const s=[];for(const n of e.contracts){if(n.status!=="active")continue;const r=He(n.templateId);if(r.objectiveType!==t)continue;let c=!1;t==="complete-expedition"&&i.success&&(c=!0),t==="sell-rarity"&&J.indexOf(i.rarity)>=r.minRarityIndex&&(c=!0),t==="donate-artifact"&&(c=!0),c&&(n.status="completed",Ma(e,r.reward,a,r.title),s.push(n))}return s}const li=[{id:"frontier-expeditions",label:"Frontier Expeditions",description:"Instruments and records from the last great continental surveys.",cultureIds:["continental-survey-corps"]},{id:"highland-civilizations",label:"Highland Civilizations",description:"Ceremonial artifacts from a highland dynasty reclaimed by jungle.",cultureIds:["kaelen-dynasty"]},{id:"maritime-discoveries",label:"Maritime Discoveries",description:"Recovered cargo and instruments from an age of trading fleets.",cultureIds:["thalassan-fleet"]},{id:"unsolved-mysteries",label:"Unsolved Mysteries",description:"A catch-all gallery for anything that doesn't fit elsewhere yet — flexible, but never as striking as a focused room.",cultureIds:[]}];function ot(e){return li.find(t=>t.id===e)}const di={"continental-survey-corps":{id:"continental-survey-corps",label:"Continental Survey Corps",eraId:"late-frontier",regionIds:["black-mesa-desert"],description:"A government-chartered survey outfit that mapped the western frontier before mysteriously losing contact with several expeditions.",motifs:["engraved survey markers","compass rose stamps","corps insignia","hand-ruled coordinate tables"]},"kaelen-dynasty":{id:"kaelen-dynasty",label:"Kaelen Dynasty",eraId:"highland-classical",regionIds:["thornwood-jungle"],description:"A highland temple-building civilization whose lowland outposts were abandoned and reclaimed by jungle within a single generation.",motifs:["stepped temple reliefs","jaguar-headed glyphs","jade inlay","sunburst carvings"]},"thalassan-fleet":{id:"thalassan-fleet",label:"Thalassan Trading Fleet",eraId:"age-of-sail",regionIds:["coral-strait"],description:"A merchant trading company whose galleons ran the strait for a century before a single storm season ended most of the fleet.",motifs:["company crest medallions","carved figureheads","ledger seals","star-and-compass rigging marks"]}};function ui(e,t){return e.artifacts.filter(i=>t.artifactIds.includes(i.id))}function pi(e,t){const i=ui(t,e);if(!i.length)return 0;const a=ot(e.themeId),s=i.reduce((d,l)=>d+J.indexOf(l.rarity),0)/i.length/(J.length-1),n=Math.min(i.length/5,1)*.2,c=a.cultureIds.length>0&&i.every(d=>a.cultureIds.some(l=>d.culture===La(l)))?.15:0;return b(s*.65+n+c,0,1)}function La(e){return di[e]?.label}function qa(e){if(!e.museum?.exhibits.length)return 0;const t=e.museum.exhibits.map(i=>pi(i,e));return t.reduce((i,a)=>i+a,0)/t.length}function Da(e,t){if(!e.museum?.built||t<=0)return null;const a=.5+qa(e)*1,s=e.reputation.publicFame*M.publicFameVisitorWeight+e.reputation.academicCredibility*M.academicCredibilityVisitorWeight,n=b(1-(e.museum.ticketPrice-10)*.02,.4,1.3),r=(M.baseDailyVisitors+s)*a*n,c=Math.round(r*(t/24)),d=Math.round(c*e.museum.ticketPrice);return e.museum.totalVisitors+=c,e.museum.totalRevenue+=d,e.finance.cash+=d,e.finance.totalRevenue+=d,{visitors:c,revenue:d}}function hi(e){return Ut.find(t=>t.id===e)}function _a(e,t,i,a,s=1){const n=hi(i);if(!n)throw new Error(`Unknown research action: ${i}`);const r={...e.confidence};for(const[f,h]of Object.entries(n.confidenceEffects))e.confidence[f]=b((e.confidence[f]??0)+h*s,0,.97);const c=e.evidence.find(f=>f.revealedByActionId===i&&!f.revealed);c&&(c.revealed=!0);let d=null;if(n.hazardRevealChance&&t&&a.bool(n.hazardRevealChance)){const f=t.hiddenHazards.filter(h=>!e.discoveredHazards.includes(h));f.length&&(d=a.pick(f),e.discoveredHazards.push(d))}if(n.reputationEffects){e.pendingReputationEffects={...e.pendingReputationEffects||{}};for(const[f,h]of Object.entries(n.reputationEffects))e.pendingReputationEffects[f]=(e.pendingReputationEffects[f]||0)+h}const l=Object.entries(n.confidenceEffects).map(([f])=>{const h=f==="siteLocation"?"Site-location confidence":f==="historical"?"Historical confidence":"Legal confidence",u=Math.round((r[f]??0)*100),v=Math.round(e.confidence[f]*100);return`${h}: ${u}% → ${v}%`}),p={actionId:i,label:n.label,at:Date.now(),evidenceRevealedId:c?.id??null,hazardRevealed:d,deltaLines:l};return e.researchLog=e.researchLog||[],e.researchLog.push(p),e.status="researching",p}function fi(e){const t=Object.values(e.confidence);return t.length?t.reduce((i,a)=>i+a,0)/t.length:0}const mi=[{id:"used-pickup-truck",name:"Used Pickup Truck",tier:1,cost:0,operatingCostPerTrip:180,crewCapacity:2,cargoCapacity:12,equipmentCapacity:8,range:"regional",reliability:.8,environments:["desert","rural","forest","battlefield"],description:"Dependable more often than not. The suspension has seen better decades."},{id:"off-road-vehicle",name:"Off-Road Expedition Vehicle",tier:2,cost:14e3,operatingCostPerTrip:220,crewCapacity:4,cargoCapacity:20,equipmentCapacity:14,range:"regional",reliability:.9,environments:["desert","rural","forest","mountain","battlefield","jungle"],description:"Built for terrain that ends most vehicles' expeditions early."},{id:"coastal-research-boat",name:"Coastal Research Boat",tier:2,cost:26e3,operatingCostPerTrip:300,crewCapacity:4,cargoCapacity:14,equipmentCapacity:10,range:"coastal",reliability:.82,environments:["coastal"],description:"Built for reef work and shallow wreck recovery, not open-ocean crossings."}];function ge(e){return mi.find(t=>t.id===e)}const ct=[{id:"survey-transit",objectType:"Surveyor's Transit",category:"instrument",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["brass","steel","glass"],possibleFeatures:["engraved corps insignia","a cracked leveling bubble","a hand-fitted replacement leg","faint sighting-scope etching"],possibleInscriptions:["Property of the Continental Survey Corps","Instrument No. 14 — Western Division",null],baseMarketValue:[1800,6500],academicWeight:1.4,rarityBias:{Common:2,Notable:3,Rare:2,Exceptional:1}},{id:"field-journal",objectType:"Field Journal",category:"document",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["paper","leather"],possibleFeatures:["water-damaged final pages","a pressed desert flower between leaves","coordinate tables in a second hand","a torn-out final entry"],possibleInscriptions:["Survey Log — Black Mesa Traverse","Personal property, return to family if found",null],baseMarketValue:[900,12e3],academicWeight:2.1,rarityBias:{Notable:3,Rare:3,Exceptional:2,Historic:1}},{id:"brass-compass",objectType:"Pocket Compass",category:"instrument",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["brass","glass"],possibleFeatures:["a spider-cracked glass face","an engraved presentation inscription","a needle frozen off true north"],possibleInscriptions:["To J.H. — safe travels","C.S.C. Issue Mk II",null],baseMarketValue:[600,3200],academicWeight:.8,rarityBias:{Common:4,Notable:3,Rare:1}},{id:"mineral-case",objectType:"Mineral Sample Case",category:"container",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["wood","iron","glass"],possibleFeatures:["hand-labeled sample slots","several samples still intact","a corps inventory sticker"],possibleInscriptions:["Sample Set 7 — Black Mesa Traverse",null],baseMarketValue:[500,4e3],academicWeight:1.6,rarityBias:{Common:3,Notable:3,Rare:2}},{id:"presentation-watch",objectType:"Engraved Pocket Watch",category:"personal-effect",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["silver","brass","glass"],possibleFeatures:["a stopped movement frozen at a specific hour","a hinged case with a hidden photograph","heavy corrosion around the winding stem"],possibleInscriptions:["For years of service — C.S.C.",'Initials "E.V." engraved on the case back',null],baseMarketValue:[1200,9e3],academicWeight:1,rarityBias:{Notable:2,Rare:3,Exceptional:2,Historic:1}},{id:"insignia-badge",objectType:"Corps Insignia Badge",category:"personal-effect",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["brass","iron"],possibleFeatures:["a bent pin clasp","traces of original enamel paint","a serial number stamped on the reverse"],possibleInscriptions:["Continental Survey Corps — Western Division",null],baseMarketValue:[300,1800],academicWeight:.6,rarityBias:{Common:5,Notable:2}},{id:"ration-tin",objectType:"Water Ration Tin",category:"tool",compatibleEras:["late-frontier"],compatibleCultures:["continental-survey-corps"],compatibleMaterials:["iron","steel"],possibleFeatures:["a dented, sand-scoured surface","a stenciled ration quantity","evidence it was reused as a tool"],possibleInscriptions:["C.S.C. Field Ration — 1 Quart",null],baseMarketValue:[80,400],academicWeight:.3,rarityBias:{Common:6,Notable:1}}];ct.push({id:"ceremonial-mask",objectType:"Ceremonial Mask",category:"ceremonial-object",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["jade","obsidian","gold"],possibleFeatures:["inlaid obsidian eyes","a cracked jaguar motif","traces of red pigment","a repaired hairline fracture"],possibleInscriptions:["A stepped-glyph dedication to a highland ancestor","A jaguar-headed maker's mark",null],baseMarketValue:[4e3,22e3],academicWeight:1.8,rarityBias:{Notable:2,Rare:3,Exceptional:2,Historic:1}},{id:"jade-figurine",objectType:"Jade Figurine",category:"ceremonial-object",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["jade"],possibleFeatures:["a finely polished surface","a chipped base","a drilled suspension hole"],possibleInscriptions:[null],baseMarketValue:[2500,14e3],academicWeight:1.2,rarityBias:{Common:2,Notable:3,Rare:2}},{id:"obsidian-blade",objectType:"Obsidian Ceremonial Blade",category:"tool",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["obsidian","gold"],possibleFeatures:["a knapped edge still sharp after centuries","a gold-wrapped handle","ceremonial notching along the spine"],possibleInscriptions:[null],baseMarketValue:[1800,9e3],academicWeight:1.1,rarityBias:{Common:3,Notable:3,Rare:1}},{id:"stele-fragment",objectType:"Carved Stele Fragment",category:"architecture",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["stone"],possibleFeatures:["a partial glyph sequence","weathering that obscures half the carving","a sunburst motif border"],possibleInscriptions:["A partial king-list glyph sequence","A dedication date glyph",null],baseMarketValue:[3e3,18e3],academicWeight:2.4,rarityBias:{Rare:2,Exceptional:3,Historic:2,"World-Class":1}},{id:"ceramic-vessel",objectType:"Painted Ceramic Vessel",category:"personal-effect",compatibleEras:["highland-classical"],compatibleCultures:["kaelen-dynasty"],compatibleMaterials:["ceramic"],possibleFeatures:["a painted procession scene","a repaired break along the rim","soot staining from ritual use"],possibleInscriptions:[null],baseMarketValue:[900,6e3],academicWeight:1,rarityBias:{Common:4,Notable:3,Rare:1}});ct.push({id:"ships-bell",objectType:"Ship's Bell",category:"instrument",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["bronze"],possibleFeatures:["heavy coral encrustation","a legible cast ship name","a hairline crack from the wreck impact"],possibleInscriptions:["Cast with the vessel's name and launch year",null],baseMarketValue:[3e3,16e3],academicWeight:1.6,rarityBias:{Notable:3,Rare:3,Exceptional:1}},{id:"navigational-astrolabe",objectType:"Mariner's Astrolabe",category:"instrument",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["brass","bronze"],possibleFeatures:["a corroded but intact alidade","engraved degree markings","a company crest medallion"],possibleInscriptions:["Thalassan Fleet Instrument Register No. 4",null],baseMarketValue:[5e3,26e3],academicWeight:2,rarityBias:{Rare:2,Exceptional:3,Historic:2,"World-Class":1}},{id:"cargo-manifest",objectType:"Cargo Manifest",category:"document",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["paper"],possibleFeatures:["water-sealed pages preserved in an oilskin pouch","a torn final page","a wax ledger seal still intact"],possibleInscriptions:["A full cargo ledger in the purser's hand","A route log with a final, unfinished entry",null],baseMarketValue:[1200,15e3],academicWeight:2.2,rarityBias:{Notable:2,Rare:3,Exceptional:2,Historic:1}},{id:"trade-coin-hoard",objectType:"Trade Coin Hoard",category:"container",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["gold","silver"],possibleFeatures:["coins fused together by centuries underwater","a still-intact strongbox corner","visible mint stamps on the top layer"],possibleInscriptions:[null],baseMarketValue:[4e3,24e3],academicWeight:1.3,rarityBias:{Notable:2,Rare:3,Exceptional:2}},{id:"figurehead-fragment",objectType:"Carved Figurehead Fragment",category:"personal-effect",compatibleEras:["age-of-sail"],compatibleCultures:["thalassan-fleet"],compatibleMaterials:["wood"],possibleFeatures:["surviving gilt paint in the carving's grooves","worm-worn wood stabilized by silt","a recognizable face beneath the damage"],possibleInscriptions:[null],baseMarketValue:[800,5500],academicWeight:.9,rarityBias:{Common:4,Notable:3,Rare:1}});function Et(e){return ct.find(t=>t.id===e)}const Ha={"late-frontier":{id:"late-frontier",label:"Late Frontier Era",yearRange:[1868,1899],description:"The tail end of continental survey expeditions, railroad expansion, and speculative mineral prospecting.",plausibleMaterials:["iron","brass","steel","glass","leather","paper","wood","silver"],plausibleObjectCategories:["instrument","document","tool","personal-effect","container"]},"highland-classical":{id:"highland-classical",label:"Highland Classical Period",yearRange:[-420,180],description:"The height of highland temple-building, jade working, and long-distance jungle trade routes.",plausibleMaterials:["jade","gold","obsidian","ceramic","stone","copper"],plausibleObjectCategories:["ceremonial-object","tool","personal-effect","architecture"]},"age-of-sail":{id:"age-of-sail",label:"Age of Sail",yearRange:[1650,1780],description:"The height of long-distance trading fleets, before steam power made sail-driven cargo routes obsolete.",plausibleMaterials:["bronze","brass","wood","iron","glass","gold","silver","ceramic"],plausibleObjectCategories:["instrument","document","weapon","personal-effect","container"]}},Na={"regent-diadem":{name:"The Regent's Diadem",objectType:"Ceremonial Diadem",culture:"Thalassan Trading Fleet",era:"Age of Sail",estimatedDateRange:[1668,1669],material:"gold and silver",feature:"a band of interlocking wave motifs surrounding a central star-compass medallion, salvaged from the escort wreck before it was hidden ashore",inscription:"For the Governor of the Coral Strait, from a grateful Fleet — 1669",condition:"Fine",completeness:92,rarity:"World-Class",academicWeight:3.2,trueAuthenticity:"authentic",estimatedValueRange:[65e3,12e4]}};function Pa(e){return Na[e]}const Ba={Common:[.55,.95],Notable:[.8,1.3],Rare:[1.1,1.8],Exceptional:[1.5,2.4],Historic:[2.1,3.3],"World-Class":[3,4.8]};function Fa(e){const t=Ki.find(i=>e<=i.max);return t?t.tier:"Common"}function Oa(e,t){const i=e.toLowerCase();return i.includes("engrav")||i.includes("inscription")||i.includes("insignia")?"Engraved":i.includes("crack")||i.includes("dent")||i.includes("scour")||i.includes("corrosion")||i.includes("corroded")?"Weathered":i.includes("stopped")||i.includes("frozen")?"Stopped":i.includes("hidden")||i.includes("secret")?"Concealed":t.charAt(0).toUpperCase()+t.slice(1)}function Va({site:e,eraId:t,cultureId:i,discoveryQuality:a,seq:s,rng:n,discoveryDate:r,discoveringCrewName:c}){const d=Ha[t],l=di[i],p=b(a+n.range(-.15,.15),0,.99),f=Fa(p),h=e.artifactTemplateIds.map(Et).filter(de=>de.compatibleEras.includes(t)&&de.compatibleCultures.includes(i)),u=h.length?h:e.artifactTemplateIds.map(Et),v=n.weightedPick(u.map(de=>({value:de,weight:de.rarityBias[f]??.4}))),g=n.pick(v.compatibleMaterials),k=n.pick(v.possibleFeatures),C=n.pick(v.possibleInscriptions),I=b(a*.5+n.range(0,.5),0,.99),T=Math.min(ae.length-1,Math.floor(I*ae.length)),E=ae[T],$=b(n.range(.4,.95)*(.7+I*.3),.2,1),[B,ce]=Ba[f],K=n.range(B,ce),[le,We]=v.baseMarketValue,be=(le+We)/2*K*(.6+.4*I)*(.7+.3*$),ye=n.float(),H=ye<.9?"authentic":ye<.98?"reproduction":"forgery",te=`${Oa(k,g)} ${v.objectType}`,ft=d.yearRange[0]+Math.floor(n.range(0,(d.yearRange[1]-d.yearRange[0])*.4)),Si=ft+Math.floor(n.range(2,12));return{id:`artifact-${s}-${Date.now().toString(36)}`,name:te,objectType:v.objectType,templateId:v.id,culture:l.label,era:d.label,estimatedDateRange:[ft,Si],material:g,feature:k,inscription:C||null,condition:E,completeness:Math.round($*100),rarity:f,academicWeight:v.academicWeight,trueAuthenticity:H,authenticationStatus:"unidentified",authenticationConfidence:null,authenticationOutcome:null,estimatedValueRange:[Math.round(be*.7),Math.round(be*1.3)],finalAppraisedValue:null,provenance:`Recovered from ${e.name} by ${c}`,discoveryLocation:e.name,discoveryDate:{...r},discoveringCrew:c,disposition:"none",restorationStatus:"none"}}function ja(e,{site:t,seq:i,discoveryDate:a,discoveringCrewName:s}){const n=Pa(e);if(!n)throw new Error(`Unknown unique artifact: ${e}`);return{id:`artifact-${i}-${e}`,name:n.name,objectType:n.objectType,templateId:e,culture:n.culture,era:n.era,estimatedDateRange:n.estimatedDateRange,material:n.material,feature:n.feature,inscription:n.inscription||null,condition:n.condition,completeness:n.completeness,rarity:n.rarity,academicWeight:n.academicWeight,trueAuthenticity:n.trueAuthenticity,authenticationStatus:"unidentified",authenticationConfidence:null,authenticationOutcome:null,estimatedValueRange:[...n.estimatedValueRange],finalAppraisedValue:null,provenance:`Recovered from ${t.name} by ${s}`,discoveryLocation:t.name,discoveryDate:{...a},discoveringCrew:s,disposition:"none",restorationStatus:"none"}}const Ua=[{id:"vehicle-trouble",phase:"travel",environments:["desert","rural","forest","mountain"],title:"Vehicle Trouble",description:"A rear axle bearing is grinding badly on the washboard road. Pushing on risks stranding the truck; stopping costs precious daylight.",choices:[{id:"A",label:"Push on carefully",description:"Slower pace, but you keep moving.",effects:{timeHours:3,riskDelta:.03}},{id:"B",label:"Stop and repair roadside",description:"Costs time and a little cash, but the vehicle is sound again.",effects:{timeHours:6,cash:-150,vehicleReliabilityDelta:.05}},{id:"C",label:"Radio for a tow and wait",description:"Safe, but expensive and slow — and visible to anyone listening.",effects:{timeHours:10,cash:-400,rivalAwarenessDelta:.1}}]},{id:"collapsing-passage",phase:"excavation",environments:["desert","cave","ruins","mountain","underground"],title:"Collapsing Passage",description:"The eastern passage into the buried structure is becoming unstable. Loose material is already sifting down from the ceiling.",choices:[{id:"A",label:"Reinforce with timber and supplies",description:"Costs time and supplies, but makes the passage safe to work.",effects:{timeHours:8,supplies:{spareParts:-2},riskDelta:-.08}},{id:"B",label:"Send a small team through quickly",description:"Fast, but dangerous if the ceiling gives further.",effects:{timeHours:2,riskDelta:.15,discoveryBonus:.05}},{id:"C",label:"Seal the passage and search elsewhere",description:"Safe, but you may be walking away from the best find here.",effects:{timeHours:4,riskDelta:-.1,discoveryBonus:-.15}}]},{id:"rival-sighting",phase:"survey",environments:["desert","forest","jungle","coastal","ruins"],title:"Rival Team Nearby",description:"Drone footage catches movement on the ridge — another outfit is scouting the same coordinates.",choices:[{id:"A",label:"Accelerate the survey",description:"Move faster to secure the site first, at the cost of thoroughness.",effects:{timeHours:-4,discoveryBonus:-.05,riskDelta:.05}},{id:"B",label:"Contact local authorities",description:"Establishes your legal standing, but reveals the site's location publicly.",effects:{timeHours:3,legalConfidenceDelta:.15,rivalAwarenessDelta:.2}},{id:"C",label:"Hide activity and continue carefully",description:"Keeps a low profile, but slows the work.",effects:{timeHours:5,rivalAwarenessDelta:-.1}}]},{id:"unknown-chamber",phase:"discovery",environments:["desert","cave","ruins","underground","mountain"],title:"A Sealed Chamber",description:"Beyond the exposed wall lies a sealed chamber no record mentions.",choices:[{id:"A",label:"Open it now",description:"Fast answers, but no chance to prepare for what's inside.",effects:{timeHours:2,riskDelta:.1,discoveryBonus:.15}},{id:"B",label:"Scan it first",description:"Safer and better-documented, but slower.",effects:{timeHours:6,riskDelta:-.05,discoveryBonus:.05,academicCredibilityGain:.5}},{id:"C",label:"Document and return with specialists",description:"The most cautious option — but you may lose the site to weather or rivals before you're back.",effects:{timeHours:12,riskDelta:-.15,discoveryBonus:-.2}}]},{id:"weather-window",phase:"travel",environments:["desert","mountain","forest","coastal","jungle"],title:"Weather Window Closing",description:"A fast-moving front is turning the approach road ugly. The team can beat it, wait it out, or reroute through slower terrain.",choices:[{id:"A",label:"Beat the front",description:"Arrive before conditions collapse, but push everyone hard.",effects:{timeHours:-3,riskDelta:.08}},{id:"B",label:"Wait it out",description:"Lose daylight, preserve safety, and keep gear dry.",effects:{timeHours:7,riskDelta:-.06}},{id:"C",label:"Take the long approach",description:"More fuel and time, but a better read on the terrain.",effects:{timeHours:5,cash:-120,discoveryBonus:.04}}]},{id:"local-tip",phase:"survey",environments:["desert","rural","forest","jungle","ruins","mountain"],title:"A Local Tip",description:"A local guide recognizes a landmark from your evidence board and offers a shortcut, but wants a finder's fee and discretion.",choices:[{id:"A",label:"Pay for the shortcut",description:"Spend cash for better search coverage.",effects:{cash:-250,discoveryBonus:.09,timeHours:-2}},{id:"B",label:"Interview them on record",description:"Slower and more public, but strengthens your documentation.",effects:{timeHours:3,legalConfidenceDelta:.1,academicCredibilityGain:.5}},{id:"C",label:"Decline and verify independently",description:"Avoids dependency on an unverified source.",effects:{timeHours:5,riskDelta:-.03}}]},{id:"false-positive-grid",phase:"survey",environments:["desert","rural","coastal","ruins"],title:"False Positive Grid",description:"The survey grid is lighting up with signals, but many readings look modern or contaminated.",choices:[{id:"A",label:"Chase every signal",description:"Thorough, slow, and exhausting, with a chance at a hidden cache.",effects:{timeHours:8,discoveryBonus:.1}},{id:"B",label:"Filter aggressively",description:"Fast and efficient, but some weak historic signals may be discarded.",effects:{timeHours:-3,discoveryBonus:-.04}},{id:"C",label:"Recalibrate the grid",description:"Spend time now to lower site risk later.",effects:{timeHours:4,riskDelta:-.05,discoveryBonus:.03}}]},{id:"fragile-layer",phase:"excavation",environments:["desert","ruins","cave","underground","forest"],title:"Fragile Deposit Layer",description:"A thin deposit layer may hold the best evidence, but rough handling could destroy context before anything is recovered.",choices:[{id:"A",label:"Micro-excavate by hand",description:"Painfully slow, but excellent for preservation and provenance.",effects:{timeHours:10,discoveryBonus:.12,academicCredibilityGain:1}},{id:"B",label:"Open a wider trench",description:"Faster access, with more chance of damaging fragile material.",effects:{timeHours:-2,riskDelta:.08,discoveryBonus:.04}},{id:"C",label:"Stabilize and sample only",description:"Very safe, but leaves much of the deposit untouched.",effects:{timeHours:4,riskDelta:-.08,discoveryBonus:-.06}}]},{id:"supply-leak",phase:"extraction",environments:["desert","rural","forest","mountain","jungle"],title:"Supply Leak",description:"A fuel can split open during packing. There is enough to get home, but not enough for a careful second sweep.",choices:[{id:"A",label:"Leave immediately",description:"Protects the recovered material and keeps the team safe.",effects:{timeHours:-2,riskDelta:-.04,discoveryBonus:-.05,supplies:{fuel:-2}}},{id:"B",label:"Patch and continue",description:"Costs repair supplies, but preserves the full search plan.",effects:{timeHours:3,supplies:{spareParts:-1},discoveryBonus:.03}},{id:"C",label:"Buy fuel from a nearby camp",description:"Expensive and visible, but avoids cutting the extraction short.",effects:{timeHours:4,cash:-220,rivalAwarenessDelta:.08}}]},{id:"hold-surge",phase:"discovery",environments:["coastal"],title:"Surge in the Hold",description:"Wave surge is dragging silt through the wreck interior. The clearest chamber may only stay visible for minutes.",choices:[{id:"A",label:"Dive the clear chamber now",description:"Big discovery upside, but the dive profile gets rough.",effects:{timeHours:1,riskDelta:.12,discoveryBonus:.14}},{id:"B",label:"Rig a guide line first",description:"Safer navigation and better recovery control.",effects:{timeHours:4,riskDelta:-.06,discoveryBonus:.04}},{id:"C",label:"Shift to the outer debris field",description:"Avoids the worst conditions, but lowers the ceiling of the find.",effects:{timeHours:2,riskDelta:-.1,discoveryBonus:-.08}}]}];function Wa(e,t){return Ua.filter(i=>i.phase===e&&i.environments.includes(t))}const za=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}),Ga=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2});function w(e,{precise:t=!1}={}){return(t?Ga:za).format(Math.round(e*100)/100)}function tt(e){const t=w(Math.abs(e));return e<0?`-${t}`:`+${t}`}function q(e,t=0){return`${(e*100).toFixed(t)}%`}const Qa=["January","February","March","April","May","June","July","August","September","October","November","December"];function vi(e){const{year:t,month:i,day:a}=e;return`${a} ${Qa[i]} ${t}`}function Ne(e){if(e<24)return`${Math.round(e)}h`;const t=Math.floor(e/24),i=Math.round(e%24);return i>0?`${t}d ${i}h`:`${t}d`}function Ya(e,t,i,a){const s=Wa(e,t).filter(n=>!i.includes(n.id));return s.length?a.pick(s):null}function Ka(e,t,i){const a=t.choices.find(n=>n.id===i);if(!a)throw new Error(`Unknown choice ${i} for event ${t.id}`);const s=a.effects||{};if(e.timeHours+=s.timeHours||0,e.riskDelta+=s.riskDelta||0,e.discoveryBonus+=s.discoveryBonus||0,e.cash+=s.cash||0,e.legalConfidenceDelta+=s.legalConfidenceDelta||0,e.rivalAwarenessDelta+=s.rivalAwarenessDelta||0,e.vehicleReliabilityDelta=(e.vehicleReliabilityDelta||0)+(s.vehicleReliabilityDelta||0),e.academicCredibilityGain=(e.academicCredibilityGain||0)+(s.academicCredibilityGain||0),s.supplies){e.supplies=e.supplies||{};for(const[n,r]of Object.entries(s.supplies))e.supplies[n]=(e.supplies[n]||0)+r}return e.log.push({eventId:t.id,title:t.title,choiceId:i,choiceLabel:a.label,effectsPreview:lt(a.effects)}),{accumulator:e,choice:a}}function lt(e={}){const t=[];if(e.timeHours&&t.push(`${e.timeHours>0?"+":""}${e.timeHours}h`),e.riskDelta&&t.push(`${e.riskDelta>0?"+":""}${Math.round(e.riskDelta*100)} risk`),e.discoveryBonus&&t.push(`${e.discoveryBonus>0?"+":""}${Math.round(e.discoveryBonus*100)} discovery`),e.cash&&t.push(tt(e.cash)),e.legalConfidenceDelta&&t.push(`${e.legalConfidenceDelta>0?"+":""}${Math.round(e.legalConfidenceDelta*100)} legal`),e.rivalAwarenessDelta&&t.push(`${e.rivalAwarenessDelta>0?"+":""}${Math.round(e.rivalAwarenessDelta*100)} rival heat`),e.vehicleReliabilityDelta&&t.push(`${e.vehicleReliabilityDelta>0?"+":""}${Math.round(e.vehicleReliabilityDelta*100)} vehicle`),e.academicCredibilityGain&&t.push(`${e.academicCredibilityGain>0?"+":""}${e.academicCredibilityGain} academic`),e.supplies)for(const[i,a]of Object.entries(e.supplies))a&&t.push(`${a>0?"+":""}${a} ${i}`);return t}function Xa(){return{timeHours:0,riskDelta:0,discoveryBonus:0,cash:0,legalConfidenceDelta:0,rivalAwarenessDelta:0,vehicleReliabilityDelta:0,academicCredibilityGain:0,supplies:{},log:[]}}function Za(e,t){return t?e.some(i=>i.roleId===t.role&&i.skillLevel>=t.level):!0}function Ja(e,t,i=[]){if(!e.length)return 0;let a=0;for(const s of e){const n=Q(s.templateId);if(!n)continue;const r=n.environments.includes(t)?1:.3,c=s.condition/100,d=Za(i,n.requiredSkill)?1:.5,l=Object.values(n.effects).reduce((p,f)=>p+f,0);a+=l*r*c*d}return b(a,0,1)}function en(e=[]){const t={riskDelta:0,discoveryBonus:0,vehicleReliabilityBonus:0,equipmentWearReduction:0,supplyEfficiency:0};for(const i of e){const a=ve(i.roleId);if(!a?.synergy)continue;const s=b(i.skillLevel/5,.2,1);a.synergy.riskDelta&&(t.riskDelta+=a.synergy.riskDelta*s),a.synergy.discoveryBonus&&(t.discoveryBonus+=a.synergy.discoveryBonus*s),a.synergy.vehicleReliabilityBonus&&(t.vehicleReliabilityBonus+=a.synergy.vehicleReliabilityBonus*s),a.synergy.equipmentWearReduction&&(t.equipmentWearReduction+=a.synergy.equipmentWearReduction*s),a.synergy.supplyEfficiency&&(t.supplyEfficiency+=a.synergy.supplyEfficiency*s),a.synergy.rivalAwarenessReduction&&(t.riskDelta-=a.synergy.rivalAwarenessReduction*.3*s)}return t.equipmentWearReduction=b(t.equipmentWearReduction,0,.6),t.supplyEfficiency=b(t.supplyEfficiency,0,.4),t}const tn={travel:{desert:["Dust cuts visibility to a few truck lengths, but the route markers hold.","Heat shimmer makes the old survey line look like it is moving."],coastal:["The harbor master clears a narrow departure window before the tide turns.","Salt spray crusts the gear cases before the team even reaches the coordinates."],default:["The team checks bearings twice and keeps moving toward the site.","Old maps and modern roads disagree, forcing a careful approach."]},survey:{desert:["Metal readings cluster near a dry wash that matches the archived route notes.","The grid picks up a line of disturbed stone barely visible under the sand."],coastal:["Sonar paints a broken outline under the silt, then loses it in the chop.","Current markers drift harder than forecast, narrowing the safe survey lane."],ruins:["Masonry seams line up with the lead better than expected.","A shadowed foundation edge gives the team a new search axis."],default:["The survey grid starts separating folklore from something measurable.","A quiet signal repeats often enough to earn a flag on the map."]},excavation:{desert:["Brushes expose a compacted layer that has not seen daylight in decades.","The dig face holds, but every bucket of spoil has to be screened."],coastal:["Lift bags steady a debris panel while the team works beneath it.","Visibility drops, then clears just enough to continue the recovery lane."],default:["The team slows down and protects context before chasing the obvious find.","Tool marks reveal a path into the site that the first survey missed."]},discovery:{desert:["A hard edge appears under the dust, too regular to be geology.","The first recovered fragment matches the period materials from the lead."],coastal:["Something brass flashes under silt as the dive light sweeps the hold.","A sealed case shifts free from the wreckage with a dull metallic scrape."],default:["The search narrows to one promising pocket of undisturbed material.","The evidence board suddenly feels less like theory and more like coordinates."]},extraction:{desert:["The final crate is padded, sealed, and carried out before the afternoon wind rises.","The return convoy moves slower with recovered material strapped in place."],coastal:["Recovered items are rinsed, logged, and stabilized before leaving the dock.","The crew clears the site just as the tide begins working against them."],default:["The team logs chain of custody before packing the last case.","Everything recovered gets photographed before the site is closed."]}};function an(e,t,i){const a=tn[e]||{},s=a[t]||a.default||["The team records a quiet but useful field note."];return i.pick(s)}function nn(e,t,i){const a=b((e.metrics?.riskRating||0)+(e.accumulator?.riskDelta||0),.03,.97),s=b((e.metrics?.discoveryQuality||0)+(e.accumulator?.discoveryBonus||0),.02,.98),n=a>.55?"warning":s>.66?"success":"info",r=t.phase||t;return{phase:r,tone:n,title:n==="warning"?"Pressure rising":n==="success"?"Promising signal":"Field note",message:an(r,e.site?.environment,i),riskAfter:a,discoveryAfter:s}}function gi(e,t=1){const i=Math.max(1,e/24),a={};for(const[s,n]of Object.entries(Qi))a[s]=Math.ceil(n*t*i);return a}function sn(e,t){const i=Object.keys(t);if(!i.length)return 1;const a=i.map(s=>{const n=t[s]||0;return n===0?1:b((e[s]||0)/n,0,1.3)});return b(a.reduce((s,n)=>s+Math.min(n,1),0)/a.length,0,1)}function bi({lead:e,site:t,equipmentInstances:i,vehicle:a,supplies:s,approachId:n,leaderSkill:r,riskMultiplier:c=1,crewInstances:d=[]}){const l=Xe[n]||Xe.standard,p=fi(e),f=Ja(i,t.environment,d),h=Yi*l.durationMultiplier,u=gi(h,1+d.length),v=en(d),g={};for(const[H,F]of Object.entries(s))g[H]=F*(1+v.supplyEfficiency);const k=sn(g,u),C=a?ge(a.templateId):null,I=C?C.environments.includes(t.environment):!1,T=(C?C.reliability:.5)*(I?1:.45),E=b(T+v.vehicleReliabilityBonus,0,1);let $=O.noConclusionPenalty,B=0;e.conclusionChosenId&&(e.conclusionChosenId===e.correctConclusionId?($=-.05,B=.1):($=O.wrongConclusionPenalty,B=-.08));const ce=d.length?((r||2)+d.reduce((H,F)=>H+F.skillLevel,0))/(1+d.length):r||2;let K=O.base+O.leadQuality*p+O.equipmentSuitability*f+O.supplyPreparation*k+O.vehicleReliability*E+(l.riskModifier||0)+$+v.riskDelta;k<O.shortageThreshold&&(K+=O.shortagePenalty*(O.shortageThreshold-k)),K=b(K*c,.03,.97);let le=ke.leadQuality*p+ke.equipmentSuitability*f+ke.siteBasePotential*t.baseDiscoveryPotential+ke.leaderSkill*b(ce/5,0,1)+(l.discoveryModifier||0)+B+v.discoveryBonus;le=b(le,.02,.98);const We=i.reduce((H,F)=>{const te=Q(F.templateId);return H+(te?te.operatingCost:0)},0),ht=Object.entries(s).reduce((H,[F,te])=>H+te*(qe[F]||0),0),be=d.reduce((H,F)=>H+F.salary,0)*(h/24),ye=Math.round((t.travelCost+ht+We)*l.costMultiplier+be);return{approach:l,leadQuality:p,equipmentSuitability:f,supplyPreparationScore:k,vehicleReliability:E,vehicleEnvironmentMatch:I,riskRating:K,successChance:b(1-K,.02,.98),discoveryQuality:le,estimatedDurationHours:h,recommendedSupplies:u,estimatedCost:ye,crewSynergy:v}}function rn({id:e,plan:t,lead:i,site:a,vehicle:s,equipmentInstances:n,crewInstances:r=[],leaderSkill:c,leaderName:d,startDate:l,riskMultiplier:p=1}){const f=bi({lead:i,site:a,equipmentInstances:n,vehicle:s,supplies:t.supplies,approachId:t.approachId,leaderSkill:c,riskMultiplier:p,crewInstances:r}),h=Ze.map(u=>({phase:u,durationHours:f.estimatedDurationHours*Wt[u],eventResolved:null,pendingEvent:null,resolvedChoiceId:null}));return{id:e,plan:t,lead:i,site:a,vehicle:s,equipmentInstances:n,crewInstances:r,leaderSkill:c,leaderName:d,metrics:f,phases:h,currentPhaseIndex:0,accumulator:Xa(),usedEventIds:[],elapsedHours:0,startDate:l}}function yi(e){return e.phases[e.currentPhaseIndex]}function on(e,t,i=.7){const a=yi(e);if(a.eventResolved!==null||a.pendingEvent)return a.pendingEvent;if(!t.bool(i))return a.eventResolved="none",null;const s=Ya(a.phase,e.site.environment,e.usedEventIds,t);return s?(a.pendingEvent=s,s):(a.eventResolved="none",null)}function cn(e,t){const i=yi(e),a=i.pendingEvent,{choice:s}=Ka(e.accumulator,a,t);return e.usedEventIds.push(a.id),i.eventResolved=a.id,i.resolvedChoiceId=t,i.pendingEvent=null,s}function ln(e){return e.elapsedHours+=e.phases[e.currentPhaseIndex].durationHours,e.currentPhaseIndex<e.phases.length-1?(e.currentPhaseIndex++,!0):!1}function dn(e){const t=e.metrics,i=[{label:"Incomplete or inaccurate intelligence about the site made the search far harder than expected.",value:1-t.leadQuality},{label:"Equipment was poorly suited to the terrain and conditions encountered.",value:1-t.equipmentSuitability},{label:"Supplies ran short of what the expedition actually needed.",value:1-t.supplyPreparationScore},{label:"Transport proved unreliable when it mattered most.",value:1-t.vehicleReliability},{label:"Weather and terrain hazards in the field proved worse than anticipated.",value:.4+e.accumulator.riskDelta}];return i.sort((a,s)=>s.value-a.value),i[0].label}function un(e,t,i){const a=(e.accumulator.vehicleReliabilityDelta||0)*-.15,s=b(e.metrics.riskRating+e.accumulator.riskDelta+a,.03,.97);e.finalRisk=s;const n=b(1-s,.02,.98),r=t.bool(n),c=b(e.metrics.discoveryQuality+e.accumulator.discoveryBonus,.02,.98);let d=[],l=null;if(r&&e.site.uniqueArtifactId)d.push(ja(e.site.uniqueArtifactId,{site:e.site,seq:i,discoveryDate:e.dateAtCompletion,discoveringCrewName:e.leaderName}));else if(r){const p=c>.72?t.int(2,3):c>.4?t.int(1,2):1,f=e.metrics.approach?.valueMultiplier??1;for(let h=0;h<p;h++){const u=Va({site:e.site,eraId:e.lead.eraId,cultureId:e.lead.cultureId,discoveryQuality:c,seq:i+h,rng:t,discoveryDate:e.dateAtCompletion,discoveringCrewName:e.leaderName});f!==1&&(u.estimatedValueRange=u.estimatedValueRange.map(v=>Math.round(v*f))),d.push(u)}}else l=dn(e);return{success:r,finalRisk:s,successChance:n,finalDiscoveryQuality:c,artifacts:d,failureReason:l}}function pn(e,t,i){const a=i?.estimatedArtifactsValue||0,s=i?.estimatedNetValue||i?.actualCashDelta||0;let n="C";t.success&&t.finalRisk<=.25&&t.finalDiscoveryQuality>=.68?n="S":t.success&&(t.finalDiscoveryQuality>=.6||s>0)?n="A":t.success?n="B":t.finalRisk<=.45?n="C":n="D";const r=t.success?n==="S"?"Flagship Recovery":n==="A"?"Clean Recovery":"Successful Recovery":n==="C"?"Close Call":"Hard Lesson",c=[];c.push(`${Math.round(t.successChance*100)}% final success chance`),c.push(`${Math.round(t.finalDiscoveryQuality*100)}% discovery quality`),t.artifacts.length&&c.push(`${t.artifacts.length} recovered item${t.artifacts.length===1?"":"s"}`),a>0&&c.push(`Estimated haul $${Math.round(a).toLocaleString()}`),(e.accumulator?.log||[]).length&&c.push(`${e.accumulator.log.length} field decision${e.accumulator.log.length===1?"":"s"} resolved`);const d=t.success?`The team brought material back from ${e.site.name} with ${Math.round(t.finalRisk*100)}% final risk.`:t.failureReason;return{grade:n,title:r,summary:d,highlights:c}}function hn(e,t,i=1,a=1){const s=[],n=(e.plan.supplies.fuel||0)+(e.accumulator.supplies.fuel||0),c=-(ge(e.vehicle.templateId).operatingCostPerTrip*a+n*qe.fuel);s.push({label:"Travel and fuel",amount:Math.round(c)});const d=e.crewInstances||[],l=e.metrics.estimatedDurationHours/24,p=-Math.round(d.reduce((E,$)=>E+$.salary,0)*l);s.push({label:"Crew wages",amount:p});const f=e.site.legalComplexity??.3,h=e.plan.approachId==="discreet"?0:-Math.round(400*f);s.push({label:"Permit fees",amount:h});const u=-Object.entries(e.plan.supplies).reduce((E,[$,B])=>{const ce=Math.max(0,B+(e.accumulator.supplies[$]||0));return E+ce*(qe[$]||0)},0);s.push({label:"Supplies",amount:Math.round(u)});const v=e.metrics.crewSynergy?.equipmentWearReduction||0;let g=0;for(const E of e.equipmentInstances){const $=Q(E.templateId);if(!$)continue;const B=Math.round((5+e.finalRisk*Xi)*i*(1-v));E.condition=b(E.condition-B,0,100),g+=B/100*$.cost*.15}s.push({label:"Equipment damage",amount:-Math.round(g)});const k=Math.round(e.accumulator.cash);k!==0&&s.push({label:"Field event costs",amount:k});const C=t.artifacts.reduce((E,$)=>E+($.estimatedValueRange[0]+$.estimatedValueRange[1])/2,0);t.artifacts.length&&s.push({label:"Recovered artifacts est.",amount:Math.round(C),isEstimate:!0});const I=s.filter(E=>!E.isEstimate).reduce((E,$)=>E+$.amount,0),T=I+C;return{lines:s,actualCashDelta:Math.round(I),estimatedArtifactsValue:Math.round(C),estimatedNetValue:Math.round(T)}}function U(e,t){const i=_t(e.rng.seed,e.rng.callCount),a=t(i);return e.rng=i.serialize(),a}function Ge(e){return ee[e.profile.difficulty]||ee.adventurer}function he(e,t){ra(e.date,t),Da(e,t)}function D(e,t,i){if(e.finance.cash<t)throw new Error(i||`Not enough cash — need ${t}, have ${Math.round(e.finance.cash)}.`)}function N(e,t){e.finance.cash-=t,e.finance.totalExpenses+=t}function fn({explorerName:e,orgName:t,difficulty:i,tutorialEnabled:a}){const s=qi(),n=ee[i]||ee.adventurer;s.profile.explorerName=e,s.profile.orgName=t||se.defaultOrgName,s.profile.difficulty=n.id,s.finance.cash=n.startingCash,s.settings.tutorialEnabled=a,s.tutorial.active=a,s.player.name=e;const r=Nt("black-mesa-camp-site");s.sites.push(r);const c=Ht("lost-survey-camp",r.instanceId);s.leads.available.push(c),s.equipment=["field-shovels","excavation-brushes","climbing-rope","field-lanterns","basic-metal-detector","field-camera","first-aid-kit","portable-radio"].map(Bt),s.vehicles=[Vt("used-pickup-truck")];const d=_t(s.rng.seed,s.rng.callCount);return s.crewCandidates=Jt(d,3),s.rng=d.serialize(),s.objectives.main={id:"first-expedition",label:"Investigate The Lost Survey Camp and launch your first expedition."},s.objectives.optional=[{id:"research-lead",label:"Research the lead at least twice before launching."},{id:"authenticate-find",label:"Authenticate a recovered artifact."}],R(s,{type:"info",title:"Welcome to Treasure Hunter",message:"A storage-unit find has led you to your first lead. Check the Leads tab to begin investigating."}),s}const mn={RESEARCH_LEAD(e,{leadInstanceId:t,actionId:i}){const a=ue(e,t);if(!a)throw new Error("Lead not found.");const s=pe(e,a.siteId),n=hi(i);if(!n)throw new Error("Unknown research action.");const r=Ge(e),c=xa(e),d=ma(e.staff),l=Math.round(n.cost*r.researchCostMultiplier*c*d);D(e,l,`Not enough cash to ${n.label.toLowerCase()} (needs ${l}).`),N(e,l),he(e,n.timeHours);const p=$a(e)*Aa(e),{record:f,disturbance:h}=U(e,u=>{const v=_a(a,s,i,u,p);ba(a,s,u);const g=ya(a,s,u);return{record:v,disturbance:g}});if(e.researchPoints+=1,a.pendingReputationEffects){for(const[u,v]of Object.entries(a.pendingReputationEffects))e.reputation[u]=b((e.reputation[u]||0)+v,0,100);a.pendingReputationEffects=null}return e.leads.available.includes(a)&&!e.leads.active.includes(a)&&(e.leads.available=e.leads.available.filter(u=>u!==a),e.leads.active.push(a)),h&&R(e,{type:"warning",title:"Rival Activity",message:`${h.name} has been through the site ahead of you — the best of it may already be gone.`}),{record:f,disturbance:h}},CHOOSE_LEAD_CONCLUSION(e,{leadInstanceId:t,conclusionId:i}){const a=ue(e,t);if(!a)throw new Error("Lead not found.");return{wasCorrect:Vi(a,i)}},LAUNCH_EXPEDITION(e,{leadInstanceId:t,plan:i}){if(e.activeExpedition)throw new Error("An expedition is already underway.");const a=ue(e,t);if(!a)throw new Error("Lead not found.");const s=pe(e,a.siteId),n=e.vehicles.find(p=>p.instanceId===i.vehicleInstanceId)||e.vehicles[0];if(!n)throw new Error("No vehicle available for this expedition.");const r=e.equipment.filter(p=>i.equipmentInstanceIds.includes(p.instanceId)),c=e.staff.filter(p=>(i.crewInstanceIds||[]).includes(p.instanceId)),d=Ge(e),l=rn({id:`exp-${Date.now()}`,plan:i,lead:a,site:s,vehicle:n,equipmentInstances:r,crewInstances:c,leaderSkill:(e.player.skill.leadership+e.player.skill.survival)/2,leaderName:e.player.name,startDate:{...e.date},riskMultiplier:d.riskMultiplier});return D(e,Math.round(l.metrics.estimatedCost*.5),"You may not be able to afford this expedition — reduce scope or supplies."),l.metrics.approach?.rivalAwarenessModifier&&(a.rivalInterest=b((a.rivalInterest||0)+l.metrics.approach.rivalAwarenessModifier,0,1)),a.status="expedition-launched",e.activeExpedition={id:l.id,leadInstanceId:t,siteInstanceId:s.instanceId,vehicleInstanceId:n.instanceId,equipmentInstanceIds:i.equipmentInstanceIds,crewInstanceIds:i.crewInstanceIds||[],rivalInterestAtLaunch:a.rivalInterest||0,fullyResearchedAtLaunch:a.confidence.siteLocation>=.85&&a.confidence.historical>=.85&&a.confidence.legal>=.85,leaderName:e.player.name,leaderSkill:l.leaderSkill,plan:i,metrics:l.metrics,phases:l.phases,currentPhaseIndex:0,accumulator:l.accumulator,fieldLog:[],usedEventIds:[],elapsedHours:0,startDate:l.startDate},R(e,{type:"expedition",title:"Expedition Launched",message:`${e.player.name} is headed to ${s.name}.`}),{}},CHECK_PHASE_EVENT(e){const t=e.activeExpedition;if(!t)throw new Error("No active expedition.");const i=pe(e,t.siteInstanceId),a={phases:t.phases,currentPhaseIndex:t.currentPhaseIndex,site:i,usedEventIds:t.usedEventIds};return{event:U(e,n=>on(a,n,.7)),autosave:!1}},RESOLVE_EXPEDITION_EVENT(e,{choiceId:t}){const i=e.activeExpedition;if(!i)throw new Error("No active expedition.");const a={phases:i.phases,currentPhaseIndex:i.currentPhaseIndex,accumulator:i.accumulator,usedEventIds:i.usedEventIds},s=cn(a,t),n=i.phases[i.currentPhaseIndex];s.effects?.timeHours&&(n.durationHours=Math.max(1,n.durationHours+s.effects.timeHours));const r=ue(e,i.leadInstanceId);return r&&s.effects?.legalConfidenceDelta&&(r.confidence.legal=b(r.confidence.legal+s.effects.legalConfidenceDelta,0,1)),r&&s.effects?.rivalAwarenessDelta&&(r.rivalInterest=b((r.rivalInterest||0)+s.effects.rivalAwarenessDelta,0,1)),{choice:s}},ADVANCE_EXPEDITION_PHASE(e){const t=e.activeExpedition;if(!t)throw new Error("No active expedition.");const i=pe(e,t.siteInstanceId),a=t.phases[t.currentPhaseIndex],s=U(e,c=>nn({...t,site:i},a,c));t.fieldLog=t.fieldLog||[],t.fieldLog.push({...s,elapsedHours:Math.round(t.elapsedHours+a.durationHours)});const n=t.phases[t.currentPhaseIndex].durationHours,r=ln(t);return he(e,n),{hasNext:r}},COMPLETE_EXPEDITION(e){const t=e.activeExpedition;if(!t)throw new Error("No active expedition.");const i=ue(e,t.leadInstanceId),a=pe(e,t.siteInstanceId),s=e.vehicles.find(g=>g.instanceId===t.vehicleInstanceId),n=e.equipment.filter(g=>t.equipmentInstanceIds.includes(g.instanceId)),r=e.staff.filter(g=>(t.crewInstanceIds||[]).includes(g.instanceId)),c=Ge(e),d={metrics:t.metrics,accumulator:t.accumulator,lead:i,site:a,vehicle:s,equipmentInstances:n,crewInstances:r,leaderName:t.leaderName,plan:t.plan,dateAtCompletion:{...e.date}},l=e.stats.expeditionsCompleted*10+e.artifacts.length,p=U(e,g=>un(d,g,l)),f=hn(d,p,c.equipmentWearMultiplier,Ca(e)),h=pn(d,p,f);e.finance.cash+=f.actualCashDelta;for(const g of f.lines)!g.isEstimate&&g.amount<0&&(e.finance.totalExpenses+=-g.amount);t.accumulator.academicCredibilityGain&&(e.reputation.academicCredibility=b(e.reputation.academicCredibility+t.accumulator.academicCredibilityGain,0,100)),p.success&&t.metrics.approach?.reputationModifier&&(e.reputation.academicCredibility=b(e.reputation.academicCredibility+t.metrics.approach.reputationModifier*2,0,100)),t.plan.approachId==="discreet"&&(a.legalComplexity??0)>.5&&(e.reputation.ethicalStanding=b(e.reputation.ethicalStanding-3,0,100));for(const g of r)fa(g,p.success?2:1);e.artifacts.push(...p.artifacts),p.success?(e.stats.expeditionsCompleted+=1,e.reputation.fieldReputation=b(e.reputation.fieldReputation+1,0,100)):e.stats.expeditionsFailed+=1,i.status="resolved",e.leads.active=e.leads.active.filter(g=>g!==i),e.leads.archived.push(i),e.stats.leadsResolved+=1;const u=Ke(e);u&&R(e,{type:"info",title:"New Lead",message:`A new lead has surfaced: ${u.title}.`});const v={id:t.id,leadTitle:i.title,siteName:a.name,environment:a.environment,success:p.success,finalRisk:p.finalRisk,failureReason:p.failureReason,artifactIds:p.artifacts.map(g=>g.id),financials:f,debrief:h,fieldLog:t.fieldLog||[],eventLog:t.accumulator.log||[],finalDiscoveryQuality:p.finalDiscoveryQuality,successChance:p.successChance,rivalInterestAtLaunch:t.rivalInterestAtLaunch||0,fullyResearchedAtLaunch:t.fullyResearchedAtLaunch||!1,date:{...e.date}};return e.expeditionHistory.push(v),e.activeExpedition=null,R(e,{type:p.success?"success":"warning",title:p.success?"Expedition Successful":"Expedition Unsuccessful",message:p.success?`Recovered ${p.artifacts.length} item${p.artifacts.length===1?"":"s"} from ${a.name}.`:p.failureReason}),Y(e),ze(e),X(e),Se(e,"complete-expedition",{success:p.success},R),{outcome:p,financials:f,historyRecord:v}},AUTHENTICATE_ARTIFACT(e,{artifactId:t,methodId:i}){const a=e.artifacts.find(r=>r.id===t);if(!a)throw new Error("Artifact not found.");const s=De[i];if(!s)throw new Error("Unknown authentication method.");if(s.requiresFacility&&!e.facilities.some(r=>r.templateId===s.requiresFacility))throw new Error(`${s.label} requires a ${_(s.requiresFacility).name}.`);D(e,s.cost,`Not enough cash for ${s.label}.`),N(e,s.cost),he(e,s.timeHours);const n=U(e,r=>ta(a,i,r));return a.authenticationStatus==="authenticated"&&(e.stats.artifactsAuthenticated+=1),Y(e),X(e),{result:n}},RESTORE_ARTIFACT(e,{artifactId:t,methodId:i}){const a=e.artifacts.find(d=>d.id===t);if(!a)throw new Error("Artifact not found.");const s=Fe[i];if(!s)throw new Error("Unknown restoration method.");const n=Gt(a,i);D(e,n,`Not enough cash for ${s.label}.`),N(e,n),he(e,s.timeHours);const{failed:r,authenticityDamaged:c}=U(e,d=>ia(a,i,d));return Y(e),{failed:r,authenticityDamaged:c,cost:n}},SELL_ARTIFACT(e,{artifactId:t}){const i=e.artifacts.find(r=>r.id===t);if(!i)throw new Error("Artifact not found.");const{saleValue:a,ethicalPenalty:s}=U(e,r=>Wi(i)),n=Math.round(a*kt(e));return i.saleValue=n,i.soldVia="private",e.finance.cash+=n,e.finance.totalRevenue+=n,s?e.reputation.ethicalStanding=b(e.reputation.ethicalStanding-s,0,100):e.reputation.fieldReputation=b(e.reputation.fieldReputation+1,0,100),Y(e),ze(e),X(e),Se(e,"sell-rarity",{rarity:i.rarity},R),{saleValue:n,ethicalPenalty:s}},STORE_ARTIFACT(e,{artifactId:t}){const i=e.artifacts.find(a=>a.id===t);if(!i)throw new Error("Artifact not found.");return zi(i),{}},DISPLAY_ARTIFACT(e,{artifactId:t}){const i=e.artifacts.find(a=>a.id===t);if(!i)throw new Error("Artifact not found.");return Gi(i),e.reputation.publicFame=b(e.reputation.publicFame+1,0,100),Y(e),{}},DONATE_ARTIFACT(e,{artifactId:t}){const i=e.artifacts.find(a=>a.id===t);if(!i)throw new Error("Artifact not found.");if(i.disposition!=="none")throw new Error("This artifact has already been dealt with.");return i.disposition="donated",e.reputation.ethicalStanding=b(e.reputation.ethicalStanding+4,0,100),e.reputation.academicCredibility=b(e.reputation.academicCredibility+2,0,100),Y(e),X(e),R(e,{type:"success",title:"Artifact Donated",message:`${i.name} returned to the historical record.`}),Se(e,"donate-artifact",{},R),{}},REPAIR_EQUIPMENT(e,{instanceId:t}){const i=e.equipment.find(s=>s.instanceId===t);if(!i)throw new Error("Equipment not found.");const a=Math.round(Ot(i)*ai(e));return D(e,a,"Not enough cash for this repair."),N(e,a),Ui(i),{cost:a}},PURCHASE_EQUIPMENT(e,{templateId:t}){const i=Q(t);if(!i)throw new Error("Unknown equipment.");const a=Math.round(i.cost*wt(e));return D(e,a,`Not enough cash for the ${i.name}.`),N(e,a),e.equipment.push(Bt(t)),R(e,{type:"info",title:"Equipment Purchased",message:i.name}),X(e),{}},PURCHASE_VEHICLE(e,{templateId:t}){const i=ge(t);if(!i)throw new Error("Unknown vehicle.");const a=si(e);if(e.vehicles.length>=a)throw new Error(`Your headquarters can only support ${a} vehicle${a===1?"":"s"} right now.`);const s=Math.round(i.cost*wt(e));return D(e,s,`Not enough cash for the ${i.name}.`),N(e,s),e.vehicles.push(Vt(t)),R(e,{type:"info",title:"Vehicle Purchased",message:i.name}),{}},HIRE_CREW(e,{candidateId:t}){const i=e.crewCandidates.findIndex(r=>r.instanceId===t);if(i===-1)throw new Error("Candidate not found — try refreshing the list.");const a=ni(e);if(e.staff.length>=a)throw new Error(`Your headquarters can only support ${a} staff right now — build Crew Quarters or upgrade your HQ.`);const s=e.crewCandidates[i],n=s.salary*2;return D(e,n,`Not enough cash to hire ${s.name} (needs ${n}).`),N(e,n),e.staff.push(s),e.crewCandidates.splice(i,1),R(e,{type:"info",title:"New Hire",message:`${s.name} has joined ${e.profile.orgName}.`}),{}},DISMISS_CREW(e,{crewInstanceId:t}){const i=e.staff.find(a=>a.instanceId===t);if(!i)throw new Error("Crew member not found.");return e.staff=e.staff.filter(a=>a!==i),{}},REFRESH_CREW_CANDIDATES(e){return D(e,200,"Not enough cash to search for new candidates."),N(e,200),he(e,6),e.crewCandidates=U(e,i=>Jt(i,3)),{}},BUILD_FACILITY(e,{facilityId:t}){const i=_(t);if(!i)throw new Error("Unknown facility.");if(e.facilities.some(a=>a.templateId===t))throw new Error("Already built.");if(i.minTier>e.organization.tier)throw new Error("Your headquarters needs to be larger to support this facility.");if(e.facilities.length>=ri(e))throw new Error("No room for more facilities — upgrade your headquarters first.");return D(e,i.cost,`Not enough cash for the ${i.name}.`),N(e,i.cost),e.facilities.push({instanceId:`facility-${t}`,templateId:t}),R(e,{type:"success",title:"Facility Built",message:`${i.name} is now operational.`}),{}},UPGRADE_HEADQUARTERS(e){const t=ii(e.organization.tier);if(!t)throw new Error("Already at the highest headquarters tier.");if(e.organization.prestige<t.prestigeRequired)throw new Error(`Requires ${t.prestigeRequired} prestige (you have ${e.organization.prestige}).`);return D(e,t.cost,`Not enough cash to build the ${t.name} (needs ${t.cost}).`),N(e,t.cost),e.organization.tier=t.tier,e.organization.tierName=t.name,R(e,{type:"milestone",title:"Headquarters Upgraded",message:`Welcome to your new ${t.name}.`}),{}},ACCEPT_SPONSOR(e,{sponsorId:t}){if(e.sponsors.some(a=>a.templateId===t))throw new Error("Already accepted.");const i=st(t);if(!i)throw new Error("Unknown sponsor.");if(e.sponsors.push({instanceId:`sponsor-${t}`,templateId:t,acceptedDate:{...e.date}}),e.finance.cash+=i.signingBonus,e.finance.totalRevenue+=i.signingBonus,i.reputationEffects)for(const[a,s]of Object.entries(i.reputationEffects))e.reputation[a]=b((e.reputation[a]||0)+s,0,100);return Y(e),R(e,{type:"success",title:"Sponsorship Signed",message:i.name}),{}},ACCEPT_CONTRACT(e,{contractId:t}){if(e.contracts.some(a=>a.templateId===t))throw new Error("Already accepted.");const i=He(t);if(!i)throw new Error("Unknown contract.");return e.contracts.push({instanceId:`contract-${t}`,templateId:t,status:"active",acceptedDate:{...e.date}}),R(e,{type:"info",title:"Contract Accepted",message:i.title}),{}},BUILD_MUSEUM(e){if(e.museum?.built)throw new Error("Museum already built.");if(e.organization.prestige<M.prestigeRequired)throw new Error(`Requires ${M.prestigeRequired} prestige (you have ${e.organization.prestige}).`);return D(e,M.cost,`Not enough cash to build a museum (needs ${M.cost}).`),N(e,M.cost),e.museum={built:!0,ticketPrice:M.defaultTicketPrice,exhibits:[],totalVisitors:0,totalRevenue:0},R(e,{type:"milestone",title:"Museum Opened",message:"Your private museum is open to the public."}),X(e),{}},CREATE_EXHIBIT(e,{themeId:t,name:i}){if(!e.museum?.built)throw new Error("Build a museum first.");const a=ot(t);if(!a)throw new Error("Unknown exhibit theme.");return e.museum.exhibits.push({instanceId:`exhibit-${Date.now()}`,themeId:t,name:i||a.label,artifactIds:[]}),{}},ASSIGN_ARTIFACT_TO_EXHIBIT(e,{exhibitId:t,artifactId:i}){if(!e.museum?.built)throw new Error("Build a museum first.");const a=e.museum.exhibits.find(n=>n.instanceId===t);if(!a)throw new Error("Exhibit not found.");const s=e.artifacts.find(n=>n.id===i);if(!s)throw new Error("Artifact not found.");if(s.disposition!=="displayed")throw new Error("Only artifacts set to Display can join an exhibit.");for(const n of e.museum.exhibits)n.artifactIds=n.artifactIds.filter(r=>r!==i);return a.artifactIds.push(i),{}},REMOVE_ARTIFACT_FROM_EXHIBIT(e,{exhibitId:t,artifactId:i}){const a=e.museum?.exhibits.find(s=>s.instanceId===t);if(!a)throw new Error("Exhibit not found.");return a.artifactIds=a.artifactIds.filter(s=>s!==i),{}},SET_TICKET_PRICE(e,{price:t}){if(!e.museum?.built)throw new Error("Build a museum first.");return e.museum.ticketPrice=b(Math.round(t),M.minTicketPrice,M.maxTicketPrice),{}},SELL_ARTIFACT_AUCTION(e,{artifactId:t}){const i=e.artifacts.find(c=>c.id===t);if(!i)throw new Error("Artifact not found.");if(i.disposition!=="none")throw new Error("This artifact has already been dealt with.");const a=i.finalAppraisedValue??(i.estimatedValueRange[0]+i.estimatedValueRange[1])/2,s=U(e,c=>{const d=c.range(_e[0],_e[1]),l=a*d*(1-Je);return Math.round(l*kt(e))});return i.disposition="sold",i.saleValue=s,i.soldVia="auction",e.finance.cash+=s,e.finance.totalRevenue+=s,!["Authentic","Modern Reproduction","Deliberate Forgery"].includes(i.authenticationOutcome)&&i.trueAuthenticity!=="authentic"?e.reputation.ethicalStanding=b(e.reputation.ethicalStanding-3,0,100):e.reputation.fieldReputation=b(e.reputation.fieldReputation+1,0,100),Y(e),ze(e),X(e),Se(e,"sell-rarity",{rarity:i.rarity},R),R(e,{type:"success",title:"Sold at Auction",message:`${i.name} sold for $${s.toLocaleString()}.`}),{saleValue:s}},UPDATE_SETTINGS(e,t){return Object.assign(e.settings,t),{}},DISMISS_TUTORIAL_STEP(e,{step:t}){return e.tutorial.dismissedSteps.includes(t)||e.tutorial.dismissedSteps.push(t),e.tutorial.currentStep=t+1,{}},RESET_TUTORIAL(e){return e.tutorial={active:!0,currentStep:0,dismissedSteps:[]},e.settings.tutorialEnabled=!0,{}},END_TUTORIAL(e){return e.tutorial.active=!1,{}},DISMISS_ALERT(e,{alertId:t}){return e.alerts=e.alerts.filter(i=>i.id!==t),{autosave:!1}}};function vn(e,t,i){const a=mn[t];if(!a)throw new Error(`Unknown action: ${t}`);return a(e,i||{})}class gn{constructor(){this._state=null,this._listeners=new Set,this._autosaveHook=null}setState(t){this._state=t,this._emit()}getState(){return this._state}hasGame(){return this._state!==null}subscribe(t){return this._listeners.add(t),()=>this._listeners.delete(t)}setAutosaveHook(t){this._autosaveHook=t}dispatch(t,i){if(!this._state)throw new Error(`Cannot dispatch ${t} before a game is loaded`);const a=vn(this._state,t,i)||{};return this._emit(),this._autosaveHook&&a.autosave!==!1&&this._autosaveHook(this._state),a}_emit(){for(const t of this._listeners)t(this._state)}}const m=new gn,bn={1:e=>({...e,crewCandidates:e.crewCandidates||[]}),2:e=>{const t={...e,stats:{...e.stats,leadsResolved:e.leads.archived.length}};for(let i=0;i<t.stats.leadsResolved;i++)Ke(t);return t},3:e=>({...e,sponsors:e.sponsors||[]}),4:e=>(e.leads.available.length===0&&e.leads.active.length===0&&Ke(e),e)};function St(e){let t=e.saveVersion||1;if(t>Te)throw new Error("This save was created by a newer version of the game and cannot be loaded here.");let i=e;for(;t<Te;){const a=bn[t];if(!a)throw new Error(`No migration path from save version ${t} to ${Te}.`);i=a(i),t+=1,i.saveVersion=t}return i}function wi(e){const t=document.createElement("template");return t.innerHTML=e.trim(),t.content.firstElementChild}function yn(e,t){return Array.from(e.querySelectorAll(t))}function re(e,t,i){yn(e,t).forEach(a=>{a.hasAttribute("role")||a.setAttribute("role","button"),a.hasAttribute("tabindex")||a.setAttribute("tabindex","0"),a.addEventListener("click",()=>i(a)),a.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),i(a))})})}function o(e){return String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}let W=null;function wn(){return W&&document.body.contains(W)||(W=document.createElement("div"),W.className="toast-region",W.setAttribute("role","status"),W.setAttribute("aria-live","polite"),document.body.appendChild(W)),W}function x(e,{variant:t="default",duration:i=3200}={}){const a=wi(`<div class="toast${t!=="default"?` toast--${t}`:""}">${o(e)}</div>`);wn().appendChild(a),setTimeout(()=>{a.style.transition="opacity 180ms ease",a.style.opacity="0",setTimeout(()=>a.remove(),200)},i)}function S(e){P("error"),x(e,{variant:"error",duration:4200})}function xt(e){P("success"),x(e,{variant:"success"})}const Pe="saves";function kn(){return new Promise((e,t)=>{try{const i=indexedDB.open(Ii,Ai);i.onupgradeneeded=()=>{const a=i.result;a.objectStoreNames.contains(Pe)||a.createObjectStore(Pe,{keyPath:"slotId"})},i.onsuccess=()=>e(i.result),i.onerror=()=>t(i.error)}catch(i){t(i)}})}async function xe(e,t){const i=await kn();return new Promise((a,s)=>{const n=i.transaction(Pe,e),r=n.objectStore(Pe),c=t(r);n.oncomplete=()=>a(c?.result),n.onerror=()=>s(n.error),n.onabort=()=>s(n.error)})}class En{constructor(){this._available=typeof indexedDB<"u",this._pendingSave=null,this._saveTimer=null,this._autosaveFailureWarned=!1}isAvailable(){return this._available}async listSlots(){if(!this._available)return Array(we).fill(null);try{const t=await xe("readonly",a=>a.getAll()),i=Array(we).fill(null);for(const a of t||[])a.slotId>=0&&a.slotId<we&&(i[a.slotId]=a);return i}catch(t){return console.error("Failed to list save slots",t),Array(we).fill(null)}}async loadSlot(t){if(!this._available)return null;let i;try{i=await xe("readonly",a=>a.get(t))}catch(a){throw console.error("Failed to read save slot",t,a),new Error("This save could not be read from storage.")}if(!i)return null;try{return St(i.state)}catch(a){throw a instanceof Error&&/save version|newer version/.test(a.message)?a:(console.error("Failed to migrate save slot",t,a),new Error("This save appears to be corrupted and could not be loaded."))}}async saveToSlot(t,i){if(!this._available)throw new Error("Saving is not available in this browser.");i.meta.slotId=t,i.meta.lastSavedAt=Date.now();const a={slotId:t,updatedAt:Date.now(),state:i};return await xe("readwrite",s=>s.put(a)),a}async deleteSlot(t){this._available&&await xe("readwrite",i=>i.delete(t))}scheduleAutosave(t,i=1200){t.meta.slotId!=null&&(this._pendingSave=t,this._saveTimer&&clearTimeout(this._saveTimer),this._saveTimer=setTimeout(()=>{const a=this._pendingSave;this._pendingSave=null,this.saveToSlot(a.meta.slotId,a).then(()=>{this._autosaveFailureWarned=!1}).catch(s=>{console.error("Autosave failed",s),this._autosaveFailureWarned||(this._autosaveFailureWarned=!0,S("Autosave failed — your progress may not be saved. Try exporting your save from Settings."))})},i))}exportSave(t){const i=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),a=URL.createObjectURL(i),s=`treasure-hunter-${(t.profile.orgName||"save").replace(/\s+/g,"-").toLowerCase()}-${Date.now()}.json`;return{url:a,filename:s}}async importSaveFromFile(t){const i=await t.text();let a;try{a=JSON.parse(i)}catch{throw new Error("That file is not valid save data (could not parse JSON).")}if(!a||typeof a!="object"||["profile","finance","reputation","date","settings","leads","sites","artifacts","equipment","vehicles","staff","organization","facilities","stats","achievements","milestones","alerts"].some(n=>!(n in a)))throw new Error("That file does not look like a complete Treasure Hunter save.");try{return St(a)}catch(n){throw n instanceof Error&&/save version|newer version/.test(n.message)?n:(console.error("Failed to migrate imported save",n),new Error("That save file is corrupted and could not be imported."))}}}const V=new En,it=new Map;let Me=null,at=null,dt=!1,$e=null;function L(e,t){it.set(e,t)}function Ce(e){dt=e}function Sn(){const e=window.location.hash.replace(/^#\//,"")||"headquarters",[t,...i]=e.split("/");return{screen:t||"headquarters",param:i.join("/")||null}}function y(e,t){dt=!1;const i=`#/${e}${t?`/${t}`:""}`;window.location.hash===i?Be():window.location.hash=i}function Be(){if($e){try{$e()}catch(n){console.error("Screen cleanup failed",n)}$e=null}const{screen:e,param:t}=Sn(),i=it.get(e)||it.get("headquarters");Me.innerHTML="";const a=document.createElement("div");a.className="screen",a.id="screen-root",Me.appendChild(a);const s=i(a,t);typeof s=="function"&&($e=s),at&&at(e,t),Me.scrollTop=0}function xn(){dt||Be()}function $n(e,t){Me=e,at=t,window.addEventListener("hashchange",Be),Be()}let ne=null,Le=null;function Cn(e,t){if(t.key!=="Tab")return;const i=e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(!i.length)return;const a=i[0],s=i[i.length-1];t.shiftKey&&document.activeElement===a?(t.preventDefault(),s.focus()):!t.shiftKey&&document.activeElement===s&&(t.preventDefault(),a.focus())}function oe(){ne&&(ne.remove(),ne=null,document.removeEventListener("keydown",ki),Le&&Le.focus&&Le.focus())}function ki(e){e.key==="Escape"&&oe(),ne&&Cn(ne,e)}function ut(e,{centered:t=!1,labelledBy:i,onMount:a}={}){oe(),Le=document.activeElement;const s=wi(`
    <div class="overlay" role="dialog" aria-modal="true" ${i?`aria-labelledby="${i}"`:""}>
      <div class="sheet${t?" modal-centered":""}">
        ${t?"":'<div class="sheet__handle"></div>'}
        ${e}
      </div>
    </div>
  `);s.addEventListener("click",c=>{c.target===s&&oe()}),document.body.appendChild(s),document.addEventListener("keydown",ki),ne=s;const n=s.querySelector(".sheet");return a&&a(n),n.querySelector("button, input, [tabindex]")?.focus(),n}function G({title:e,message:t,confirmLabel:i="Confirm",cancelLabel:a="Cancel",danger:s=!1}){return new Promise(n=>{let r=!1;const c=d=>{r||(r=!0,n(d),oe())};ut(`
      <h3 id="confirm-title">${o(e)}</h3>
      <p style="margin-top: var(--space-2);">${o(t)}</p>
      <div class="row" style="margin-top: var(--space-4);">
        <button class="btn btn--secondary" data-action="cancel" style="flex:1">${o(a)}</button>
        <button class="btn ${s?"btn--danger":"btn--primary"}" data-action="confirm" style="flex:1">${o(i)}</button>
      </div>
    `,{centered:!0,labelledBy:"confirm-title",onMount:d=>{d.querySelector('[data-action="confirm"]').addEventListener("click",()=>c(!0)),d.querySelector('[data-action="cancel"]').addEventListener("click",()=>c(!1))}})})}const $t={desert:{sky1:"#f2a35b",sky2:"#26314f",land1:"#7b5130",land2:"#c28b4d",accent:"#ffd98a",water:"#3f8a86"},jungle:{sky1:"#4aa08f",sky2:"#102d2b",land1:"#153c2f",land2:"#2f6b45",accent:"#d8c46a",water:"#2f8f91"},coastal:{sky1:"#62a8b7",sky2:"#0d2538",land1:"#22304a",land2:"#c8ab7d",accent:"#e3c785",water:"#256b86"},mountain:{sky1:"#7d91aa",sky2:"#101828",land1:"#2b2e36",land2:"#6b7380",accent:"#e3c785",water:"#3f8a86"},urban:{sky1:"#5b6a86",sky2:"#111a2c",land1:"#1b1d22",land2:"#3a4254",accent:"#e3c785",water:"#3f8a86"}};function In(e){return $t[e]||$t.desert}function Ei(){return`
    <svg class="title-scene__art" viewBox="0 0 720 420" role="img" aria-label="An expedition desk with a map, compass, lantern, and marked treasure route">
      <defs>
        <radialGradient id="title-lantern-glow" cx="72%" cy="28%" r="44%">
          <stop offset="0%" stop-color="#f7d894" stop-opacity="0.95" />
          <stop offset="54%" stop-color="#c9a15a" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#0b1220" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="title-map-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f6e9c8" />
          <stop offset="100%" stop-color="#b98b4a" />
        </linearGradient>
        <filter id="title-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000000" flood-opacity="0.4" />
        </filter>
      </defs>
      <rect width="720" height="420" fill="#0b1220" />
      <rect width="720" height="420" fill="url(#title-lantern-glow)" />
      <path d="M0 321 C121 274 206 309 322 275 C438 241 542 248 720 194 V420 H0 Z" fill="#111a2c" opacity="0.88" />
      <g filter="url(#title-soft-shadow)" transform="translate(74 74) rotate(-5 270 145)">
        <path d="M29 28 C118 10 183 43 270 26 C357 9 435 33 516 15 L560 249 C470 269 393 239 308 258 C220 278 141 249 53 272 Z" fill="url(#title-map-paper)" />
        <path d="M66 88 C132 76 178 99 229 87 C276 76 332 53 399 78 C456 99 496 83 529 69" fill="none" stroke="#7a4f27" stroke-width="3" stroke-dasharray="8 8" opacity="0.55" />
        <path d="M93 198 C151 167 191 206 251 179 C317 150 351 172 414 139 C456 117 499 123 540 104" fill="none" stroke="#2f6b68" stroke-width="10" opacity="0.25" />
        <path d="M82 70 L153 124 L128 212 L211 172 L281 236 L350 154 L437 189 L515 88" fill="none" stroke="#7a3f2b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <g fill="#9a2f28">
          <circle cx="82" cy="70" r="8" />
          <circle cx="211" cy="172" r="8" />
          <circle cx="350" cy="154" r="8" />
          <circle cx="515" cy="88" r="10" />
        </g>
        <path d="M501 77 l28 28 M529 77 l-28 28" stroke="#9a2f28" stroke-width="5" stroke-linecap="round" />
        <g transform="translate(378 196)">
          <circle r="34" fill="#111a2c" opacity="0.88" />
          <circle r="27" fill="none" stroke="#e3c785" stroke-width="3" />
          <path d="M0 -22 L8 5 L0 22 L-8 5 Z" fill="#e3c785" />
          <path d="M0 -22 L8 5 L0 1 L-8 5 Z" fill="#f4ecd8" opacity="0.65" />
        </g>
      </g>
      <g transform="translate(522 54)">
        <rect x="40" y="63" width="44" height="72" rx="8" fill="#1b1d22" stroke="#c9a15a" stroke-width="3" />
        <path d="M49 63 C50 25 77 25 79 63" fill="none" stroke="#c9a15a" stroke-width="5" />
        <ellipse cx="62" cy="105" rx="18" ry="26" fill="#f4d18a" opacity="0.82" class="lantern-flicker" />
      </g>
      <g transform="translate(78 298)" opacity="0.86">
        <rect x="0" y="24" width="124" height="38" rx="7" fill="#1b1d22" stroke="#8b93a5" />
        <rect x="17" y="0" width="55" height="33" rx="5" fill="#1b1d22" stroke="#8b93a5" />
        <circle cx="27" cy="68" r="14" fill="#0b1220" stroke="#c8ab7d" stroke-width="4" />
        <circle cx="96" cy="68" r="14" fill="#0b1220" stroke="#c8ab7d" stroke-width="4" />
      </g>
    </svg>
  `}function An(e){return`
    <svg viewBox="0 0 720 320" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${o(e.profile.orgName||"Independent Explorer")} headquarters with maps, gear, and an expedition vehicle">
      <defs>
        <linearGradient id="hq-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#263b5f" />
          <stop offset="62%" stop-color="#101828" />
          <stop offset="100%" stop-color="#0b1220" />
        </linearGradient>
        <radialGradient id="hq-light" cx="36%" cy="42%" r="42%">
          <stop offset="0%" stop-color="#e3c785" stop-opacity="0.48" />
          <stop offset="100%" stop-color="#e3c785" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="720" height="320" fill="url(#hq-sky)" />
      <rect width="720" height="320" fill="url(#hq-light)" />
      <path d="M0 241 C98 212 166 235 251 216 C359 191 449 216 548 186 C617 165 671 159 720 148 V320 H0 Z" fill="#172134" />
      <path d="M0 270 C112 244 184 262 289 244 C420 222 525 247 720 203 V320 H0 Z" fill="#0f1727" />
      <g transform="translate(70 118)">
        <rect x="0" y="28" width="314" height="112" fill="#1b2740" stroke="#51607a" stroke-width="3" />
        <polygon points="-10,28 153,-31 324,28" fill="#121d31" stroke="#51607a" stroke-width="3" />
        <rect x="22" y="58" width="76" height="82" fill="#0b1220" stroke="#c9a15a" stroke-width="3" />
        <rect x="124" y="66" width="54" height="42" fill="#101828" stroke="#8b93a5" />
        <rect x="196" y="66" width="54" height="42" fill="#101828" stroke="#8b93a5" />
        <circle cx="60" cy="45" r="6" fill="#e3c785" class="pulse-anim" />
        <path d="M41 101 L83 76 L116 95 L154 75 L216 102 L261 82" fill="none" stroke="#c9a15a" stroke-width="3" stroke-dasharray="5 5" opacity="0.8" />
      </g>
      <g transform="translate(449 214)">
        <rect x="0" y="21" width="138" height="42" rx="8" fill="#2b2e36" stroke="#8b93a5" stroke-width="2" />
        <rect x="23" y="-7" width="62" height="32" rx="6" fill="#2b2e36" stroke="#8b93a5" stroke-width="2" />
        <path d="M96 24 L133 24 L116 3 L91 2 Z" fill="#22304a" stroke="#8b93a5" />
        <circle cx="29" cy="70" r="15" fill="#0b1220" stroke="#c8ab7d" stroke-width="4" />
        <circle cx="109" cy="70" r="15" fill="#0b1220" stroke="#c8ab7d" stroke-width="4" />
      </g>
      <g transform="translate(516 56)" opacity="0.92">
        <circle cx="52" cy="52" r="43" fill="#101828" stroke="#c9a15a" stroke-width="3" />
        <path d="M52 16 L66 56 L52 88 L38 56 Z" fill="#c9a15a" />
        <path d="M52 16 L66 56 L52 51 L38 56 Z" fill="#f4ecd8" opacity="0.62" />
      </g>
    </svg>
  `}function Rn(e,t){const i=In(t),a={travel:"Driving toward the expedition site",survey:"Surveying the terrain for evidence",excavation:"Excavating a promising location",discovery:"A buried artifact emerging from the site",extraction:"Returning the find safely"}[e]||"Expedition underway";return`
    <svg viewBox="0 0 720 340" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${o(a)}">
      <defs>
        <linearGradient id="exp-sky-${e}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${i.sky1}" stop-opacity="0.95" />
          <stop offset="58%" stop-color="${i.sky2}" />
          <stop offset="100%" stop-color="#0b1220" />
        </linearGradient>
        <radialGradient id="exp-glow-${e}" cx="54%" cy="56%" r="32%">
          <stop offset="0%" stop-color="${i.accent}" stop-opacity="${e==="discovery"?"0.82":"0.3"}" />
          <stop offset="100%" stop-color="${i.accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="720" height="340" fill="url(#exp-sky-${e})" />
      <circle cx="596" cy="66" r="38" fill="${i.accent}" opacity="0.2" />
      <path d="M0 244 C122 190 198 239 323 205 C454 170 548 196 720 129 V340 H0 Z" fill="${i.land1}" opacity="0.9" />
      <path d="M0 282 C128 247 218 269 335 239 C492 199 579 241 720 204 V340 H0 Z" fill="${i.land2}" opacity="0.82" />
      <path d="M0 300 C126 281 217 292 356 267 C484 244 588 268 720 237 V340 H0 Z" fill="#0b1220" opacity="0.58" />
      ${t==="coastal"?`<path d="M0 255 C140 236 231 267 360 241 C502 213 603 233 720 218 V340 H0 Z" fill="${i.water}" opacity="0.52" />`:""}
      <rect width="720" height="340" fill="url(#exp-glow-${e})" />
      ${e==="travel"?`
        <g transform="translate(168 154)">
          <rect x="0" y="22" width="150" height="42" rx="8" fill="#242a34" stroke="#c8ab7d" stroke-width="2" />
          <rect x="24" y="-7" width="68" height="34" rx="6" fill="#242a34" stroke="#c8ab7d" stroke-width="2" />
          <path d="M106 23 L146 23 L126 0 L101 0 Z" fill="#22304a" stroke="#c8ab7d" />
          <circle cx="34" cy="70" r="15" fill="#0b1220" stroke="#f4ecd8" stroke-width="4" />
          <circle cx="119" cy="70" r="15" fill="#0b1220" stroke="#f4ecd8" stroke-width="4" />
          <path d="M-56 69 H-8 M-86 54 H-28" stroke="#f4ecd8" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round" />
        </g>
      `:""}
      ${e==="survey"?`
        <g transform="translate(354 202)">
          <circle r="64" fill="none" stroke="${i.accent}" stroke-width="3" opacity="0.32" class="scan-ring" />
          <circle r="34" fill="none" stroke="${i.accent}" stroke-width="3" opacity="0.58" class="pulse-anim" />
          <path d="M0 -74 V74 M-74 0 H74" stroke="${i.accent}" stroke-width="2" opacity="0.45" />
          <circle r="7" fill="#f4ecd8" />
        </g>
      `:""}
      ${e==="excavation"?`
        <g transform="translate(315 224)">
          <path d="M-88 54 C-42 -23 66 -23 119 52" fill="none" stroke="${i.accent}" stroke-width="8" stroke-linecap="round" />
          <path d="M-76 55 C-32 22 73 20 111 55" fill="#0b1220" opacity="0.72" />
          <path d="M-28 -18 L36 46 M44 -21 L-20 43" stroke="#f4ecd8" stroke-width="5" stroke-linecap="round" opacity="0.78" />
        </g>
      `:""}
      ${e==="discovery"?`
        <g transform="translate(360 207)" class="artifact-glow">
          <ellipse cx="0" cy="72" rx="110" ry="24" fill="#0b1220" opacity="0.55" />
          <path d="M-36 65 L-16 -34 L34 -18 L43 67 Z" fill="#f4ecd8" stroke="${i.accent}" stroke-width="5" />
          <path d="M-18 -10 L28 8 M-24 23 L35 38" stroke="#9b5e2e" stroke-width="4" opacity="0.62" />
          <circle cx="8" cy="10" r="10" fill="${i.accent}" opacity="0.8" />
        </g>
      `:""}
      ${e==="extraction"?`
        <g transform="translate(432 226)">
          <rect x="0" y="22" width="136" height="42" rx="8" fill="#242a34" stroke="#c8ab7d" stroke-width="2" />
          <rect x="20" y="-6" width="57" height="34" rx="6" fill="#242a34" stroke="#c8ab7d" stroke-width="2" />
          <rect x="91" y="3" width="30" height="22" rx="4" fill="${i.accent}" opacity="0.75" />
          <circle cx="29" cy="70" r="15" fill="#0b1220" stroke="#f4ecd8" stroke-width="4" />
          <circle cx="108" cy="70" r="15" fill="#0b1220" stroke="#f4ecd8" stroke-width="4" />
        </g>
      `:""}
    </svg>
  `}function je(e,t={}){const i=e?.rarity||"Common",a=String(e?.objectType||e?.name||"artifact").toLowerCase(),s=t.compact?" artifact-thumb--compact":"",n=a.includes("coin")||a.includes("seal")?"coin":a.includes("mask")?"mask":a.includes("weapon")||a.includes("blade")||a.includes("dagger")?"blade":a.includes("textile")||a.includes("manuscript")||a.includes("document")?"scroll":"relic",r=o(e?.name||"Uncatalogued artifact");return`
    <div class="artifact-thumb rarity-${o(i).replace(/[^a-zA-Z0-9-]/g,"-")}${s}" aria-label="${r}">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <rect width="120" height="120" rx="18" fill="var(--artifact-bg)" />
        <circle cx="60" cy="58" r="43" fill="var(--artifact-light)" opacity="0.14" />
        <circle cx="60" cy="58" r="32" fill="var(--artifact-dark)" opacity="0.18" />
        ${n==="coin"?'<circle cx="60" cy="60" r="31" fill="none" stroke="var(--artifact-line)" stroke-width="8"/><circle cx="60" cy="60" r="15" fill="none" stroke="var(--artifact-line)" stroke-width="5"/>':""}
        ${n==="mask"?'<path d="M31 30 C49 17 75 17 91 31 L83 88 C73 101 47 101 37 88 Z" fill="var(--artifact-fill)" stroke="var(--artifact-line)" stroke-width="5"/><circle cx="49" cy="58" r="6" fill="var(--artifact-dark)"/><circle cx="73" cy="58" r="6" fill="var(--artifact-dark)"/><path d="M50 78 C58 84 67 84 75 78" fill="none" stroke="var(--artifact-dark)" stroke-width="4" stroke-linecap="round"/>':""}
        ${n==="blade"?'<path d="M63 14 C79 39 73 64 61 90 C47 64 42 39 59 14 Z" fill="var(--artifact-fill)" stroke="var(--artifact-line)" stroke-width="5"/><path d="M40 91 H82 M60 88 V109" stroke="var(--artifact-line)" stroke-width="7" stroke-linecap="round"/>':""}
        ${n==="scroll"?'<path d="M35 27 H85 C75 36 75 82 85 92 H35 C45 82 45 36 35 27 Z" fill="var(--artifact-fill)" stroke="var(--artifact-line)" stroke-width="5"/><path d="M50 49 H75 M49 62 H78 M50 75 H68" stroke="var(--artifact-dark)" stroke-width="4" stroke-linecap="round" opacity="0.58"/>':""}
        ${n==="relic"?'<path d="M60 18 L88 43 L78 91 H42 L32 43 Z" fill="var(--artifact-fill)" stroke="var(--artifact-line)" stroke-width="5"/><path d="M48 47 H72 M43 64 H77" stroke="var(--artifact-dark)" stroke-width="5" stroke-linecap="round" opacity="0.58"/><circle cx="60" cy="78" r="7" fill="var(--artifact-line)"/>':""}
      </svg>
    </div>
  `}function Tn(e){return new Promise(t=>{pt(e,t)})}async function pt(e,t){const i=await V.listSlots();e.innerHTML=`
    <div class="title-screen">
      <div class="title-scene">
        ${Ei()}
        <div class="title-scene__scrim"></div>
        <div class="title-lockup title-lockup--hero">
          <span class="eyebrow">Field office now open</span>
          <h1>${o(se.gameTitle)}</h1>
          <p class="subtitle">${o(se.subtitle)}</p>
          <p class="title-copy">Research impossible leads, assemble a crew, brave hostile sites, and decide what history is worth once it is back in your hands.</p>
        </div>
      </div>
      <div class="title-panel">
        <div class="row row--between title-panel__heading">
          <div>
            <span class="eyebrow">Save Slots</span>
            <h2>Choose an expedition file</h2>
          </div>
          <span class="badge badge--brass">Offline PWA</span>
        </div>
        <div class="stack" id="slot-list"></div>
        <button class="btn btn--ghost btn--full" id="import-btn">Import Save File</button>
      </div>
      <input type="file" id="import-input" accept="application/json" class="visually-hidden" />
    </div>
  `;const a=e.querySelector("#slot-list");i.forEach((s,n)=>{const r=document.createElement("div");if(r.className="card",s){const c=s.state;r.innerHTML=`
        <div class="row row--between">
          <div>
            <strong>${o(c.profile.orgName||"Unnamed Organization")}</strong>
            <div class="muted text-sm">${o(c.profile.explorerName)} · ${vi(c.date)} · ${w(c.finance.cash)}</div>
          </div>
        </div>
        <div class="row" style="margin-top: var(--space-3);">
          <button class="btn btn--primary" data-continue="${n}" style="flex:1">Continue</button>
          <button class="btn btn--secondary" data-newgame="${n}">New</button>
          <button class="btn btn--danger" data-delete="${n}">Delete</button>
        </div>
      `}else r.innerHTML=`
        <div class="row row--between">
          <span class="muted">Slot ${n+1} — Empty</span>
          <button class="btn btn--primary" data-newgame="${n}">Start New Game</button>
        </div>
      `;r.classList.add("slot-card"),a.appendChild(r)}),a.addEventListener("click",async s=>{const n=s.target.closest("[data-continue]"),r=s.target.closest("[data-newgame]"),c=s.target.closest("[data-delete]");if(n){const d=Number(n.dataset.continue);try{const l=await V.loadSlot(d);m.setState(l),t()}catch(l){S(l.message)}}else if(r){const d=Number(r.dataset.newgame);Mn(e,d,t)}else if(c){const d=Number(c.dataset.delete);await G({title:"Delete this save?",message:"This cannot be undone.",confirmLabel:"Delete",danger:!0})&&(await V.deleteSlot(d),pt(e,t))}}),e.querySelector("#import-btn").addEventListener("click",()=>e.querySelector("#import-input").click()),e.querySelector("#import-input").addEventListener("change",async s=>{const n=s.target.files[0];if(n)try{const r=await V.importSaveFromFile(n),c=i.findIndex(l=>!l);if(c===-1){const l=i[0]?.state;if(!await G({title:"All save slots are full",message:`Importing will overwrite "${l?.profile?.orgName||"Slot 1"}". This cannot be undone.`,confirmLabel:"Overwrite Slot 1",danger:!0}))return}const d=c===-1?0:c;await V.saveToSlot(d,r),m.setState(r),t()}catch(r){S(r.message)}})}function Mn(e,t,i){const a={explorerName:"",orgName:"",difficulty:"adventurer",tutorialEnabled:!0,step:0};function s(){a.step===0?n():a.step===1?r():c()}function n(){e.innerHTML=`
      <div class="wizard-screen stack">
        <span class="eyebrow">New Expedition</span>
        <h2>Who's leading this outfit?</h2>
        <p class="muted">Give the field reports a name. This is the person people will blame when the map is wrong.</p>
        <div class="field">
          <label for="explorer-name">Explorer name</label>
          <input type="text" id="explorer-name" maxlength="30" placeholder="e.g. Mara Ashworth" value="${o(a.explorerName)}" />
        </div>
        <div class="field">
          <label for="org-name">Organization name</label>
          <input type="text" id="org-name" maxlength="40" placeholder="e.g. Ashworth Field Recovery" value="${o(a.orgName)}" />
        </div>
        <button class="btn btn--primary btn--full" id="next-btn">Continue</button>
        <button class="btn btn--ghost btn--full" id="back-btn">Back</button>
      </div>
    `,e.querySelector("#next-btn").addEventListener("click",()=>{const d=e.querySelector("#explorer-name").value.trim(),l=e.querySelector("#org-name").value.trim();if(!d){S("Enter an explorer name to continue.");return}a.explorerName=d,a.orgName=l,a.step=1,s()}),e.querySelector("#back-btn").addEventListener("click",()=>pt(e,i))}function r(){e.innerHTML=`
      <div class="wizard-screen stack">
        <span class="eyebrow">New Expedition</span>
        <h2>Choose your difficulty</h2>
        <p class="muted">The story is the same; the margin for error is not.</p>
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
    `;const d=e.querySelector("#difficulty-list");Object.values(ee).forEach(l=>{const p=document.createElement("button");p.className="difficulty-option",p.setAttribute("aria-pressed",String(l.id===a.difficulty)),p.innerHTML=`<strong>${o(l.label)}</strong><div class="muted text-sm">${o(l.description)}</div>`,p.addEventListener("click",()=>{a.difficulty=l.id,d.querySelectorAll(".difficulty-option").forEach(f=>f.setAttribute("aria-pressed","false")),p.setAttribute("aria-pressed","true")}),d.appendChild(p)}),e.querySelector("#tutorial-toggle").addEventListener("change",l=>{a.tutorialEnabled=l.target.checked}),e.querySelector("#next-btn").addEventListener("click",()=>{a.step=2,s()}),e.querySelector("#back-btn").addEventListener("click",()=>{a.step=0,s()})}function c(){e.innerHTML=`
      <div class="wizard-screen wizard-screen--prologue stack">
        <div class="prologue-map">${Ei()}</div>
        <span class="eyebrow">Prologue</span>
        <h2>The Storage Unit</h2>
        <p class="premise-text">You paid $340 sight-unseen for the contents of a retired explorer's storage unit, mostly hoping for tools you could resell.</p>
        <p class="premise-text">Instead you found a water-damaged field journal, a hand-drawn map with the destination smudged away, and a folder of newspaper clippings about a Continental Survey Corps expedition that vanished in the Black Mesa Desert in 1891 — and was never found.</p>
        <p class="premise-text">Everyone else gave up on it. You have a truck, a shovel, and nothing better to do.</p>
        <button class="btn btn--primary btn--full" id="start-btn">Begin</button>
        <button class="btn btn--ghost btn--full" id="back-btn">Back</button>
      </div>
    `,e.querySelector("#start-btn").addEventListener("click",async()=>{const d=fn(a);try{await V.saveToSlot(t,d)}catch{S("Could not save your new game — check available storage and try again.");return}m.setState(d),i()}),e.querySelector("#back-btn").addEventListener("click",()=>{a.step=1,s()})}s()}function Ie({label:e,value:t,accent:i=!1}){return`
    <div class="stat-card">
      <span class="stat-card__label">${o(e)}</span>
      <span class="stat-card__value${i?" stat-card__value--accent":""}">${t}</span>
    </div>
  `}function Ln(e){return{info:"ℹ",success:"✓",warning:"⚠",expedition:"➤",milestone:"★",achievement:"★"}[e]||"•"}function qn(e){const t=m.getState(),i=t.reputation,a=Math.round((i.publicFame+i.academicCredibility+i.fieldReputation)/3),s=[...t.leads.available,...t.leads.active].slice(-1)[0],n=t.artifacts.slice(-1)[0];e.innerHTML=`
    <div class="hq-hero">
      <div class="hq-hero__scene">${An(t)}</div>
      <div class="hq-hero__caption">
        <span class="eyebrow">${o(t.organization.tierName)}</span>
        <h1>${o(t.profile.orgName)}</h1>
        <p class="text-sm">${o(t.player.name)} · ${vi(t.date)}</p>
        <div class="hero-actions">
          <button class="btn btn--primary btn--sm" id="hero-leads-btn">Review Leads</button>
          <button class="btn btn--secondary btn--sm" id="hero-expeditions-btn">Plan Run</button>
        </div>
      </div>
    </div>

    <div class="grid-2">
      ${Ie({label:"Cash",value:w(t.finance.cash),accent:!0})}
      ${Ie({label:"Overall Reputation",value:a})}
      ${Ie({label:"Research Points",value:t.researchPoints})}
      ${Ie({label:"Prestige",value:t.organization.prestige})}
    </div>

    <div class="card objective-card" id="objective-card">
      <span class="eyebrow">Current Objective</span>
      <h3>${o(t.objectives.main?.label||"Explore your options")}</h3>
      ${t.objectives.optional.length?`
        <ul class="stack text-sm muted" style="margin: var(--space-2) 0 0; padding-left: 18px;">
          ${t.objectives.optional.map(r=>`<li>${o(r.label)}</li>`).join("")}
        </ul>
      `:""}
    </div>

    <div class="card command-card">
      <span class="eyebrow">Next Best Move</span>
      <div class="command-card__grid">
        <button class="command-card__action" id="quick-leads-btn">
          <strong>Investigate</strong>
          <span>Turn rumors and fragments into expedition-ready evidence.</span>
        </button>
        <button class="command-card__action" id="quick-expedition-btn">
          <strong>Mount Expedition</strong>
          <span>Pick a site, load the truck, and take your chances in the field.</span>
        </button>
      </div>
    </div>

    ${t.activeExpedition?`
      <div class="card" style="border-color: var(--border-strong);">
        <span class="eyebrow">Active Expedition</span>
        <p>Underway — check in to continue making decisions in the field.</p>
        <button class="btn btn--primary btn--full" id="resume-expedition-btn" style="margin-top: var(--space-3);">Resume Expedition</button>
      </div>
    `:""}

    <div class="grid-2-tablet stack">
      ${s?`
        <div class="card card--interactive" id="recent-lead-card">
          <span class="eyebrow">Recent Lead</span>
          <h3>${o(s.title)}</h3>
          <p class="text-sm">${o(s.potentialDescription)}</p>
        </div>
      `:""}
      ${n?`
        <div class="card card--interactive" id="recent-artifact-card">
          <span class="eyebrow">Recent Find</span>
          <h3>${o(n.name)}</h3>
          <p class="text-sm">${o(n.condition)} condition · ${o(n.rarity)}</p>
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
              <span class="alert-item__icon">${Ln(r.type)}</span>
              <div>
                <strong class="text-sm">${o(r.title)}</strong>
                <p class="text-sm">${o(r.message)}</p>
              </div>
            </div>
          `).join("")}
        </div>
      `:'<p class="empty-state">No alerts yet — go find something.</p>'}
    </div>
  `,e.querySelector("#hero-leads-btn")?.addEventListener("click",()=>y("leads")),e.querySelector("#hero-expeditions-btn")?.addEventListener("click",()=>y("expeditions")),e.querySelector("#quick-leads-btn")?.addEventListener("click",()=>y("leads")),e.querySelector("#quick-expedition-btn")?.addEventListener("click",()=>y("expeditions")),e.querySelector("#resume-expedition-btn")?.addEventListener("click",()=>y("live-expedition")),re(e,"#recent-lead-card",()=>y("leads",s.instanceId)),re(e,"#recent-artifact-card",()=>y("artifact-detail",n.id))}function Ue({value:e,max:t=1,variant:i=""}){const a=Math.max(0,Math.min(100,e/t*100));return`
    <div class="progress" role="progressbar" aria-valuenow="${Math.round(a)}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress__fill${i?` progress__fill--${i}`:""}" style="width:${a}%"></div>
    </div>
  `}function Dn(e,t){return`
    <div class="card card--interactive" data-lead="${e.instanceId}">
      <div class="row row--between">
        <span class="eyebrow">${o(e.category.replace(/-/g," "))}</span>
        <span class="badge reliability-tag">${o(e.sourceReliability)}</span>
      </div>
      <h3>${o(e.title)}</h3>
      <p class="text-sm">${o(e.potentialDescription)}</p>
      <div style="margin-top: var(--space-2);">
        ${Ue({value:t,max:1})}
        <span class="text-sm muted">Overall confidence: ${q(t)}</span>
      </div>
    </div>
  `}function _n(e,t){const i=[{title:"Active Investigations",leads:t.leads.active},{title:"Available Leads",leads:t.leads.available},{title:"Archived",leads:t.leads.archived}].filter(r=>r.leads.length),a=t.contracts.filter(r=>r.status==="active"),s=t.contracts.filter(r=>r.status==="completed"),n=Ta(t);e.innerHTML=`
    <h1>Leads</h1>
    ${i.length?i.map(r=>`
      <div class="stack">
        <h2>${r.title}</h2>
        <div class="stack">${r.leads.map(c=>Dn(c,fi(c))).join("")}</div>
      </div>
    `).join(""):'<p class="empty-state">No leads yet. Check back after your next expedition.</p>'}

    <div class="stack">
      <h2>Contracts</h2>
      ${a.length?`
        <div class="stack">
          ${a.map(r=>{const c=He(r.templateId);return`<div class="card"><div class="row row--between"><strong>${o(c.title)}</strong><span class="badge badge--brass">Active</span></div><p class="text-sm muted">${o(c.client)} — ${o(c.description)}</p></div>`}).join("")}
        </div>
      `:""}
      ${s.length?`
        <div class="stack">
          ${s.map(r=>{const c=He(r.templateId);return`<div class="card"><div class="row row--between"><strong>${o(c.title)}</strong><span class="badge badge--success">Fulfilled</span></div></div>`}).join("")}
        </div>
      `:""}
      ${n.length?`
        <div class="stack">
          ${n.map(r=>`
            <div class="card">
              <div class="row row--between">
                <strong>${o(r.title)}</strong>
                <span class="badge">${o(r.client)}</span>
              </div>
              <p class="text-sm muted">${o(r.description)}</p>
              <div class="row row--between" style="margin-top:var(--space-2);">
                <span class="text-sm muted">Reward: ${w(r.reward.cash)}</span>
                <button class="btn btn--secondary btn--sm" data-accept-contract="${r.id}">Accept</button>
              </div>
            </div>
          `).join("")}
        </div>
      `:""}
      ${!a.length&&!s.length&&!n.length?'<p class="empty-state">No contracts right now.</p>':""}
    </div>
  `,re(e,"[data-lead]",r=>y("leads",r.dataset.lead)),e.querySelectorAll("[data-accept-contract]").forEach(r=>{r.addEventListener("click",()=>{try{m.dispatch("ACCEPT_CONTRACT",{contractId:r.dataset.acceptContract}),x("Contract accepted.")}catch(c){S(c.message)}})})}function Qe(e,t){return`
    <div class="confidence-row">
      <div class="confidence-row__label"><span>${o(e)}</span><span>${q(t)}</span></div>
      ${Ue({value:t,max:1})}
    </div>
  `}function Hn(e,t,i){const a=ee[t.profile.difficulty],s=t.sites.find(r=>r.instanceId===i.siteId),n=i.confidence;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; All Leads</button>
    <div class="stack">
      <span class="eyebrow">${o(i.category.replace(/-/g," "))} · ${o(s?.regionId?.replace(/-/g," ")||"")}</span>
      <h1>${o(i.title)}</h1>
      <p>${o(i.potentialDescription)}</p>
      <p class="text-sm muted">Source: ${o(i.source)}</p>
    </div>

    <div class="card stack">
      <h3>Confidence</h3>
      ${Qe("Site location",n.siteLocation)}
      ${Qe("Historical",n.historical)}
      ${Qe("Legal",n.legal)}
    </div>

    <div class="card stack">
      <h3>Known Risks</h3>
      <div class="row row--wrap">
        ${i.knownRisks.map(r=>`<span class="badge badge--warning">${o(r)}</span>`).join("")}
        ${i.discoveredHazards.map(r=>`<span class="badge badge--danger">${o(r)}</span>`).join("")}
      </div>
    </div>

    ${(i.rivalInterest||0)>0?`
      <div class="card stack">
        <h3>Rival Activity</h3>
        <div class="row row--between">
          <span class="text-sm muted">Interest level</span>
          <span class="badge ${i.rivalInterest>=.75?"badge--danger":i.rivalInterest>=.5?"badge--warning":""}">${wa(i.rivalInterest)}</span>
        </div>
        ${i.rivalDisturbed?`<p class="text-sm" style="color:var(--danger);">${o(et.find(r=>r.id===i.rivalId)?.name||"A rival")} has already been through this site — expect a weaker haul.</p>`:'<p class="text-sm muted">The longer this sits unresolved, the more likely someone else notices it too.</p>'}
      </div>
    `:""}

    <div class="stack">
      <h2>Research</h2>
      <div class="stack" id="research-list">
        ${Ut.map(r=>{const c=Math.round(r.cost*a.researchCostMultiplier),d=t.finance.cash>=c;return`
            <div class="card">
              <div class="row row--between">
                <div>
                  <strong>${o(r.label)}</strong>
                  <p class="text-sm">${o(r.description)}</p>
                </div>
              </div>
              <div class="row row--between" style="margin-top: var(--space-2);">
                <span class="text-sm muted">${w(c)} · ${Ne(r.timeHours)}</span>
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
              <strong class="text-sm">${o(r.label)}</strong>
              <div class="text-sm muted">${r.deltaLines.map(o).join(" · ")}</div>
              ${r.hazardRevealed?`<div class="text-sm" style="color:var(--warning)">New hazard identified: ${o(r.hazardRevealed)}</div>`:""}
            </div>
          `).join("")}
        </div>
      `:""}
    </div>

    <button class="btn btn--secondary btn--full" id="evidence-btn">Open Evidence Board</button>
    <button class="btn btn--primary btn--full" id="plan-btn" ${t.activeExpedition?"disabled":""}>
      ${t.activeExpedition?"Expedition Already Underway":"Plan Expedition"}
    </button>
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("leads")),e.querySelector("#evidence-btn").addEventListener("click",()=>y("evidence",i.instanceId)),e.querySelector("#plan-btn").addEventListener("click",()=>{t.activeExpedition||y("planning",i.instanceId)}),e.querySelectorAll("[data-research]").forEach(r=>{r.addEventListener("click",()=>{try{m.dispatch("RESEARCH_LEAD",{leadInstanceId:i.instanceId,actionId:r.dataset.research}),x("Research complete — check your field notes.")}catch(c){S(c.message)}})})}function Nn(e,t){return e.leads.available.find(i=>i.instanceId===t)||e.leads.active.find(i=>i.instanceId===t)||e.leads.archived.find(i=>i.instanceId===t)}function Pn(e,t){const i=m.getState();if(t){const a=Nn(i,t);if(a){Hn(e,i,a);return}}_n(e,i)}function Bn(e,t){return e.leads.available.find(i=>i.instanceId===t)||e.leads.active.find(i=>i.instanceId===t)||e.leads.archived.find(i=>i.instanceId===t)}function Fn(e,t){const i=m.getState(),a=Bn(i,t);if(!a){e.innerHTML='<p class="empty-state">Lead not found.</p>';return}const s=ji(a);e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; ${o(a.title)}</button>
    <h1>Evidence Board</h1>
    <p class="muted">Everything you've uncovered so far, gathered in one place.</p>
    <div class="evidence-grid">
      ${s.length?s.map(n=>`
        <div class="card evidence-card">
          <span class="evidence-card__category">${o(n.category.replace(/-/g," "))}</span>
          <h3>${o(n.title)}</h3>
          <p class="text-sm">${o(n.text)}</p>
        </div>
      `).join(""):'<p class="empty-state">No evidence uncovered yet — try researching this lead.</p>'}
    </div>

    <div class="card stack">
      <h2>Draw a Conclusion</h2>
      <p class="text-sm muted">Where was the site most likely located? Choose carefully — evidence supports one answer better than the others, but nothing here is certain.</p>
      <div class="stack" id="conclusion-options">
        ${a.conclusionOptions.map(n=>`
          <button class="conclusion-option" data-conclusion="${n.id}" aria-pressed="${a.conclusionChosenId===n.id}" ${a.conclusionChosenId?"disabled":""}>
            <strong>${o(n.label)}</strong>
            <div class="text-sm muted">${o(n.description)}</div>
          </button>
        `).join("")}
      </div>
      ${a.conclusionChosenId?`<p class="text-sm" style="color:var(--accent);">Conclusion locked in — this will shape your expedition's risk profile.</p>`:""}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("leads",a.instanceId)),e.querySelectorAll("[data-conclusion]").forEach(n=>{n.addEventListener("click",()=>{if(!a.conclusionChosenId)try{m.dispatch("CHOOSE_LEAD_CONCLUSION",{leadInstanceId:a.instanceId,conclusionId:n.dataset.conclusion}),x("Conclusion recorded.")}catch(r){S(r.message)}})})}function On(e,t){return e.leads.available.find(i=>i.instanceId===t)||e.leads.active.find(i=>i.instanceId===t)}function Ct(e,t){const i=[...t.leads.active,...t.leads.available];e.innerHTML=`
    <h1>Expeditions</h1>
    ${i.length?`
      <div class="stack">
        <h2>Ready to Plan</h2>
        <div class="stack">
          ${i.map(a=>`
            <div class="card card--interactive" data-lead="${a.instanceId}">
              <strong>${o(a.title)}</strong>
              <p class="text-sm muted">${o(a.potentialDescription)}</p>
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
                <strong>${o(a.leadTitle)}</strong>
                <span class="badge ${a.success?"badge--success":"badge--danger"}">${a.success?"Success":"Unsuccessful"}</span>
              </div>
              <p class="text-sm muted">${o(a.siteName)} · Net ${w(a.financials.estimatedNetValue)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `:""}
  `,re(e,"[data-lead]",a=>y("planning",a.dataset.lead))}function Vn(e,t,i){const a=t.sites.find(d=>d.instanceId===i.siteId),s=ee[t.profile.difficulty],n={approachId:"standard",equipmentInstanceIds:t.equipment.map(d=>d.instanceId),crewInstanceIds:[],supplies:gi(60,1),vehicleInstanceId:t.vehicles[0].instanceId,budgetReserve:500};function r(){const d=t.equipment.filter(f=>n.equipmentInstanceIds.includes(f.instanceId)),l=t.staff.filter(f=>n.crewInstanceIds.includes(f.instanceId)),p=t.vehicles.find(f=>f.instanceId===n.vehicleInstanceId)||t.vehicles[0];return bi({lead:i,site:a,equipmentInstances:d,vehicle:p,supplies:n.supplies,approachId:n.approachId,leaderSkill:(t.player.skill.leadership+t.player.skill.survival)/2,riskMultiplier:s.riskMultiplier,crewInstances:l})}function c(){const d=r();JSON.stringify(n.supplies)!==JSON.stringify(d.recommendedSupplies)&&!c._suppliesTouched&&(n.supplies=d.recommendedSupplies),e.innerHTML=`
      <button class="btn btn--ghost" id="back-btn">&larr; Expeditions</button>
      <h1>Plan: ${o(i.title)}</h1>
      <p class="muted">${o(a.name)} · ${o(a.terrain)}</p>

      <div class="stack">
        <h2>Approach</h2>
        <div class="stack">
          ${Object.values(Xe).map(l=>`
            <button class="approach-option" data-approach="${l.id}" aria-pressed="${n.approachId===l.id}">
              <strong>${o(l.label)}</strong>
              <div class="text-sm muted">${o(l.description)}</div>
            </button>
          `).join("")}
        </div>
      </div>

      ${t.vehicles.length>1?`
        <div class="stack">
          <h2>Vehicle</h2>
          <div class="stack">
            ${t.vehicles.map(l=>{const p=ge(l.templateId);return`
                <button class="approach-option" data-vehicle="${l.instanceId}" aria-pressed="${n.vehicleInstanceId===l.instanceId}">
                  <strong>${o(p.name)}</strong>
                  <div class="text-sm muted">${o(p.description)}</div>
                </button>
              `}).join("")}
          </div>
        </div>
      `:""}
      ${d.vehicleEnvironmentMatch?"":`<p class="text-sm" style="color:var(--warning);">Your vehicle isn't built for ${o(a.environment)} terrain — reliability suffers badly until you bring something better suited.</p>`}

      ${t.staff.length?`
        <div class="stack">
          <h2>Crew</h2>
          <div class="card">
            ${t.staff.map(l=>{const p=ve(l.roleId),f=n.crewInstanceIds.includes(l.instanceId);return`
                <label class="equipment-pick">
                  <input type="checkbox" data-crew="${l.instanceId}" ${f?"checked":""} />
                  <span class="spacer">${o(l.name)} <span class="muted">· ${o(p?.label||l.roleId)}</span></span>
                  <span class="badge">${w(l.salary)}/day</span>
                </label>
              `}).join("")}
          </div>
        </div>
      `:""}

      <div class="stack">
        <h2>Equipment</h2>
        <div class="card">
          ${t.equipment.map(l=>{const p=Q(l.templateId),f=n.equipmentInstanceIds.includes(l.instanceId),h=p.environments.includes(a.environment);return`
              <label class="equipment-pick">
                <input type="checkbox" data-equipment="${l.instanceId}" ${f?"checked":""} />
                <span class="spacer">${o(p.name)}</span>
                <span class="badge ${h?"badge--brass":""}">${Ft(l.condition)}</span>
              </label>
            `}).join("")}
        </div>
      </div>

      <div class="stack">
        <h2>Supplies</h2>
        <div class="card stack">
          ${Object.entries(n.supplies).map(([l,p])=>{const f=d.recommendedSupplies[l],h=f?p/f:1;return`
              <div class="supply-row">
                <div>
                  <label style="margin:0; text-transform:capitalize;">${o(l)}</label>
                  <div class="text-sm muted">Recommended: ${f} · ${w(qe[l])}/unit</div>
                </div>
                <input type="number" min="0" data-supply="${l}" value="${p}" />
              </div>
              ${h<.7?'<div class="supply-warning supply-warning--high">Shortage risk: High</div>':h<1?'<div class="supply-warning">Shortage risk: Moderate</div>':""}
            `}).join("")}
        </div>
      </div>

      <div class="card estimate-panel">
        ${["Success Chance","Risk Rating","Discovery Quality","Estimated Cost"].map((l,p)=>{const f=[q(d.successChance),q(d.riskRating),q(d.discoveryQuality),w(d.estimatedCost)];return`<div class="stat-card"><span class="stat-card__label">${l}</span><span class="stat-card__value">${f[p]}</span></div>`}).join("")}
      </div>
      <p class="text-sm muted">Estimated duration: ${Ne(d.estimatedDurationHours)}</p>

      <button class="btn btn--primary btn--full" id="launch-btn" ${t.activeExpedition?"disabled":""}>Launch Expedition</button>
    `,e.querySelector("#back-btn").addEventListener("click",()=>y("expeditions")),e.querySelectorAll("[data-approach]").forEach(l=>{l.addEventListener("click",()=>{n.approachId=l.dataset.approach,c()})}),e.querySelectorAll("[data-vehicle]").forEach(l=>{l.addEventListener("click",()=>{n.vehicleInstanceId=l.dataset.vehicle,c()})}),e.querySelectorAll("[data-crew]").forEach(l=>{l.addEventListener("change",()=>{const p=l.dataset.crew;l.checked?n.crewInstanceIds.push(p):n.crewInstanceIds=n.crewInstanceIds.filter(f=>f!==p),c()})}),e.querySelectorAll("[data-equipment]").forEach(l=>{l.addEventListener("change",()=>{const p=l.dataset.equipment;l.checked?n.equipmentInstanceIds.push(p):n.equipmentInstanceIds=n.equipmentInstanceIds.filter(f=>f!==p),c()})}),e.querySelectorAll("[data-supply]").forEach(l=>{l.addEventListener("input",()=>{c._suppliesTouched=!0,n.supplies[l.dataset.supply]=Number(l.value)||0,c()})}),e.querySelector("#launch-btn").addEventListener("click",()=>{try{m.dispatch("LAUNCH_EXPEDITION",{leadInstanceId:i.instanceId,plan:{...n}}),P("vehicleDeparture"),y("live-expedition")}catch(l){S(l.message)}})}c()}function It(e,t){const i=m.getState();if(i.activeExpedition){y("live-expedition");return}if(!t){Ct(e,i);return}const a=On(i,t);if(!a){Ct(e,i);return}Vn(e,i,a)}const At={travel:"Travel",survey:"Survey",excavation:"Excavation",discovery:"Discovery",extraction:"Extraction"},jn={travel:"On the road toward the site.",survey:"Narrowing down the search area.",excavation:"Working to access the site.",discovery:"Uncovering whatever is down there.",extraction:"Getting everything safely back to the truck."},Un=130;let Rt=0;function Tt(e){return Math.max(0,Math.min(1,e))}function Wn(e){const t=lt(e);return t.length?t.map(i=>`<span class="badge">${o(i)}</span>`).join(""):'<span class="badge">Steady</span>'}function zn(e=[]){return e.length?`
    <div class="field-log" aria-label="Recent field log">
      ${e.slice(-3).reverse().map(t=>`
        <div class="field-log__entry field-log__entry--${t.tone||"info"}">
          <span class="eyebrow">${o(t.phase.replace(/-/g," "))}</span>
          <strong>${o(t.title)}</strong>
          <p class="text-sm">${o(t.message)}</p>
        </div>
      `).join("")}
    </div>
  `:""}function Gn(e){Ce(!0);const t=++Rt,i=m.getState();if(!i.activeExpedition){e.innerHTML='<p class="empty-state">No active expedition.</p><button class="btn btn--primary btn--full" id="go">Plan an Expedition</button>',e.querySelector("#go").addEventListener("click",()=>y("expeditions"));return}const a=i.settings.defaultExpeditionSpeed||1,s={speed:a,rafId:null,accumulatedMs:0,lastTs:null,paused:a===0};function n(){return t!==Rt}function r(){s.rafId&&cancelAnimationFrame(s.rafId),s.rafId=null}function c(){if(n())return;const u=m.getState().activeExpedition;if(!u)return;s.accumulatedMs=0,s.lastTs=null;const v=u.phases[u.currentPhaseIndex],g=m.getState().sites.find(k=>k.instanceId===u.siteInstanceId);if(d(u,v,g),v.pendingEvent){l(v.pendingEvent);return}if(v.eventResolved===null){const{event:k}=m.dispatch("CHECK_PHASE_EVENT",{});if(k){l(k);return}}p(v)}function d(u,v,g){const k=u.currentPhaseIndex,C=Tt((u.metrics?.riskRating||0)+(u.accumulator?.riskDelta||0)-(u.accumulator?.vehicleReliabilityDelta||0)*.15),I=Tt((u.metrics?.discoveryQuality||0)+(u.accumulator?.discoveryBonus||0));e.innerHTML=`
      <div class="expedition-scene">${Rn(v.phase,g.environment)}</div>
      <div class="phase-track" aria-hidden="true">
        ${Ze.map((T,E)=>`<div class="phase-pip ${E<k?"phase-pip--done":E===k?"phase-pip--active":""}"></div>`).join("")}
      </div>
      <div class="expedition-dashboard">
        <div>
          <span class="stat-card__label">Success Outlook</span>
          <strong>${q(1-C)}</strong>
        </div>
        <div>
          <span class="stat-card__label">Discovery Signal</span>
          <strong>${q(I)}</strong>
        </div>
        <div>
          <span class="stat-card__label">Field Decisions</span>
          <strong>${(u.accumulator?.log||[]).length}</strong>
        </div>
      </div>
      <div class="row row--between">
        <div>
          <span class="eyebrow">Phase ${k+1} of ${Ze.length}</span>
          <h2>${At[v.phase]}</h2>
        </div>
        <div class="speed-controls" role="group" aria-label="Playback speed">
          <button class="btn btn--secondary btn--sm speed-btn" data-speed="0" aria-pressed="${s.speed===0}" aria-label="Pause">⏸</button>
          <button class="btn btn--secondary btn--sm speed-btn" data-speed="1" aria-pressed="${s.speed===1}">1x</button>
          <button class="btn btn--secondary btn--sm speed-btn" data-speed="2" aria-pressed="${s.speed===2}">2x</button>
          <button class="btn btn--secondary btn--sm speed-btn" data-speed="4" aria-pressed="${s.speed===4}">4x</button>
        </div>
      </div>
      <p class="text-sm muted">${jn[v.phase]}</p>
      <div class="progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" id="phase-progress">
        <div class="progress__fill" id="phase-progress-fill" style="width:0%"></div>
      </div>
      <div id="event-slot"></div>
      ${zn(u.fieldLog)}
      <div class="sr-live" aria-live="polite" id="sr-status"></div>
    `,e.querySelectorAll(".speed-btn").forEach(T=>{T.addEventListener("click",()=>{const E=Number(T.dataset.speed);s.speed=E,s.paused=E===0,e.querySelectorAll(".speed-btn").forEach($=>$.setAttribute("aria-pressed",String($===T)))})})}function l(u){const v=e.querySelector("#event-slot");if(!v)return;v.innerHTML=`
      <div class="card event-card">
        <span class="eyebrow">Field Decision</span>
        <h3>${o(u.title)}</h3>
        <p class="text-sm">${o(u.description)}</p>
        <div class="stack">
          ${u.choices.map(k=>`
            <button class="event-choice" data-choice="${k.id}">
              <strong>${o(k.label)}</strong>
              <div class="text-sm muted">${o(k.description)}</div>
              <div class="event-choice__impact">${Wn(k.effects)}</div>
            </button>
          `).join("")}
        </div>
      </div>
    `;const g=e.querySelector("#sr-status");g&&(g.textContent=`Field decision needed: ${u.title}. ${u.description}`),v.querySelector("[data-choice]")?.focus(),v.querySelectorAll("[data-choice]").forEach(k=>{k.addEventListener("click",()=>{const{choice:C}=m.dispatch("RESOLVE_EXPEDITION_EVENT",{choiceId:k.dataset.choice}),I=lt(C.effects).join(", ");x(`${C.label}${I?` — ${I}`:""}.`),v.innerHTML="";const T=m.getState().activeExpedition;p(T.phases[T.currentPhaseIndex])})})}function p(u){const v=Un*1e3*Wt[u.phase],g=e.querySelector("#phase-progress-fill"),k=e.querySelector("#phase-progress"),C=e.querySelector("#sr-status");function I(T){if(n())return;s.lastTs===null&&(s.lastTs=T);const E=T-s.lastTs;s.lastTs=T,s.paused||(s.accumulatedMs+=E*s.speed);const $=Math.min(100,s.accumulatedMs/v*100);if(g&&(g.style.width=`${$}%`),k&&k.setAttribute("aria-valuenow",String(Math.round($))),$>=100){r(),f();return}s.rafId=requestAnimationFrame(I)}C&&(C.textContent=`${At[u.phase]} underway.`),s.rafId=requestAnimationFrame(I)}function f(){if(n())return;const{hasNext:u}=m.dispatch("ADVANCE_EXPEDITION_PHASE",{});if(u)P("select"),c();else{const{outcome:v}=m.dispatch("COMPLETE_EXPEDITION",{});r(),v.success&&v.artifacts.length?h(v.artifacts,0):(P(v.success?"success":"error"),Ce(!1),y("expedition-results"))}}function h(u,v){const g=u[v];P("discoveryReveal");const k=m.getState().settings.reducedMotion;e.innerHTML=`
      <div class="reveal-stage">
        <span class="eyebrow">Discovery ${v+1} of ${u.length}</span>
        <div class="reveal-silhouette ${k?"":"reveal-silhouette-anim"}">
          ${je(g)}
        </div>
        <div id="reveal-details" class="stack"></div>
        <div class="sr-live" aria-live="polite" id="reveal-sr-status"></div>
        <button class="btn btn--primary btn--full" id="reveal-continue">Continue</button>
      </div>
    `;const C=e.querySelector("#reveal-details"),I=e.querySelector("#reveal-sr-status");I.textContent=`Discovery ${v+1} of ${u.length}. Clearing debris...`;const T=()=>{C.innerHTML=`
        <h2 class="${k?"":"reveal-detail-anim"}">${o(g.name)}</h2>
        <p class="text-sm ${k?"":"reveal-detail-anim"}">${o(g.material)} · ${o(g.era)} · ${o(g.condition)} condition</p>
      `,I.textContent=`${g.name}. ${g.material}, ${g.era}, ${g.condition} condition.`},E=()=>{J.indexOf(g.rarity),C.innerHTML+=`
        <div class="row ${k?"":"reveal-rarity-anim"}" style="justify-content:center;">
          <span class="rarity-dot rarity-dot--${g.rarity}"></span>
          <span class="badge badge--brass">${o(g.rarity)}</span>
        </div>
        <p class="text-sm muted">Estimated value: $${g.estimatedValueRange[0].toLocaleString()}–$${g.estimatedValueRange[1].toLocaleString()}</p>
      `,I.textContent=`Rarity: ${g.rarity}. Estimated value: $${g.estimatedValueRange[0].toLocaleString()} to $${g.estimatedValueRange[1].toLocaleString()}.`};k?(T(),E()):(setTimeout(T,500),setTimeout(E,1100)),e.querySelector("#reveal-continue").addEventListener("click",()=>{v+1<u.length?h(u,v+1):(Ce(!1),y("expedition-results"))})}return c(),()=>{r(),Ce(!1)}}function Qn(e){return{grade:e.success?"B":"D",title:e.success?"Successful Recovery":"Hard Lesson",summary:e.success?`The team returned from ${e.siteName}.`:e.failureReason,highlights:[`${q(1-e.finalRisk)} final success outlook`,e.artifactIds.length?`${e.artifactIds.length} recovered item${e.artifactIds.length===1?"":"s"}`:"No recovered artifacts"]}}function Yn(e){const t=e.fieldLog||[];return t.length?`
    <div class="card">
      <h3>Field Log</h3>
      <div class="field-log field-log--results">
        ${t.map(i=>`
          <div class="field-log__entry field-log__entry--${i.tone||"info"}">
            <span class="eyebrow">${o(i.phase.replace(/-/g," "))}</span>
            <strong>${o(i.title)}</strong>
            <p class="text-sm">${o(i.message)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `:""}function Kn(e){const t=e.eventLog||[];return t.length?`
    <div class="card">
      <h3>Key Decisions</h3>
      <div class="stack">
        ${t.map(i=>`
          <div class="decision-row">
            <div>
              <strong>${o(i.title)}</strong>
              <div class="text-sm muted">${o(i.choiceLabel)}</div>
            </div>
            <div class="decision-row__effects">
              ${(i.effectsPreview||[]).map(a=>`<span class="badge">${o(a)}</span>`).join("")||'<span class="badge">Steady</span>'}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `:""}function Xn(e){const t=m.getState(),i=t.expeditionHistory[t.expeditionHistory.length-1];if(!i){e.innerHTML='<p class="empty-state">No recent expedition results.</p><button class="btn btn--primary btn--full" id="go">Go to Headquarters</button>',e.querySelector("#go").addEventListener("click",()=>y("headquarters"));return}const a=t.artifacts.filter(n=>i.artifactIds.includes(n.id)),s=i.debrief||Qn(i);e.innerHTML=`
    <div class="results-hero results-hero--${i.success?"success":"failed"}">
      <div class="results-grade" aria-label="Expedition grade">${o(s.grade)}</div>
      <div class="stack">
        <span class="eyebrow">${i.success?"Debrief Complete":"Debrief Required"}</span>
        <h1>${o(s.title)}</h1>
        <p>${o(s.summary)}</p>
        <p class="muted">${o(i.leadTitle)} · ${o(i.siteName)}</p>
      </div>
    </div>

    <div class="debrief-grid">
      ${s.highlights.map(n=>`
        <div class="debrief-stat">
          <span class="stat-card__label">Highlight</span>
          <strong>${o(n)}</strong>
        </div>
      `).join("")}
    </div>

    ${i.success?`
      <div class="card">
        <h3>Recovered</h3>
        <div class="recovered-list">
          ${a.map(n=>`
            <div class="recovered-item">
              <div class="recovered-item__thumb">${je(n,{compact:!0})}</div>
              <div>
                <strong>${o(n.name)}</strong>
                <div class="text-sm muted">${o(n.rarity)} · ${o(n.condition)}</div>
              </div>
              <span class="badge badge--brass">$${n.estimatedValueRange[0].toLocaleString()}–$${n.estimatedValueRange[1].toLocaleString()}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `:`
      <div class="card" style="border-color: rgba(193,72,63,0.4);">
        <h3>What Happened</h3>
        <p>${o(i.failureReason)}</p>
        <p class="text-sm muted">Final risk was assessed at ${q(i.finalRisk)}. Better research, equipment, or supplies next time can bring that down.</p>
      </div>
    `}

    ${Kn(i)}
    ${Yn(i)}

    <div class="card">
      <h3>Expedition Financials</h3>
      <div class="stack" style="gap:0;">
        ${i.financials.lines.map(n=>`
          <div class="financial-line ${n.isEstimate?"financial-line--estimate":n.amount<0?"financial-line--negative":n.amount>0?"financial-line--positive":""}">
            <span>${o(n.label)}</span>
            <span>${n.isEstimate?w(n.amount):tt(n.amount)}</span>
          </div>
        `).join("")}
        <div class="financial-line financial-line--total">
          <span>Cash change</span>
          <span>${tt(i.financials.actualCashDelta)}</span>
        </div>
        ${i.financials.estimatedArtifactsValue?`
          <div class="financial-line text-sm muted">
            <span>Estimated net value (artifacts not yet sold)</span>
            <span>${w(i.financials.estimatedNetValue)}</span>
          </div>
        `:""}
      </div>
    </div>

    <div class="result-actions">
      ${i.success&&a[0]?'<button class="btn btn--primary btn--full" id="artifact-btn">Inspect First Find</button>':""}
      <button class="btn ${i.success?"btn--secondary":"btn--primary"} btn--full" id="continue-btn">${i.success?"Open Collection":"Return to Headquarters"}</button>
      <button class="btn btn--ghost btn--full" id="next-lead-btn">Review Leads</button>
    </div>
  `,e.querySelector("#artifact-btn")?.addEventListener("click",()=>{y("artifact-detail",a[0].id)}),e.querySelector("#continue-btn").addEventListener("click",()=>{y(i.success?"collection":"headquarters")}),e.querySelector("#next-lead-btn").addEventListener("click",()=>{y("leads")})}function Ae(e){const t=e.disposition!=="none"?`<span class="badge">${o(e.disposition)}</span>`:e.authenticationStatus==="unidentified"?'<span class="badge badge--warning">Unidentified</span>':`<span class="badge badge--brass">${o(e.authenticationOutcome||"Inspected")}</span>`;return`
    <div class="card artifact-tile card--interactive" data-artifact="${e.id}">
      <div class="artifact-tile__thumb">${je(e,{compact:!0})}</div>
      <strong class="text-sm">${o(e.name)}</strong>
      <span class="text-sm muted">${o(e.rarity)}</span>
      ${t}
    </div>
  `}function Zn(e){const t=m.getState(),i=t.artifacts.filter(r=>r.disposition==="none"),a=t.artifacts.filter(r=>r.disposition==="stored"||r.disposition==="displayed"),s=t.artifacts.filter(r=>r.disposition==="sold"),n=t.artifacts.filter(r=>r.disposition==="donated");e.innerHTML=`
    <h1>Collection</h1>
    ${t.artifacts.length===0?'<p class="empty-state">Nothing recovered yet. Launch an expedition to start your collection.</p>':""}

    ${i.length?`
      <div class="stack">
        <h2>Needs Attention</h2>
        <div class="artifact-grid">${i.map(Ae).join("")}</div>
      </div>
    `:""}

    ${a.length?`
      <div class="stack">
        <h2>Your Collection</h2>
        <div class="artifact-grid">${a.map(Ae).join("")}</div>
      </div>
    `:""}

    ${s.length?`
      <div class="stack">
        <h2>Sold</h2>
        <div class="artifact-grid">${s.map(Ae).join("")}</div>
      </div>
    `:""}

    ${n.length?`
      <div class="stack">
        <h2>Donated</h2>
        <div class="artifact-grid">${n.map(Ae).join("")}</div>
      </div>
    `:""}
  `,re(e,"[data-artifact]",r=>y("artifact-detail",r.dataset.artifact))}function z(e,t){return`<div class="detail-row"><dt>${o(e)}</dt><dd>${t}</dd></div>`}function Jn(e,t){const i=m.getState(),a=i.artifacts.find(h=>h.id===t);if(!a){e.innerHTML='<p class="empty-state">Artifact not found.</p>';return}const s=["Authentic","Modern Reproduction","Deliberate Forgery"].includes(a.authenticationOutcome),n=a.disposition==="none",r=jt(a),c=a.finalAppraisedValue??(a.estimatedValueRange[0]+a.estimatedValueRange[1])/2,d=Math.round(c*_e[0]*(1-Je)),l=Math.round(c*_e[1]*(1-Je)),p=Object.values(De).filter(h=>!h.requiresFacility||i.facilities.some(u=>u.templateId===h.requiresFacility)),f=Object.values(De).filter(h=>h.requiresFacility&&!i.facilities.some(u=>u.templateId===h.requiresFacility));e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Collection</button>
    <div class="artifact-detail-hero">
      ${je(a)}
      <div>
        <span class="eyebrow">${o(a.rarity)} · ${o(a.objectType)}</span>
        <h1>${o(a.name)}</h1>
        <p class="text-sm muted">${o(a.material)} · ${o(a.era)} · ${o(a.condition)} condition</p>
      </div>
    </div>

    <div class="card">
      <dl class="stack" style="gap:0;">
        ${z("Culture",o(a.culture))}
        ${z("Era",o(a.era))}
        ${z("Estimated date",`${a.estimatedDateRange[0]}–${a.estimatedDateRange[1]}`)}
        ${z("Material",o(a.material))}
        ${z("Notable feature",o(a.feature))}
        ${z("Inscription",a.inscription?o(a.inscription):"None visible")}
        ${z("Condition",`${o(a.condition)} (${a.completeness}% complete)`)}
        ${z("Provenance",o(a.provenance))}
        ${z("Discovered",`${o(a.discoveryLocation)}`)}
      </dl>
    </div>

    <div class="card">
      <h3>Authentication</h3>
      ${a.authenticationStatus==="unidentified"?`
        <p class="text-sm muted">Nothing has been verified yet. Each method costs more but tells you more.</p>
      `:`
        <p>Outcome: <strong>${o(a.authenticationOutcome)}</strong> (${q(a.authenticationConfidence)} confidence)</p>
        ${a.finalAppraisedValue!=null?`<p class="text-sm muted">Final appraised value: ${w(a.finalAppraisedValue)}</p>`:""}
      `}
      ${s?"":`
        <div class="stack" style="margin-top:var(--space-2);">
          ${p.map(h=>`
            <div class="row row--between">
              <div>
                <strong class="text-sm">${o(h.label)}</strong>
                <div class="text-sm muted">${w(h.cost)} · ${Ne(h.timeHours)}</div>
              </div>
              <button class="btn btn--secondary btn--sm" data-authenticate="${h.id}" ${i.finance.cash<h.cost?"disabled":""}>Run</button>
            </div>
          `).join("")}
          ${f.map(h=>`
            <div class="row row--between">
              <div>
                <strong class="text-sm muted">${o(h.label)}</strong>
                <div class="text-sm muted">Requires ${o(_(h.requiresFacility).name)}</div>
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
      <p class="text-sm muted">Condition: ${o(a.condition)} (${Math.round(a.completeness)}% complete)${a.restorationStatus!=="none"?` · Last treatment: ${o(a.restorationStatus)}`:""}</p>
      <div class="stack" style="margin-top:var(--space-2);">
        ${Object.values(Fe).map(h=>{const u=Gt(a,h.id);return`
            <div class="row row--between">
              <div>
                <strong class="text-sm">${o(h.label)}</strong>
                <div class="text-sm muted">${o(h.description)}</div>
                <div class="text-sm muted">${w(u)} · ${Ne(h.timeHours)}${h.failureChance?` · ${q(h.failureChance)} failure risk`:""}</div>
              </div>
              <button class="btn btn--secondary btn--sm" data-restore="${h.id}" ${i.finance.cash<u?"disabled":""}>Restore</button>
            </div>
          `}).join("")}
      </div>
    </div>

    <div class="stack">
      <h3>Decision</h3>
      <div class="disposition-actions">
        <button class="btn btn--primary" id="sell-btn" ${n?"":"disabled"}>Sell Privately (${w(r)})</button>
        <button class="btn btn--secondary" id="auction-btn" ${n?"":"disabled"}>Sell at Auction (${w(d)}–${w(l)})</button>
        <button class="btn btn--secondary" id="store-btn" ${n?"":"disabled"}>Store</button>
        <button class="btn btn--secondary" id="display-btn" ${n?"":"disabled"}>Display</button>
        <button class="btn btn--secondary" id="donate-btn" ${n?"":"disabled"}>Donate</button>
      </div>
      <p class="text-sm muted">A private sale is predictable. An auction takes a cut and swings wider, but can pay off big. Donating earns no cash but strengthens academic and ethical standing.</p>
      ${!s&&a.trueAuthenticity!=="authentic"?'<p class="text-sm" style="color:var(--warning);">Selling before authentication carries risk if this turns out not to be genuine.</p>':""}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("collection")),e.querySelectorAll("[data-authenticate]").forEach(h=>{h.addEventListener("click",()=>{try{const{result:u}=m.dispatch("AUTHENTICATE_ARTIFACT",{artifactId:t,methodId:h.dataset.authenticate});x(`Result: ${u.outcome}`)}catch(u){S(u.message)}})}),e.querySelectorAll("[data-restore]").forEach(h=>{h.addEventListener("click",()=>{try{const{failed:u,authenticityDamaged:v}=m.dispatch("RESTORE_ARTIFACT",{artifactId:t,methodId:h.dataset.restore});v?S("The restoration went wrong — the piece may look better, but its authenticity is now in question."):u?x("The restoration underperformed, but did no harm."):xt("Restoration complete.")}catch(u){S(u.message)}})}),e.querySelector("#sell-btn")?.addEventListener("click",async()=>{if(await G({title:"Sell this artifact?",message:`You'll receive approximately ${w(r)}. This cannot be undone.`,confirmLabel:"Sell"}))try{const{saleValue:u}=m.dispatch("SELL_ARTIFACT",{artifactId:t});P("cashRegister"),x(`Sold for ${w(u)}.`,{variant:"success"}),y("collection")}catch(u){S(u.message)}}),e.querySelector("#auction-btn")?.addEventListener("click",async()=>{if(await G({title:"Sell at auction?",message:`Expect somewhere between ${w(d)} and ${w(l)} after fees. This cannot be undone.`,confirmLabel:"Sell at Auction"}))try{const{saleValue:u}=m.dispatch("SELL_ARTIFACT_AUCTION",{artifactId:t});P("auctionHammer"),x(`Sold at auction for ${w(u)}.`,{variant:"success"}),y("collection")}catch(u){S(u.message)}}),e.querySelector("#store-btn")?.addEventListener("click",()=>{m.dispatch("STORE_ARTIFACT",{artifactId:t}),x("Stored in the archive."),y("collection")}),e.querySelector("#display-btn")?.addEventListener("click",()=>{m.dispatch("DISPLAY_ARTIFACT",{artifactId:t}),x(i.museum?.built?"Reserved for display — add it to an exhibit from the Museum screen.":"Reserved for display — your museum will house it once built."),y("collection")}),e.querySelector("#donate-btn")?.addEventListener("click",async()=>{if(await G({title:"Donate this artifact?",message:"No cash, but a solid boost to academic credibility and ethical standing. This cannot be undone.",confirmLabel:"Donate"}))try{m.dispatch("DONATE_ARTIFACT",{artifactId:t}),xt("Donated — the historical record thanks you."),y("collection")}catch(u){S(u.message)}})}const es=[{id:"first-find",label:"First Find",description:"Recover your first artifact.",checkId:"first-find"},{id:"proven-authentic",label:"Proven Authentic",description:"Authenticate your first artifact.",checkId:"proven-authentic"},{id:"worth-the-risk",label:"Worth the Risk",description:"Complete an expedition rated high-risk.",checkId:"worth-the-risk"},{id:"no-stone-unturned",label:"No Stone Unturned",description:"Fully research a lead before launching an expedition.",checkId:"no-stone-unturned"},{id:"into-the-deep",label:"Into the Deep",description:"Complete a marine expedition.",checkId:"into-the-deep"},{id:"beneath-the-sand",label:"Beneath the Sand",description:"Complete a desert excavation.",checkId:"beneath-the-sand"},{id:"cold-case",label:"Cold Case",description:"Complete an arctic expedition.",checkId:"cold-case"},{id:"academic-respect",label:"Academic Respect",description:"Reach 20 academic credibility.",checkId:"academic-respect"},{id:"world-class-discovery",label:"World-Class Discovery",description:"Recover a World-Class rarity artifact.",checkId:"world-class-discovery"},{id:"fully-equipped",label:"Fully Equipped",description:"Own equipment from every category.",checkId:"fully-equipped"},{id:"expedition-leader",label:"Expedition Leader",description:"Complete five expeditions.",checkId:"expedition-leader"},{id:"museum-opening",label:"Museum Opening",description:"Open your private museum.",checkId:"museum-opening"},{id:"sold-at-auction",label:"Sold at Auction",description:"Sell an artifact at auction.",checkId:"sold-at-auction"},{id:"returned-to-history",label:"Returned to History",description:"Donate an artifact to an institution.",checkId:"returned-to-history"},{id:"rival-beaten",label:"Rival Beaten",description:"Reach a site before a rival.",checkId:"rival-beaten"},{id:"hundred-artifacts",label:"Hundred Artifacts",description:"Recover 100 artifacts.",checkId:"hundred-artifacts"},{id:"seven-seas",label:"Seven Seas",description:"Complete expeditions in seven different regions.",checkId:"seven-seas"},{id:"master-cartographer",label:"Master Cartographer",description:"Fully map ten sites.",checkId:"master-cartographer"},{id:"legendary-explorer",label:"Legendary Explorer",description:"Reach maximum organization prestige.",checkId:"legendary-explorer"}],ts=[{key:"publicFame",label:"Public Fame",description:"Drives museum attendance, sponsor interest, and media opportunities."},{key:"academicCredibility",label:"Academic Credibility",description:"Unlocks university partnerships, experts, and better research leads."},{key:"fieldReputation",label:"Field Reputation",description:"Affects crew applicants, local guides, and rival respect."},{key:"ethicalStanding",label:"Ethical Standing",description:"Governs permits, community cooperation, and institutional trust."}];function fe(e,t,i){return`
    <div class="card card--interactive" data-hub="${e}">
      <div class="row row--between">
        <div>
          <strong>${o(t)}</strong>
          <div class="text-sm muted">${o(i)}</div>
        </div>
        <span aria-hidden="true">&rarr;</span>
      </div>
    </div>
  `}function is(e){const t=m.getState(),i=si(t),a=t.vehicles.map(n=>n.templateId),s=mi.filter(n=>!a.includes(n.id));e.innerHTML=`
    <h1>Organization</h1>

    <div class="stack">
      ${fe("staff","Staff",`${t.staff.length} hired · ${t.crewCandidates.length} candidates available`)}
      ${fe("equipment","Equipment",`${t.equipment.length} items owned`)}
      ${fe("facilities","Headquarters & Facilities",`${t.organization.tierName} · ${t.facilities.length} facilities`)}
      ${fe("museum","Museum",t.museum?.built?`${t.museum.exhibits.length} exhibits · ${w(t.museum.totalRevenue)} earned`:"Not built yet")}
      ${fe("reports","Reports","Expeditions, finances, and collection at a glance")}
    </div>

    <div class="stack">
      <h2>Vehicles (${t.vehicles.length}/${i})</h2>
      <div class="stack">
        ${t.vehicles.map(n=>{const r=ge(n.templateId);return`<div class="card"><strong>${o(r.name)}</strong><div class="text-sm muted">${o(r.description)}</div></div>`}).join("")}
      </div>
      ${s.length?s.map(n=>{const r=t.vehicles.length>=i;return`
        <div class="card">
          <strong>${o(n.name)}</strong>
          <p class="text-sm muted">${o(n.description)}</p>
          <div class="row row--between" style="margin-top:var(--space-2);">
            <span class="text-sm muted">${w(n.cost)}</span>
            <button class="btn btn--primary btn--sm" data-buy-vehicle="${n.id}" ${t.finance.cash<n.cost||r?"disabled":""}>Buy</button>
          </div>
          ${r?'<p class="text-sm" style="color:var(--warning);">Needs a larger headquarters or a Vehicle Garage first.</p>':""}
        </div>
      `}).join(""):""}
    </div>

    <div class="stack">
      <h2>Reputation</h2>
      <div class="card stack">
        ${ts.map(n=>`
          <div class="stack" style="gap:4px;">
            <div class="row row--between text-sm">
              <strong>${o(n.label)}</strong>
              <span>${Math.round(t.reputation[n.key])}</span>
            </div>
            ${Ue({value:t.reputation[n.key],max:100})}
            <span class="text-sm muted">${o(n.description)}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="stack">
      <h2>Sponsors</h2>
      ${t.sponsors.length?`
        <div class="stack">
          ${t.sponsors.map(n=>{const r=st(n.templateId);return`<div class="card"><strong>${o(r.name)}</strong><div class="text-sm muted">${o(r.category)}${r.perk?` · ${o(r.perk.label)}`:""}</div></div>`}).join("")}
        </div>
      `:""}
      <div class="stack">
        ${Ra(t).map(n=>`
          <div class="card">
            <div class="row row--between">
              <strong>${o(n.name)}</strong>
              <span class="badge">${o(n.category)}</span>
            </div>
            <p class="text-sm muted">${o(n.description)}</p>
            ${n.perk?`<p class="text-sm muted">Perk: ${o(n.perk.label)}</p>`:""}
            <div class="row row--between" style="margin-top:var(--space-2);">
              <span class="text-sm muted">Signing bonus: ${w(n.signingBonus)}</span>
              <button class="btn btn--primary btn--sm" data-accept-sponsor="${n.id}">Accept</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="stack">
      <h2>Finances</h2>
      <div class="card">
        <div class="detail-row"><dt>Cash</dt><dd>${w(t.finance.cash)}</dd></div>
        <div class="detail-row"><dt>Total revenue</dt><dd>${w(t.finance.totalRevenue)}</dd></div>
        <div class="detail-row"><dt>Total expenses</dt><dd>${w(t.finance.totalExpenses)}</dd></div>
        <div class="detail-row"><dt>Prestige</dt><dd>${t.organization.prestige}</dd></div>
      </div>
    </div>

    <div class="stack">
      <h2>Achievements</h2>
      <div class="stack">
        ${es.map(n=>`
          <div class="row row--between card" style="padding: var(--space-3);">
            <div>
              <strong class="text-sm">${o(n.label)}</strong>
              <div class="text-sm muted">${o(n.description)}</div>
            </div>
            <span class="badge ${t.achievements.unlocked.includes(n.id)?"badge--brass":""}">${t.achievements.unlocked.includes(n.id)?"Unlocked":"Locked"}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <button class="btn btn--secondary btn--full" id="settings-btn">Settings</button>
  `,e.querySelector("#settings-btn").addEventListener("click",()=>y("settings")),re(e,"[data-hub]",n=>y(n.dataset.hub)),e.querySelectorAll("[data-buy-vehicle]").forEach(n=>{n.addEventListener("click",()=>{try{m.dispatch("PURCHASE_VEHICLE",{templateId:n.dataset.buyVehicle}),x("New vehicle added to your fleet.")}catch(r){S(r.message)}})}),e.querySelectorAll("[data-accept-sponsor]").forEach(n=>{n.addEventListener("click",()=>{try{m.dispatch("ACCEPT_SPONSOR",{sponsorId:n.dataset.acceptSponsor}),x("Sponsorship signed.")}catch(r){S(r.message)}})})}function Mt(e,{hireable:t=!1}={}){const i=ve(e.roleId),a=pa(e.traitId),s=ha(e.traitId)?"badge--success":"badge--warning";return`
    <div class="card stack" data-crew="${e.instanceId}">
      <div class="row row--between">
        <div>
          <strong>${o(e.name)}</strong>
          <div class="text-sm muted">${o(i?.label||e.roleId)} · Skill ${e.skillLevel}/5</div>
        </div>
        <span class="badge badge--brass">${w(e.salary)}/day</span>
      </div>
      <p class="text-sm muted">${o(i?.description||"")}</p>
      <div class="row row--wrap">
        <span class="badge ${s}">${o(a?.label||e.traitId)}</span>
      </div>
      <div class="row" style="margin-top: var(--space-2);">
        ${t?`<button class="btn btn--primary btn--full" data-hire="${e.instanceId}">Hire — ${w(e.salary*2)} signing fee</button>`:`<button class="btn btn--secondary btn--full" data-dismiss="${e.instanceId}">Dismiss</button>`}
      </div>
    </div>
  `}function as(e){const t=m.getState(),i=ni(t);e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Staff</h1>
    <p class="muted">${t.staff.length} / ${i} staff slots used</p>

    <div class="stack">
      <h2>Your Roster</h2>
      ${t.staff.length?`<div class="stack">${t.staff.map(a=>Mt(a)).join("")}</div>`:`<p class="empty-state">You're working alone for now. Hire your first specialist below.</p>`}
    </div>

    <div class="stack">
      <div class="row row--between">
        <h2>Candidates</h2>
        <button class="btn btn--secondary btn--sm" id="refresh-btn">Find New (${w(200)})</button>
      </div>
      ${t.crewCandidates.length?`<div class="stack">${t.crewCandidates.map(a=>Mt(a,{hireable:!0})).join("")}</div>`:'<p class="empty-state">No candidates right now — try finding new ones.</p>'}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("organization")),e.querySelector("#refresh-btn").addEventListener("click",()=>{try{m.dispatch("REFRESH_CREW_CANDIDATES",{}),x("New candidates found.")}catch(a){S(a.message)}}),e.querySelectorAll("[data-hire]").forEach(a=>{a.addEventListener("click",()=>{try{m.dispatch("HIRE_CREW",{candidateId:a.dataset.hire}),x("Welcome to the team.")}catch(s){S(s.message)}})}),e.querySelectorAll("[data-dismiss]").forEach(a=>{a.addEventListener("click",async()=>{await G({title:"Dismiss this crew member?",message:"They will need to be re-hired later if you change your mind.",confirmLabel:"Dismiss",danger:!0})&&(m.dispatch("DISMISS_CREW",{crewInstanceId:a.dataset.dismiss}),x("Crew member dismissed."))})})}const ns={basic:"Basic Field Gear",survey:"Survey Equipment",excavation:"Excavation Equipment",marine:"Marine Equipment"};function ss(e,t){const i=Q(e.templateId),a=Math.round(Ot(e)*t);return`
    <div class="row row--between" style="padding: var(--space-2) 0; border-bottom: 1px solid var(--border-subtle);">
      <div>
        <strong class="text-sm">${o(i.name)}</strong>
        <div class="text-sm muted">${Ft(e.condition)} (${Math.round(e.condition)}%)</div>
      </div>
      ${e.condition<100?`<button class="btn btn--secondary btn--sm" data-repair="${e.instanceId}">Repair — ${w(a)}</button>`:'<span class="badge badge--success">Ready</span>'}
    </div>
  `}function rs(e,t,i){const a=e.requiredSkill?`Best with a ${e.requiredSkill.role.replace(/-/g," ")} (skill ${e.requiredSkill.level}+) — usable without, at half effect.`:"No specialist required.";return`
    <div class="card">
      <div class="row row--between">
        <strong>${o(e.name)}</strong>
        ${t?`<span class="badge">Owned ×${t}</span>`:""}
      </div>
      <p class="text-sm muted">${o(a)}</p>
      <div class="row row--between" style="margin-top: var(--space-2);">
        <span class="text-sm muted">${w(e.cost)} · ${w(e.operatingCost)}/use</span>
        <button class="btn btn--primary btn--sm" data-buy="${e.id}" ${i<e.cost?"disabled":""}>Buy</button>
      </div>
    </div>
  `}function os(e){const t=m.getState(),i=ai(t),a={};for(const n of t.equipment){const r=Q(n.templateId);a[r.category]=a[r.category]||[],a[r.category].push(n)}const s={};for(const n of t.equipment)s[n.templateId]=(s[n.templateId]||0)+1;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Equipment</h1>

    ${Object.entries(a).map(([n,r])=>`
      <div class="stack">
        <h2>${ns[n]||n}</h2>
        <div class="card">${r.map(c=>ss(c,i)).join("")}</div>
      </div>
    `).join("")}

    <div class="stack">
      <h2>Shop</h2>
      <div class="stack">
        ${Pt.map(n=>rs(n,s[n.id]||0,t.finance.cash)).join("")}
      </div>
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("organization")),e.querySelectorAll("[data-repair]").forEach(n=>{n.addEventListener("click",()=>{try{m.dispatch("REPAIR_EQUIPMENT",{instanceId:n.dataset.repair}),x("Equipment repaired.")}catch(r){S(r.message)}})}),e.querySelectorAll("[data-buy]").forEach(n=>{n.addEventListener("click",()=>{try{m.dispatch("PURCHASE_EQUIPMENT",{templateId:n.dataset.buy}),x("Equipment added to your inventory.")}catch(r){S(r.message)}})})}function cs(e){const t=m.getState(),i=Oe(t.organization.tier),a=ii(t.organization.tier),s=ka(t),n=ri(t);e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Headquarters</h1>

    <div class="card stack">
      <span class="eyebrow">Current Tier</span>
      <h2>${o(i.name)}</h2>
      <p class="text-sm muted">Supports up to ${i.baseMaxStaff} staff and ${i.baseMaxVehicles} vehicles before facility bonuses.</p>
      ${a?`
        <div class="divider"></div>
        <span class="eyebrow">Next: ${o(a.name)}</span>
        <p class="text-sm muted">Requires ${a.prestigeRequired} prestige (you have ${t.organization.prestige}) and ${w(a.cost)}.</p>
        <button class="btn btn--primary btn--full" id="upgrade-btn" ${t.organization.prestige<a.prestigeRequired||t.finance.cash<a.cost?"disabled":""}>
          Upgrade to ${o(a.name)}
        </button>
      `:`<p class="text-sm muted">You've reached the highest headquarters tier.</p>`}
    </div>

    <div class="stack">
      <h2>Facilities (${t.facilities.length}/${n})</h2>
      ${t.facilities.length?`
        <div class="stack">
          ${t.facilities.map(r=>{const c=_(r.templateId);return`<div class="card"><strong>${o(c.name)}</strong><p class="text-sm muted">${o(c.description)}</p></div>`}).join("")}
        </div>
      `:'<p class="empty-state">No facilities built yet.</p>'}
    </div>

    ${s.length?`
      <div class="stack">
        <h2>Build</h2>
        <div class="stack">
          ${s.map(r=>`
            <div class="card">
              <strong>${o(r.name)}</strong>
              <p class="text-sm muted">${o(r.description)}</p>
              <div class="row row--between" style="margin-top: var(--space-2);">
                <span class="text-sm muted">${w(r.cost)}</span>
                <button class="btn btn--primary btn--sm" data-build="${r.id}" ${t.finance.cash<r.cost||t.facilities.length>=n?"disabled":""}>Build</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `:""}
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("organization")),e.querySelector("#upgrade-btn")?.addEventListener("click",()=>{try{m.dispatch("UPGRADE_HEADQUARTERS",{}),x("Headquarters upgraded!")}catch(r){S(r.message)}}),e.querySelectorAll("[data-build]").forEach(r=>{r.addEventListener("click",()=>{try{m.dispatch("BUILD_FACILITY",{facilityId:r.dataset.build}),x("Facility built.")}catch(c){S(c.message)}})})}function ls(e,t){const i=t.finance.cash>=M.cost,a=t.organization.prestige>=M.prestigeRequired;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Museum</h1>
    <div class="card stack">
      <p>Turn displayed artifacts into curated exhibits that draw paying visitors — recurring income that doesn't depend on your next expedition.</p>
      <div class="detail-row"><dt>Cost</dt><dd>${w(M.cost)}</dd></div>
      <div class="detail-row"><dt>Prestige required</dt><dd>${M.prestigeRequired} (you have ${t.organization.prestige})</dd></div>
      <button class="btn btn--primary btn--full" id="build-museum-btn" ${i&&a?"":"disabled"}>Build Museum</button>
      ${a?i?"":'<p class="text-sm" style="color:var(--warning);">Not enough cash yet.</p>':'<p class="text-sm" style="color:var(--warning);">Needs more prestige — keep completing expeditions and building reputation.</p>'}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("organization")),e.querySelector("#build-museum-btn").addEventListener("click",()=>{try{m.dispatch("BUILD_MUSEUM",{}),x("Museum built!")}catch(s){S(s.message)}})}function ds(e){const t=m.getState(),i=new Set(t.museum.exhibits.flatMap(n=>n.artifactIds)),a=t.artifacts.filter(n=>n.disposition==="displayed"),s=`
    <h2 id="picker-title">Add to Exhibit</h2>
    <div class="stack" style="margin-top: var(--space-3);">
      ${a.length?a.map(n=>`
        <div class="row row--between">
          <div>
            <strong class="text-sm">${o(n.name)}</strong>
            <div class="text-sm muted">${o(n.rarity)}${i.has(n.id)?" · already in an exhibit":""}</div>
          </div>
          <button class="btn btn--secondary btn--sm" data-pick="${n.id}">Add</button>
        </div>
      `).join(""):'<p class="empty-state">No displayed artifacts available. Set some aside from your Collection first.</p>'}
    </div>
  `;ut(s,{labelledBy:"picker-title",onMount:n=>{n.querySelectorAll("[data-pick]").forEach(r=>{r.addEventListener("click",()=>{try{m.dispatch("ASSIGN_ARTIFACT_TO_EXHIBIT",{exhibitId:e,artifactId:r.dataset.pick}),oe(),y("museum")}catch(c){S(c.message)}})})}})}function us(e,t){const i=t.museum,a=li;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Museum</h1>

    <div class="grid-2">
      <div class="stat-card"><span class="stat-card__label">Total Visitors</span><span class="stat-card__value">${i.totalVisitors.toLocaleString()}</span></div>
      <div class="stat-card"><span class="stat-card__label">Total Revenue</span><span class="stat-card__value stat-card__value--accent">${w(i.totalRevenue)}</span></div>
    </div>

    <div class="card stack">
      <h3>Ticket Price</h3>
      <div class="row row--between">
        <input type="number" id="ticket-price" min="${M.minTicketPrice}" max="${M.maxTicketPrice}" value="${i.ticketPrice}" style="width:100px;" />
        <button class="btn btn--secondary btn--sm" id="set-price-btn">Update</button>
      </div>
      <p class="text-sm muted">Higher prices earn more per visitor, but fewer people come.</p>
    </div>

    <div class="stack">
      <div class="row row--between">
        <h2>Exhibits</h2>
        <button class="btn btn--secondary btn--sm" id="new-exhibit-btn">New Exhibit</button>
      </div>
      ${i.exhibits.length?i.exhibits.map(s=>{const n=ot(s.themeId),r=pi(s,t),c=ui(t,s);return`
          <div class="card stack">
            <div class="row row--between">
              <div>
                <span class="eyebrow">${o(n.label)}</span>
                <h3>${o(s.name)}</h3>
              </div>
              <button class="btn btn--secondary btn--sm" data-add-artifact="${s.instanceId}">Add Piece</button>
            </div>
            ${Ue({value:r,max:1})}
            <span class="text-sm muted">Quality: ${q(r)}</span>
            ${c.length?`
              <div class="stack" style="gap: var(--space-1);">
                ${c.map(d=>`
                  <div class="row row--between">
                    <span class="text-sm">${o(d.name)}</span>
                    <button class="icon-btn" data-remove-artifact="${s.instanceId}:${d.id}" aria-label="Remove">✕</button>
                  </div>
                `).join("")}
              </div>
            `:'<p class="text-sm muted">No pieces yet.</p>'}
          </div>
        `}).join(""):'<p class="empty-state">No exhibits yet. Create one to start displaying your collection.</p>'}
    </div>
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("organization")),e.querySelector("#set-price-btn").addEventListener("click",()=>{const s=Number(e.querySelector("#ticket-price").value);try{m.dispatch("SET_TICKET_PRICE",{price:s}),x("Ticket price updated.")}catch(n){S(n.message)}}),e.querySelector("#new-exhibit-btn").addEventListener("click",()=>{const s=`
      <h2 id="theme-title">Choose a Theme</h2>
      <div class="stack" style="margin-top: var(--space-3);">
        ${a.map(n=>`
          <button class="approach-option" data-theme="${n.id}">
            <strong>${o(n.label)}</strong>
            <div class="text-sm muted">${o(n.description)}</div>
          </button>
        `).join("")}
      </div>
    `;ut(s,{labelledBy:"theme-title",onMount:n=>{n.querySelectorAll("[data-theme]").forEach(r=>{r.addEventListener("click",()=>{m.dispatch("CREATE_EXHIBIT",{themeId:r.dataset.theme}),oe(),y("museum")})})}})}),e.querySelectorAll("[data-add-artifact]").forEach(s=>{s.addEventListener("click",()=>ds(s.dataset.addArtifact))}),e.querySelectorAll("[data-remove-artifact]").forEach(s=>{s.addEventListener("click",()=>{const[n,r]=s.dataset.removeArtifact.split(":");m.dispatch("REMOVE_ARTIFACT_FROM_EXHIBIT",{exhibitId:n,artifactId:r}),x("Removed from exhibit."),y("museum")})})}function ps(e){const t=m.getState();t.museum?.built?us(e,t):ls(e,t)}function ie(e,t){return`<div class="stack"><h2>${o(e)}</h2><div class="card">${t}</div></div>`}function A(e,t){return`<div class="detail-row"><dt>${o(e)}</dt><dd>${t}</dd></div>`}function hs(e){const t=m.getState(),i=t.expeditionHistory,a=i.filter(l=>l.success).length,s=i.length?a/i.length:0,n=i.reduce((l,p)=>l+p.financials.actualCashDelta,0),r={};for(const l of J)r[l]=0;for(const l of t.artifacts)r[l.rarity]=(r[l.rarity]||0)+1;const c={none:0,stored:0,displayed:0,sold:0,donated:0};let d=0;for(const l of t.artifacts)c[l.disposition]=(c[l.disposition]||0)+1,l.disposition==="none"&&(d+=(l.estimatedValueRange[0]+l.estimatedValueRange[1])/2);e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Reports</h1>

    ${ie("Expeditions",`
      ${A("Total launched",i.length)}
      ${A("Success rate",q(s))}
      ${A("Net financial impact",w(n))}
      ${A("Failed",t.stats.expeditionsFailed)}
    `)}

    ${i.length?ie("Recent Expeditions",`
      <div class="stack" style="gap:0;">
        ${[...i].reverse().slice(0,8).map(l=>`
          <div class="financial-line">
            <span>${o(l.leadTitle)} <span class="muted">(${o(l.siteName)})</span></span>
            <span class="${l.success?"financial-line--positive":"financial-line--negative"}">${l.success?"Success":"Failed"} · ${w(l.financials.actualCashDelta)}</span>
          </div>
        `).join("")}
      </div>
    `):""}

    ${ie("Finances",`
      ${A("Cash on hand",w(t.finance.cash))}
      ${A("Total revenue",w(t.finance.totalRevenue))}
      ${A("Total expenses",w(t.finance.totalExpenses))}
      ${A("Organization prestige",t.organization.prestige)}
    `)}

    ${ie("Collection",`
      ${A("Total artifacts",t.artifacts.length)}
      ${A("Awaiting a decision",c.none)}
      ${A("Stored",c.stored)}
      ${A("Displayed",c.displayed)}
      ${A("Sold",c.sold)}
      ${A("Donated",c.donated)}
      ${A("Unrealized value (undecided pieces)",w(d))}
      <div class="divider"></div>
      ${J.filter(l=>r[l]>0).map(l=>A(l,r[l])).join("")}
    `)}

    ${t.staff.length?ie("Crew",`
      ${t.staff.map(l=>A(`${l.name} (${ve(l.roleId)?.label||l.roleId})`,`Skill ${l.skillLevel}/5 · ${l.experience} XP`)).join("")}
    `):""}

    ${ie("Reputation",`
      ${A("Public Fame",Math.round(t.reputation.publicFame))}
      ${A("Academic Credibility",Math.round(t.reputation.academicCredibility))}
      ${A("Field Reputation",Math.round(t.reputation.fieldReputation))}
      ${A("Ethical Standing",Math.round(t.reputation.ethicalStanding))}
    `)}
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("organization"))}function Re(e,t,i){return`
    <div class="toggle-row">
      <label for="${e}" style="margin:0;">${t}</label>
      <span class="switch">
        <input type="checkbox" id="${e}" ${i?"checked":""} />
        <span class="switch__track"></span>
      </span>
    </div>
  `}function fs(e){const t=m.getState(),i=t.settings;e.innerHTML=`
    <button class="btn btn--ghost" id="back-btn">&larr; Organization</button>
    <h1>Settings</h1>

    <div class="card stack">
      <h3>Audio</h3>
      ${Re("sound-toggle","Sound effects",i.soundEnabled)}
      ${Re("music-toggle","Music",i.musicEnabled)}
    </div>

    <div class="card stack">
      <h3>Display</h3>
      ${Re("motion-toggle","Reduced motion",i.reducedMotion)}
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
      ${Re("confirm-toggle","Confirm expensive actions",i.confirmExpensiveActions)}
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
  `,e.querySelector("#back-btn").addEventListener("click",()=>y("organization"));const a=(s,n)=>{e.querySelector(`#${s}`).addEventListener("change",r=>{m.dispatch("UPDATE_SETTINGS",{[n]:r.target.checked})})};a("sound-toggle","soundEnabled"),a("music-toggle","musicEnabled"),a("motion-toggle","reducedMotion"),a("confirm-toggle","confirmExpensiveActions"),e.querySelector("#theme-select").addEventListener("change",s=>{m.dispatch("UPDATE_SETTINGS",{theme:s.target.value})}),e.querySelector("#speed-select").addEventListener("change",s=>{m.dispatch("UPDATE_SETTINGS",{defaultExpeditionSpeed:Number(s.target.value)})}),e.querySelector("#reset-tutorial-btn").addEventListener("click",async()=>{await G({title:"Reset tutorial?",message:"Coach marks will appear again as you play.",confirmLabel:"Reset"})&&(m.dispatch("RESET_TUTORIAL",{}),x("Tutorial reset."))}),e.querySelector("#export-btn").addEventListener("click",()=>{const{url:s,filename:n}=V.exportSave(m.getState()),r=document.createElement("a");r.href=s,r.download=n,r.click(),setTimeout(()=>URL.revokeObjectURL(s),2e3),x("Save exported.")}),e.querySelector("#import-btn").addEventListener("click",()=>e.querySelector("#import-input").click()),e.querySelector("#import-input").addEventListener("change",async s=>{const n=s.target.files[0];if(!(!n||!await G({title:"Import save?",message:"This replaces your current session with the imported save (your current slot on disk is untouched until you save again).",confirmLabel:"Import"})))try{const c=await V.importSaveFromFile(n),d=m.getState().meta.slotId;c.meta.slotId=d,m.setState(c),await V.saveToSlot(d,c),x("Save imported."),y("headquarters")}catch(c){S(c.message)}}),e.querySelector("#quit-btn").addEventListener("click",async()=>{await G({title:"Return to title screen?",message:"Your progress is already saved automatically.",confirmLabel:"Return to Title"})&&window.location.reload()})}const Ye=[{screen:"leads",title:"Your First Lead",message:"A storage-unit find led here. Open it to see what you know so far."},{screen:"leads",title:"Research the Lead",message:"Spend cash and time on research to improve your odds before committing to an expedition."},{screen:"evidence",title:"Weigh the Evidence",message:"Review what you've uncovered, then draw a conclusion about the most likely site."},{screen:"planning",title:"Prepare Your Expedition",message:"Pick an approach, pack equipment and supplies, then launch when the estimate looks reasonable."},{screen:"live-expedition",title:"In the Field",message:"Watch the expedition unfold. Field events will ask you to make a call — there's no single right answer."},{screen:"expedition-results",title:"Review the Outcome",message:"Financials are broken down clearly so you always know why an expedition went the way it did."},{screen:"collection",title:"Authenticate Your Find",message:"Open a recovered artifact and get a first opinion on whether it's genuine."},{screen:"artifact-detail",title:"Sell, Store, or Display",message:"Decide what to do with it — each choice trades cash against reputation."},{screen:"headquarters",title:"Keep Growing",message:"Earn revenue and reputation to unlock hiring, better equipment, and eventually a museum of your own."}];function ms(e,t){if(!e)return;const i=m.getState();if(!i||!i.tutorial.active||!i.settings.tutorialEnabled){e.innerHTML="";return}const a=i.tutorial.currentStep,s=Ye[a];if(!s||s.screen!==t||i.tutorial.dismissedSteps.includes(a)){e.innerHTML="";return}e.innerHTML=`
    <div class="coach-mark" role="dialog" aria-label="Tutorial tip">
      <div class="row row--between">
        <span class="eyebrow">Tip ${a+1} of ${Ye.length}</span>
        <button class="icon-btn" id="dismiss-tutorial" aria-label="Dismiss tip">✕</button>
      </div>
      <h3>${o(s.title)}</h3>
      <p class="text-sm">${o(s.message)}</p>
      <button class="btn btn--primary btn--full" id="got-it-btn" style="margin-top:var(--space-2);">Got it</button>
    </div>
  `;const n=()=>{m.dispatch("DISMISS_TUTORIAL_STEP",{step:a}),a>=Ye.length-1&&m.dispatch("END_TUTORIAL",{}),e.innerHTML=""};e.querySelector("#got-it-btn").addEventListener("click",n),e.querySelector("#dismiss-tutorial").addEventListener("click",n)}const vs=[{id:"headquarters",label:"HQ",icon:"compass"},{id:"leads",label:"Leads",icon:"map"},{id:"expeditions",label:"Expeditions",icon:"route"},{id:"collection",label:"Collection",icon:"case"},{id:"organization",label:"Org",icon:"building"}],Lt={compass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 5-5 2 2-5z"/></svg>',map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M7.8 7.5C10 10 12 12 14 13.5c1.4 1 2.6 1.7 4 2"/></svg>',case:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="3" width="16" height="18"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/></svg>',bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>'};function qt(e){document.documentElement.dataset.theme=e.settings.theme||"expedition",document.documentElement.dataset.reducedMotion=String(!!e.settings.reducedMotion)}function gs(e){e.innerHTML=`
    <div class="app-shell">
      <header class="app-header">
        <div class="row" style="gap:8px;">
          <strong style="font-family:var(--font-display);">${se.gameTitle}</strong>
        </div>
        <button class="icon-btn" id="alerts-btn" aria-label="Alerts">${Lt.bell}<span id="alert-dot" class="visually-hidden"></span></button>
      </header>
      <main class="app-main" id="app-main"></main>
      <nav class="bottom-nav" aria-label="Primary">
        ${vs.map(r=>`
          <button class="bottom-nav__item" data-nav="${r.id}" aria-current="false">
            ${Lt[r.icon]}
            <span>${r.label}</span>
          </button>
        `).join("")}
      </nav>
    </div>
    <div id="tutorial-root"></div>
  `;const t=e.querySelector("#app-main"),i=e.querySelector(".bottom-nav");L("headquarters",qn),L("leads",Pn),L("evidence",Fn),L("planning",It),L("expeditions",It),L("live-expedition",Gn),L("expedition-results",Xn),L("collection",Zn),L("artifact-detail",Jn),L("organization",is),L("staff",as),L("equipment",os),L("facilities",cs),L("museum",ps),L("reports",hs),L("settings",fs);const a=["settings","staff","equipment","facilities","museum","reports"],s=["expeditions","planning","live-expedition","expedition-results"];function n(r){const c=r==="evidence"?"leads":s.includes(r)?"expeditions":r==="artifact-detail"?"collection":a.includes(r)?"organization":r;i.querySelectorAll("[data-nav]").forEach(d=>{d.setAttribute("aria-current",d.dataset.nav===c?"page":"false")}),ms(document.getElementById("tutorial-root"),r)}i.addEventListener("click",r=>{const c=r.target.closest("[data-nav]");c&&(P("click"),y(c.dataset.nav))}),e.querySelector("#alerts-btn").addEventListener("click",()=>{Ci(()=>import("./alerts-sheet-CtHHcE65.js"),[],import.meta.url).then(r=>r.openAlertsSheet())}),$n(t,n),m.subscribe(r=>{qt(r),Dt(r),bt(r.settings),xn()}),m.setAutosaveHook(r=>V.scheduleAutosave(r)),qt(m.getState()),Dt(m.getState()),bt(m.getState().settings)}function Dt(e){const t=document.getElementById("alerts-btn");if(!t)return;const i=e.alerts.length;t.style.position="relative";let a=t.querySelector(".alert-count-dot");i>0?a||(a=document.createElement("span"),a.className="alert-count-dot",a.style.cssText="position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--danger);",t.appendChild(a)):a&&a.remove()}async function bs(){const e=document.getElementById("app-root");window.addEventListener("error",t=>{console.error(t.error||t.message)}),window.addEventListener("unhandledrejection",t=>{console.error(t.reason),t.reason?.message&&S(t.reason.message)}),await Tn(e),gs(e),y("headquarters")}bs();export{o as e,ut as o,m as s};
