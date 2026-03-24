'use strict';
// Validate required environment variables at startup

class EnvChecker {
  constructor() {
    this._rules = [];
  }

  require(name, options) {
    options = options || {};
    this._rules.push({ name, required: true, ...options });
    return this;
  }

  optional(name, options) {
    options = options || {};
    this._rules.push({ name, required: false, ...options });
    return this;
  }

  check(env) {
    env = env || process.env;
    const errors = [];
    const warnings = [];
    const values = {};

    this._rules.forEach((rule) => {
      const raw = env[rule.name];

      if (raw === undefined || raw === '') {
        if (rule.required) {
          errors.push('Missing required env var: ' + rule.name);
        } else if (rule.default !== undefined) {
          values[rule.name] = rule.default;
        }
        return;
      }

      let value = raw;
      if (rule.type === 'number') {
        value = Number(raw);
        if (isNaN(value)) errors.push(rule.name + ' must be a number, got: ' + raw);
      } else if (rule.type === 'boolean') {
        value = raw === 'true' || raw === '1';
      } else if (rule.type === 'json') {
        try { value = JSON.parse(raw); } catch (_) {
          errors.push(rule.name + ' must be valid JSON');
        }
      }

      if (rule.pattern && !new RegExp(rule.pattern).test(raw)) {
        errors.push(rule.name + ' does not match expected pattern');
      }

      values[rule.name] = value;
    });

    return { ok: errors.length === 0, errors, warnings, values };
  }

  assert(env) {
    const result = this.check(env);
    if (!result.ok) {
      result.errors.forEach((e) => console.error('[env-checker] ' + e));
      process.exit(1);
    }
    return result.values;
  }
}

module.exports = EnvChecker;
