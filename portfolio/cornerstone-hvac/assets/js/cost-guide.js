const ranges = {
  minor: ["Minor service", "$150-$450", "Often tied to maintenance, airflow, simple controls, or accessible minor parts."],
  moderate: ["Moderate repair", "$400-$1,200", "May involve deeper electrical, airflow, drain, motor, or operational checks."],
  major: ["Major component repair", "$1,000-$3,500+", "Major components, age, access, warranty status, and system type can change the conversation."]
};

export function initCostGuide() {
  document.querySelectorAll("[data-cost-guide]").forEach((guide) => {
    const selects = guide.querySelectorAll("select");
    const result = guide.querySelector("[data-cost-result]");
    if (!selects.length || !result) return;
    const update = () => {
      const symptom = guide.querySelector("[data-cost-symptom]");
      const data = ranges[symptom ? symptom.value : "minor"] || ranges.minor;
      const warranty = guide.querySelector("[data-cost-warranty]");
      const warrantyText = warranty && warranty.value === "in" ? "Warranty status may reduce out-of-pocket cost." : "Out-of-warranty repairs depend on parts, access, and diagnosis.";
      result.innerHTML = "<h3>" + data[0] + "</h3><p><strong>Estimated range:</strong> " + data[1] + "</p><p>" + data[2] + " " + warrantyText + "</p><p class='fine-print'>These are general estimates for planning purposes only. They are not quotes and do not imply a diagnosis.</p>";
    };
    selects.forEach((select) => select.addEventListener("change", update));
    update();
  });
}
