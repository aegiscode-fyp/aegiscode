<!-- Test cases for xss-templates.yaml (Vue). Deliberately vulnerable, never shipped. -->
<template>
  <!-- ruleid: aegiscode.javascript.xss.template-unescaped-output -->
  <div v-html="comment.body"></div>
  <!-- ok: aegiscode.javascript.xss.template-unescaped-output -->
  <div>{{ comment.body }}</div>
</template>
