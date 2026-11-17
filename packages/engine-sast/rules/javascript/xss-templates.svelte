<!-- Test cases for xss-templates.yaml (Svelte). Deliberately vulnerable, never shipped. -->
<!-- ruleid: aegiscode.javascript.xss.template-unescaped-output -->
<div>{@html comment.body}</div>
<!-- ok: aegiscode.javascript.xss.template-unescaped-output -->
<div>{comment.body}</div>
