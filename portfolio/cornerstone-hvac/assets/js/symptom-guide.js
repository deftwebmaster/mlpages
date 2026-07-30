const states = {
  "burning-smell": ["Emergency", "Turn the system off and call for immediate help. If you see smoke or sparking equipment, leave the property and contact emergency services."],
  "co-alarm": ["Emergency", "Leave the home if a carbon monoxide alarm is active. Contact emergency services before calling an HVAC contractor."],
  "no-power": ["Same-Day Service", "A system that will not turn on during extreme weather should be checked soon, especially for vulnerable occupants."],
  "warm-air": ["Same-Day Service", "Warm air during cooling season can point to airflow, control, refrigerant, or outdoor-unit problems."],
  "water": ["Same-Day Service", "Water near indoor equipment can create damage risk, especially near electrical components."],
  "frozen": ["Same-Day Service", "A frozen coil is a symptom. Turn cooling off and schedule service so airflow and system conditions can be checked."],
  "blank-thermostat": ["Same-Day Service", "A blank thermostat may be a simple battery issue or a system safety shutoff. Check batteries if safe, then schedule service."],
  "noise": ["Schedule Soon", "Unusual noises should be checked before they become larger repairs. Turn the system off if the sound is severe."],
  "weak-airflow": ["Schedule Soon", "Weak airflow can come from filters, ducts, blower issues, or equipment condition. Start with a filter check if accessible."]
};

export function initSymptomGuide() {
  document.querySelectorAll("[data-symptom-guide]").forEach((guide) => {
    const select = guide.querySelector("select");
    const result = guide.querySelector("[data-symptom-result]");
    if (!select || !result) return;
    select.addEventListener("change", () => {
      const state = states[select.value];
      if (!state) {
        result.innerHTML = "<p>Select a symptom to see suggested urgency.</p>";
        result.dataset.state = "";
        return;
      }
      result.dataset.state = state[0].toLowerCase().replace(/\s+/g, "-");
      result.innerHTML = "<h3>" + state[0] + "</h3><p>" + state[1] + "</p><p class='fine-print'>This is not a diagnosis. Use safety judgment first.</p>";
    });
  });
}
