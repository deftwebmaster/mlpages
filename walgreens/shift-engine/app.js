const STORAGE_KEY = "shiftEngineData";
const TODAY = new Date().toISOString().slice(0, 10);

const SHIFT_OPTIONS = [
  { id: "opening", label: "Opening Shift", hint: "Cash, readiness, early orders" },
  { id: "mid", label: "Mid Shift", hint: "Survival mode and customer flow" },
  { id: "closing", label: "Closing Shift", hint: "Cash, lockup, final checks" },
  { id: "ad_day", label: "Ad Day", hint: "Pricing accuracy over perfection" },
  { id: "truck", label: "Truck / Backstock", hint: "Opportunistic inventory work" },
  { id: "all", label: "All Tasks", hint: "Everything visible" }
];

const PRIORITY_STACK = [
  "Customer in front of you",
  "Money integrity: tills, safe, cash reports, pricing",
  "Time-sensitive orders: online same-day, photo, FedEx",
  "Security / theft awareness",
  "Required task systems: Zebra, reports, inventory",
  "Truck / backstock",
  "Store recovery / facing"
];

const OVERRIDE_RULES = [
  "Customer physically present beats task work.",
  "Cash discrepancy beats everything except immediate safety/security.",
  "Two-person staffing means truck/backstock is opportunistic.",
  "Photo without waiting customer is lower priority than front register.",
  "Online same-day orders beat facing, backstock, and non-urgent Zebra tasks.",
  "Ad day accuracy beats ad day completeness.",
  "Closing cash/security beats store appearance.",
  "If overwhelmed, enter Minimum Viable Shift Mode."
];

const CHAOS_PROTECT = [
  "Customer coverage",
  "Register issues",
  "Safe/cash issues",
  "Online same-day orders",
  "Waiting photo customers",
  "FedEx customers",
  "Closing lockup/alarm"
];

const CHAOS_SUPPRESSED = [
  "Facing",
  "Deep recovery",
  "Truck",
  "Backstock",
  "Non-urgent Zebra",
  "Optional organization",
  "Go-backs",
  "Trash"
];

const TASKS = [
  { id: "opening_unlock_disarm", label: "Unlock doors + disarm alarm", shift: "opening", category: "security", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Doors unlocked and alarm disarmed successfully?" },
  { id: "opening_starting_tills", label: "Count registers / starting tills", shift: "opening", category: "cash", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Starting tills verified?" },
  { id: "opening_verify_tills", label: "Verify starting tills", shift: "opening", category: "cash", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Starting tills verified against expected amounts?" },
  { id: "opening_safe_count", label: "Count safe", shift: "opening", category: "cash", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Safe count completed and accurate?" },
  { id: "opening_safe_worksheet", label: "Complete daily safe count worksheet", shift: "opening", category: "cash", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Daily safe count worksheet completed?" },
  { id: "opening_cash_report", label: "Complete cash report", shift: "opening", category: "reports", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Cash report completed?" },
  { id: "opening_sap_reports", label: "Run SAP reports", shift: "opening", category: "reports", priority: "must_not_fail", riskWeight: 4, requiresConfirmation: false },
  { id: "opening_zebra_tasks", label: "Review Zebra task list", shift: "opening", category: "zebra", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "opening_urgent_zebra", label: "Complete urgent Zebra tasks", shift: "opening", category: "zebra", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "opening_fedex_inventory", label: "Check FedEx inventory", shift: "opening", category: "fedex", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "opening_same_day_orders", label: "Check online same-day orders", shift: "opening", category: "online_orders", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Online same-day orders checked?" },
  { id: "opening_photo_orders", label: "Check pending photo orders", shift: "opening", category: "photo", priority: "must_not_fail", riskWeight: 4, requiresConfirmation: true, confirmationPrompt: "Pending photo orders checked?" },
  { id: "opening_front_readiness", label: "Check front-end readiness", shift: "opening", category: "customer", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "opening_photo_readiness", label: "Check photo counter readiness", shift: "opening", category: "photo", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "opening_floor_scan", label: "Quick floor scan for obvious problems", shift: "opening", category: "security", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "mid_front_register", label: "Keep front register coverage stable", shift: "mid", category: "customer", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: false },
  { id: "mid_prevent_lines", label: "Prevent long customer lines", shift: "mid", category: "customer", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: false },
  { id: "mid_photo_watch", label: "Watch photo counter / photo queue", shift: "mid", category: "photo", priority: "should_happen", riskWeight: 4, requiresConfirmation: false },
  { id: "mid_photo_triage", label: "Triage pending photo orders", shift: "mid", category: "photo", priority: "should_happen", riskWeight: 4, requiresConfirmation: false },
  { id: "mid_online_orders", label: "Check online same-day orders", shift: "mid", category: "online_orders", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Online same-day orders checked?" },
  { id: "mid_fedex", label: "Handle FedEx drop-offs / pickups", shift: "mid", category: "fedex", priority: "must_not_fail", riskWeight: 4, requiresConfirmation: false },
  { id: "mid_floor_awareness", label: "Maintain floor awareness", shift: "mid", category: "security", priority: "should_happen", riskWeight: 4, requiresConfirmation: false },
  { id: "mid_high_theft_check", label: "Quick-check high-theft areas", shift: "mid", category: "security", priority: "should_happen", riskWeight: 4, requiresConfirmation: false },
  { id: "mid_truck", label: "Work truck only during stable windows", shift: "mid", category: "inventory", priority: "nice_if_possible", riskWeight: 2, requiresConfirmation: false },
  { id: "mid_backstock", label: "Work backstock after customer/order tasks are stable", shift: "mid", category: "inventory", priority: "nice_if_possible", riskWeight: 2, requiresConfirmation: false },
  { id: "mid_go_backs", label: "Clear go-backs when possible", shift: "mid", category: "store_recovery", priority: "nice_if_possible", riskWeight: 2, requiresConfirmation: false },
  { id: "mid_zebra_when_stable", label: "Complete Zebra tasks only when coverage allows", shift: "mid", category: "zebra", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "mid_employee_comms", label: "Keep communication clear with other employee", shift: "mid", category: "customer", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "closing_online_orders", label: "Final check: online same-day orders", shift: "closing", category: "online_orders", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Final online same-day order check completed?" },
  { id: "closing_photo_orders", label: "Final check: pending photo orders", shift: "closing", category: "photo", priority: "must_not_fail", riskWeight: 4, requiresConfirmation: true, confirmationPrompt: "Final photo order check completed?" },
  { id: "closing_fedex_customer", label: "Handle final FedEx/customer-facing issues", shift: "closing", category: "fedex", priority: "must_not_fail", riskWeight: 4, requiresConfirmation: false },
  { id: "closing_tills", label: "Count registers / ending tills", shift: "closing", category: "cash", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Ending tills counted and verified?" },
  { id: "closing_verify_tills", label: "Verify tills", shift: "closing", category: "cash", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Ending tills verified?" },
  { id: "closing_safe", label: "Count safe + complete required logging", shift: "closing", category: "cash", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Safe count and logging completed?" },
  { id: "closing_trash", label: "Clear trash", shift: "closing", category: "store_recovery", priority: "should_happen", riskWeight: 2, requiresConfirmation: false },
  { id: "closing_go_backs", label: "Clear go-backs", shift: "closing", category: "store_recovery", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "closing_security_check", label: "Final floor/security check", shift: "closing", category: "security", priority: "must_not_fail", riskWeight: 4, requiresConfirmation: true, confirmationPrompt: "Final floor/security check completed?" },
  { id: "closing_face_store", label: "Face store / end-of-day recovery pass", shift: "closing", category: "store_recovery", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "closing_lock_alarm", label: "Lock doors + set alarm", shift: "closing", category: "security", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Doors locked and alarm set successfully?" },
  { id: "ad_remove_expired", label: "Remove expired tags", shift: "ad_day", category: "inventory", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: false },
  { id: "ad_place_tags", label: "Place weekly ad tags", shift: "ad_day", category: "inventory", priority: "must_not_fail", riskWeight: 4, requiresConfirmation: false },
  { id: "ad_verify_pricing", label: "Verify promo pricing by scanning test items", shift: "ad_day", category: "cash", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Scanned test items match promo pricing?" },
  { id: "ad_high_traffic", label: "Check high-traffic promo areas", shift: "ad_day", category: "inventory", priority: "should_happen", riskWeight: 4, requiresConfirmation: false },
  { id: "ad_endcaps", label: "Check endcaps + promo displays", shift: "ad_day", category: "inventory", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "ad_seasonal", label: "Check seasonal/display areas", shift: "ad_day", category: "inventory", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "ad_mismatches", label: "Correct mismatched tags/pricing issues", shift: "ad_day", category: "cash", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: true, confirmationPrompt: "Known tag/pricing mismatches resolved?" },
  { id: "ad_resume_verified", label: "Resume from last verified section after interruption", shift: "ad_day", category: "inventory", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "truck_priority_totes", label: "Identify priority totes/sections", shift: "truck", category: "inventory", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "truck_customer_critical", label: "Work customer-critical items first", shift: "truck", category: "inventory", priority: "should_happen", riskWeight: 4, requiresConfirmation: false },
  { id: "truck_high_velocity", label: "Work high-velocity items first", shift: "truck", category: "inventory", priority: "should_happen", riskWeight: 3, requiresConfirmation: false },
  { id: "truck_safe_aisles", label: "Keep aisles safe and passable", shift: "truck", category: "security", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: false },
  { id: "truck_pause_demand", label: "Pause truck when front/photo/FedEx demand rises", shift: "truck", category: "customer", priority: "must_not_fail", riskWeight: 5, requiresConfirmation: false },
  { id: "truck_stable_state", label: "Return unfinished truck/backstock to stable state", shift: "truck", category: "inventory", priority: "should_happen", riskWeight: 4, requiresConfirmation: false }
];

const RULES = [
  { id: "line_over_three", trigger: "Line has 3+ customers", action: "Abandon all non-front tasks. Stabilize customer flow.", severity: "high", appliesTo: ["mid", "closing", "opening"] },
  { id: "cash_discrepancy", trigger: "Safe or till count is off", action: "Pause lower-priority work. Resolve cash issue first.", severity: "critical", appliesTo: ["opening", "closing"] },
  { id: "short_staffed", trigger: "Only two people working", action: "Treat truck, backstock, and facing as opportunistic.", severity: "high", appliesTo: ["all"] },
  { id: "photo_customer_waiting", trigger: "Customer physically waiting at photo", action: "Photo becomes active customer priority.", severity: "high", appliesTo: ["all"] },
  { id: "photo_pending_no_customer", trigger: "Photo orders pending but no waiting customer", action: "Keep below front register and online same-day orders.", severity: "medium", appliesTo: ["all"] },
  { id: "online_order_pending", trigger: "Online same-day order pending", action: "Prioritize before facing, truck, backstock, and non-urgent Zebra tasks.", severity: "high", appliesTo: ["all"] },
  { id: "theft_risk", trigger: "Suspicious behavior or theft risk", action: "Increase floor presence. Delay inventory/recovery tasks.", severity: "high", appliesTo: ["all"] },
  { id: "ad_interrupted", trigger: "Interrupted during ad tag work", action: "Resume from last verified section, not a random spot.", severity: "medium", appliesTo: ["ad_day"] },
  { id: "behind_closing", trigger: "Behind near closing", action: "Cash, orders, lockup, and alarm beat facing.", severity: "critical", appliesTo: ["closing"] },
  { id: "customers_present", trigger: "Customer physically present", action: "Customer beats task work.", severity: "critical", appliesTo: ["all"] },
  { id: "ad_accuracy", trigger: "Ad day work is interrupted or time-limited", action: "Accuracy beats completeness. Remove expired tags and verify price first.", severity: "high", appliesTo: ["ad_day"] },
  { id: "overwhelmed", trigger: "Shift becomes chaotic", action: "Enter Minimum Viable Shift Mode.", severity: "critical", appliesTo: ["all"] }
];

const state = loadState();
let dialogAction = null;
let ruleFilter = "current";
let toastTimer = null;

function defaultState() {
  return {
    activeShift: "opening",
    mode: "normal",
    currentDate: TODAY,
    tasks: TASKS,
    taskStates: {},
    completedTaskIds: [],
    deferredTasks: [],
    notes: [],
    shiftReviews: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const loaded = { ...defaultState(), ...parsed, currentDate: parsed.currentDate || TODAY };
    if (loaded.currentDate !== TODAY) {
      loaded.currentDate = TODAY;
      loaded.taskStates = {};
      loaded.completedTaskIds = [];
      loaded.deferredTasks = [];
      loaded.notes = [];
    }
    return loaded;
  } catch {
    return defaultState();
  }
}

function saveState() {
  syncTaskCollections();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
  render();
}

function taskState(taskId) {
  return state.taskStates[taskId]?.state || "not_started";
}

function relevantTasks({ chaos = false } = {}) {
  const shift = state.activeShift;
  const minimum = state.mode === "minimum" || chaos;
  const activeChaos = state.mode === "chaos";
  return TASKS
    .filter((task) => shift === "all" || task.shift === shift || task.shift === "all")
    .filter((task) => {
      if (minimum) return task.priority === "must_not_fail" && isMinimumViableTask(task);
      if (activeChaos) return isChaosVisibleTask(task);
      return true;
    })
    .sort(sortTasks);
}

function sortTasks(a, b) {
  const priorityRank = { must_not_fail: 0, should_happen: 1, nice_if_possible: 2 };
  const timeSensitive = new Set(["online_orders", "photo", "fedex", "cash", "security"]);
  return (
    priorityRank[a.priority] - priorityRank[b.priority] ||
    b.riskWeight - a.riskWeight ||
    Number(timeSensitive.has(b.category)) - Number(timeSensitive.has(a.category)) ||
    a.label.localeCompare(b.label)
  );
}

function isMinimumViableTask(task) {
  if (["customer", "cash", "online_orders", "fedex", "security"].includes(task.category)) return true;
  return task.category === "photo" && task.priority === "must_not_fail";
}

function isChaosVisibleTask(task) {
  if (task.priority === "must_not_fail") return true;
  if (task.priority === "nice_if_possible") return false;
  return task.riskWeight >= 4 || ["customer", "photo", "fedex", "online_orders", "security"].includes(task.category);
}

function groupedTasks(tasks) {
  const groups = {
    critical: { label: "Critical Now", tasks: [] },
    should: { label: "Should Happen", tasks: [] },
    nice: { label: "Nice If Possible", tasks: [] },
    deferred: { label: "Deferred", tasks: [] },
    completed: { label: "Completed", tasks: [] }
  };

  tasks.forEach((task) => {
    const current = taskState(task.id);
    if (current === "completed") groups.completed.tasks.push(task);
    else if (current === "deferred" || current === "blocked" || current === "missed") groups.deferred.tasks.push(task);
    else if (task.priority === "must_not_fail") groups.critical.tasks.push(task);
    else if (task.priority === "should_happen") groups.should.tasks.push(task);
    else groups.nice.tasks.push(task);
  });

  return Object.values(groups);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render() {
  renderChrome();
  renderShiftButtons();
  renderPriorityStack();
  renderTasks(document.getElementById("taskBoard"), relevantTasks());
  renderTasks(document.getElementById("chaosBoard"), relevantTasks({ chaos: true }));
  renderChaosReference();
  renderRules();
  renderReview();
  renderSettings();
}

function renderChrome() {
  const visibleTasks = relevantTasks();
  const completed = visibleTasks.filter((task) => taskState(task.id) === "completed").length;
  const percent = visibleTasks.length ? Math.round((completed / visibleTasks.length) * 100) : 0;
  const remaining = visibleTasks.filter((task) => task.priority === "must_not_fail" && taskState(task.id) !== "completed").length;
  const deferred = Object.values(state.taskStates).filter((entry) => entry.state === "deferred").length;
  document.getElementById("criticalRemaining").textContent = remaining;
  document.getElementById("deferredCount").textContent = deferred;
  document.getElementById("progressLabel").textContent = `${percent}% complete`;
  document.getElementById("progressDetail").textContent = `${completed} of ${visibleTasks.length} tasks`;
  document.getElementById("progressFill").style.width = `${percent}%`;
  document.getElementById("todayTitle").textContent = `${labelForShift(state.activeShift)} triage`;
  const modeLabel = state.mode === "minimum" ? "Minimum" : state.mode === "chaos" ? "Chaos" : "Normal";
  document.getElementById("modeLabel").textContent = modeLabel;
  document.getElementById("modeToggle").className = `mode-pill ${state.mode}`;
  document.getElementById("minimumToggle").textContent = state.mode === "minimum" ? "Exit Minimum Viable Mode" : "Enter Minimum Viable Mode";
}

function renderShiftButtons() {
  const wrap = document.getElementById("shiftButtons");
  wrap.replaceChildren();
  SHIFT_OPTIONS.forEach((shift) => {
    const button = el("button", `shift-button ${state.activeShift === shift.id ? "active" : ""}`);
    button.type = "button";
    button.dataset.shift = shift.id;
    const count = TASKS.filter((task) => shift.id === "all" || task.shift === shift.id || task.shift === "all").length;
    button.append(el("strong", "", shift.label), el("span", "", `${shift.hint} · ${count} tasks`));
    wrap.append(button);
  });
}

function renderPriorityStack() {
  const list = document.getElementById("priorityStack");
  list.replaceChildren(...PRIORITY_STACK.map((item) => el("li", "", item)));
}

function renderTasks(container, tasks) {
  container.replaceChildren();
  const groups = groupedTasks(tasks).filter((group) => group.tasks.length);
  if (!groups.length) {
    container.append(el("div", "empty-state", "No tasks visible in this mode."));
    return;
  }
  groups.forEach((group) => {
    const section = el("section", "task-section");
    const header = el("div", "task-section-header");
    header.append(el("span", "", group.label), el("span", "", String(group.tasks.length)));
    section.append(header, ...group.tasks.map(renderTaskCard));
    container.append(section);
  });
}

function renderTaskCard(task) {
  const current = taskState(task.id);
  const entry = state.taskStates[task.id];
  const card = el("article", `task-card ${task.priority} ${current}`);
  card.dataset.taskId = task.id;
  const top = el("div", "task-top");
  const text = el("div");
  text.append(el("h3", "task-title", task.label));
  const meta = el("div", "meta-row");
  meta.append(priorityBadge(task.priority), el("span", "badge", categoryLabel(task.category)), el("span", "badge", stateLabel(current)));
  if (entry?.reason) meta.append(el("span", "badge", `deferred: ${entry.reason}`));
  text.append(meta);
  const risk = el("div", "task-risk");
  risk.innerHTML = `<span>Risk</span>${task.riskWeight}`;
  top.append(text, risk);

  const actions = el("div", "task-actions");
  if (current === "completed" || current === "deferred") {
    const undo = el("button", "", current === "completed" ? "Undo" : "Restore");
    undo.type = "button";
    undo.dataset.action = "undo";
    undo.addEventListener("click", () => undoTask(task.id));

    const note = el("button", "", "Note");
    note.type = "button";
    note.dataset.action = "note";
    note.addEventListener("click", () => openTaskDialog("note", task));
    actions.append(undo, note);
  } else {
    const complete = el("button", "", "Complete");
    complete.type = "button";
    complete.dataset.action = "complete";
    complete.addEventListener("click", () => openTaskDialog("complete", task));

    const defer = el("button", "", "Defer");
    defer.type = "button";
    defer.dataset.action = "defer";
    defer.disabled = task.priority === "must_not_fail";
    defer.addEventListener("click", () => openTaskDialog("defer", task));

    const note = el("button", "", "Note");
    note.type = "button";
    note.dataset.action = "note";
    note.addEventListener("click", () => openTaskDialog("note", task));
    actions.append(complete, defer, note);
  }
  card.append(top, actions);
  if (state.taskStates[task.id]?.note) {
    card.append(el("p", "hero-copy", state.taskStates[task.id].note));
  }
  return card;
}

function priorityBadge(priority) {
  const text = priority === "must_not_fail" ? "MUST NOT FAIL" : priority === "should_happen" ? "SHOULD HAPPEN" : "NICE IF POSSIBLE";
  const cls = priority === "must_not_fail" ? "critical" : priority === "should_happen" ? "warn" : "ok";
  return el("span", `badge ${cls}`, text);
}

function renderRules() {
  const rules = RULES.filter((rule) => {
    if (ruleFilter === "current") return state.activeShift === "all" || rule.appliesTo.includes("all") || rule.appliesTo.includes(state.activeShift);
    if (ruleFilter === "all") return true;
    return rule.severity === ruleFilter;
  });
  const list = document.getElementById("rulesList");
  list.replaceChildren(...rules.map((rule) => {
    const card = el("article", `rule-card ${rule.severity}`);
    card.append(priorityBadge(rule.severity === "critical" ? "must_not_fail" : "should_happen"));
    card.append(el("h3", "", rule.trigger), el("p", "", `→ ${rule.action}`));
    return card;
  }));
  document.querySelectorAll("[data-rule-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.ruleFilter === ruleFilter);
  });
  const overrideList = document.getElementById("overrideList");
  overrideList.replaceChildren(...OVERRIDE_RULES.map((rule, index) => {
    const item = el("div", "override-item");
    item.append(el("span", "", String(index + 1).padStart(2, "0")), el("p", "", rule));
    return item;
  }));
}

function renderChaosReference() {
  const protect = document.getElementById("protectGrid");
  protect.replaceChildren(...CHAOS_PROTECT.map((item) => el("div", "protect-card", item)));
  const suppressed = document.getElementById("suppressedList");
  suppressed.replaceChildren(...CHAOS_SUPPRESSED.map((item) => el("span", "suppressed-tag", item)));
}

function renderReview() {
  const active = relevantTasks();
  const completed = active.filter((task) => taskState(task.id) === "completed").length;
  const deferred = active.filter((task) => taskState(task.id) === "deferred").length;
  const missedCritical = active.filter((task) => task.priority === "must_not_fail" && ["deferred", "blocked", "missed", "not_started"].includes(taskState(task.id))).length;
  document.getElementById("reviewCompleted").textContent = completed;
  document.getElementById("reviewDeferred").textContent = deferred;
  document.getElementById("reviewMissed").textContent = missedCritical;

  const history = document.getElementById("reviewHistory");
  history.replaceChildren(...state.shiftReviews.slice(-5).reverse().map((review) => {
    const card = el("article", "review-card");
    card.append(el("h3", "", `${review.date} · ${labelForShift(review.shift)}`));
    card.append(el("p", "", `${review.completed} completed · ${review.deferred} deferred · ${review.missedCritical} critical misses`));
    card.append(el("p", "", `Cause: ${review.breakCause}`));
    if (review.completedNotes) card.append(el("p", "", `Completed: ${review.completedNotes}`));
    if (review.deferredNotes) card.append(el("p", "", `Deferred: ${review.deferredNotes}`));
    if (review.notes) card.append(el("p", "", review.notes));
    return card;
  }));
}

function renderSettings() {
  document.getElementById("dataPreview").textContent = JSON.stringify(state, null, 2);
}

function openTaskDialog(action, task) {
  dialogAction = { action, task };
  const dialog = document.getElementById("taskDialog");
  const title = document.getElementById("dialogTitle");
  const copy = document.getElementById("dialogCopy");
  const reasonWrap = document.getElementById("dialogReasonWrap");
  const stateWrap = document.getElementById("dialogStateWrap");
  const confirm = document.getElementById("dialogConfirm");
  document.getElementById("taskNote").value = state.taskStates[task.id]?.note || "";
  document.getElementById("taskStateSelect").value = taskState(task.id);

  title.textContent = action === "complete" ? "Complete task" : action === "defer" ? "Defer task" : "Task note";
  copy.textContent = action === "complete" && task.requiresConfirmation ? task.confirmationPrompt : task.label;
  reasonWrap.style.display = action === "defer" ? "grid" : "none";
  stateWrap.style.display = action === "note" ? "grid" : "none";
  confirm.textContent = action === "complete" ? "Complete" : action === "defer" ? "Defer" : "Save note";
  dialog.showModal();
}

function applyDialogAction() {
  if (!dialogAction) return;
  const { action, task } = dialogAction;
  const note = document.getElementById("taskNote").value.trim();
  const existing = state.taskStates[task.id] || {};
  if (action === "complete") {
    state.taskStates[task.id] = { ...existing, state: "completed", completedAt: new Date().toISOString(), confirmed: Boolean(task.requiresConfirmation), note };
    showToast("Task completed");
  }
  if (action === "defer") {
    const reason = document.getElementById("deferReason").value;
    state.taskStates[task.id] = { ...existing, state: "deferred", deferredAt: new Date().toISOString(), reason, mode: state.mode, note };
    showToast("Task deferred");
  }
  if (action === "note") {
    state.taskStates[task.id] = { ...existing, state: document.getElementById("taskStateSelect").value, note };
    state.notes.push({ taskId: task.id, createdAt: new Date().toISOString(), note });
    showToast("Task updated");
  }
  dialogAction = null;
  saveState();
}

function undoTask(taskId) {
  const existing = state.taskStates[taskId] || {};
  state.taskStates[taskId] = { ...existing, state: "not_started", reason: "", completedAt: "", deferredAt: "" };
  showToast("Task restored");
  saveState();
}

function syncTaskCollections() {
  state.completedTaskIds = Object.entries(state.taskStates)
    .filter(([, entry]) => entry.state === "completed")
    .map(([taskId]) => taskId);
  state.deferredTasks = Object.entries(state.taskStates)
    .filter(([, entry]) => entry.state === "deferred")
    .map(([taskId, entry]) => ({
      taskId,
      deferredAt: entry.deferredAt || new Date().toISOString(),
      reason: entry.reason || "Other",
      mode: entry.mode || state.mode
    }));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function labelForShift(shift) {
  return SHIFT_OPTIONS.find((item) => item.id === shift)?.label || "Shift";
}

function categoryLabel(category) {
  return category.replaceAll("_", " ");
}

function stateLabel(value) {
  return value.replaceAll("_", " ");
}

function resetToday() {
  state.currentDate = TODAY;
  state.taskStates = {};
  state.completedTaskIds = [];
  state.deferredTasks = [];
  state.notes = [];
  saveState();
}

function resetAll() {
  Object.assign(state, defaultState());
  saveState();
}

document.addEventListener("click", (event) => {
  const shiftButton = event.target.closest("[data-shift]");
  if (shiftButton) {
    state.activeShift = shiftButton.dataset.shift;
    saveState();
  }
  const navButton = event.target.closest("[data-screen]");
  if (navButton) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === navButton.dataset.screen));
    document.querySelectorAll(".nav-button").forEach((button) => button.classList.toggle("active", button === navButton));
  }
  const filterButton = event.target.closest("[data-rule-filter]");
  if (filterButton) {
    ruleFilter = filterButton.dataset.ruleFilter;
    renderRules();
  }
});

document.getElementById("modeToggle").addEventListener("click", () => {
  state.mode = state.mode === "normal" ? "chaos" : "normal";
  saveState();
  showToast(state.mode === "chaos" ? "Chaos mode on" : "Normal mode");
});

document.getElementById("minimumToggle").addEventListener("click", () => {
  state.mode = state.mode === "minimum" ? "normal" : "minimum";
  saveState();
  showToast(state.mode === "minimum" ? "Minimum viable mode on" : "Normal mode");
});

document.getElementById("priorityStackToggle").addEventListener("click", () => {
  const card = document.getElementById("priorityStackCard");
  const expanded = card.classList.toggle("expanded");
  card.classList.toggle("collapsed", !expanded);
  document.getElementById("priorityStackToggle").setAttribute("aria-expanded", String(expanded));
});

document.getElementById("taskDialogForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const submitter = event.submitter?.value;
  document.getElementById("taskDialog").close();
  if (submitter === "confirm") applyDialogAction();
});

document.getElementById("dialogConfirm").addEventListener("click", (event) => {
  event.preventDefault();
  document.getElementById("taskDialog").close();
  applyDialogAction();
});

document.getElementById("reviewForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const active = relevantTasks();
  const review = {
    date: TODAY,
    shift: state.activeShift,
    completed: active.filter((task) => taskState(task.id) === "completed").length,
    deferred: active.filter((task) => taskState(task.id) === "deferred").length,
    missedCritical: active.filter((task) => task.priority === "must_not_fail" && taskState(task.id) !== "completed").length,
    breakCause: document.getElementById("breakCause").value,
    completedNotes: document.getElementById("reviewCompletedNotes").value.trim(),
    deferredNotes: document.getElementById("reviewDeferredNotes").value.trim(),
    notes: document.getElementById("reviewNotes").value.trim()
  };
  state.shiftReviews.push(review);
  document.getElementById("reviewCompletedNotes").value = "";
  document.getElementById("reviewDeferredNotes").value = "";
  document.getElementById("reviewNotes").value = "";
  saveState();
  showToast("Review saved");
});

document.getElementById("resetDay").addEventListener("click", () => {
  if (confirm("Reset today's task progress? Reviews stay saved.")) resetToday();
});

document.getElementById("resetAll").addEventListener("click", () => {
  if (confirm("Reset all Shift Engine data on this device?")) resetAll();
});

document.getElementById("exportData").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `shift-engine-${TODAY}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importData").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    Object.assign(state, defaultState(), imported);
    saveState();
  } catch {
    alert("That JSON file could not be imported.");
  } finally {
    event.target.value = "";
  }
});

render();
