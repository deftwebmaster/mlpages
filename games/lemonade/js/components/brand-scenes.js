const WEATHER_CLASS = {
  sunny: 'sunny',
  'heat-wave': 'hot',
  humid: 'hot',
  cloudy: 'cloudy',
  'light-rain': 'rainy',
  'heavy-rain': 'rainy',
  'storm-risk': 'stormy',
  windy: 'windy',
  'cold-front': 'cloudy'
};

export function weatherSceneClass(type) {
  return WEATHER_CLASS[type] || 'sunny';
}

export function splashEmpireSceneHtml() {
  return `
    <div class="lemon-empire-scene" aria-hidden="true">
      <div class="empire-skyline">
        <span class="tower t1"></span>
        <span class="tower t2"></span>
        <span class="tower t3"></span>
      </div>
      <div class="sunburst"></div>
      <div class="lemon-orbit o1"></div>
      <div class="lemon-orbit o2"></div>
      <div class="lemon-orbit o3"></div>
      ${lemonadeStandSceneHtml({ variant: 'splash' })}
    </div>
  `;
}

export function lemonadeStandSceneHtml({ variant = 'default', weather = 'sunny', employeeCount = 0, cups = 0, customers = 0 } = {}) {
  const activeEmployees = Math.min(3, Math.max(0, employeeCount));
  const visibleCups = Math.min(5, Math.max(0, Math.round(cups / 12)));
  const visibleCustomers = Math.min(4, Math.max(0, customers));
  return `
    <div class="lemonade-scene lemonade-scene--${variant} lemonade-scene--${weatherSceneClass(weather)}" aria-hidden="true">
      <div class="scene-sun"></div>
      <div class="scene-cloud c1"></div>
      <div class="scene-cloud c2"></div>
      <div class="scene-rain"></div>
      <div class="scene-awning">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="scene-counter">
        <div class="scene-sign">FRESH</div>
        <div class="scene-pitcher"></div>
        <div class="scene-cups">
          ${Array.from({ length: visibleCups || 3 }, () => '<span></span>').join('')}
        </div>
      </div>
      <div class="scene-base"></div>
      <div class="scene-team">
        ${Array.from({ length: activeEmployees }, (_, i) => `<span class="team-member m${i + 1}"></span>`).join('')}
      </div>
      <div class="scene-customers">
        ${Array.from({ length: visibleCustomers }, (_, i) => `<span class="scene-customer p${i + 1}"></span>`).join('')}
      </div>
      <div class="scene-ground"></div>
    </div>
  `;
}
