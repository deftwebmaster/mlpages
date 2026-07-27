// Achievements are permanent once earned. `check(stats)` receives the cumulative
// lifetime stats object from state.stats and returns true when earned.

export const ACHIEVEMENTS = [
  { id: 'first-sale', name: 'First Sale', description: 'Sell your very first cup.',
    check: (s) => s.totalCupsSold >= 1 },
  { id: 'sold-out', name: 'Sold Out', description: 'Sell every cup you prepared in a single day.',
    check: (s) => s.soldOutDays >= 1 },
  { id: 'perfect-batch', name: 'Perfect Batch', description: 'Finish a day with zero waste.',
    check: (s) => s.zeroWasteDays >= 1 },
  { id: 'no-waste-streak', name: 'Lean Operation', description: 'Finish five days in a row with zero waste.',
    check: (s) => s.zeroWasteStreak >= 5 },
  { id: 'rush-hour', name: 'Rush Hour', description: 'Serve 30 customers in a single day.',
    check: (s) => s.bestDayCustomers >= 30 },
  { id: 'neighborhood-favorite', name: 'Neighborhood Favorite', description: 'Reach 15 reputation.',
    check: (s) => s.reputation >= 15 },
  { id: 'rain-or-shine', name: 'Rain or Shine', description: 'Turn a profit on a rainy day.',
    check: (s) => s.profitableRainDays >= 1 },
  { id: 'hundred-dollar-day', name: 'Hundred-Dollar Day', description: 'Earn $100 profit in a single day.',
    check: (s) => s.bestDayProfit >= 100 },
  { id: 'thousand-cup-club', name: 'Thousand-Cup Club', description: 'Sell 1,000 cups lifetime.',
    check: (s) => s.totalCupsSold >= 1000 },
  { id: 'first-employee', name: 'First Employee', description: 'Hire your first employee.',
    check: (s) => s.employeesHired >= 1 },
  { id: 'second-location', name: 'Second Location', description: 'Open a second location.',
    check: (s) => s.locationsOwned >= 2 },
  { id: 'wholesale-rookie', name: 'Wholesale Rookie', description: 'Complete your first wholesale contract.',
    check: (s) => s.contractsCompleted >= 1 },
  { id: 'lemon-millionaire', name: 'Lemon Millionaire', description: 'Reach a $1,000,000 business valuation.',
    check: (s) => s.businessValue >= 1000000 },
  { id: 'summer-survivor', name: 'Summer Survivor', description: 'Complete a full summer season.',
    check: (s) => s.seasonsCompleted.summer >= 1 },
  { id: 'price-war-winner', name: 'Price War Winner', description: 'Out-earn a competitor during a price war event.',
    check: (s) => s.priceWarsWon >= 1 },
  { id: 'five-star-service', name: 'Five-Star Service', description: 'Reach 95% average satisfaction over a day.',
    check: (s) => s.bestDaySatisfaction >= 0.95 },
];

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
