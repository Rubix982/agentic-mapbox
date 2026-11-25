// Does the Styles API give a public token Mapbox's Standard style, with the settings (schema) GL JS's setConfigProperty
// accepts, and do the classic styles have no settings at all?
//
// The record keeps each setting's name, type, default and allowed values, and none of Mapbox's descriptions.
import { apiExperiment, fact } from '../lib.mjs';

await apiExperiment({
  file: import.meta.url,
  question: "Does the Styles API give a public token the Standard style with its settings (schema), and do classic styles have none?",
  run: async (api) => {
    const get = async (id) => {
      const r = await api.get(`https://api.mapbox.com/styles/v1/mapbox/${id}`);
      return { status: r.status, kb: Math.round(r.buffer.length / 1024), style: r.json };
    };
    const std = await get('standard'), sat = await get('standard-satellite'), streets = await get('streets-v12');
    const summary = (schema) => Object.fromEntries(Object.entries(schema || {}).map(([k, v]) => [k, { type: v.type, default: v.default, ...(v.values ? { values: v.values } : {}), ...(v.minValue !== undefined ? { min: v.minValue, max: v.maxValue } : {}) }]));
    const s = summary(std.style?.schema), ss = summary(sat.style?.schema);
    const byType = Object.values(s).reduce((a, v) => ((a[v.type] = (a[v.type] || 0) + 1), a), {});
    const onlySat = Object.keys(ss).filter((k) => !s[k]), onlyStd = Object.keys(s).filter((k) => !ss[k]);
    return {
      facts: [
        fact('The Standard style comes back with a schema of settings', std.status === 200 && Object.keys(s).length > 0, { status: std.status, settings: Object.keys(s).length, by_type: byType, style_kb: std.kb }),
        fact('lightPreset is a string setting with values dawn, day, dusk, night and default day', JSON.stringify(s.lightPreset) === JSON.stringify({ type: 'string', default: 'day', values: ['dawn', 'day', 'dusk', 'night'] }), { lightPreset: s.lightPreset }),
        fact('Standard Satellite has a schema too, with fewer settings than Standard', sat.status === 200 && Object.keys(ss).length > 0 && Object.keys(ss).length < Object.keys(s).length, { settings: Object.keys(ss).length, only_in_satellite: onlySat, only_in_standard_count: onlyStd.length }),
        fact('The classic Streets v12 style has no schema', streets.status === 200 && !streets.style?.schema, { status: streets.status, top_level_keys: streets.style && Object.keys(streets.style) }),
      ],
      numbers: { standard_top_level_keys: std.style && Object.keys(std.style), standard_settings: s, standard_satellite_settings: Object.keys(ss) },
    };
  },
});
