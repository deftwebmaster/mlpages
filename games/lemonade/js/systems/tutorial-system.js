// A short, contextual first-day tutorial. Each step is tied to the screen
// where the relevant action happens (not a slideshow) and advances only when
// the player performs that action, or is skipped entirely at any point.

export const TUTORIAL_STEPS = [
  { id: 'welcome', screen: 'stand', next: 'buy-ingredients',
    title: 'Welcome to your stand!',
    message: "You've got a little cash and a driveway spot. Check the weather and cash up top, then head to Supplies to stock up." },
  { id: 'buy-ingredients', screen: 'supplies', next: 'set-recipe',
    title: 'Stock up',
    message: 'Buy lemons, sugar, water, ice, and cups — you need all five before you can prepare a batch.' },
  { id: 'set-recipe', screen: 'stand', next: 'set-price',
    title: 'Set your recipe',
    message: 'Tap "Edit Recipe" to adjust lemon, sugar, and ice. This changes the taste, cost, and who likes your lemonade.' },
  { id: 'set-price', screen: 'stand', next: 'prepare',
    title: 'Set a price',
    message: 'Use the price stepper to choose what you charge per cup. Watch how the neighborhood reacts.' },
  { id: 'prepare', screen: 'stand', next: 'start-day',
    title: 'Prepare your batch',
    message: 'Choose how many cups to prepare, then tap "Prepare Today" to get your batch ready.' },
  { id: 'start-day', screen: 'stand', next: 'results',
    title: "You're ready!",
    message: 'Tap "Start Day" to open for business and watch the customers roll in.' },
  { id: 'results', screen: 'results', next: 'done',
    title: 'Review your day',
    message: 'This screen explains what helped and hurt your sales. Tap Continue when you\'re ready for tomorrow.' },
  { id: 'done', screen: null, next: 'done', title: '', message: '' },
];

export function getCurrentTutorialStep(state) {
  if (!state.tutorial.enabled || state.tutorial.step === 'done') return null;
  return TUTORIAL_STEPS.find((s) => s.id === state.tutorial.step) || null;
}

export function isTutorialStepActive(state, screenId, stepId) {
  const step = getCurrentTutorialStep(state);
  return !!step && step.screen === screenId && (!stepId || step.id === stepId);
}

export function advanceTutorial(state, fromStepId) {
  if (!state.tutorial.enabled || state.tutorial.step !== fromStepId) return;
  const step = TUTORIAL_STEPS.find((s) => s.id === fromStepId);
  if (!step) return;
  if (!state.tutorial.completedSteps.includes(fromStepId)) {
    state.tutorial.completedSteps.push(fromStepId);
  }
  state.tutorial.step = step.next;
  if (step.next === 'done') state.tutorial.enabled = false;
}

export function skipTutorial(state) {
  state.tutorial.step = 'done';
  state.tutorial.enabled = false;
}
