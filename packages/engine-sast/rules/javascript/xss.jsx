// React test cases for xss.yaml.
// This file is deliberately vulnerable and is never shipped in the npm package.
import DOMPurify from "dompurify";

export function Comment({ comment }) {
  // ruleid: aegiscode.javascript.xss.react-dangerously-set-inner-html
  return <div className="comment" dangerouslySetInnerHTML={{ __html: comment.body }} />;
}

export function SafeComment({ comment }) {
  return (
    // ok: aegiscode.javascript.xss.react-dangerously-set-inner-html
    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }} />
  );
}

export function Static() {
  return (
    // ok: aegiscode.javascript.xss.react-dangerously-set-inner-html
    <div dangerouslySetInnerHTML={{ __html: "<b>AegisCode</b>" }} />
  );
}

export function Plain({ comment }) {
  // ok: aegiscode.javascript.xss.react-dangerously-set-inner-html
  return <div>{comment.body}</div>;
}

export function Created({ html }) {
  // ruleid: aegiscode.javascript.xss.react-dangerously-set-inner-html
  return React.createElement("div", { dangerouslySetInnerHTML: { __html: html } });
}
