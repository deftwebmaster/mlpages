const TOOL_URL = 'https://mattlivingston.com/tools/finance/';
const SCENARIO_KEY = 'finance-decision-lab-scenarios';
const CPI_SOURCE_URL = 'https://www.bls.gov/cpi/tables/';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const currencyCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pct = (value, digits = 1) => `${Number(value).toFixed(digits)}%`;
const money = (value) => currency.format(Number.isFinite(value) ? value : 0);
const moneyCents = (value) => currencyCents.format(Number.isFinite(value) ? value : 0);
const num = (id) => Number($(id).value) || 0;
const val = (id) => $(id).value;

let currentResult = null;
let scenarios = loadScenarios();
let customSubscriptions = [];

const cpiData = {
  1913: 9.9, 1914: 10.0, 1915: 10.1, 1916: 10.9, 1917: 12.8, 1918: 15.1, 1919: 17.3, 1920: 20.0,
  1921: 17.9, 1922: 16.8, 1923: 17.1, 1924: 17.1, 1925: 17.5, 1926: 17.7, 1927: 17.4, 1928: 17.1,
  1929: 17.1, 1930: 16.7, 1931: 15.2, 1932: 13.7, 1933: 13.0, 1934: 13.4, 1935: 13.7, 1936: 13.9,
  1937: 14.4, 1938: 14.1, 1939: 13.9, 1940: 14.0, 1941: 14.7, 1942: 16.3, 1943: 17.3, 1944: 17.6,
  1945: 18.0, 1946: 19.5, 1947: 22.3, 1948: 24.1, 1949: 23.8, 1950: 24.1, 1951: 26.0, 1952: 26.5,
  1953: 26.7, 1954: 26.9, 1955: 26.8, 1956: 27.2, 1957: 28.1, 1958: 28.9, 1959: 29.1, 1960: 29.6,
  1961: 29.9, 1962: 30.2, 1963: 30.6, 1964: 31.0, 1965: 31.5, 1966: 32.4, 1967: 33.4, 1968: 34.8,
  1969: 36.7, 1970: 38.8, 1971: 40.5, 1972: 41.8, 1973: 44.4, 1974: 49.3, 1975: 53.8, 1976: 56.9,
  1977: 60.6, 1978: 65.2, 1979: 72.6, 1980: 82.4, 1981: 90.9, 1982: 96.5, 1983: 99.6, 1984: 103.9,
  1985: 107.6, 1986: 109.6, 1987: 113.6, 1988: 118.3, 1989: 124.0, 1990: 130.7, 1991: 136.2, 1992: 140.3,
  1993: 144.5, 1994: 148.2, 1995: 152.4, 1996: 156.9, 1997: 160.5, 1998: 163.0, 1999: 166.6, 2000: 172.2,
  2001: 177.1, 2002: 179.9, 2003: 184.0, 2004: 188.9, 2005: 195.3, 2006: 201.6, 2007: 207.3, 2008: 215.3,
  2009: 214.5, 2010: 218.1, 2011: 224.9, 2012: 229.6, 2013: 233.0, 2014: 236.7, 2015: 237.0, 2016: 240.0,
  2017: 245.1, 2018: 251.1, 2019: 255.7, 2020: 258.8, 2021: 271.0, 2022: 292.7, 2023: 304.7, 2024: 314.2,
};

const starterSubscriptions = [
  ['Netflix', 15.49],
  ['Disney+', 13.99],
  ['Hulu', 17.99],
  ['Max', 16.99],
  ['Prime Video', 8.99],
  ['Apple TV+', 9.99],
  ['Spotify', 11.99],
  ['YouTube Premium', 13.99],
  ['Cloud Storage', 9.99],
  ['Gym / Wellness App', 29.99],
];

document.addEventListener('DOMContentLoaded', () => {
  initializeYears();
  renderSubscriptions();
  renderScenarioVault();
  bindNavigation();
  bindForms();
});

function bindNavigation() {
  $$('[data-open-lab]').forEach((button) => {
    button.addEventListener('click', () => openLab(button.dataset.openLab));
  });

  $$('[data-back]').forEach((button) => button.addEventListener('click', showDashboard));

  $$('[data-scroll]').forEach((button) => {
    button.addEventListener('click', () => $(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' }));
  });

  $('#inflationMode').addEventListener('change', updateInflationMode);
  $('#addSubscriptionBtn').addEventListener('click', addCustomSubscription);
  $('#exportScenariosBtn').addEventListener('click', exportScenarioVault);
  $('#clearScenariosBtn').addEventListener('click', clearScenarioVault);
}

function bindForms() {
  $$('[data-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const type = form.dataset.form;
      const handlers = {
        inflation: calculateInflation,
        subscription: calculateSubscriptions,
        loan: calculateLoan,
        carlease: calculateCarLease,
        rentbuy: calculateRentBuy,
        sidehustle: calculateSideHustle,
      };
      handlers[type]();
    });
  });
}

function openLab(id) {
  $('#dashboard').classList.add('hidden');
  $$('.lab-panel').forEach((panel) => panel.classList.add('hidden'));
  $(`#${id}-lab`).classList.remove('hidden');
  $(`#${id}-lab`).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showDashboard() {
  $('#dashboard').classList.remove('hidden');
  $$('.lab-panel').forEach((panel) => panel.classList.add('hidden'));
  $('#dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initializeYears() {
  const years = Object.keys(cpiData).map(Number).sort((a, b) => b - a);
  ['#inflationFrom', '#inflationTo'].forEach((id) => {
    const select = $(id);
    years.forEach((year) => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      select.appendChild(option);
    });
  });
  $('#inflationFrom').value = '1970';
  $('#inflationTo').value = String(years[0]);
}

function updateInflationMode() {
  const mode = val('#inflationMode');
  $$('[data-mode-fields]').forEach((group) => {
    group.classList.toggle('hidden', group.dataset.modeFields !== mode);
  });
}

function payment(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function loanSchedule(principal, annualRate, months, extra = 0) {
  const basePayment = payment(principal, annualRate, months);
  const monthlyRate = annualRate / 100 / 12;
  let balance = principal;
  let totalInterest = 0;
  const rows = [];

  for (let month = 1; month <= months && balance > 0.005; month++) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(balance, basePayment + extra - interest);
    if (principalPaid <= 0) break;
    balance -= principalPaid;
    totalInterest += interest;

    if (month <= 12 || month % 12 === 0 || balance <= 0.005) {
      rows.push({
        month,
        payment: principalPaid + interest,
        principal: principalPaid,
        interest,
        balance: Math.max(balance, 0),
      });
    }
  }

  return {
    payment: basePayment,
    totalInterest,
    totalPaid: principal + totalInterest,
    months: rows.length ? rows[rows.length - 1].month : 0,
    rows,
  };
}

function calculateInflation() {
  const amount = num('#inflationAmount');
  const mode = val('#inflationMode');
  let result;

  if (mode === 'historical') {
    const fromYear = Number(val('#inflationFrom'));
    const toYear = Number(val('#inflationTo'));
    const adjusted = amount * (cpiData[toYear] / cpiData[fromYear]);
    const change = ((adjusted / amount) - 1) * 100;
    result = {
      type: 'Inflation Lens',
      title: `${moneyCents(amount)} in ${fromYear} equals ${moneyCents(adjusted)} in ${toYear}`,
      tone: change >= 0 ? 'warning' : 'positive',
      summary: `Purchasing power changed by ${pct(change, 1)} using CPI-U annual average data.`,
      metrics: [
        ['Adjusted value', moneyCents(adjusted), `${fromYear} to ${toYear}`],
        ['Cumulative change', pct(change, 1), 'CPI-U basis'],
        ['Latest CPI year', String(Math.max(...Object.keys(cpiData).map(Number))), 'Annual average'],
      ],
      assumptions: [
        `CPI-U annual average dataset is embedded through ${Math.max(...Object.keys(cpiData).map(Number))}. Source: ${CPI_SOURCE_URL}`,
        'This does not estimate taxes, investment return, lifestyle changes, or regional price differences.',
      ],
      insights: [
        `If your income did not rise by about ${pct(change, 1)} over the same period, your purchasing power fell.`,
      ],
      inputs: { amount, fromYear, toYear },
    };
  } else {
    const years = num('#inflationYears');
    const rate = num('#inflationRate');
    const future = amount * Math.pow(1 + rate / 100, years);
    result = {
      type: 'Inflation Lens',
      title: `${moneyCents(amount)} of buying power needs ${moneyCents(future)} in ${years} years`,
      tone: 'warning',
      summary: `At ${pct(rate)} annual inflation, prices rise about ${pct(((future / amount) - 1) * 100, 1)} over the period.`,
      metrics: [
        ['Future amount', moneyCents(future), 'To keep buying power'],
        ['Annual inflation', pct(rate), 'User assumption'],
        ['Total increase', pct(((future / amount) - 1) * 100, 1), `${years} years`],
      ],
      assumptions: [
        `Future inflation is user-entered and compounded annually. CPI reference tables: ${CPI_SOURCE_URL}`,
        'Actual inflation can vary widely by category and location.',
      ],
      insights: [
        `At ${pct(rate + 1)}, the needed amount becomes ${moneyCents(amount * Math.pow(1 + (rate + 1) / 100, years))}.`,
        `At ${pct(Math.max(rate - 1, 0))}, the needed amount becomes ${moneyCents(amount * Math.pow(1 + Math.max(rate - 1, 0) / 100, years))}.`,
      ],
      inputs: { amount, years, rate },
    };
  }

  renderResult('#inflationResults', result);
}

function renderSubscriptions() {
  const container = $('#subscriptionList');
  container.innerHTML = '';
  [...starterSubscriptions, ...customSubscriptions].forEach(([name, price], index) => {
    const id = `sub-${index}`;
    const item = document.createElement('label');
    item.className = 'subscription-item';
    item.innerHTML = `
      <input type="checkbox" id="${id}" data-name="${escapeAttr(name)}" checked>
      <span>${escapeHtml(name)}</span>
      <input type="number" aria-label="${escapeAttr(name)} monthly price" value="${price}" min="0" step="0.01">
    `;
    container.appendChild(item);
  });
}

function addCustomSubscription() {
  const name = val('#customSubName').trim();
  const price = num('#customSubPrice');
  if (!name || price <= 0) return;
  customSubscriptions.push([name, price]);
  $('#customSubName').value = '';
  $('#customSubPrice').value = '';
  renderSubscriptions();
}

function calculateSubscriptions() {
  const selected = $$('.subscription-item').map((item) => {
    const checkbox = $('input[type="checkbox"]', item);
    const priceInput = $('input[type="number"]', item);
    return checkbox.checked ? { name: checkbox.dataset.name, price: Number(priceInput.value) || 0 } : null;
  }).filter(Boolean);

  const totalMonthly = selected.reduce((sum, item) => sum + item.price, 0);
  const people = Math.max(num('#splitPeople'), 1);
  const budget = num('#subscriptionBudget');
  const annual = totalMonthly * 12;
  const perPerson = totalMonthly / people;
  const overBudget = totalMonthly - budget;
  const sorted = [...selected].sort((a, b) => b.price - a.price);

  const result = {
    type: 'Subscription Audit',
    title: overBudget > 0 ? `You are ${moneyCents(overBudget)} over your monthly target` : `You are ${moneyCents(Math.abs(overBudget))} under your monthly target`,
    tone: overBudget > 0 ? 'warning' : 'positive',
    summary: `${selected.length} active subscriptions total ${moneyCents(totalMonthly)} per month, or ${moneyCents(annual)} per year.`,
    metrics: [
      ['Monthly total', moneyCents(totalMonthly), `${selected.length} selected`],
      ['Annual burn', moneyCents(annual), 'Before any discounts'],
      ['Split share', moneyCents(perPerson), `${people} ${people === 1 ? 'person' : 'people'}`],
    ],
    assumptions: [
      'Starter prices are editable estimates and may not match current provider pricing, taxes, bundles, or promotional offers.',
      'Splitting subscriptions may be restricted by provider terms. Check the service rules before sharing accounts.',
    ],
    insights: sorted.slice(0, 4).map((item) => `${item.name} is ${moneyCents(item.price * 12)} per year.`),
    table: {
      headers: ['Service', 'Monthly', 'Annual'],
      rows: sorted.map((item) => [item.name, moneyCents(item.price), moneyCents(item.price * 12)]),
    },
    inputs: { selected, people, budget },
  };

  renderResult('#subscriptionResults', result);
}

function calculateLoan() {
  const type = val('#loanType');
  const amount = num('#loanAmount');
  const apr = num('#loanApr');
  const term = Math.max(num('#loanTerm'), 1);
  const extra = num('#loanExtra');
  const base = loanSchedule(amount, apr, term, 0);
  const accelerated = loanSchedule(amount, apr, term, extra);
  const savedInterest = base.totalInterest - accelerated.totalInterest;
  const savedMonths = term - accelerated.months;
  const lowerRate = loanSchedule(amount, Math.max(apr - 1, 0), term, 0);
  const higherRate = loanSchedule(amount, apr + 1, term, 0);

  const result = {
    type: 'Loan Payoff Lab',
    title: extra > 0 ? `${moneyCents(extra)} extra saves about ${money(savedInterest)}` : `${type} payment is ${moneyCents(base.payment)} per month`,
    tone: extra > 0 && savedInterest > 0 ? 'positive' : 'neutral',
    summary: `${money(amount)} borrowed at ${pct(apr)} APR over ${term} months creates ${money(base.totalInterest)} in estimated interest.`,
    metrics: [
      ['Required payment', moneyCents(base.payment), `${term} months`],
      ['Base interest', money(base.totalInterest), 'No extra payment'],
      ['Payoff with extra', `${accelerated.months} mo`, `${savedMonths} mo faster`],
    ],
    assumptions: [
      'Uses fixed-rate monthly amortization and assumes payments are made on schedule.',
      'Does not include origination fees, late fees, escrow, taxes, deferment, forbearance, or variable-rate changes.',
    ],
    insights: [
      `${pct(apr - Math.max(apr - 1, 0))} lower APR would make the payment about ${moneyCents(lowerRate.payment)}.`,
      `${pct(1)} higher APR would make the payment about ${moneyCents(higherRate.payment)}.`,
      extra > 0 ? `The extra payment saves about ${money(savedInterest)} and ${savedMonths} months.` : 'Add an extra payment to see payoff acceleration.',
    ],
    table: {
      headers: ['Path', 'Monthly', 'Interest', 'Payoff'],
      rows: [
        ['Base schedule', moneyCents(base.payment), money(base.totalInterest), `${term} months`],
        ['With extra payment', moneyCents(base.payment + extra), money(accelerated.totalInterest), `${accelerated.months} months`],
      ],
    },
    schedule: accelerated.rows,
    inputs: { type, amount, apr, term, extra },
  };

  renderResult('#loanResults', result);
}

function calculateCarLease() {
  const vehiclePrice = num('#vehiclePrice');
  const taxRate = num('#salesTax') / 100;
  const buyDown = num('#buyDown');
  const buyApr = num('#buyApr');
  const buyTerm = Math.max(num('#buyTerm'), 1);
  const depreciation = num('#depreciationRate') / 100;
  const leaseDown = num('#leaseDown');
  const leasePayment = num('#leasePayment');
  const leaseTerm = Math.max(num('#leaseTerm'), 1);
  const residualPercent = num('#residualPercent') / 100;
  const annualMiles = num('#annualMiles');
  const includedMiles = num('#includedMiles');
  const mileFee = num('#mileFee');
  const leaseFees = num('#leaseFees');

  const buyPrincipal = Math.max(vehiclePrice * (1 + taxRate) - buyDown, 0);
  const buySchedule = loanSchedule(buyPrincipal, buyApr, buyTerm, 0);
  const buyAtLeaseEnd = loanSchedule(buyPrincipal, buyApr, buyTerm, 0);
  const leaseYears = leaseTerm / 12;
  const estimatedVehicleValue = vehiclePrice * Math.pow(1 - depreciation, leaseYears);
  const remainingBalance = buyAtLeaseEnd.rows.find((row) => row.month >= leaseTerm)?.balance ?? 0;
  const buyCashOut = buyDown + buySchedule.payment * leaseTerm;
  const buyEquity = Math.max(estimatedVehicleValue - remainingBalance, 0);
  const buyNetPosition = buyEquity - buyCashOut;
  const overageMiles = Math.max((annualMiles - includedMiles) * leaseYears, 0);
  const mileageFees = overageMiles * mileFee;
  const leaseTotal = leaseDown + leasePayment * leaseTerm + mileageFees + leaseFees;
  const leaseBuyout = vehiclePrice * residualPercent;
  const difference = buyNetPosition - (-leaseTotal);

  const result = {
    type: 'Buy vs Lease Lab',
    title: difference >= 0 ? `Buying is ahead by about ${money(difference)}` : `Leasing is ahead by about ${money(Math.abs(difference))}`,
    tone: difference >= 0 ? 'positive' : 'warning',
    summary: `Compared over ${leaseTerm} months with ${moneyCents(leasePayment)} lease payments and a ${pct(depreciation * 100)} annual depreciation assumption.`,
    metrics: [
      ['Buy monthly', moneyCents(buySchedule.payment), `${buyTerm} mo loan`],
      ['Lease cash out', money(leaseTotal), 'Including mileage/fees'],
      ['Estimated buy equity', money(buyEquity), `After ${leaseTerm} mo`],
    ],
    assumptions: [
      'Buying model includes sales tax in financed amount and estimates vehicle value from annual depreciation.',
      'Lease model uses entered payment, due-at-signing, lease-end fees, included miles, overage fee, and residual value.',
      'Insurance, registration, repairs, incentives, trade-ins, and tax treatment are not included.',
    ],
    insights: [
      overageMiles > 0 ? `Expected mileage creates ${money(mileageFees)} in lease overage fees.` : 'Expected mileage is within the lease allowance.',
      `Lease buyout estimate is ${money(leaseBuyout)} before tax and fees.`,
      `A 5-point higher residual would put the lease buyout around ${money(vehiclePrice * (residualPercent + 0.05))}.`,
    ],
    table: {
      headers: ['Option', 'Cash Out', 'Asset / Equity', 'Net Position'],
      rows: [
        ['Buy', money(buyCashOut), money(buyEquity), money(buyNetPosition)],
        ['Lease', money(leaseTotal), money(0), money(-leaseTotal)],
      ],
    },
    inputs: { vehiclePrice, taxRate, buyDown, buyApr, buyTerm, depreciation, leaseDown, leasePayment, leaseTerm, residualPercent, annualMiles, includedMiles, mileFee, leaseFees },
  };

  renderResult('#carleaseResults', result);
}

function calculateRentBuy() {
  const monthlyRent = num('#monthlyRent');
  const rentIncrease = num('#rentIncrease') / 100;
  const rentersInsurance = num('#rentersInsurance');
  const investmentReturn = num('#investmentReturn') / 100;
  const homePrice = num('#homePrice');
  const downPayment = num('#downPayment');
  const mortgageApr = num('#mortgageApr');
  const mortgageTermMonths = Math.max(num('#mortgageTerm') * 12, 1);
  const propertyTax = num('#propertyTax') / 100;
  const homeInsurance = num('#homeInsurance');
  const monthlyHoa = num('#monthlyHoa');
  const maintenanceRate = num('#maintenanceRate') / 100;
  const homeAppreciation = num('#homeAppreciation') / 100;
  const years = Math.max(num('#compareYears'), 1);
  const closingCostRate = num('#closingCostRate') / 100;
  const sellingCostRate = num('#sellingCostRate') / 100;

  const principal = Math.max(homePrice - downPayment, 0);
  const mortgagePayment = payment(principal, mortgageApr, mortgageTermMonths);
  const buyerClosingCosts = homePrice * closingCostRate;
  const initialCash = downPayment + buyerClosingCosts;
  const base = runRentBuyModel({
    monthlyRent,
    rentIncrease,
    rentersInsurance,
    investmentReturn,
    homePrice,
    initialCash,
    principal,
    mortgageApr,
    mortgageTermMonths,
    mortgagePayment,
    propertyTax,
    homeInsurance,
    monthlyHoa,
    maintenanceRate,
    homeAppreciation,
    years,
    sellingCostRate,
  });

  const lowAppreciation = runRentBuyModel({ ...base.inputs, homeAppreciation: homeAppreciation - 0.01 }).difference;
  const highAppreciation = runRentBuyModel({ ...base.inputs, homeAppreciation: homeAppreciation + 0.01 }).difference;
  const higherInvestment = runRentBuyModel({ ...base.inputs, investmentReturn: investmentReturn + 0.01 }).difference;

  const result = {
    type: 'Rent vs Buy Lab',
    title: base.difference >= 0 ? `Buying is ahead by about ${money(base.difference)}` : `Renting is ahead by about ${money(Math.abs(base.difference))}`,
    tone: base.difference >= 0 ? 'positive' : 'warning',
    summary: `Over ${years} years, this compares homeowner equity after selling costs against renting plus invested cash-flow differences.`,
    metrics: [
      ['Rent path net worth', money(base.rentNetWorth), 'Down payment/cash-flow invested'],
      ['Buy path net worth', money(base.buyNetWorth), 'Equity after selling costs'],
      ['Break-even', base.breakEvenYear ? `Year ${base.breakEvenYear}` : 'Not in 40 yrs', 'Estimated'],
    ],
    assumptions: [
      `Buyer closing costs are estimated at ${pct(closingCostRate * 100)} and selling costs at ${pct(sellingCostRate * 100)}.`,
      'Renting invests the initial cash plus any monthly savings at the entered return.',
      'Taxes, PMI, utilities, renovations, itemized deductions, moving costs, and local market risk are not fully modeled.',
    ],
    insights: [
      `If appreciation is 1 point lower, the buy-vs-rent difference becomes ${money(lowAppreciation)}.`,
      `If appreciation is 1 point higher, the buy-vs-rent difference becomes ${money(highAppreciation)}.`,
      `If renting investments return 1 point more, the difference becomes ${money(higherInvestment)}.`,
    ],
    table: {
      headers: ['Path', 'Monthly Now', 'Cash Paid', 'Ending Value', 'Net Worth'],
      rows: [
        ['Rent', moneyCents(monthlyRent + rentersInsurance), money(base.totalRentPaid), money(base.rentInvestment), money(base.rentNetWorth)],
        ['Buy', moneyCents(base.firstMonthOwnCost), money(base.totalOwnerCashOut), money(base.homeSaleProceeds), money(base.buyNetWorth)],
      ],
    },
    inputs: { monthlyRent, rentIncrease, rentersInsurance, investmentReturn, homePrice, downPayment, mortgageApr, mortgageTermMonths, propertyTax, homeInsurance, monthlyHoa, maintenanceRate, homeAppreciation, years, closingCostRate, sellingCostRate },
  };

  renderResult('#rentbuyResults', result);
}

function runRentBuyModel(config) {
  const monthlyRate = config.mortgageApr / 100 / 12;
  let rent = config.monthlyRent;
  let rentInvestment = config.initialCash;
  let rentPaid = 0;
  let ownerCashOut = config.initialCash;
  let homeValue = config.homePrice;
  let balance = config.principal;
  let breakEvenYear = 0;
  const monthlyInvestmentReturn = config.investmentReturn / 12;
  const firstMonthOwnCost = config.mortgagePayment + (config.homePrice * config.propertyTax / 12) + (config.homeInsurance / 12) + config.monthlyHoa + (config.homePrice * config.maintenanceRate / 12);

  for (let year = 1; year <= config.years; year++) {
    for (let month = 1; month <= 12; month++) {
      const rentCost = rent + config.rentersInsurance;
      const tax = homeValue * config.propertyTax / 12;
      const maintenance = homeValue * config.maintenanceRate / 12;
      const ownCost = config.mortgagePayment + tax + (config.homeInsurance / 12) + config.monthlyHoa + maintenance;

      rentPaid += rentCost;
      ownerCashOut += ownCost;
      rentInvestment *= (1 + monthlyInvestmentReturn);
      if (ownCost > rentCost) rentInvestment += ownCost - rentCost;

      if (balance > 0) {
        const interest = balance * monthlyRate;
        const principalPaid = Math.min(balance, Math.max(config.mortgagePayment - interest, 0));
        balance -= principalPaid;
      }
    }

    homeValue *= (1 + config.homeAppreciation);
    const saleCosts = homeValue * config.sellingCostRate;
    const homeSaleProceeds = Math.max(homeValue - saleCosts - balance, 0);
    const buyNetWorth = homeSaleProceeds - ownerCashOut;
    const rentNetWorth = rentInvestment - rentPaid;
    if (!breakEvenYear && buyNetWorth >= rentNetWorth) breakEvenYear = year;
    rent *= (1 + config.rentIncrease);
  }

  const saleCosts = homeValue * config.sellingCostRate;
  const homeSaleProceeds = Math.max(homeValue - saleCosts - balance, 0);
  const buyNetWorth = homeSaleProceeds - ownerCashOut;
  const rentNetWorth = rentInvestment - rentPaid;

  return {
    inputs: config,
    firstMonthOwnCost,
    totalRentPaid: rentPaid,
    totalOwnerCashOut: ownerCashOut,
    homeSaleProceeds,
    rentInvestment,
    buyNetWorth,
    rentNetWorth,
    difference: buyNetWorth - rentNetWorth,
    breakEvenYear,
  };
}

function calculateSideHustle() {
  const gross = num('#hustleIncome');
  const platformFeeRate = num('#platformFee') / 100;
  const billableHours = num('#billableHours');
  const adminHours = num('#adminHours');
  const expenses = num('#hustleExpenses');
  const taxRate = num('#taxSetAside') / 100;
  const dayJobRate = num('#dayJobRate');
  const monthlyGoal = num('#monthlyGoal');
  const platformFees = gross * platformFeeRate;
  const taxable = Math.max(gross - platformFees - expenses, 0);
  const taxes = taxable * taxRate;
  const net = taxable - taxes;
  const totalHours = billableHours + adminHours;
  const hourly = totalHours > 0 ? net / totalHours : 0;
  const targetGross = targetGrossForHourly(dayJobRate, totalHours, expenses, platformFeeRate, taxRate);
  const grossForGoal = targetGrossForNet(monthlyGoal, expenses, platformFeeRate, taxRate);

  const result = {
    type: 'Side Hustle Lab',
    title: hourly >= dayJobRate ? `This clears your day-job rate by ${moneyCents(hourly - dayJobRate)}/hr` : `This trails your day-job rate by ${moneyCents(dayJobRate - hourly)}/hr`,
    tone: hourly >= dayJobRate ? 'positive' : 'warning',
    summary: `${money(gross)} gross becomes about ${money(net)} net after platform fees, expenses, and tax set-aside.`,
    metrics: [
      ['True hourly', `${moneyCents(hourly)}/hr`, `${totalHours} total hrs`],
      ['Monthly net', money(net), 'After set-aside'],
      ['Gross to beat job', money(targetGross), `${moneyCents(dayJobRate)}/hr target`],
    ],
    assumptions: [
      'Tax set-aside is an estimate and may not match federal, state, local, or self-employment tax owed.',
      'Admin hours are included because sales, invoicing, travel, bookkeeping, and support are still work.',
      'Does not include benefits, retirement match, insurance, risk, or burnout cost.',
    ],
    insights: [
      `To net ${money(monthlyGoal)}, gross revenue needs to be about ${money(grossForGoal)} with these assumptions.`,
      `Every admin hour lowers the true hourly rate; at 0 admin hours this would be ${moneyCents(billableHours > 0 ? net / billableHours : 0)}/hr.`,
      `Platform fees cost ${money(platformFees)} per month before taxes.`,
    ],
    table: {
      headers: ['Line Item', 'Monthly', 'Annual'],
      rows: [
        ['Gross revenue', money(gross), money(gross * 12)],
        ['Platform fees', `-${money(platformFees)}`, `-${money(platformFees * 12)}`],
        ['Expenses', `-${money(expenses)}`, `-${money(expenses * 12)}`],
        ['Tax set-aside', `-${money(taxes)}`, `-${money(taxes * 12)}`],
        ['Net income', money(net), money(net * 12)],
      ],
    },
    inputs: { gross, platformFeeRate, billableHours, adminHours, expenses, taxRate, dayJobRate, monthlyGoal },
  };

  renderResult('#sidehustleResults', result);
}

function targetGrossForHourly(hourlyTarget, hours, expenses, feeRate, taxRate) {
  return targetGrossForNet(hourlyTarget * hours, expenses, feeRate, taxRate);
}

function targetGrossForNet(netTarget, expenses, feeRate, taxRate) {
  const keepRate = (1 - feeRate) * (1 - taxRate);
  if (keepRate <= 0) return 0;
  return Math.max((netTarget / (1 - taxRate) + expenses) / (1 - feeRate), 0);
}

function renderResult(targetSelector, result) {
  currentResult = result;
  const target = $(targetSelector);
  target.innerHTML = `
    <article class="decision-card">
      <div class="decision-banner ${result.tone === 'warning' ? 'warning' : result.tone === 'negative' ? 'negative' : ''}">
        <strong>${escapeHtml(result.title)}</strong>
        <div class="result-note">${escapeHtml(result.summary)}</div>
      </div>
      <div class="metric-grid">
        ${result.metrics.map(([label, value, note]) => `
          <div class="metric">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
            <p>${escapeHtml(note)}</p>
          </div>
        `).join('')}
      </div>
      ${result.table ? renderTable(result.table) : ''}
      ${result.schedule ? renderSchedule(result.schedule) : ''}
      <section>
        <h3>What changes the answer</h3>
        <ul class="insight-list">${result.insights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      <section>
        <h3>Assumptions</h3>
        <ul class="assumption-list">${result.assumptions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      <div class="result-actions">
        <button class="btn primary" type="button" data-save-result>Save Scenario</button>
        <button class="btn secondary" type="button" data-export-result>Export Report</button>
      </div>
    </article>
  `;

  $('[data-save-result]', target).addEventListener('click', saveCurrentScenario);
  $('[data-export-result]', target).addEventListener('click', () => exportReport(currentResult));
}

function renderTable(table) {
  return `
    <div class="comparison-table">
      <table>
        <thead><tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
        <tbody>
          ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSchedule(rows) {
  return `
    <section>
      <h3>Amortization Snapshot</h3>
      <div class="amortization-table">
        <table>
          <thead><tr><th>Month</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
          <tbody>
            ${rows.slice(0, 16).map((row) => `
              <tr>
                <td>${row.month}</td>
                <td>${moneyCents(row.payment)}</td>
                <td>${moneyCents(row.principal)}</td>
                <td>${moneyCents(row.interest)}</td>
                <td>${money(row.balance)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function saveCurrentScenario() {
  if (!currentResult) return;
  const label = window.prompt('Name this scenario:', `${currentResult.type} - ${new Date().toLocaleDateString()}`);
  if (!label) return;
  scenarios.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    label,
    savedAt: new Date().toISOString(),
    result: currentResult,
  });
  scenarios = scenarios.slice(0, 24);
  persistScenarios();
  renderScenarioVault();
  $('#scenario-vault').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderScenarioVault() {
  const list = $('#scenarioList');
  if (!scenarios.length) {
    list.innerHTML = '<div class="empty-state">No saved scenarios yet. Run any lab, then save the result here.</div>';
    return;
  }

  list.innerHTML = scenarios.map((scenario) => {
    const metrics = scenario.result.metrics.slice(0, 3).map(([label, value]) => `<span>${escapeHtml(label)}: <strong>${escapeHtml(value)}</strong></span>`).join('');
    return `
      <article class="scenario-card">
        <small>${escapeHtml(scenario.result.type)} · ${new Date(scenario.savedAt).toLocaleString()}</small>
        <strong>${escapeHtml(scenario.label)}</strong>
        <p>${escapeHtml(scenario.result.title)}</p>
        <div class="scenario-metrics">${metrics}</div>
        <div class="result-actions">
          <button class="btn secondary" type="button" data-export-scenario="${scenario.id}">Export</button>
          <button class="btn ghost danger" type="button" data-delete-scenario="${scenario.id}">Delete</button>
        </div>
      </article>
    `;
  }).join('');

  $$('[data-export-scenario]').forEach((button) => {
    button.addEventListener('click', () => {
      const scenario = scenarios.find((item) => item.id === button.dataset.exportScenario);
      if (scenario) exportReport(scenario.result, scenario.label);
    });
  });

  $$('[data-delete-scenario]').forEach((button) => {
    button.addEventListener('click', () => {
      scenarios = scenarios.filter((scenario) => scenario.id !== button.dataset.deleteScenario);
      persistScenarios();
      renderScenarioVault();
    });
  });
}

function loadScenarios() {
  try {
    return JSON.parse(localStorage.getItem(SCENARIO_KEY) || '[]');
  } catch {
    return [];
  }
}

function persistScenarios() {
  localStorage.setItem(SCENARIO_KEY, JSON.stringify(scenarios));
}

function clearScenarioVault() {
  if (!scenarios.length) return;
  if (!window.confirm('Clear all saved Finance: Decision Lab scenarios from this browser?')) return;
  scenarios = [];
  persistScenarios();
  renderScenarioVault();
}

function exportScenarioVault() {
  if (!scenarios.length) return;
  const lines = ['# Finance: Decision Lab Scenario Vault', ''];
  scenarios.forEach((scenario) => {
    lines.push(`## ${scenario.label}`);
    lines.push('');
    lines.push(reportMarkdown(scenario.result));
    lines.push('');
  });
  downloadText(lines.join('\n'), 'finance-decision-lab-scenarios.md', 'text/markdown');
}

function exportReport(result, label = result.type) {
  downloadText(reportMarkdown(result), slugify(label) + '.md', 'text/markdown');
}

function reportMarkdown(result) {
  const lines = [
    `# ${result.type}`,
    '',
    `**Decision:** ${result.title}`,
    '',
    result.summary,
    '',
    '## Metrics',
    '',
    ...result.metrics.map(([label, value, note]) => `- **${label}:** ${value}${note ? ` (${note})` : ''}`),
    '',
  ];

  if (result.table) {
    lines.push('## Comparison');
    lines.push('');
    lines.push(`| ${result.table.headers.join(' | ')} |`);
    lines.push(`| ${result.table.headers.map(() => '---').join(' | ')} |`);
    result.table.rows.forEach((row) => lines.push(`| ${row.join(' | ')} |`));
    lines.push('');
  }

  lines.push('## What Changes The Answer');
  lines.push('');
  result.insights.forEach((item) => lines.push(`- ${item}`));
  lines.push('');
  lines.push('## Assumptions');
  lines.push('');
  result.assumptions.forEach((item) => lines.push(`- ${item}`));
  lines.push('');
  lines.push(`_Generated by [Finance: Decision Lab](${TOOL_URL}) on ${new Date().toISOString()}._`);
  return lines.join('\n');
}

function downloadText(text, filename, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'finance-decision-lab-report';
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
