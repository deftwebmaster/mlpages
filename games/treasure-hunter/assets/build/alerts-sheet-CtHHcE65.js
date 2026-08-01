import{s as i,e as l,o as n}from"./index-BJwu9a6s.js";function o(s){return{info:"ℹ",success:"✓",warning:"⚠",expedition:"➤",milestone:"★",achievement:"★"}[s]||"•"}function c(){const s=i.getState(),a=`
    <h2 id="alerts-title">Alerts</h2>
    <div class="stack" style="margin-top: var(--space-3);">
      ${s.alerts.length?s.alerts.map(t=>`
        <div class="alert-item">
          <span class="alert-item__icon">${o(t.type)}</span>
          <div class="spacer">
            <strong class="text-sm">${l(t.title)}</strong>
            <p class="text-sm">${l(t.message)}</p>
          </div>
          <button class="icon-btn" data-dismiss="${t.id}" aria-label="Dismiss">✕</button>
        </div>
      `).join(""):'<p class="empty-state">No alerts.</p>'}
    </div>
  `;n(a,{labelledBy:"alerts-title",onMount:t=>{t.querySelectorAll("[data-dismiss]").forEach(e=>{e.addEventListener("click",()=>{i.dispatch("DISMISS_ALERT",{alertId:e.dataset.dismiss}),e.closest(".alert-item").remove()})})}})}export{c as openAlertsSheet};
