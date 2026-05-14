export class PolicyEvaluationService { evaluate(rules: Array<{key:string;allow:boolean}>) { const deny = rules.find((r)=>!r.allow); return { allowed: !deny, reason: deny?.key || null } } }
