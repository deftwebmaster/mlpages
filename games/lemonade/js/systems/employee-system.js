import { EMPLOYEE_ROLES, EMPLOYEE_TRAITS, generateApplicantName } from '../data/employees.js';
import { randRange, pick, chance } from '../utils/random.js';
import { clamp, roundTo } from '../utils/math.js';

const SHIFT_FACTORS = { closed: 0, morning: 0.5, afternoon: 0.5, full: 1 };

export function getUnlockedRoles(state) {
  return EMPLOYEE_ROLES.filter((role) => {
    const req = role.unlockRequirement || {};
    if (req.cupsSold && state.stats.totalCupsSold < req.cupsSold) return false;
    if (req.reputation && state.reputation.score < req.reputation) return false;
    if (req.businessValue && state.stats.businessValue < req.businessValue) return false;
    if (req.locationsOwned && state.locations.ownedIds.length < req.locationsOwned) return false;
    return true;
  });
}

export function generateApplicants(rng, state, count = 3) {
  const roles = getUnlockedRoles(state);
  if (!roles.length) return [];
  const applicants = [];
  for (let i = 0; i < count; i += 1) {
    const role = pick(rng, roles);
    const trait = chance(rng, 0.7) ? pick(rng, EMPLOYEE_TRAITS) : null;
    applicants.push({
      id: `applicant-${Date.now()}-${i}`,
      name: generateApplicantName(rng),
      roleId: role.id,
      wage: roundTo(role.baseWage * randRange(rng, 0.85, 1.25), 2),
      trait: trait?.id || null,
      speed: roundTo(randRange(rng, 0.7, 1.15), 2),
      service: roundTo(randRange(rng, 0.7, 1.15), 2),
      reliability: roundTo(randRange(rng, 0.75, 1.0), 2),
      salesAbility: roundTo(randRange(rng, 0.7, 1.15), 2),
      experience: 0,
      morale: 0.8,
      shift: 'closed',
    });
  }
  return applicants;
}

export function hireEmployee(state, applicant) {
  state.employees.push({ ...applicant, hiredDay: state.calendar.day });
  state.stats.employeesHired += 1;
}

export function fireEmployee(state, employeeId) {
  state.employees = state.employees.filter((e) => e.id !== employeeId);
}

export function assignShift(state, employeeId, shift) {
  const employee = state.employees.find((e) => e.id === employeeId);
  if (employee) employee.shift = shift;
}

export function giveRaise(state, employeeId, amount) {
  const employee = state.employees.find((e) => e.id === employeeId);
  if (employee) {
    employee.wage = roundTo(employee.wage + amount, 2);
    employee.morale = clamp(employee.morale + 0.1, 0, 1);
  }
}

export function dailyWageCost(state) {
  return roundTo(
    state.employees.reduce((sum, e) => sum + e.wage * (SHIFT_FACTORS[e.shift] ?? 0), 0),
    2
  );
}

export function serviceContributionFromEmployees(state) {
  const working = state.employees.filter((e) => e.shift !== 'closed');
  if (!working.length) return { speedBonus: 1, satisfactionBonus: 0 };
  const speedBonus = 1 + working.reduce((sum, e) => sum + (e.speed - 1) * (SHIFT_FACTORS[e.shift] ?? 0) * e.morale, 0) * 0.5;
  const satisfactionBonus = working.reduce((sum, e) => sum + (e.service - 1) * 0.05, 0);
  return { speedBonus: clamp(speedBonus, 0.6, 2.2), satisfactionBonus: clamp(satisfactionBonus, -0.1, 0.2) };
}

/** Called at day-end: experience grows for anyone who worked; morale drifts toward wage fairness. */
export function updateEmployeesEndOfDay(state) {
  const departures = [];
  for (const employee of state.employees) {
    if (employee.shift === 'closed') {
      employee.morale = clamp(employee.morale - 0.02, 0, 1);
      continue;
    }
    employee.experience += SHIFT_FACTORS[employee.shift] ?? 0;
    employee.speed = clamp(employee.speed + employee.experience * 0.001, 0.5, 1.6);
    employee.morale = clamp(employee.morale + randRange(Math.random, -0.03, 0.05), 0, 1);
    if (employee.morale < 0.2 && Math.random() < 0.15) {
      departures.push(employee.id);
    }
  }
  if (departures.length) {
    state.employees = state.employees.filter((e) => !departures.includes(e.id));
  }
  return departures;
}

export function getRole(roleId) {
  return EMPLOYEE_ROLES.find((r) => r.id === roleId);
}
