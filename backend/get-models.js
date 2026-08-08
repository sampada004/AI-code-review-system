fetch('https://openrouter.ai/api/v1/models')
  .then(r => r.json())
  .then(data => {
    const freeModels = data.data.filter(m => m.id.endsWith(':free') || (m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0"));
    console.log(freeModels.map(m => m.id).join('\n'));
  })
  .catch(console.error);
