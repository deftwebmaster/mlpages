/**
 * Website Launch Kit
 * Matt Livingston - 2025
 */

(function() {
    'use strict';

    // =========================================================================
    // Data: Placeholder content sources
    // =========================================================================

    const DATA = {
        loremSentences: [
            "The quick brown fox jumps over the lazy dog.",
            "Pack my box with five dozen liquor jugs.",
            "How vexingly quick daft zebras jump.",
            "Bright vixens jump; dozy fowl quack.",
            "The five boxing wizards jump quickly.",
            "Sphinx of black quartz, judge my vow.",
            "Two driven jocks help fax my big quiz.",
            "The jay, pig, fox, zebra, and my wolves quack.",
            "Sympathizing would fix Quaker objectives.",
            "A wizard's job is to vex chumps quickly in fog."
        ],
        loremParagraphs: [
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
            "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.",
            "Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor ultrices risus nec adipiscing.",
            "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin pharetra nonummy pede. Mauris et orci.",
            "Suspendisse potenti. Sed accumsan gravida mauris. Praesent turpis. Vestibulum volutpat pretium libero. Cras id dui. Aenean ut eros et nisl sagittis vestibulum.",
            "Fusce risus nisl viverra et tempor et pretium in sapien. Donec venenatis vulputate lorem. Morbi nec metus. Phasellus blandit leo ut odio.",
            "Nam pretium turpis et arcu. Duis arcu tortor suscipit eget imperdiet nec imperdiet iaculis ipsum. Sed aliquam ultrices mauris. Integer ante arcu.",
            "Praesent egestas neque eu enim. In hac habitasse platea dictumst. Fusce a quam. Etiam ut purus mattis mauris sodales aliquam.",
            "Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus."
        ],
        headlines: {
            h1: [
                "Welcome to the Future of Innovation",
                "Transform Your Business Today",
                "Discover What's Possible",
                "Built for Modern Teams",
                "The Platform You've Been Waiting For",
                "Simplify Everything",
                "Where Ideas Become Reality",
                "Your Success Starts Here",
                "Reimagine the Way You Work",
                "Power Meets Simplicity"
            ],
            h2: [
                "How It Works",
                "Key Features",
                "Why Choose Us",
                "Get Started in Minutes",
                "Trusted by Thousands",
                "See the Difference",
                "What Our Customers Say",
                "Pricing That Makes Sense",
                "Built for Scale",
                "Security You Can Trust"
            ],
            h3: [
                "Easy Integration",
                "24/7 Support",
                "Real-Time Analytics",
                "Custom Workflows",
                "Team Collaboration",
                "Automated Reports",
                "Cloud-Native Architecture",
                "Enterprise Ready",
                "Mobile First Design",
                "API Access Included"
            ]
        },
        listItems: [
            "Streamlined workflow automation",
            "Real-time data synchronization",
            "Advanced security protocols",
            "Intuitive user interface",
            "Comprehensive documentation",
            "Priority customer support",
            "Flexible pricing options",
            "Seamless third-party integrations",
            "Custom reporting dashboards",
            "Mobile-responsive design",
            "Multi-language support",
            "Role-based access control",
            "Automated backup systems",
            "Performance optimization tools",
            "Dedicated account management"
        ],
        firstNames: [
            "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
            "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
            "Thomas", "Sarah", "Charles", "Karen", "Emma", "Olivia", "Ava", "Isabella",
            "Sophia", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn", "Liam", "Noah",
            "Oliver", "Elijah", "Lucas", "Mason", "Logan", "Alexander", "Ethan", "Jacob"
        ],
        lastNames: [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
            "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
            "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
            "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
        ],
        companies: [
            "Apex Technologies", "Blue Harbor Solutions", "Cascade Industries", "Delta Force Systems",
            "Echo Digital", "Frontier Analytics", "Golden Gate Ventures", "Horizon Labs",
            "Ironclad Security", "Jupiter Innovations", "Keystone Partners", "Lighthouse Media",
            "Momentum Group", "Nexus Consulting", "Orbit Software", "Pinnacle Strategies",
            "Quantum Dynamics", "Redwood Capital", "Summit Enterprises", "Titan Corp"
        ],
        streetNames: [
            "Main", "Oak", "Maple", "Cedar", "Pine", "Elm", "Washington", "Lake",
            "Hill", "Park", "View", "River", "Sunset", "Highland", "Forest"
        ],
        streetSuffixes: ["St", "Ave", "Blvd", "Dr", "Ln", "Way", "Rd", "Ct", "Pl"],
        cities: [
            { city: "New York", state: "NY", zip: "10001" },
            { city: "Los Angeles", state: "CA", zip: "90001" },
            { city: "Chicago", state: "IL", zip: "60601" },
            { city: "Houston", state: "TX", zip: "77001" },
            { city: "Phoenix", state: "AZ", zip: "85001" },
            { city: "Philadelphia", state: "PA", zip: "19101" },
            { city: "San Antonio", state: "TX", zip: "78201" },
            { city: "San Diego", state: "CA", zip: "92101" },
            { city: "Dallas", state: "TX", zip: "75201" },
            { city: "Austin", state: "TX", zip: "78701" },
            { city: "Denver", state: "CO", zip: "80201" },
            { city: "Seattle", state: "WA", zip: "98101" },
            { city: "Boston", state: "MA", zip: "02101" },
            { city: "Nashville", state: "TN", zip: "37201" },
            { city: "Portland", state: "OR", zip: "97201" }
        ],
        euCities: [
            { city: "London", country: "United Kingdom", postal: "SW1A 1AA" },
            { city: "Paris", country: "France", postal: "75001" },
            { city: "Berlin", country: "Germany", postal: "10115" },
            { city: "Amsterdam", country: "Netherlands", postal: "1011" },
            { city: "Madrid", country: "Spain", postal: "28001" },
            { city: "Rome", country: "Italy", postal: "00100" },
            { city: "Vienna", country: "Austria", postal: "1010" },
            { city: "Dublin", country: "Ireland", postal: "D01" },
            { city: "Stockholm", country: "Sweden", postal: "111 21" },
            { city: "Copenhagen", country: "Denmark", postal: "1000" }
        ],
        emailDomains: ["example.com", "test.org", "demo.net", "sample.io", "placeholder.dev"],
        relativeTimes: [
            "Just now", "2 minutes ago", "5 minutes ago", "15 minutes ago", "30 minutes ago",
            "1 hour ago", "2 hours ago", "5 hours ago", "Yesterday", "2 days ago",
            "3 days ago", "Last week", "2 weeks ago", "Last month", "2 months ago"
        ],
        saasPrices: [
            { tier: "Starter", price: 9, period: "/mo" },
            { tier: "Pro", price: 29, period: "/mo" },
            { tier: "Team", price: 79, period: "/mo" },
            { tier: "Business", price: 199, period: "/mo" },
            { tier: "Enterprise", price: null, period: "Custom" }
        ]
    };

    // =========================================================================
    // Utilities
    // =========================================================================

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pick(arr) {
        return arr[random(0, arr.length - 1)];
    }

    function pickMultiple(arr, count, unique = true) {
        if (!unique || count >= arr.length) {
            const result = [];
            for (let i = 0; i < count; i++) {
                result.push(pick(arr));
            }
            return result;
        }
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    function getLineEnding() {
        const setting = document.getElementById('lineEnding').value;
        return setting === 'crlf' ? '\r\n' : '\n';
    }

    function copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const original = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = original;
                button.classList.remove('copied');
            }, 1500);
        });
    }

    // =========================================================================
    // Generators
    // =========================================================================

    const generators = {
        paragraphs() {
            const count = parseInt(document.getElementById('paragraphCount').value, 10) || 3;
            const length = document.getElementById('paragraphLength').value;
            const le = getLineEnding();
            
            let sentencesPerParagraph;
            switch (length) {
                case 'short': sentencesPerParagraph = [2, 3]; break;
                case 'long': sentencesPerParagraph = [6, 8]; break;
                default: sentencesPerParagraph = [4, 5];
            }

            const paragraphs = [];
            for (let i = 0; i < count; i++) {
                if (i < DATA.loremParagraphs.length) {
                    paragraphs.push(DATA.loremParagraphs[i]);
                } else {
                    // Generate from sentences
                    const numSentences = random(...sentencesPerParagraph);
                    const sentences = pickMultiple(DATA.loremSentences, numSentences, false);
                    paragraphs.push(sentences.join(' '));
                }
            }

            return paragraphs.join(le + le);
        },

        headlines() {
            const count = parseInt(document.getElementById('headlineCount').value, 10) || 5;
            const style = document.getElementById('headlineStyle').value;
            const le = getLineEnding();

            const results = [];
            for (let i = 0; i < count; i++) {
                let level = style;
                if (style === 'mixed') {
                    level = pick(['h1', 'h2', 'h3']);
                }
                results.push(pick(DATA.headlines[level]));
            }

            return results.join(le);
        },

        lists() {
            const count = parseInt(document.getElementById('listItemCount').value, 10) || 5;
            const type = document.getElementById('listType').value;
            const le = getLineEnding();

            const items = pickMultiple(DATA.listItems, count, true);
            
            if (type === 'ol') {
                return items.map((item, i) => `${i + 1}. ${item}`).join(le);
            }
            return items.map(item => `• ${item}`).join(le);
        },

        names() {
            const count = parseInt(document.getElementById('nameCount').value, 10) || 5;
            const type = document.getElementById('nameType').value;
            const le = getLineEnding();

            const results = [];
            for (let i = 0; i < count; i++) {
                switch (type) {
                    case 'first':
                        results.push(pick(DATA.firstNames));
                        break;
                    case 'last':
                        results.push(pick(DATA.lastNames));
                        break;
                    case 'company':
                        results.push(pick(DATA.companies));
                        break;
                    default:
                        results.push(`${pick(DATA.firstNames)} ${pick(DATA.lastNames)}`);
                }
            }

            return results.join(le);
        },

        addresses() {
            const count = parseInt(document.getElementById('addressCount').value, 10) || 3;
            const format = document.getElementById('addressFormat').value;
            const le = getLineEnding();

            const results = [];
            for (let i = 0; i < count; i++) {
                const streetNum = random(100, 9999);
                const street = `${pick(DATA.streetNames)} ${pick(DATA.streetSuffixes)}`;
                
                if (format === 'eu') {
                    const loc = pick(DATA.euCities);
                    results.push(`${streetNum} ${street}${le}${loc.postal} ${loc.city}${le}${loc.country}`);
                } else {
                    const loc = pick(DATA.cities);
                    results.push(`${streetNum} ${street}${le}${loc.city}, ${loc.state} ${loc.zip}`);
                }
            }

            return results.join(le + le);
        },

        contacts() {
            const count = parseInt(document.getElementById('contactCount').value, 10) || 5;
            const type = document.getElementById('contactType').value;
            const le = getLineEnding();

            const results = [];
            for (let i = 0; i < count; i++) {
                const firstName = pick(DATA.firstNames).toLowerCase();
                const lastName = pick(DATA.lastNames).toLowerCase();
                const phone = `(${random(200, 999)}) ${random(200, 999)}-${random(1000, 9999)}`;
                const email = `${firstName}.${lastName}@${pick(DATA.emailDomains)}`;

                switch (type) {
                    case 'phone':
                        results.push(phone);
                        break;
                    case 'email':
                        results.push(email);
                        break;
                    default:
                        results.push(`${phone} | ${email}`);
                }
            }

            return results.join(le);
        },

        prices() {
            const count = parseInt(document.getElementById('priceCount').value, 10) || 5;
            const range = document.getElementById('priceRange').value;
            const le = getLineEnding();

            if (range === 'saas') {
                return DATA.saasPrices.map(tier => {
                    if (tier.price === null) {
                        return `${tier.tier}: ${tier.period}`;
                    }
                    return `${tier.tier}: $${tier.price}${tier.period}`;
                }).join(le);
            }

            let min, max;
            switch (range) {
                case 'low': min = 1; max = 50; break;
                case 'high': min = 100; max = 10000; break;
                default: min = 10; max = 500;
            }

            const results = [];
            for (let i = 0; i < count; i++) {
                const price = random(min, max);
                const cents = random(0, 99);
                results.push(`$${price}.${cents.toString().padStart(2, '0')}`);
            }

            return results.join(le);
        },

        dates() {
            const count = parseInt(document.getElementById('dateCount').value, 10) || 5;
            const type = document.getElementById('dateType').value;
            const le = getLineEnding();
            const timestampFormat = document.getElementById('timestampFormat').value;

            const results = [];
            const now = new Date();

            for (let i = 0; i < count; i++) {
                // Random date within past year
                const daysAgo = random(0, 365);
                const date = new Date(now);
                date.setDate(date.getDate() - daysAgo);
                date.setHours(random(0, 23), random(0, 59), random(0, 59));

                switch (type) {
                    case 'date':
                        if (timestampFormat === 'iso') {
                            results.push(date.toISOString().split('T')[0]);
                        } else {
                            results.push(date.toLocaleDateString('en-US', { 
                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
                            }));
                        }
                        break;
                    case 'datetime':
                        if (timestampFormat === 'iso') {
                            results.push(date.toISOString());
                        } else {
                            results.push(date.toLocaleString('en-US', {
                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            }));
                        }
                        break;
                    case 'relative':
                        results.push(pick(DATA.relativeTimes));
                        break;
                    case 'timestamp':
                        results.push(Math.floor(date.getTime() / 1000).toString());
                        break;
                }
            }

            return results.join(le);
        },

        images() {
            const count = parseInt(document.getElementById('imageCount').value, 10) || 3;
            const size = document.getElementById('imageSize').value;
            const output = document.getElementById('imageOutput').value;
            const le = getLineEnding();

            const sizes = {
                thumbnail: [150, 150],
                small: [300, 200],
                medium: [600, 400],
                large: [1200, 800],
                hero: [1920, 1080]
            };

            const [width, height] = sizes[size];
            const results = [];

            for (let i = 0; i < count; i++) {
                const id = random(1, 1000);
                
                switch (output) {
                    case 'url':
                        results.push(`https://picsum.photos/seed/${id}/${width}/${height}`);
                        break;
                    case 'svg':
                        results.push(
                            `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
                            `<rect width="100%" height="100%" fill="#334155"/>` +
                            `<text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle" dy=".3em">${width}×${height}</text>` +
                            `</svg>`
                        );
                        break;
                    case 'img':
                        results.push(`<img src="https://picsum.photos/seed/${id}/${width}/${height}" alt="Placeholder image ${width}×${height}" width="${width}" height="${height}">`);
                        break;
                }
            }

            return results.join(le + le);
        }
    };

    // =========================================================================
    // Tab Management
    // =========================================================================

    function initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;

                // Update buttons
                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');

                // Update panels
                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById(`${tabId}-panel`).classList.add('active');

                // Save to localStorage
                localStorage.setItem('launchKit_activeTab', tabId);
            });
        });

        // Restore active tab
        const savedTab = localStorage.getItem('launchKit_activeTab');
        if (savedTab) {
            const btn = document.querySelector(`[data-tab="${savedTab}"]`);
            if (btn) btn.click();
        }
    }

    // =========================================================================
    // Generator Buttons
    // =========================================================================

    function initGenerators() {
        document.querySelectorAll('.btn-generate').forEach(btn => {
            btn.addEventListener('click', () => {
                const generatorName = btn.dataset.generator;
                const outputBox = document.getElementById(`${generatorName}Output`);
                
                if (generators[generatorName]) {
                    const output = generators[generatorName]();
                    
                    // Create output with copy button
                    outputBox.innerHTML = `
                        <div class="copy-wrapper">
                            <button type="button" class="btn btn-copy">Copy</button>
                        </div>
                        <pre>${escapeHtml(output)}</pre>
                    `;
                    outputBox.classList.add('has-content');

                    // Wire up copy button
                    outputBox.querySelector('.btn-copy').addEventListener('click', function() {
                        copyToClipboard(output, this);
                    });
                }
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========================================================================
    // Config Import/Export
    // =========================================================================

    function getConfig() {
        const config = {
            version: 1,
            settings: {
                lineEnding: document.getElementById('lineEnding').value,
                commentVerbosity: document.getElementById('commentVerbosity').value,
                timestampFormat: document.getElementById('timestampFormat').value
            },
            placeholder: {
                paragraphCount: document.getElementById('paragraphCount').value,
                paragraphLength: document.getElementById('paragraphLength').value,
                headlineCount: document.getElementById('headlineCount').value,
                headlineStyle: document.getElementById('headlineStyle').value,
                listItemCount: document.getElementById('listItemCount').value,
                listType: document.getElementById('listType').value,
                nameCount: document.getElementById('nameCount').value,
                nameType: document.getElementById('nameType').value,
                addressCount: document.getElementById('addressCount').value,
                addressFormat: document.getElementById('addressFormat').value,
                contactCount: document.getElementById('contactCount').value,
                contactType: document.getElementById('contactType').value,
                priceCount: document.getElementById('priceCount').value,
                priceRange: document.getElementById('priceRange').value,
                dateCount: document.getElementById('dateCount').value,
                dateType: document.getElementById('dateType').value,
                imageCount: document.getElementById('imageCount').value,
                imageSize: document.getElementById('imageSize').value,
                imageOutput: document.getElementById('imageOutput').value
            },
            meta: {
                metaTitle: document.getElementById('metaTitle').value,
                metaDescription: document.getElementById('metaDescription').value,
                metaKeywords: document.getElementById('metaKeywords').value,
                metaCanonical: document.getElementById('metaCanonical').value,
                ogTitle: document.getElementById('ogTitle').value,
                ogDescription: document.getElementById('ogDescription').value,
                ogImage: document.getElementById('ogImage').value,
                ogType: document.getElementById('ogType').value,
                ogSiteName: document.getElementById('ogSiteName').value,
                twitterCard: document.getElementById('twitterCard').value,
                twitterSite: document.getElementById('twitterSite').value,
                twitterCreator: document.getElementById('twitterCreator').value,
                faviconPath: document.getElementById('faviconPath').value,
                appleTouchIcon: document.getElementById('appleTouchIcon').value,
                metaViewport: document.getElementById('metaViewport').checked,
                metaCharset: document.getElementById('metaCharset').checked,
                metaRobots: document.getElementById('metaRobots').checked,
                metaRobotsValue: document.getElementById('metaRobotsValue').value,
                metaThemeColor: document.getElementById('metaThemeColor').checked,
                metaThemeColorValue: document.getElementById('metaThemeColorValue').value
            }
        };
        return config;
    }

    function loadConfig(config) {
        if (!config || config.version !== 1) return;

        // Settings
        if (config.settings) {
            Object.entries(config.settings).forEach(([key, value]) => {
                const el = document.getElementById(key);
                if (el) el.value = value;
            });
        }

        // Placeholder settings
        if (config.placeholder) {
            Object.entries(config.placeholder).forEach(([key, value]) => {
                const el = document.getElementById(key);
                if (el) el.value = value;
            });
        }

        // Meta settings
        if (config.meta) {
            Object.entries(config.meta).forEach(([key, value]) => {
                const el = document.getElementById(key);
                if (el) {
                    if (el.type === 'checkbox') {
                        el.checked = value;
                        // Trigger change to show/hide conditional fields
                        el.dispatchEvent(new Event('change'));
                    } else {
                        el.value = value;
                    }
                }
            });
            // Update character counts
            const titleCount = document.getElementById('metaTitleCount');
            const descCount = document.getElementById('metaDescriptionCount');
            if (titleCount) titleCount.textContent = (config.meta.metaTitle || '').length;
            if (descCount) descCount.textContent = (config.meta.metaDescription || '').length;
        }
    }

    function initConfigButtons() {
        const exportBtn = document.getElementById('exportConfigBtn');
        const importBtn = document.getElementById('importConfigBtn');
        const importInput = document.getElementById('importConfigInput');

        exportBtn.addEventListener('click', () => {
            const config = getConfig();
            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'launch-kit-config.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        importBtn.addEventListener('click', () => {
            importInput.click();
        });

        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    loadConfig(config);
                    saveToLocalStorage();
                } catch (err) {
                    alert('Invalid config file');
                }
            };
            reader.readAsText(file);
            importInput.value = '';
        });
    }

    // =========================================================================
    // LocalStorage Auto-save
    // =========================================================================

    function saveToLocalStorage() {
        const config = getConfig();
        localStorage.setItem('launchKit_config', JSON.stringify(config));
    }

    function loadFromLocalStorage() {
        const saved = localStorage.getItem('launchKit_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                loadConfig(config);
            } catch (err) {
                console.error('Failed to load config from localStorage');
            }
        }
    }

    function initAutoSave() {
        // Save on any input change
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('change', saveToLocalStorage);
        });
    }

    // =========================================================================
    // Download All
    // =========================================================================

    function initDownloadAll() {
        document.getElementById('downloadAllBtn').addEventListener('click', downloadAll);
    }

    async function downloadAll() {
        const zip = new JSZip();
        const le = getLineEnding();
        const files = [];

        // Generate all files by triggering each generator
        // and capturing the output

        // 1. robots.txt
        generateRobots();
        const robotsContent = document.getElementById('robotsOutput').querySelector('pre')?.textContent;
        if (robotsContent && !robotsContent.startsWith('#')) {
            zip.file('robots.txt', robotsContent);
            files.push('robots.txt');
        }

        // 2. sitemap.xml
        generateSitemap();
        const sitemapContent = document.getElementById('sitemapOutput').querySelector('pre')?.textContent;
        if (sitemapContent && sitemapContent.includes('<?xml')) {
            zip.file('sitemap.xml', sitemapContent);
            files.push('sitemap.xml');
        }

        // 3. .htaccess
        generateHtaccess();
        const htaccessContent = document.getElementById('htaccessOutput').querySelector('pre')?.textContent;
        if (htaccessContent && !htaccessContent.startsWith('#')) {
            zip.file('.htaccess', htaccessContent);
            files.push('.htaccess');
        }

        // 4. humans.txt
        generateHumans();
        const humansContent = document.getElementById('humansOutput').querySelector('pre')?.textContent;
        if (humansContent && humansContent.includes('/* TEAM */')) {
            zip.file('humans.txt', humansContent);
            files.push('humans.txt');
        }

        // 5. Security headers (based on selected format)
        generateSecurity();
        const securityContent = document.getElementById('securityOutput').querySelector('pre')?.textContent;
        const securityFormat = document.getElementById('securityOutputFormat').value;
        if (securityContent && !securityContent.startsWith('#')) {
            let securityFilename;
            switch (securityFormat) {
                case 'htaccess':
                    securityFilename = 'security-headers.htaccess';
                    break;
                case 'netlify':
                    securityFilename = '_headers';
                    break;
                case 'nginx':
                    securityFilename = 'security-headers.nginx.conf';
                    break;
                case 'cloudflare':
                    securityFilename = 'cloudflare-headers.txt';
                    break;
                default:
                    securityFilename = 'security-headers.txt';
            }
            zip.file(securityFilename, securityContent);
            files.push(securityFilename);
        }

        // 6. Meta tags (as HTML snippet)
        generateMetaTags();
        const metaContent = document.getElementById('metaOutput').querySelector('pre')?.textContent;
        if (metaContent && metaContent.includes('<meta')) {
            zip.file('meta-tags.html', metaContent);
            files.push('meta-tags.html');
        }

        // 7. Legal documents
        const legalTypes = ['privacy', 'terms', 'cookies', 'affiliate'];
        const legalFormat = document.getElementById('legalOutputFormat').value;
        const currentLegalType = document.querySelector('input[name="legalDocType"]:checked').value;
        
        // Generate each legal document
        for (const docType of legalTypes) {
            // Select the radio
            const radio = document.querySelector(`input[name="legalDocType"][value="${docType}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
                
                // Generate
                generateLegal();
                const content = document.getElementById('legalOutput').querySelector('pre')?.textContent;
                
                if (content && !content.startsWith('#')) {
                    const ext = legalFormat === 'html' ? 'html' : legalFormat === 'markdown' ? 'md' : 'txt';
                    const filenames = {
                        privacy: `privacy-policy.${ext}`,
                        terms: `terms-of-service.${ext}`,
                        cookies: `cookie-policy.${ext}`,
                        affiliate: `affiliate-disclosure.${ext}`
                    };
                    zip.file(filenames[docType], content);
                    files.push(filenames[docType]);
                }
            }
        }
        
        // Restore original legal selection
        const originalRadio = document.querySelector(`input[name="legalDocType"][value="${currentLegalType}"]`);
        if (originalRadio) {
            originalRadio.checked = true;
            originalRadio.dispatchEvent(new Event('change'));
        }

        // 8. Add a README
        const readmeContent = generateReadme(files, le);
        zip.file('README.txt', readmeContent);

        // Generate and download ZIP
        if (files.length === 0) {
            alert('No files to download. Generate some content first!');
            return;
        }

        try {
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'website-launch-kit.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to generate ZIP:', err);
            alert('Failed to generate ZIP file. Please try again.');
        }
    }

    function generateReadme(files, le) {
        const lines = [
            'WEBSITE LAUNCH KIT',
            '==================',
            '',
            'Generated by Website Launch Kit',
            'https://mattlivingston.com/tools/launch-kit/',
            '',
            `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
            '',
            'FILES INCLUDED:',
            '---------------',
            ''
        ];

        files.forEach(file => {
            lines.push(`• ${file}`);
        });

        lines.push('');
        lines.push('INSTALLATION:');
        lines.push('-------------');
        lines.push('');
        lines.push('1. robots.txt - Upload to your site root');
        lines.push('2. sitemap.xml - Upload to site root, submit to Google Search Console');
        lines.push('3. .htaccess - Upload to site root (Apache servers only)');
        lines.push('4. humans.txt - Upload to site root');
        lines.push('5. _headers - Upload to site root (Netlify only)');
        lines.push('6. meta-tags.html - Copy contents into your <head> tag');
        lines.push('7. Legal docs - Create pages and paste content');
        lines.push('');
        lines.push('IMPORTANT:');
        lines.push('----------');
        lines.push('• Always backup existing files before replacing');
        lines.push('• Test on staging environment first');
        lines.push('• Legal documents are templates - consult a lawyer for compliance');
        lines.push('');
        lines.push('---');
        lines.push('Built by Matt Livingston');

        return lines.join(le);
    }

    // =========================================================================
    // Init
    // =========================================================================

    function init() {
        loadFromLocalStorage();
        initTabs();
        initGenerators();
        initConfigButtons();
        initAutoSave();
        initDownloadAll();
        initMetaTags();
        initRobots();
        initSitemap();
        initHumans();
        initHtaccess();
        initSecurity();
        initLegal();
        initChecklist();
    }

    // =========================================================================
    // Meta Tags Module
    // =========================================================================

    function initMetaTags() {
        // Character counters
        const titleInput = document.getElementById('metaTitle');
        const descInput = document.getElementById('metaDescription');
        const titleCount = document.getElementById('metaTitleCount');
        const descCount = document.getElementById('metaDescriptionCount');

        titleInput.addEventListener('input', () => {
            titleCount.textContent = titleInput.value.length;
            updateMetaPreview();
        });

        descInput.addEventListener('input', () => {
            descCount.textContent = descInput.value.length;
            updateMetaPreview();
        });

        // Conditional fields
        document.getElementById('metaRobots').addEventListener('change', (e) => {
            document.getElementById('robotsOptions').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('metaThemeColor').addEventListener('change', (e) => {
            document.getElementById('themeColorOption').style.display = e.target.checked ? 'block' : 'none';
        });

        // Preview tabs
        document.querySelectorAll('.preview-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.preview-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`preview-${tab.dataset.preview}`).classList.add('active');
            });
        });

        // Live preview updates
        const previewInputs = [
            'metaTitle', 'metaDescription', 'metaCanonical',
            'ogTitle', 'ogDescription', 'ogImage', 'ogSiteName',
            'twitterCard'
        ];
        previewInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', updateMetaPreview);
            }
        });

        // Generate button
        document.getElementById('generateMetaBtn').addEventListener('click', generateMetaTags);

        // Copy button
        document.getElementById('copyMetaBtn').addEventListener('click', function() {
            const output = document.getElementById('metaOutput').querySelector('pre').textContent;
            copyToClipboard(output, this);
        });

        // Initial preview
        updateMetaPreview();
    }

    function updateMetaPreview() {
        const title = document.getElementById('metaTitle').value || 'Page Title';
        const description = document.getElementById('metaDescription').value || 'Your page description will appear here...';
        const canonical = document.getElementById('metaCanonical').value || 'https://example.com';
        const ogTitle = document.getElementById('ogTitle').value || title;
        const ogDescription = document.getElementById('ogDescription').value || description;
        const ogImage = document.getElementById('ogImage').value;
        const ogSiteName = document.getElementById('ogSiteName').value || new URL(canonical || 'https://example.com').hostname;

        // Google preview
        document.getElementById('previewGoogleTitle').textContent = title;
        document.getElementById('previewGoogleUrl').textContent = canonical;
        document.getElementById('previewGoogleDescription').textContent = description;

        // Facebook/OG preview
        document.getElementById('previewOgTitle').textContent = ogTitle;
        document.getElementById('previewOgDescription').textContent = ogDescription;
        try {
            document.getElementById('previewOgSite').textContent = new URL(canonical || 'https://example.com').hostname;
        } catch {
            document.getElementById('previewOgSite').textContent = 'example.com';
        }
        
        const ogImageEl = document.getElementById('previewOgImage');
        if (ogImage) {
            ogImageEl.style.backgroundImage = `url(${ogImage})`;
            ogImageEl.querySelector('span').style.display = 'none';
        } else {
            ogImageEl.style.backgroundImage = '';
            ogImageEl.querySelector('span').style.display = '';
        }

        // Twitter preview
        document.getElementById('previewTwitterTitle').textContent = ogTitle;
        document.getElementById('previewTwitterDescription').textContent = ogDescription;
        try {
            document.getElementById('previewTwitterUrl').textContent = new URL(canonical || 'https://example.com').hostname;
        } catch {
            document.getElementById('previewTwitterUrl').textContent = 'example.com';
        }
        
        const twitterImageEl = document.getElementById('previewTwitterImage');
        if (ogImage) {
            twitterImageEl.style.backgroundImage = `url(${ogImage})`;
            twitterImageEl.querySelector('span').style.display = 'none';
        } else {
            twitterImageEl.style.backgroundImage = '';
            twitterImageEl.querySelector('span').style.display = '';
        }
    }

    function generateMetaTags() {
        const le = getLineEnding();
        const verbosity = document.getElementById('commentVerbosity').value;
        
        const title = document.getElementById('metaTitle').value;
        const description = document.getElementById('metaDescription').value;
        const keywords = document.getElementById('metaKeywords').value;
        const canonical = document.getElementById('metaCanonical').value;
        
        const ogTitle = document.getElementById('ogTitle').value;
        const ogDescription = document.getElementById('ogDescription').value;
        const ogImage = document.getElementById('ogImage').value;
        const ogType = document.getElementById('ogType').value;
        const ogSiteName = document.getElementById('ogSiteName').value;
        
        const twitterCard = document.getElementById('twitterCard').value;
        const twitterSite = document.getElementById('twitterSite').value;
        const twitterCreator = document.getElementById('twitterCreator').value;
        
        const faviconPath = document.getElementById('faviconPath').value;
        const appleTouchIcon = document.getElementById('appleTouchIcon').value;
        
        const includeViewport = document.getElementById('metaViewport').checked;
        const includeCharset = document.getElementById('metaCharset').checked;
        const includeRobots = document.getElementById('metaRobots').checked;
        const robotsValue = document.getElementById('metaRobotsValue').value;
        const includeThemeColor = document.getElementById('metaThemeColor').checked;
        const themeColorValue = document.getElementById('metaThemeColorValue').value;

        const lines = [];
        const comment = (text) => {
            if (verbosity === 'minimal') return null;
            if (verbosity === 'teach') return `<!-- ${text} -->`;
            return `<!-- ${text} -->`;
        };

        // Basic meta
        if (verbosity !== 'minimal') {
            lines.push(comment('Basic Meta Tags'));
        }
        if (includeCharset) {
            lines.push('<meta charset="UTF-8">');
        }
        if (includeViewport) {
            lines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
        }
        if (title) {
            lines.push(`<title>${escapeHtml(title)}</title>`);
        }
        if (description) {
            lines.push(`<meta name="description" content="${escapeHtml(description)}">`);
        }
        if (keywords) {
            lines.push(`<meta name="keywords" content="${escapeHtml(keywords)}">`);
        }
        if (includeRobots) {
            lines.push(`<meta name="robots" content="${robotsValue}">`);
        }
        if (includeThemeColor && themeColorValue) {
            lines.push(`<meta name="theme-color" content="${escapeHtml(themeColorValue)}">`);
        }
        if (canonical) {
            lines.push(`<link rel="canonical" href="${escapeHtml(canonical)}">`);
        }

        // Favicon
        if (faviconPath || appleTouchIcon) {
            lines.push('');
            if (verbosity !== 'minimal') {
                lines.push(comment('Favicon'));
            }
            if (faviconPath) {
                lines.push(`<link rel="icon" href="${escapeHtml(faviconPath)}">`);
            }
            if (appleTouchIcon) {
                lines.push(`<link rel="apple-touch-icon" href="${escapeHtml(appleTouchIcon)}">`);
            }
        }

        // Open Graph
        if (title || ogTitle || ogImage) {
            lines.push('');
            if (verbosity !== 'minimal') {
                lines.push(comment('Open Graph / Facebook'));
            }
            lines.push(`<meta property="og:type" content="${ogType}">`);
            if (canonical) {
                lines.push(`<meta property="og:url" content="${escapeHtml(canonical)}">`);
            }
            lines.push(`<meta property="og:title" content="${escapeHtml(ogTitle || title)}">`);
            if (description || ogDescription) {
                lines.push(`<meta property="og:description" content="${escapeHtml(ogDescription || description)}">`);
            }
            if (ogImage) {
                lines.push(`<meta property="og:image" content="${escapeHtml(ogImage)}">`);
            }
            if (ogSiteName) {
                lines.push(`<meta property="og:site_name" content="${escapeHtml(ogSiteName)}">`);
            }
        }

        // Twitter Card
        if (title || ogTitle || ogImage) {
            lines.push('');
            if (verbosity !== 'minimal') {
                lines.push(comment('Twitter Card'));
            }
            lines.push(`<meta name="twitter:card" content="${twitterCard}">`);
            if (twitterSite) {
                lines.push(`<meta name="twitter:site" content="${escapeHtml(twitterSite)}">`);
            }
            if (twitterCreator) {
                lines.push(`<meta name="twitter:creator" content="${escapeHtml(twitterCreator)}">`);
            }
            lines.push(`<meta name="twitter:title" content="${escapeHtml(ogTitle || title)}">`);
            if (description || ogDescription) {
                lines.push(`<meta name="twitter:description" content="${escapeHtml(ogDescription || description)}">`);
            }
            if (ogImage) {
                lines.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}">`);
            }
        }

        // Filter out nulls and join
        const output = lines.filter(l => l !== null).join(le);
        
        document.getElementById('metaOutput').innerHTML = `<pre>${escapeHtml(output)}</pre>`;
    }

    // =========================================================================
    // robots.txt Module
    // =========================================================================

    function initRobots() {
        // Preset buttons
        document.querySelectorAll('[data-robots-preset]').forEach(btn => {
            btn.addEventListener('click', () => applyRobotsPreset(btn.dataset.robotsPreset));
        });

        // Multiple sitemaps toggle
        document.getElementById('robotsMultipleSitemaps').addEventListener('change', (e) => {
            document.getElementById('additionalSitemapsGroup').style.display = e.target.checked ? 'block' : 'none';
        });

        // Add user-agent block
        document.getElementById('addUserAgentBtn').addEventListener('click', addUserAgentBlock);

        // Generate button
        document.getElementById('generateRobotsBtn').addEventListener('click', generateRobots);

        // Copy button
        document.getElementById('copyRobotsBtn').addEventListener('click', function() {
            const output = document.getElementById('robotsOutput').querySelector('pre').textContent;
            copyToClipboard(output, this);
        });

        // Initialize first user-agent block event listeners
        initUserAgentBlock(document.querySelector('.user-agent-group'));
    }

    function initUserAgentBlock(block) {
        // Agent select change (for custom option)
        const agentSelect = block.querySelector('.agent-select');
        const agentCustom = block.querySelector('.agent-custom');
        
        agentSelect.addEventListener('change', () => {
            agentCustom.style.display = agentSelect.value === 'custom' ? 'block' : 'none';
        });

        // Add rule button
        block.querySelector('.btn-add-rule').addEventListener('click', () => {
            const rulesList = block.querySelector('.rules-list');
            const newRule = document.createElement('div');
            newRule.className = 'rule-row';
            newRule.innerHTML = `
                <select class="rule-type">
                    <option value="Allow">Allow</option>
                    <option value="Disallow" selected>Disallow</option>
                </select>
                <input type="text" class="rule-path" placeholder="/path/">
                <button type="button" class="btn btn-icon btn-remove-rule" title="Remove rule">×</button>
            `;
            rulesList.appendChild(newRule);
            initRuleRow(newRule);
        });

        // Initialize existing rule rows
        block.querySelectorAll('.rule-row').forEach(initRuleRow);

        // Remove agent button
        const removeBtn = block.querySelector('.btn-remove-agent');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                block.remove();
                updateRemoveAgentButtons();
            });
        }
    }

    function initRuleRow(row) {
        const removeBtn = row.querySelector('.btn-remove-rule');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                const rulesList = row.closest('.rules-list');
                if (rulesList.querySelectorAll('.rule-row').length > 1) {
                    row.remove();
                }
            });
        }
    }

    function addUserAgentBlock() {
        const container = document.getElementById('robotsUserAgents');
        const index = container.querySelectorAll('.user-agent-group').length;
        
        const newBlock = document.createElement('div');
        newBlock.className = 'user-agent-group';
        newBlock.dataset.agentIndex = index;
        newBlock.innerHTML = `
            <div class="form-group">
                <label>User-agent</label>
                <select class="agent-select">
                    <option value="*">* (All bots)</option>
                    <option value="Googlebot">Googlebot</option>
                    <option value="Bingbot">Bingbot</option>
                    <option value="GPTBot" selected>GPTBot (OpenAI)</option>
                    <option value="ChatGPT-User">ChatGPT-User</option>
                    <option value="Claude-Web">Claude-Web</option>
                    <option value="Applebot">Applebot</option>
                    <option value="DuckDuckBot">DuckDuckBot</option>
                    <option value="Slurp">Slurp (Yahoo)</option>
                    <option value="facebookexternalhit">Facebook</option>
                    <option value="Twitterbot">Twitterbot</option>
                    <option value="custom">Custom...</option>
                </select>
                <input type="text" class="agent-custom" placeholder="Custom user-agent" style="display: none; margin-top: 0.5rem;">
            </div>
            <div class="rules-container">
                <div class="form-group">
                    <label>Rules</label>
                    <div class="rules-list">
                        <div class="rule-row">
                            <select class="rule-type">
                                <option value="Allow">Allow</option>
                                <option value="Disallow" selected>Disallow</option>
                            </select>
                            <input type="text" class="rule-path" placeholder="/" value="/">
                            <button type="button" class="btn btn-icon btn-remove-rule" title="Remove rule">×</button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-add-rule">+ Add Rule</button>
                </div>
            </div>
            <div class="form-group">
                <label>
                    Crawl-delay <span class="optional">(seconds, optional)</span>
                </label>
                <input type="number" class="crawl-delay" placeholder="e.g., 10" min="0" max="60">
            </div>
            <button type="button" class="btn btn-sm btn-danger btn-remove-agent">Remove User-agent</button>
        `;
        
        container.appendChild(newBlock);
        initUserAgentBlock(newBlock);
        updateRemoveAgentButtons();
    }

    function updateRemoveAgentButtons() {
        const blocks = document.querySelectorAll('.user-agent-group');
        blocks.forEach((block, index) => {
            const removeBtn = block.querySelector('.btn-remove-agent');
            if (removeBtn) {
                removeBtn.style.display = blocks.length > 1 ? 'block' : 'none';
            }
        });
    }

    function applyRobotsPreset(preset) {
        const container = document.getElementById('robotsUserAgents');
        
        // Clear existing blocks
        container.innerHTML = '';
        
        let config;
        switch (preset) {
            case 'allow-all':
                config = [{
                    agent: '*',
                    rules: [{ type: 'Allow', path: '/' }],
                    crawlDelay: ''
                }];
                break;
            case 'block-all':
                config = [{
                    agent: '*',
                    rules: [{ type: 'Disallow', path: '/' }],
                    crawlDelay: ''
                }];
                break;
            case 'standard':
                config = [{
                    agent: '*',
                    rules: [
                        { type: 'Allow', path: '/' },
                        { type: 'Disallow', path: '/admin/' },
                        { type: 'Disallow', path: '/api/' },
                        { type: 'Disallow', path: '/private/' }
                    ],
                    crawlDelay: ''
                }];
                break;
            case 'wordpress':
                config = [{
                    agent: '*',
                    rules: [
                        { type: 'Allow', path: '/' },
                        { type: 'Disallow', path: '/wp-admin/' },
                        { type: 'Allow', path: '/wp-admin/admin-ajax.php' },
                        { type: 'Disallow', path: '/wp-includes/' },
                        { type: 'Disallow', path: '/trackback/' },
                        { type: 'Disallow', path: '/xmlrpc.php' }
                    ],
                    crawlDelay: ''
                }];
                break;
        }

        // Create blocks from config
        config.forEach((blockConfig, index) => {
            const block = document.createElement('div');
            block.className = 'user-agent-group';
            block.dataset.agentIndex = index;
            
            const rulesHtml = blockConfig.rules.map(rule => `
                <div class="rule-row">
                    <select class="rule-type">
                        <option value="Allow" ${rule.type === 'Allow' ? 'selected' : ''}>Allow</option>
                        <option value="Disallow" ${rule.type === 'Disallow' ? 'selected' : ''}>Disallow</option>
                    </select>
                    <input type="text" class="rule-path" placeholder="/" value="${rule.path}">
                    <button type="button" class="btn btn-icon btn-remove-rule" title="Remove rule">×</button>
                </div>
            `).join('');

            block.innerHTML = `
                <div class="form-group">
                    <label>User-agent</label>
                    <select class="agent-select">
                        <option value="*" ${blockConfig.agent === '*' ? 'selected' : ''}>* (All bots)</option>
                        <option value="Googlebot" ${blockConfig.agent === 'Googlebot' ? 'selected' : ''}>Googlebot</option>
                        <option value="Bingbot" ${blockConfig.agent === 'Bingbot' ? 'selected' : ''}>Bingbot</option>
                        <option value="GPTBot" ${blockConfig.agent === 'GPTBot' ? 'selected' : ''}>GPTBot (OpenAI)</option>
                        <option value="ChatGPT-User" ${blockConfig.agent === 'ChatGPT-User' ? 'selected' : ''}>ChatGPT-User</option>
                        <option value="Claude-Web" ${blockConfig.agent === 'Claude-Web' ? 'selected' : ''}>Claude-Web</option>
                        <option value="Applebot" ${blockConfig.agent === 'Applebot' ? 'selected' : ''}>Applebot</option>
                        <option value="DuckDuckBot" ${blockConfig.agent === 'DuckDuckBot' ? 'selected' : ''}>DuckDuckBot</option>
                        <option value="Slurp" ${blockConfig.agent === 'Slurp' ? 'selected' : ''}>Slurp (Yahoo)</option>
                        <option value="facebookexternalhit" ${blockConfig.agent === 'facebookexternalhit' ? 'selected' : ''}>Facebook</option>
                        <option value="Twitterbot" ${blockConfig.agent === 'Twitterbot' ? 'selected' : ''}>Twitterbot</option>
                        <option value="custom">Custom...</option>
                    </select>
                    <input type="text" class="agent-custom" placeholder="Custom user-agent" style="display: none; margin-top: 0.5rem;">
                </div>
                <div class="rules-container">
                    <div class="form-group">
                        <label>Rules</label>
                        <div class="rules-list">
                            ${rulesHtml}
                        </div>
                        <button type="button" class="btn btn-sm btn-add-rule">+ Add Rule</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        Crawl-delay <span class="optional">(seconds, optional)</span>
                    </label>
                    <input type="number" class="crawl-delay" placeholder="e.g., 10" min="0" max="60" value="${blockConfig.crawlDelay}">
                </div>
                <button type="button" class="btn btn-sm btn-danger btn-remove-agent" style="display: none;">Remove User-agent</button>
            `;
            
            container.appendChild(block);
            initUserAgentBlock(block);
        });

        updateRemoveAgentButtons();
    }

    function generateRobots() {
        const le = getLineEnding();
        const verbosity = document.getElementById('commentVerbosity').value;
        const lines = [];
        const validationResults = [];

        const comment = (text) => {
            if (verbosity === 'minimal') return null;
            return `# ${text}`;
        };

        // Header comment
        if (verbosity === 'teach') {
            lines.push('# robots.txt - Controls how search engines crawl your site');
            lines.push('# Place this file at the root of your domain: https://example.com/robots.txt');
            lines.push('');
        }

        // User-agent blocks
        const blocks = document.querySelectorAll('.user-agent-group');
        let hasAllowAll = false;
        let hasDisallowAll = false;

        blocks.forEach((block, index) => {
            const agentSelect = block.querySelector('.agent-select');
            const agentCustom = block.querySelector('.agent-custom');
            const agent = agentSelect.value === 'custom' ? agentCustom.value : agentSelect.value;
            
            if (!agent) return;

            if (index > 0) lines.push('');
            
            lines.push(`User-agent: ${agent}`);

            // Rules
            const rules = block.querySelectorAll('.rule-row');
            rules.forEach(rule => {
                const type = rule.querySelector('.rule-type').value;
                const path = rule.querySelector('.rule-path').value || '/';
                lines.push(`${type}: ${path}`);

                if (agent === '*' && type === 'Allow' && path === '/') hasAllowAll = true;
                if (agent === '*' && type === 'Disallow' && path === '/') hasDisallowAll = true;
            });

            // Crawl-delay
            const crawlDelay = block.querySelector('.crawl-delay').value;
            if (crawlDelay) {
                lines.push(`Crawl-delay: ${crawlDelay}`);
            }
        });

        // Sitemap
        const sitemapUrl = document.getElementById('robotsSitemap').value;
        const multipleSitemaps = document.getElementById('robotsMultipleSitemaps').checked;
        const additionalSitemaps = document.getElementById('robotsAdditionalSitemaps').value;

        if (sitemapUrl || additionalSitemaps) {
            lines.push('');
            if (verbosity !== 'minimal') {
                lines.push(comment('Sitemap'));
            }
            if (sitemapUrl) {
                lines.push(`Sitemap: ${sitemapUrl}`);
            }
            if (multipleSitemaps && additionalSitemaps) {
                additionalSitemaps.split('\n').filter(s => s.trim()).forEach(url => {
                    lines.push(`Sitemap: ${url.trim()}`);
                });
            }
        }

        // Host directive
        const host = document.getElementById('robotsHost').value;
        if (host) {
            lines.push('');
            if (verbosity !== 'minimal') {
                lines.push(comment('Host (Yandex)'));
            }
            lines.push(`Host: ${host}`);
        }

        // Generate output
        const output = lines.filter(l => l !== null).join(le);
        document.getElementById('robotsOutput').innerHTML = `<pre>${escapeHtml(output)}</pre>`;

        // Validation
        validationResults.push({
            status: 'pass',
            message: 'Valid robots.txt syntax'
        });

        if (hasDisallowAll) {
            validationResults.push({
                status: 'warn',
                message: 'Blocking all crawlers - site won\'t be indexed'
            });
        } else if (hasAllowAll) {
            validationResults.push({
                status: 'pass',
                message: 'Allowing all crawlers'
            });
        }

        if (sitemapUrl) {
            validationResults.push({
                status: 'pass',
                message: 'Sitemap URL included'
            });
        } else {
            validationResults.push({
                status: 'warn',
                message: 'No sitemap URL - consider adding one'
            });
        }

        // Update validation display
        const validationContainer = document.getElementById('robotsValidation');
        validationContainer.innerHTML = validationResults.map(r => `
            <div class="validation-item ${r.status}">
                <span class="validation-icon"></span>
                <span>${r.message}</span>
            </div>
        `).join('');
    }

    // =========================================================================
    // Sitemap Module
    // =========================================================================

    function initSitemap() {
        // Quick add buttons
        document.querySelectorAll('[data-sitemap-quick]').forEach(btn => {
            btn.addEventListener('click', () => {
                addSitemapUrl(btn.dataset.sitemapQuick);
            });
        });

        // Add URL button
        document.getElementById('addSitemapUrlBtn').addEventListener('click', () => addSitemapUrl(''));

        // Bulk import
        document.getElementById('importSitemapUrlsBtn').addEventListener('click', importBulkUrls);

        // Generate button
        document.getElementById('generateSitemapBtn').addEventListener('click', generateSitemap);

        // Copy button
        document.getElementById('copySitemapBtn').addEventListener('click', function() {
            const output = document.getElementById('sitemapOutput').querySelector('pre').textContent;
            copyToClipboard(output, this);
        });

        // Initialize first URL row
        initSitemapUrlRow(document.querySelector('.sitemap-url-row'));
        updateSitemapStats();
    }

    function initSitemapUrlRow(row) {
        // Toggle options
        const toggleBtn = row.querySelector('.btn-toggle-options');
        const options = row.querySelector('.url-options');
        
        toggleBtn.addEventListener('click', () => {
            const isVisible = options.style.display !== 'none';
            options.style.display = isVisible ? 'none' : 'block';
            toggleBtn.textContent = isVisible ? '⚙' : '▼';
        });

        // Remove button
        const removeBtn = row.querySelector('.btn-remove-url');
        removeBtn.addEventListener('click', () => {
            const container = document.getElementById('sitemapUrls');
            if (container.querySelectorAll('.sitemap-url-row').length > 1) {
                row.remove();
                updateSitemapStats();
            }
        });
    }

    function addSitemapUrl(path, priority = '', changefreq = '', lastmod = '') {
        const container = document.getElementById('sitemapUrls');
        
        // Check if path already exists
        const existingPaths = Array.from(container.querySelectorAll('.url-path')).map(el => el.value);
        if (path && existingPaths.includes(path)) {
            return; // Don't add duplicates
        }

        const index = container.querySelectorAll('.sitemap-url-row').length;
        const row = document.createElement('div');
        row.className = 'sitemap-url-row';
        row.dataset.urlIndex = index;
        
        row.innerHTML = `
            <div class="url-main">
                <input type="text" class="url-path" placeholder="/page-path" value="${escapeHtml(path)}">
                <button type="button" class="btn btn-icon btn-toggle-options" title="Options">⚙</button>
                <button type="button" class="btn btn-icon btn-remove-url" title="Remove">×</button>
            </div>
            <div class="url-options" style="display: none;">
                <div class="url-options-grid">
                    <label>
                        <span>Priority</span>
                        <select class="url-priority">
                            <option value="" ${priority === '' ? 'selected' : ''}>Default</option>
                            <option value="1.0" ${priority === '1.0' ? 'selected' : ''}>1.0 (Highest)</option>
                            <option value="0.9" ${priority === '0.9' ? 'selected' : ''}>0.9</option>
                            <option value="0.8" ${priority === '0.8' ? 'selected' : ''}>0.8</option>
                            <option value="0.7" ${priority === '0.7' ? 'selected' : ''}>0.7</option>
                            <option value="0.6" ${priority === '0.6' ? 'selected' : ''}>0.6</option>
                            <option value="0.5" ${priority === '0.5' ? 'selected' : ''}>0.5</option>
                            <option value="0.4" ${priority === '0.4' ? 'selected' : ''}>0.4</option>
                            <option value="0.3" ${priority === '0.3' ? 'selected' : ''}>0.3</option>
                            <option value="0.2" ${priority === '0.2' ? 'selected' : ''}>0.2</option>
                            <option value="0.1" ${priority === '0.1' ? 'selected' : ''}>0.1</option>
                            <option value="0.0" ${priority === '0.0' ? 'selected' : ''}>0.0</option>
                        </select>
                    </label>
                    <label>
                        <span>Frequency</span>
                        <select class="url-changefreq">
                            <option value="" ${changefreq === '' ? 'selected' : ''}>Default</option>
                            <option value="always" ${changefreq === 'always' ? 'selected' : ''}>always</option>
                            <option value="hourly" ${changefreq === 'hourly' ? 'selected' : ''}>hourly</option>
                            <option value="daily" ${changefreq === 'daily' ? 'selected' : ''}>daily</option>
                            <option value="weekly" ${changefreq === 'weekly' ? 'selected' : ''}>weekly</option>
                            <option value="monthly" ${changefreq === 'monthly' ? 'selected' : ''}>monthly</option>
                            <option value="yearly" ${changefreq === 'yearly' ? 'selected' : ''}>yearly</option>
                            <option value="never" ${changefreq === 'never' ? 'selected' : ''}>never</option>
                        </select>
                    </label>
                    <label>
                        <span>Last Modified</span>
                        <input type="date" class="url-lastmod" value="${lastmod}">
                    </label>
                </div>
            </div>
        `;
        
        container.appendChild(row);
        initSitemapUrlRow(row);
        updateSitemapStats();
    }

    function importBulkUrls() {
        const textarea = document.getElementById('sitemapBulkUrls');
        const urls = textarea.value.split('\n').map(u => u.trim()).filter(u => u);
        
        urls.forEach(url => {
            // Normalize path
            let path = url;
            if (!path.startsWith('/') && !path.startsWith('http')) {
                path = '/' + path;
            }
            addSitemapUrl(path);
        });

        textarea.value = '';
        updateSitemapStats();
    }

    function updateSitemapStats() {
        const count = document.querySelectorAll('.sitemap-url-row').length;
        document.getElementById('sitemapUrlCount').textContent = count;
    }

    function generateSitemap() {
        const le = getLineEnding();
        const verbosity = document.getElementById('commentVerbosity').value;
        
        const baseUrl = document.getElementById('sitemapBaseUrl').value.replace(/\/$/, '');
        const defaultFreq = document.getElementById('sitemapDefaultFreq').value;
        const defaultPriority = document.getElementById('sitemapDefaultPriority').value;
        
        const lines = [];
        
        // XML declaration
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        
        if (verbosity === 'teach') {
            lines.push('<!-- Sitemap protocol: https://www.sitemaps.org/protocol.html -->');
            lines.push('<!-- Submit this file to Google Search Console for faster indexing -->');
        }
        
        lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
        
        // URLs
        const urlRows = document.querySelectorAll('.sitemap-url-row');
        urlRows.forEach(row => {
            const path = row.querySelector('.url-path').value;
            if (!path) return;
            
            const priority = row.querySelector('.url-priority').value || defaultPriority;
            const changefreq = row.querySelector('.url-changefreq').value || defaultFreq;
            const lastmod = row.querySelector('.url-lastmod').value;
            
            // Build full URL
            let fullUrl;
            if (path.startsWith('http')) {
                fullUrl = path;
            } else {
                fullUrl = baseUrl + (path.startsWith('/') ? path : '/' + path);
            }
            
            lines.push('  <url>');
            lines.push(`    <loc>${escapeHtml(fullUrl)}</loc>`);
            
            if (lastmod) {
                lines.push(`    <lastmod>${lastmod}</lastmod>`);
            }
            
            if (changefreq) {
                lines.push(`    <changefreq>${changefreq}</changefreq>`);
            }
            
            if (priority) {
                lines.push(`    <priority>${priority}</priority>`);
            }
            
            lines.push('  </url>');
        });
        
        lines.push('</urlset>');
        
        const output = lines.join(le);
        document.getElementById('sitemapOutput').innerHTML = `<pre>${escapeHtml(output)}</pre>`;
        
        updateSitemapStats();
    }

    // =========================================================================
    // humans.txt Module
    // =========================================================================

    function initHumans() {
        // Add team member
        document.getElementById('addTeamMemberBtn').addEventListener('click', addTeamMember);

        // Initialize first team member row
        initTeamMemberRow(document.querySelector('.team-member-row'));
        
        // Tech quick add buttons
        document.querySelectorAll('[data-tech]').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                updateTechTextarea();
            });
        });

        // Software quick add buttons
        document.querySelectorAll('[data-software]').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                updateSoftwareTextarea();
            });
        });

        // Set default date to today
        document.getElementById('humansLastUpdate').value = new Date().toISOString().split('T')[0];

        // Generate button
        document.getElementById('generateHumansBtn').addEventListener('click', generateHumans);

        // Copy button
        document.getElementById('copyHumansBtn').addEventListener('click', function() {
            const output = document.getElementById('humansOutput').querySelector('pre').textContent;
            copyToClipboard(output, this);
        });
    }

    function initTeamMemberRow(row) {
        const removeBtn = row.querySelector('.btn-remove-member');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                row.remove();
                updateRemoveMemberButtons();
            });
        }
    }

    function addTeamMember() {
        const container = document.getElementById('humanTeamMembers');
        const index = container.querySelectorAll('.team-member-row').length;
        
        const row = document.createElement('div');
        row.className = 'team-member-row';
        row.dataset.memberIndex = index;
        
        row.innerHTML = `
            <div class="form-group">
                <label>Name</label>
                <input type="text" class="member-name" placeholder="Team Member">
            </div>
            <div class="form-group">
                <label>Role</label>
                <input type="text" class="member-role" placeholder="Role">
            </div>
            <div class="form-group">
                <label>Contact/Social <span class="optional">(optional)</span></label>
                <input type="text" class="member-contact" placeholder="@handle or email">
            </div>
            <div class="form-group">
                <label>Location <span class="optional">(optional)</span></label>
                <input type="text" class="member-location" placeholder="City, State">
            </div>
            <button type="button" class="btn btn-sm btn-danger btn-remove-member">Remove</button>
        `;
        
        container.appendChild(row);
        initTeamMemberRow(row);
        updateRemoveMemberButtons();
    }

    function updateRemoveMemberButtons() {
        const rows = document.querySelectorAll('.team-member-row');
        rows.forEach(row => {
            const removeBtn = row.querySelector('.btn-remove-member');
            if (removeBtn) {
                removeBtn.style.display = rows.length > 1 ? 'block' : 'none';
            }
        });
    }

    function updateTechTextarea() {
        const active = Array.from(document.querySelectorAll('[data-tech].active')).map(btn => btn.dataset.tech);
        const textarea = document.getElementById('humansTech');
        const existing = textarea.value.split(/[,\n]/).map(s => s.trim()).filter(s => s);
        
        // Add new ones that aren't already there
        active.forEach(tech => {
            if (!existing.includes(tech)) {
                existing.push(tech);
            }
        });
        
        textarea.value = existing.join(', ');
    }

    function updateSoftwareTextarea() {
        const active = Array.from(document.querySelectorAll('[data-software].active')).map(btn => btn.dataset.software);
        const textarea = document.getElementById('humansSoftware');
        const existing = textarea.value.split(/[,\n]/).map(s => s.trim()).filter(s => s);
        
        active.forEach(software => {
            if (!existing.includes(software)) {
                existing.push(software);
            }
        });
        
        textarea.value = existing.join(', ');
    }

    function generateHumans() {
        const le = getLineEnding();
        const lines = [];
        
        // Header
        lines.push('/* TEAM */');
        lines.push('');
        
        // Team members
        const members = document.querySelectorAll('.team-member-row');
        members.forEach(member => {
            const name = member.querySelector('.member-name').value;
            const role = member.querySelector('.member-role').value;
            const contact = member.querySelector('.member-contact').value;
            const location = member.querySelector('.member-location').value;
            
            if (name || role) {
                if (name) lines.push(`Name: ${name}`);
                if (role) lines.push(`Role: ${role}`);
                if (contact) lines.push(`Contact: ${contact}`);
                if (location) lines.push(`Location: ${location}`);
                lines.push('');
            }
        });
        
        // Thanks
        const thanks = document.getElementById('humansThanks').value.trim();
        if (thanks) {
            lines.push('/* THANKS */');
            lines.push('');
            const thanksList = thanks.split(/[,\n]/).map(s => s.trim()).filter(s => s);
            thanksList.forEach(t => lines.push(t));
            lines.push('');
        }
        
        // Site info
        const lastUpdate = document.getElementById('humansLastUpdate').value;
        const language = document.getElementById('humansLanguage').value;
        const doctype = document.getElementById('humansDoctype').value;
        
        if (lastUpdate || language || doctype) {
            lines.push('/* SITE */');
            lines.push('');
            if (lastUpdate) lines.push(`Last update: ${lastUpdate}`);
            if (language) lines.push(`Language: ${language}`);
            if (doctype) lines.push(`Doctype: ${doctype}`);
            lines.push('');
        }
        
        // Technology
        const tech = document.getElementById('humansTech').value.trim();
        if (tech) {
            lines.push('/* TECHNOLOGY */');
            lines.push('');
            const techList = tech.split(/[,\n]/).map(s => s.trim()).filter(s => s);
            techList.forEach(t => lines.push(t));
            lines.push('');
        }
        
        // Software
        const software = document.getElementById('humansSoftware').value.trim();
        if (software) {
            lines.push('/* SOFTWARE */');
            lines.push('');
            const softwareList = software.split(/[,\n]/).map(s => s.trim()).filter(s => s);
            softwareList.forEach(s => lines.push(s));
            lines.push('');
        }
        
        // Fun additions
        const funFact = document.getElementById('humansFunFact').value.trim();
        const easterEgg = document.getElementById('humansEasterEgg').value.trim();
        const hiring = document.getElementById('humansHiring').value.trim();
        
        if (funFact || easterEgg || hiring) {
            lines.push('/* FUN */');
            lines.push('');
            if (funFact) lines.push(`Fun fact: ${funFact}`);
            if (easterEgg) lines.push(`Easter egg: ${easterEgg}`);
            if (hiring) lines.push(`We're hiring: ${hiring}`);
            lines.push('');
        }
        
        const output = lines.join(le);
        document.getElementById('humansOutput').innerHTML = `<pre>${escapeHtml(output)}</pre>`;
    }

    // =========================================================================
    // .htaccess Module
    // =========================================================================

    function initHtaccess() {
        // Toggle cache options visibility
        document.getElementById('htaccessCaching').addEventListener('change', (e) => {
            document.getElementById('cacheOptions').style.display = e.target.checked ? 'block' : 'none';
        });

        // Toggle hotlink domain field
        document.getElementById('htaccessBlockHotlinking').addEventListener('change', (e) => {
            document.getElementById('hotlinkDomainGroup').style.display = e.target.checked ? 'block' : 'none';
        });

        // Mutual exclusivity for www redirects
        document.getElementById('htaccessWwwRedirect').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.getElementById('htaccessNonWwwRedirect').checked = false;
            }
        });
        document.getElementById('htaccessNonWwwRedirect').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.getElementById('htaccessWwwRedirect').checked = false;
            }
        });

        // Mutual exclusivity for compression
        document.getElementById('htaccessGzip').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.getElementById('htaccessDeflate').checked = false;
            }
        });
        document.getElementById('htaccessDeflate').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.getElementById('htaccessGzip').checked = false;
            }
        });

        // Add redirect button
        document.getElementById('addRedirectBtn').addEventListener('click', addRedirectRow);

        // Initialize existing redirect rows
        document.querySelectorAll('.redirect-row').forEach(initRedirectRow);

        // Generate button
        document.getElementById('generateHtaccessBtn').addEventListener('click', generateHtaccess);

        // Copy button
        document.getElementById('copyHtaccessBtn').addEventListener('click', function() {
            const output = document.getElementById('htaccessOutput').querySelector('pre').textContent;
            copyToClipboard(output, this);
        });
    }

    function initRedirectRow(row) {
        const removeBtn = row.querySelector('.btn-remove-redirect');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                const container = document.getElementById('htaccessCustomRedirects');
                if (container.querySelectorAll('.redirect-row').length > 1) {
                    row.remove();
                } else {
                    // Clear the fields instead of removing
                    row.querySelector('.redirect-from').value = '';
                    row.querySelector('.redirect-to').value = '';
                }
            });
        }
    }

    function addRedirectRow() {
        const container = document.getElementById('htaccessCustomRedirects');
        const row = document.createElement('div');
        row.className = 'redirect-row';
        row.innerHTML = `
            <select class="redirect-type">
                <option value="301">301 (Permanent)</option>
                <option value="302">302 (Temporary)</option>
            </select>
            <input type="text" class="redirect-from" placeholder="/old-page">
            <span class="redirect-arrow">→</span>
            <input type="text" class="redirect-to" placeholder="/new-page">
            <button type="button" class="btn btn-icon btn-remove-redirect" title="Remove">×</button>
        `;
        container.appendChild(row);
        initRedirectRow(row);
    }

    function generateHtaccess() {
        const le = getLineEnding();
        const verbosity = document.getElementById('commentVerbosity').value;
        const lines = [];

        const comment = (text) => {
            if (verbosity === 'minimal') return null;
            return `# ${text}`;
        };

        const section = (title) => {
            if (verbosity === 'minimal') return [];
            if (verbosity === 'teach') {
                return ['', `# ${'='.repeat(50)}`, `# ${title}`, `# ${'='.repeat(50)}`];
            }
            return ['', `# ${title}`];
        };

        // Header
        if (verbosity !== 'minimal') {
            lines.push('# .htaccess generated by Website Launch Kit');
            lines.push('# https://mattlivingston.com/tools/launch-kit/');
        }

        // Redirects
        const httpsRedirect = document.getElementById('htaccessHttpsRedirect').checked;
        const wwwRedirect = document.getElementById('htaccessWwwRedirect').checked;
        const nonWwwRedirect = document.getElementById('htaccessNonWwwRedirect').checked;
        const trailingSlash = document.getElementById('htaccessTrailingSlash').checked;

        if (httpsRedirect || wwwRedirect || nonWwwRedirect || trailingSlash) {
            lines.push(...section('Redirects'));
            lines.push('<IfModule mod_rewrite.c>');
            lines.push('    RewriteEngine On');
            
            if (httpsRedirect) {
                if (verbosity === 'teach') {
                    lines.push('    # Force HTTPS - redirects all HTTP traffic to HTTPS');
                }
                lines.push('    RewriteCond %{HTTPS} off');
                lines.push('    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]');
            }

            if (wwwRedirect) {
                if (verbosity === 'teach') {
                    lines.push('    # Remove www prefix');
                }
                lines.push('    RewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]');
                lines.push('    RewriteRule ^(.*)$ https://%1/$1 [R=301,L]');
            }

            if (nonWwwRedirect) {
                if (verbosity === 'teach') {
                    lines.push('    # Add www prefix');
                }
                lines.push('    RewriteCond %{HTTP_HOST} !^www\\. [NC]');
                lines.push('    RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [R=301,L]');
            }

            if (trailingSlash) {
                if (verbosity === 'teach') {
                    lines.push('    # Remove trailing slashes');
                }
                lines.push('    RewriteCond %{REQUEST_FILENAME} !-d');
                lines.push('    RewriteCond %{REQUEST_URI} (.+)/$');
                lines.push('    RewriteRule ^ %1 [R=301,L]');
            }

            lines.push('</IfModule>');
        }

        // Custom redirects
        const redirectRows = document.querySelectorAll('.redirect-row');
        const customRedirects = [];
        redirectRows.forEach(row => {
            const from = row.querySelector('.redirect-from').value.trim();
            const to = row.querySelector('.redirect-to').value.trim();
            const type = row.querySelector('.redirect-type').value;
            if (from && to) {
                customRedirects.push({ from, to, type });
            }
        });

        if (customRedirects.length > 0) {
            lines.push(...section('Custom Redirects'));
            customRedirects.forEach(r => {
                lines.push(`Redirect ${r.type} ${r.from} ${r.to}`);
            });
        }

        // Caching
        if (document.getElementById('htaccessCaching').checked) {
            const cacheImages = document.getElementById('htaccessCacheImages').value;
            const cacheCSS = document.getElementById('htaccessCacheCSS').value;
            const cacheFonts = document.getElementById('htaccessCacheFonts').value;

            lines.push(...section('Browser Caching'));
            lines.push('<IfModule mod_expires.c>');
            lines.push('    ExpiresActive On');
            
            if (verbosity === 'teach') {
                lines.push('    # Images');
            }
            lines.push(`    ExpiresByType image/jpeg "access plus ${cacheImages}"`);
            lines.push(`    ExpiresByType image/png "access plus ${cacheImages}"`);
            lines.push(`    ExpiresByType image/gif "access plus ${cacheImages}"`);
            lines.push(`    ExpiresByType image/webp "access plus ${cacheImages}"`);
            lines.push(`    ExpiresByType image/svg+xml "access plus ${cacheImages}"`);
            lines.push(`    ExpiresByType image/x-icon "access plus ${cacheImages}"`);
            
            if (verbosity === 'teach') {
                lines.push('    # CSS & JavaScript');
            }
            lines.push(`    ExpiresByType text/css "access plus ${cacheCSS}"`);
            lines.push(`    ExpiresByType application/javascript "access plus ${cacheCSS}"`);
            lines.push(`    ExpiresByType text/javascript "access plus ${cacheCSS}"`);
            
            if (verbosity === 'teach') {
                lines.push('    # Fonts');
            }
            lines.push(`    ExpiresByType font/woff "access plus ${cacheFonts}"`);
            lines.push(`    ExpiresByType font/woff2 "access plus ${cacheFonts}"`);
            lines.push(`    ExpiresByType application/font-woff "access plus ${cacheFonts}"`);
            lines.push(`    ExpiresByType application/font-woff2 "access plus ${cacheFonts}"`);
            lines.push(`    ExpiresByType font/ttf "access plus ${cacheFonts}"`);
            lines.push(`    ExpiresByType font/otf "access plus ${cacheFonts}"`);
            
            lines.push('</IfModule>');
        }

        // Compression
        if (document.getElementById('htaccessGzip').checked) {
            lines.push(...section('Gzip Compression'));
            lines.push('<IfModule mod_gzip.c>');
            lines.push('    mod_gzip_on Yes');
            lines.push('    mod_gzip_dechunk Yes');
            lines.push('    mod_gzip_item_include file \\.(html?|txt|css|js|php|pl)$');
            lines.push('    mod_gzip_item_include handler ^cgi-script$');
            lines.push('    mod_gzip_item_include mime ^text/.*');
            lines.push('    mod_gzip_item_include mime ^application/x-javascript.*');
            lines.push('    mod_gzip_item_exclude mime ^image/.*');
            lines.push('    mod_gzip_item_exclude rspheader ^Content-Encoding:.*gzip.*');
            lines.push('</IfModule>');
        }

        if (document.getElementById('htaccessDeflate').checked) {
            lines.push(...section('Deflate Compression'));
            lines.push('<IfModule mod_deflate.c>');
            lines.push('    AddOutputFilterByType DEFLATE text/html');
            lines.push('    AddOutputFilterByType DEFLATE text/css');
            lines.push('    AddOutputFilterByType DEFLATE text/javascript');
            lines.push('    AddOutputFilterByType DEFLATE text/xml');
            lines.push('    AddOutputFilterByType DEFLATE text/plain');
            lines.push('    AddOutputFilterByType DEFLATE application/javascript');
            lines.push('    AddOutputFilterByType DEFLATE application/x-javascript');
            lines.push('    AddOutputFilterByType DEFLATE application/json');
            lines.push('    AddOutputFilterByType DEFLATE application/xml');
            lines.push('</IfModule>');
        }

        // Error pages
        const error404 = document.getElementById('htaccess404').value.trim();
        const error403 = document.getElementById('htaccess403').value.trim();
        const error500 = document.getElementById('htaccess500').value.trim();

        if (error404 || error403 || error500) {
            lines.push(...section('Custom Error Pages'));
            if (error404) lines.push(`ErrorDocument 404 ${error404}`);
            if (error403) lines.push(`ErrorDocument 403 ${error403}`);
            if (error500) lines.push(`ErrorDocument 500 ${error500}`);
        }

        // Security
        const hideServer = document.getElementById('htaccessHideServerInfo').checked;
        const blockDot = document.getElementById('htaccessBlockDotFiles').checked;
        const disableDir = document.getElementById('htaccessDisableDirectoryListing').checked;
        const blockHotlink = document.getElementById('htaccessBlockHotlinking').checked;

        if (hideServer || blockDot || disableDir || blockHotlink) {
            lines.push(...section('Security'));

            if (hideServer) {
                lines.push('ServerSignature Off');
            }

            if (disableDir) {
                lines.push('Options -Indexes');
            }

            if (blockDot) {
                if (verbosity === 'teach') {
                    lines.push('# Block access to hidden files and directories');
                }
                lines.push('<IfModule mod_rewrite.c>');
                lines.push('    RewriteEngine On');
                lines.push('    RewriteCond %{SCRIPT_FILENAME} -d [OR]');
                lines.push('    RewriteCond %{SCRIPT_FILENAME} -f');
                lines.push('    RewriteRule "(^|/)\\." - [F]');
                lines.push('</IfModule>');
            }

            if (blockHotlink) {
                const domain = document.getElementById('htaccessHotlinkDomain').value.trim() || 'example.com';
                if (verbosity === 'teach') {
                    lines.push('# Prevent image hotlinking');
                }
                lines.push('<IfModule mod_rewrite.c>');
                lines.push('    RewriteEngine On');
                lines.push(`    RewriteCond %{HTTP_REFERER} !^$`);
                lines.push(`    RewriteCond %{HTTP_REFERER} !^https?://(www\\.)?${domain.replace('.', '\\.')} [NC]`);
                lines.push('    RewriteRule \\.(jpg|jpeg|png|gif|webp|svg)$ - [F,NC]');
                lines.push('</IfModule>');
            }
        }

        // Performance
        const disableEtags = document.getElementById('htaccessEtags').checked;
        const keepAlive = document.getElementById('htaccessKeepAlive').checked;

        if (disableEtags || keepAlive) {
            lines.push(...section('Performance'));

            if (disableEtags) {
                if (verbosity === 'teach') {
                    lines.push('# Disable ETags (can improve caching behavior)');
                }
                lines.push('<IfModule mod_headers.c>');
                lines.push('    Header unset ETag');
                lines.push('</IfModule>');
                lines.push('FileETag None');
            }

            if (keepAlive) {
                if (verbosity === 'teach') {
                    lines.push('# Enable Keep-Alive connections');
                }
                lines.push('<IfModule mod_headers.c>');
                lines.push('    Header set Connection keep-alive');
                lines.push('</IfModule>');
            }
        }

        const output = lines.filter(l => l !== null).join(le);
        document.getElementById('htaccessOutput').innerHTML = `<pre>${escapeHtml(output)}</pre>`;
    }

    // =========================================================================
    // Security Headers Module
    // =========================================================================

    function initSecurity() {
        // Toggle CSP options
        document.getElementById('securityCSP').addEventListener('change', (e) => {
            document.getElementById('cspOptions').style.display = e.target.checked ? 'block' : 'none';
        });

        // Toggle other header options
        document.getElementById('securityXFrame').addEventListener('change', (e) => {
            document.getElementById('xFrameOptions').style.display = e.target.checked ? 'block' : 'none';
        });
        document.getElementById('securityReferrer').addEventListener('change', (e) => {
            document.getElementById('referrerOptions').style.display = e.target.checked ? 'block' : 'none';
        });
        document.getElementById('securityHSTS').addEventListener('change', (e) => {
            document.getElementById('hstsOptions').style.display = e.target.checked ? 'block' : 'none';
        });
        document.getElementById('securityPermissions').addEventListener('change', (e) => {
            document.getElementById('permissionsOptions').style.display = e.target.checked ? 'block' : 'none';
        });

        // Presets
        document.querySelectorAll('[data-security-preset]').forEach(btn => {
            btn.addEventListener('click', () => applySecurityPreset(btn.dataset.securityPreset));
        });

        // Generate button
        document.getElementById('generateSecurityBtn').addEventListener('click', generateSecurity);

        // Copy button
        document.getElementById('copySecurityBtn').addEventListener('click', function() {
            const output = document.getElementById('securityOutput').querySelector('pre').textContent;
            copyToClipboard(output, this);
        });
    }

    function applySecurityPreset(preset) {
        switch (preset) {
            case 'basic':
                document.getElementById('securityCSP').checked = true;
                document.getElementById('cspOptions').style.display = 'block';
                document.getElementById('cspDefaultSrc').value = "'self'";
                document.getElementById('cspScriptSrc').value = "'self' 'unsafe-inline'";
                document.getElementById('cspStyleSrc').value = "'self' 'unsafe-inline'";
                document.getElementById('cspImgSrc').value = "'self' data: https:";
                document.getElementById('cspFontSrc').value = "'self' https://fonts.gstatic.com";
                document.getElementById('cspConnectSrc').value = "'self'";
                document.getElementById('cspFrameSrc').value = "'self'";
                document.getElementById('cspObjectSrc').value = "'none'";
                document.getElementById('cspUpgradeInsecure').checked = false;
                document.getElementById('cspBlockMixed').checked = true;
                document.getElementById('securityXFrame').checked = true;
                document.getElementById('xFrameValue').value = 'SAMEORIGIN';
                document.getElementById('securityXContentType').checked = true;
                document.getElementById('securityReferrer').checked = true;
                document.getElementById('referrerValue').value = 'strict-origin';
                document.getElementById('securityHSTS').checked = true;
                document.getElementById('hstsMaxAge').value = '31536000';
                document.getElementById('hstsSubdomains').checked = false;
                document.getElementById('hstsPreload').checked = false;
                document.getElementById('securityPermissions').checked = false;
                break;

            case 'strict':
                document.getElementById('securityCSP').checked = true;
                document.getElementById('cspOptions').style.display = 'block';
                document.getElementById('cspDefaultSrc').value = "'self'";
                document.getElementById('cspScriptSrc').value = "'self'";
                document.getElementById('cspStyleSrc').value = "'self'";
                document.getElementById('cspImgSrc').value = "'self' data:";
                document.getElementById('cspFontSrc').value = "'self'";
                document.getElementById('cspConnectSrc').value = "'self'";
                document.getElementById('cspFrameSrc').value = "'none'";
                document.getElementById('cspObjectSrc').value = "'none'";
                document.getElementById('cspUpgradeInsecure').checked = true;
                document.getElementById('cspBlockMixed').checked = true;
                document.getElementById('securityXFrame').checked = true;
                document.getElementById('xFrameValue').value = 'DENY';
                document.getElementById('securityXContentType').checked = true;
                document.getElementById('securityReferrer').checked = true;
                document.getElementById('referrerValue').value = 'no-referrer';
                document.getElementById('securityHSTS').checked = true;
                document.getElementById('hstsMaxAge').value = '63072000';
                document.getElementById('hstsSubdomains').checked = true;
                document.getElementById('hstsPreload').checked = true;
                document.getElementById('securityPermissions').checked = true;
                document.getElementById('permissionsOptions').style.display = 'block';
                break;

            case 'api':
                document.getElementById('securityCSP').checked = true;
                document.getElementById('cspOptions').style.display = 'block';
                document.getElementById('cspDefaultSrc').value = "'none'";
                document.getElementById('cspScriptSrc').value = "'none'";
                document.getElementById('cspStyleSrc').value = "'none'";
                document.getElementById('cspImgSrc').value = "'none'";
                document.getElementById('cspFontSrc').value = "'none'";
                document.getElementById('cspConnectSrc').value = "'none'";
                document.getElementById('cspFrameSrc').value = "'none'";
                document.getElementById('cspObjectSrc').value = "'none'";
                document.getElementById('cspUpgradeInsecure').checked = false;
                document.getElementById('cspBlockMixed').checked = false;
                document.getElementById('securityXFrame').checked = true;
                document.getElementById('xFrameValue').value = 'DENY';
                document.getElementById('securityXContentType').checked = true;
                document.getElementById('securityReferrer').checked = true;
                document.getElementById('referrerValue').value = 'no-referrer';
                document.getElementById('securityHSTS').checked = true;
                document.getElementById('hstsMaxAge').value = '31536000';
                document.getElementById('hstsSubdomains').checked = true;
                document.getElementById('hstsPreload').checked = false;
                document.getElementById('securityPermissions').checked = false;
                break;
        }

        // Update visibility
        document.getElementById('xFrameOptions').style.display = document.getElementById('securityXFrame').checked ? 'block' : 'none';
        document.getElementById('referrerOptions').style.display = document.getElementById('securityReferrer').checked ? 'block' : 'none';
        document.getElementById('hstsOptions').style.display = document.getElementById('securityHSTS').checked ? 'block' : 'none';
        document.getElementById('permissionsOptions').style.display = document.getElementById('securityPermissions').checked ? 'block' : 'none';
    }

    function generateSecurity() {
        const le = getLineEnding();
        const verbosity = document.getElementById('commentVerbosity').value;
        const format = document.getElementById('securityOutputFormat').value;
        
        // Gather header values
        const headers = [];

        // CSP
        if (document.getElementById('securityCSP').checked) {
            const cspParts = [];
            const defaultSrc = document.getElementById('cspDefaultSrc').value.trim();
            const scriptSrc = document.getElementById('cspScriptSrc').value.trim();
            const styleSrc = document.getElementById('cspStyleSrc').value.trim();
            const imgSrc = document.getElementById('cspImgSrc').value.trim();
            const fontSrc = document.getElementById('cspFontSrc').value.trim();
            const connectSrc = document.getElementById('cspConnectSrc').value.trim();
            const frameSrc = document.getElementById('cspFrameSrc').value.trim();
            const objectSrc = document.getElementById('cspObjectSrc').value.trim();

            if (defaultSrc) cspParts.push(`default-src ${defaultSrc}`);
            if (scriptSrc) cspParts.push(`script-src ${scriptSrc}`);
            if (styleSrc) cspParts.push(`style-src ${styleSrc}`);
            if (imgSrc) cspParts.push(`img-src ${imgSrc}`);
            if (fontSrc) cspParts.push(`font-src ${fontSrc}`);
            if (connectSrc) cspParts.push(`connect-src ${connectSrc}`);
            if (frameSrc) cspParts.push(`frame-src ${frameSrc}`);
            if (objectSrc) cspParts.push(`object-src ${objectSrc}`);
            if (document.getElementById('cspUpgradeInsecure').checked) cspParts.push('upgrade-insecure-requests');
            if (document.getElementById('cspBlockMixed').checked) cspParts.push('block-all-mixed-content');

            if (cspParts.length > 0) {
                headers.push({
                    name: 'Content-Security-Policy',
                    value: cspParts.join('; '),
                    comment: 'Controls which resources can be loaded'
                });
            }
        }

        // X-Frame-Options
        if (document.getElementById('securityXFrame').checked) {
            headers.push({
                name: 'X-Frame-Options',
                value: document.getElementById('xFrameValue').value,
                comment: 'Prevents clickjacking attacks'
            });
        }

        // X-Content-Type-Options
        if (document.getElementById('securityXContentType').checked) {
            headers.push({
                name: 'X-Content-Type-Options',
                value: 'nosniff',
                comment: 'Prevents MIME type sniffing'
            });
        }

        // Referrer-Policy
        if (document.getElementById('securityReferrer').checked) {
            headers.push({
                name: 'Referrer-Policy',
                value: document.getElementById('referrerValue').value,
                comment: 'Controls referrer information sent with requests'
            });
        }

        // HSTS
        if (document.getElementById('securityHSTS').checked) {
            let hstsValue = `max-age=${document.getElementById('hstsMaxAge').value}`;
            if (document.getElementById('hstsSubdomains').checked) hstsValue += '; includeSubDomains';
            if (document.getElementById('hstsPreload').checked) hstsValue += '; preload';
            headers.push({
                name: 'Strict-Transport-Security',
                value: hstsValue,
                comment: 'Forces HTTPS connections'
            });
        }

        // Permissions-Policy
        if (document.getElementById('securityPermissions').checked) {
            const permissions = [];
            if (document.getElementById('permGeolocation').checked) permissions.push('geolocation=()');
            if (document.getElementById('permMicrophone').checked) permissions.push('microphone=()');
            if (document.getElementById('permCamera').checked) permissions.push('camera=()');
            if (document.getElementById('permPayment').checked) permissions.push('payment=()');
            
            if (permissions.length > 0) {
                headers.push({
                    name: 'Permissions-Policy',
                    value: permissions.join(', '),
                    comment: 'Controls browser features and APIs'
                });
            }
        }

        // Generate output based on format
        let output = '';
        const titles = {
            htaccess: '.htaccess',
            netlify: 'Netlify _headers',
            cloudflare: 'Cloudflare Transform Rules',
            nginx: 'nginx.conf'
        };

        document.getElementById('securityOutputTitle').textContent = titles[format];

        switch (format) {
            case 'htaccess':
                output = generateHtaccessHeaders(headers, le, verbosity);
                break;
            case 'netlify':
                output = generateNetlifyHeaders(headers, le, verbosity);
                break;
            case 'cloudflare':
                output = generateCloudflareHeaders(headers, le, verbosity);
                break;
            case 'nginx':
                output = generateNginxHeaders(headers, le, verbosity);
                break;
        }

        document.getElementById('securityOutput').innerHTML = `<pre>${escapeHtml(output)}</pre>`;
    }

    function generateHtaccessHeaders(headers, le, verbosity) {
        const lines = [];
        
        if (verbosity !== 'minimal') {
            lines.push('# Security Headers');
            lines.push('# Add to your .htaccess file');
        }
        
        lines.push('<IfModule mod_headers.c>');
        
        headers.forEach(h => {
            if (verbosity === 'teach') {
                lines.push(`    # ${h.comment}`);
            }
            lines.push(`    Header always set ${h.name} "${h.value}"`);
        });
        
        lines.push('</IfModule>');
        
        return lines.join(le);
    }

    function generateNetlifyHeaders(headers, le, verbosity) {
        const lines = [];
        
        if (verbosity !== 'minimal') {
            lines.push('# Netlify _headers file');
            lines.push('# Place in your publish directory or repository root');
            lines.push('');
        }
        
        lines.push('/*');
        
        headers.forEach(h => {
            if (verbosity === 'teach') {
                lines.push(`  # ${h.comment}`);
            }
            lines.push(`  ${h.name}: ${h.value}`);
        });
        
        return lines.join(le);
    }

    function generateCloudflareHeaders(headers, le, verbosity) {
        const lines = [];
        
        lines.push('# Cloudflare Transform Rules - Response Headers');
        lines.push('# Go to: Rules > Transform Rules > Modify Response Header');
        lines.push('# Create a new rule with these headers:');
        lines.push('');
        lines.push('# Match: All incoming requests (or specify your path)');
        lines.push('# Then: Set each header below');
        lines.push('');
        
        headers.forEach((h, i) => {
            if (verbosity === 'teach') {
                lines.push(`# ${i + 1}. ${h.comment}`);
            }
            lines.push(`Header name: ${h.name}`);
            lines.push(`Value: ${h.value}`);
            lines.push('');
        });
        
        lines.push('# Note: For complex CSP, consider using Cloudflare Workers');
        
        return lines.join(le);
    }

    function generateNginxHeaders(headers, le, verbosity) {
        const lines = [];
        
        if (verbosity !== 'minimal') {
            lines.push('# nginx Security Headers');
            lines.push('# Add to your server or location block');
            lines.push('');
        }
        
        headers.forEach(h => {
            if (verbosity === 'teach') {
                lines.push(`# ${h.comment}`);
            }
            lines.push(`add_header ${h.name} "${h.value}" always;`);
        });
        
        return lines.join(le);
    }

    // =========================================================================
    // Legal Boilerplate Module
    // =========================================================================

    function initLegal() {
        // Document type selector
        document.querySelectorAll('input[name="legalDocType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Hide all options
                document.querySelectorAll('.legal-options').forEach(el => el.style.display = 'none');
                
                // Show selected options
                const optionsId = e.target.value + 'Options';
                const optionsEl = document.getElementById(optionsId);
                if (optionsEl) optionsEl.style.display = 'block';
                
                // Update output title
                const titles = {
                    privacy: 'Privacy Policy',
                    terms: 'Terms of Service',
                    cookies: 'Cookie Notice',
                    affiliate: 'Affiliate Disclosure'
                };
                document.getElementById('legalOutputTitle').textContent = titles[e.target.value];
            });
        });

        // Generate button
        document.getElementById('generateLegalBtn').addEventListener('click', generateLegal);

        // Copy button
        document.getElementById('copyLegalBtn').addEventListener('click', function() {
            const output = document.getElementById('legalOutput').querySelector('pre').textContent;
            copyToClipboard(output, this);
        });
    }

    function generateLegal() {
        const docType = document.querySelector('input[name="legalDocType"]:checked').value;
        const format = document.getElementById('legalOutputFormat').value;
        
        const siteName = document.getElementById('legalSiteName').value || '[Company Name]';
        const siteUrl = document.getElementById('legalSiteUrl').value || 'https://example.com';
        const contactEmail = document.getElementById('legalContactEmail').value || 'contact@example.com';
        const country = document.getElementById('legalCountry').value;
        
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        let content = '';
        
        switch (docType) {
            case 'privacy':
                content = generatePrivacyPolicy(siteName, siteUrl, contactEmail, country, today, format);
                break;
            case 'terms':
                content = generateTermsOfService(siteName, siteUrl, contactEmail, country, today, format);
                break;
            case 'cookies':
                content = generateCookieNotice(siteName, siteUrl, contactEmail, today, format);
                break;
            case 'affiliate':
                content = generateAffiliateDisclosure(siteName, siteUrl, today, format);
                break;
        }
        
        document.getElementById('legalOutput').innerHTML = `<pre>${escapeHtml(content)}</pre>`;
    }

    function generatePrivacyPolicy(siteName, siteUrl, email, country, date, format) {
        const compliance = document.getElementById('privacyCompliance').value;
        const collectsEmail = document.getElementById('privacyCollectsEmail').checked;
        const collectsName = document.getElementById('privacyCollectsName').checked;
        const collectsAnalytics = document.getElementById('privacyCollectsAnalytics').checked;
        const collectsPayment = document.getElementById('privacyCollectsPayment').checked;
        const collectsLocation = document.getElementById('privacyCollectsLocation').checked;
        const usesGA = document.getElementById('privacyUsesGoogleAnalytics').checked;
        const usesStripe = document.getElementById('privacyUsesStripe').checked;
        const usesMailchimp = document.getElementById('privacyUsesMailchimp').checked;
        const usesSocial = document.getElementById('privacyUsesSocial').checked;

        const h1 = format === 'html' ? '<h1>' : format === 'markdown' ? '# ' : '';
        const h1e = format === 'html' ? '</h1>' : '';
        const h2 = format === 'html' ? '<h2>' : format === 'markdown' ? '## ' : '';
        const h2e = format === 'html' ? '</h2>' : '';
        const p = format === 'html' ? '<p>' : '';
        const pe = format === 'html' ? '</p>' : '';
        const ul = format === 'html' ? '<ul>' : '';
        const ule = format === 'html' ? '</ul>' : '';
        const li = format === 'html' ? '<li>' : format === 'markdown' ? '- ' : '• ';
        const lie = format === 'html' ? '</li>' : '';
        const br = format === 'html' ? '\n' : '\n\n';

        let content = `${h1}Privacy Policy${h1e}${br}`;
        content += `${p}Last updated: ${date}${pe}${br}`;
        content += `${p}${siteName} ("we", "us", or "our") operates ${siteUrl}. This Privacy Policy describes how we collect, use, and share information about you.${pe}${br}`;

        // Information We Collect
        content += `${h2}Information We Collect${h2e}${br}`;
        content += `${p}We may collect the following types of information:${pe}${br}`;
        content += ul + '\n';
        if (collectsName) content += `${li}Name${lie}\n`;
        if (collectsEmail) content += `${li}Email address${lie}\n`;
        if (collectsPayment) content += `${li}Payment information${lie}\n`;
        if (collectsLocation) content += `${li}Location data${lie}\n`;
        if (collectsAnalytics) content += `${li}Usage data and analytics${lie}\n`;
        content += ule + br;

        // How We Use Information
        content += `${h2}How We Use Your Information${h2e}${br}`;
        content += `${p}We use the information we collect to:${pe}${br}`;
        content += ul + '\n';
        content += `${li}Provide and maintain our services${lie}\n`;
        content += `${li}Communicate with you${lie}\n`;
        if (collectsAnalytics) content += `${li}Analyze usage and improve our services${lie}\n`;
        if (collectsPayment) content += `${li}Process payments${lie}\n`;
        content += ule + br;

        // Third Parties
        if (usesGA || usesStripe || usesMailchimp || usesSocial) {
            content += `${h2}Third-Party Services${h2e}${br}`;
            content += `${p}We use the following third-party services:${pe}${br}`;
            content += ul + '\n';
            if (usesGA) content += `${li}Google Analytics - for website analytics${lie}\n`;
            if (usesStripe) content += `${li}Payment processors - to handle transactions${lie}\n`;
            if (usesMailchimp) content += `${li}Email marketing services - to send newsletters${lie}\n`;
            if (usesSocial) content += `${li}Social media platforms - for social features${lie}\n`;
            content += ule + br;
        }

        // GDPR
        if (compliance === 'gdpr') {
            content += `${h2}Your Rights (GDPR)${h2e}${br}`;
            content += `${p}If you are in the European Economic Area, you have the right to:${pe}${br}`;
            content += ul + '\n';
            content += `${li}Access your personal data${lie}\n`;
            content += `${li}Correct inaccurate data${lie}\n`;
            content += `${li}Request deletion of your data${lie}\n`;
            content += `${li}Object to processing${lie}\n`;
            content += `${li}Data portability${lie}\n`;
            content += `${li}Withdraw consent${lie}\n`;
            content += ule + br;
        }

        // CCPA
        if (compliance === 'ccpa') {
            content += `${h2}California Privacy Rights (CCPA)${h2e}${br}`;
            content += `${p}California residents have the right to:${pe}${br}`;
            content += ul + '\n';
            content += `${li}Know what personal information is collected${lie}\n`;
            content += `${li}Know if personal information is sold or disclosed${lie}\n`;
            content += `${li}Opt out of the sale of personal information${lie}\n`;
            content += `${li}Request deletion of personal information${lie}\n`;
            content += `${li}Non-discrimination for exercising privacy rights${lie}\n`;
            content += ule + br;
        }

        // Contact
        content += `${h2}Contact Us${h2e}${br}`;
        content += `${p}If you have questions about this Privacy Policy, please contact us at ${email}.${pe}${br}`;

        return content;
    }

    function generateTermsOfService(siteName, siteUrl, email, country, date, format) {
        const siteType = document.getElementById('termsSiteType').value;
        const hasUserContent = document.getElementById('termsUserContent').checked;
        const hasAccounts = document.getElementById('termsAccounts').checked;
        const hasPayments = document.getElementById('termsPayments').checked;
        const hasTermination = document.getElementById('termsTermination').checked;

        const h1 = format === 'html' ? '<h1>' : format === 'markdown' ? '# ' : '';
        const h1e = format === 'html' ? '</h1>' : '';
        const h2 = format === 'html' ? '<h2>' : format === 'markdown' ? '## ' : '';
        const h2e = format === 'html' ? '</h2>' : '';
        const p = format === 'html' ? '<p>' : '';
        const pe = format === 'html' ? '</p>' : '';
        const br = format === 'html' ? '\n' : '\n\n';

        let content = `${h1}Terms of Service${h1e}${br}`;
        content += `${p}Last updated: ${date}${pe}${br}`;
        content += `${p}Please read these Terms of Service ("Terms") carefully before using ${siteUrl} operated by ${siteName}.${pe}${br}`;

        // Acceptance
        content += `${h2}Acceptance of Terms${h2e}${br}`;
        content += `${p}By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.${pe}${br}`;

        // Use License
        content += `${h2}Use License${h2e}${br}`;
        content += `${p}Permission is granted to temporarily access the materials on ${siteName}'s website for personal, non-commercial use only.${pe}${br}`;

        // User Accounts
        if (hasAccounts) {
            content += `${h2}User Accounts${h2e}${br}`;
            content += `${p}When you create an account, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password. ${siteName} cannot and will not be liable for any loss or damage from your failure to comply with this obligation.${pe}${br}`;
        }

        // User Content
        if (hasUserContent) {
            content += `${h2}User Content${h2e}${br}`;
            content += `${p}You retain ownership of any content you submit. By posting content, you grant ${siteName} a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content in connection with the service.${pe}${br}`;
            content += `${p}You agree not to post content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable.${pe}${br}`;
        }

        // Payments
        if (hasPayments) {
            content += `${h2}Payments and Billing${h2e}${br}`;
            content += `${p}Certain services may be subject to payments. You agree to pay all fees associated with your account. Fees are non-refundable except as required by law or as explicitly stated otherwise.${pe}${br}`;
        }

        // Disclaimer
        content += `${h2}Disclaimer${h2e}${br}`;
        content += `${p}The materials on ${siteName}'s website are provided on an 'as is' basis. ${siteName} makes no warranties, expressed or implied, and hereby disclaims all warranties including, without limitation, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.${pe}${br}`;

        // Limitations
        content += `${h2}Limitations${h2e}${br}`;
        content += `${p}In no event shall ${siteName} be liable for any damages arising out of the use or inability to use the materials on the website.${pe}${br}`;

        // Termination
        if (hasTermination) {
            content += `${h2}Termination${h2e}${br}`;
            content += `${p}We may terminate or suspend your access immediately, without prior notice, for any reason whatsoever, including without limitation if you breach the Terms.${pe}${br}`;
        }

        // Governing Law
        content += `${h2}Governing Law${h2e}${br}`;
        content += `${p}These Terms shall be governed by and construed in accordance with the laws of ${country === 'US' ? 'the United States' : country === 'UK' ? 'the United Kingdom' : country === 'EU' ? 'the European Union' : country === 'CA' ? 'Canada' : country === 'AU' ? 'Australia' : 'your jurisdiction'}.${pe}${br}`;

        // Contact
        content += `${h2}Contact Us${h2e}${br}`;
        content += `${p}If you have questions about these Terms, please contact us at ${email}.${pe}${br}`;

        return content;
    }

    function generateCookieNotice(siteName, siteUrl, email, date, format) {
        const cookieFormat = document.getElementById('cookieFormat').value;
        const essential = document.getElementById('cookiesEssential').checked;
        const analytics = document.getElementById('cookiesAnalytics').checked;
        const marketing = document.getElementById('cookiesMarketing').checked;
        const preferences = document.getElementById('cookiesPreferences').checked;

        const h1 = format === 'html' ? '<h1>' : format === 'markdown' ? '# ' : '';
        const h1e = format === 'html' ? '</h1>' : '';
        const h2 = format === 'html' ? '<h2>' : format === 'markdown' ? '## ' : '';
        const h2e = format === 'html' ? '</h2>' : '';
        const p = format === 'html' ? '<p>' : '';
        const pe = format === 'html' ? '</p>' : '';
        const br = format === 'html' ? '\n' : '\n\n';

        if (cookieFormat === 'short') {
            return `We use cookies to improve your experience. By continuing to use this site, you consent to our use of cookies. See our Cookie Policy for details.`;
        }

        let content = `${h1}Cookie Policy${h1e}${br}`;
        content += `${p}Last updated: ${date}${pe}${br}`;
        content += `${p}${siteName} uses cookies and similar technologies to provide, protect, and improve our services.${pe}${br}`;

        content += `${h2}What Are Cookies${h2e}${br}`;
        content += `${p}Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and understand how you use the site.${pe}${br}`;

        content += `${h2}Cookies We Use${h2e}${br}`;
        
        if (essential) {
            content += `${p}<strong>Essential Cookies:</strong> Required for the website to function. These cannot be disabled.${pe}${br}`;
        }
        if (analytics) {
            content += `${p}<strong>Analytics Cookies:</strong> Help us understand how visitors use our site so we can improve it.${pe}${br}`;
        }
        if (marketing) {
            content += `${p}<strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track campaign performance.${pe}${br}`;
        }
        if (preferences) {
            content += `${p}<strong>Preference Cookies:</strong> Remember your settings and preferences for a better experience.${pe}${br}`;
        }

        content += `${h2}Managing Cookies${h2e}${br}`;
        content += `${p}You can control cookies through your browser settings. Note that disabling certain cookies may affect website functionality.${pe}${br}`;

        content += `${h2}Contact Us${h2e}${br}`;
        content += `${p}Questions about our cookie policy? Contact us at ${email}.${pe}${br}`;

        return content;
    }

    function generateAffiliateDisclosure(siteName, siteUrl, date, format) {
        const affiliateFormat = document.getElementById('affiliateFormat').value;
        const amazon = document.getElementById('affiliateAmazon').checked;
        const generic = document.getElementById('affiliateGeneric').checked;
        const sponsored = document.getElementById('affiliateSponsored').checked;

        const h1 = format === 'html' ? '<h1>' : format === 'markdown' ? '# ' : '';
        const h1e = format === 'html' ? '</h1>' : '';
        const h2 = format === 'html' ? '<h2>' : format === 'markdown' ? '## ' : '';
        const h2e = format === 'html' ? '</h2>' : '';
        const p = format === 'html' ? '<p>' : '';
        const pe = format === 'html' ? '</p>' : '';
        const br = format === 'html' ? '\n' : '\n\n';

        if (affiliateFormat === 'short') {
            let short = `This post may contain affiliate links. If you make a purchase through these links, we may earn a commission at no extra cost to you.`;
            if (amazon) short += ` As an Amazon Associate, we earn from qualifying purchases.`;
            return short;
        }

        let content = `${h1}Affiliate Disclosure${h1e}${br}`;
        content += `${p}Last updated: ${date}${pe}${br}`;
        content += `${p}${siteName} may earn money or products from the companies mentioned in this post or on this website.${pe}${br}`;

        content += `${h2}FTC Disclosure${h2e}${br}`;
        content += `${p}In accordance with the FTC guidelines, we disclose that we may have a financial relationship with some of the companies mentioned on this website. This means if you click on a link and make a purchase, we may receive a small commission at no extra cost to you.${pe}${br}`;

        if (amazon) {
            content += `${h2}Amazon Associates${h2e}${br}`;
            content += `${p}${siteName} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.${pe}${br}`;
        }

        if (generic) {
            content += `${h2}Other Affiliate Programs${h2e}${br}`;
            content += `${p}We also participate in other affiliate programs and may earn commissions on purchases made through links on this site.${pe}${br}`;
        }

        if (sponsored) {
            content += `${h2}Sponsored Content${h2e}${br}`;
            content += `${p}Some content on this site may be sponsored. All sponsored content will be clearly marked as such.${pe}${br}`;
        }

        content += `${h2}Our Commitment${h2e}${br}`;
        content += `${p}Affiliate relationships do not influence our editorial content. We only recommend products we genuinely believe will provide value to our readers.${pe}${br}`;

        return content;
    }

    // =========================================================================
    // Launch Checklist Module
    // =========================================================================

    function initChecklist() {
        // Load saved state
        loadChecklistState();

        // Add event listeners to all checkboxes
        document.querySelectorAll('.checklist-item input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                saveChecklistState();
                updateChecklistProgress();
            });
        });

        // Reset button
        document.getElementById('resetChecklistBtn').addEventListener('click', () => {
            if (confirm('Reset all checklist items?')) {
                document.querySelectorAll('.checklist-item input').forEach(cb => cb.checked = false);
                saveChecklistState();
                updateChecklistProgress();
            }
        });

        // Initial progress update
        updateChecklistProgress();
    }

    function saveChecklistState() {
        const state = {};
        document.querySelectorAll('.checklist-item input').forEach(checkbox => {
            state[checkbox.id] = checkbox.checked;
        });
        localStorage.setItem('launchKit_checklist', JSON.stringify(state));
    }

    function loadChecklistState() {
        const saved = localStorage.getItem('launchKit_checklist');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                Object.entries(state).forEach(([id, checked]) => {
                    const checkbox = document.getElementById(id);
                    if (checkbox) checkbox.checked = checked;
                });
            } catch (err) {
                console.error('Failed to load checklist state');
            }
        }
    }

    function updateChecklistProgress() {
        const allItems = document.querySelectorAll('.checklist-item input');
        const checkedItems = document.querySelectorAll('.checklist-item input:checked');
        
        const total = allItems.length;
        const completed = checkedItems.length;
        const remaining = total - completed;
        const percentage = Math.round((completed / total) * 100);

        // Update progress ring
        const ring = document.getElementById('progressRing');
        const circumference = 326.73; // 2 * π * 52
        const offset = circumference - (percentage / 100) * circumference;
        ring.style.strokeDashoffset = offset;

        // Change color when complete
        if (percentage === 100) {
            ring.classList.add('complete');
        } else {
            ring.classList.remove('complete');
        }

        // Update numbers
        document.getElementById('progressNumber').textContent = percentage;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('remainingCount').textContent = remaining;

        // Update category counts
        const categories = ['essential', 'seo', 'performance', 'security', 'legal', 'analytics', 'nice'];
        categories.forEach(category => {
            const items = document.querySelectorAll(`.checklist-item[data-category="${category}"] input`);
            const checked = document.querySelectorAll(`.checklist-item[data-category="${category}"] input:checked`);
            const countEl = document.querySelector(`.category-count[data-category="${category}"]`);
            if (countEl) {
                countEl.textContent = `${checked.length}/${items.length}`;
            }
        });

        // Update ship it section
        const shipSection = document.getElementById('shipItSection');
        const shipMessage = document.getElementById('shipItMessage');
        
        if (percentage === 100) {
            shipSection.classList.add('ready');
            shipMessage.querySelector('p').textContent = "You're ready to ship! 🎉";
        } else if (percentage >= 80) {
            shipSection.classList.remove('ready');
            shipMessage.querySelector('p').textContent = "Almost there. Ship when green.";
        } else {
            shipSection.classList.remove('ready');
            shipMessage.querySelector('p').textContent = "Ship when green. Iterate after.";
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
