// Test cases for xss.yaml (Express responses, DOM sinks, jQuery, template engines).
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");
const escapeHtml = require("escape-html");
const Handlebars = require("handlebars");
const nunjucks = require("nunjucks");
const Mustache = require("mustache");

const app = express();

app.get("/greet", (req, res) => {
  const name = req.query.name;
  // ruleid: aegiscode.javascript.xss.tainted-response
  res.send("<h1>Hello " + name + "</h1>");
  // ruleid: aegiscode.javascript.xss.tainted-response
  res.write(`<p>${req.query.msg}</p>`);
  // ok: aegiscode.javascript.xss.tainted-response
  res.send("<h1>Hello " + escapeHtml(name) + "</h1>");
  // ok: aegiscode.javascript.xss.tainted-response
  res.send({ name: name });
  // ok: aegiscode.javascript.xss.tainted-response
  res.json({ name });
  // ok: aegiscode.javascript.xss.tainted-response
  res.send("Page " + parseInt(req.query.page, 10));
});

function renderComment(comment) {
  const box = document.getElementById("box");
  // ruleid: aegiscode.javascript.xss.inner-html
  box.innerHTML = comment.text;
  // ruleid: aegiscode.javascript.xss.inner-html
  box.innerHTML += `<li>${comment.author}</li>`;
  // ok: aegiscode.javascript.xss.inner-html
  box.innerHTML = "<p>Loading...</p>";
  // ok: aegiscode.javascript.xss.inner-html
  box.innerHTML = DOMPurify.sanitize(comment.text);
  // ok: aegiscode.javascript.xss.inner-html
  box.textContent = comment.text;

  // ruleid: aegiscode.javascript.xss.insert-adjacent-html
  box.insertAdjacentHTML("beforeend", comment.html);
  // ruleid: aegiscode.javascript.xss.insert-adjacent-html
  document.createRange().createContextualFragment(comment.html);
  // ok: aegiscode.javascript.xss.insert-adjacent-html
  box.insertAdjacentHTML("beforeend", "<hr>");

  // ruleid: aegiscode.javascript.xss.document-write
  document.write("<div>" + location.hash + "</div>");
  // ok: aegiscode.javascript.xss.document-write
  document.write("<div>static</div>");
}

function showResults(data, query) {
  // ruleid: aegiscode.javascript.xss.jquery-html
  $("#results").html(data.html);
  // ruleid: aegiscode.javascript.xss.jquery-html
  $("#list").append("<li>" + query + "</li>");
  // ruleid: aegiscode.javascript.xss.jquery-html
  jQuery("#list").prepend(`<li>${query}</li>`);
  // ruleid: aegiscode.javascript.xss.jquery-html
  $("<div class='hit'>" + query + "</div>").appendTo("#list");
  // ok: aegiscode.javascript.xss.jquery-html
  $("#results").text(data.html);
  // ok: aegiscode.javascript.xss.jquery-html
  $("#results").html("<b>none</b>");
  // ok: aegiscode.javascript.xss.jquery-html
  $("#list").append($("<li>").text(query));
}

// ruleid: aegiscode.javascript.xss.template-escaping-disabled
nunjucks.configure("views", { autoescape: false });
// ok: aegiscode.javascript.xss.template-escaping-disabled
nunjucks.configure("views", { autoescape: true });
// ruleid: aegiscode.javascript.xss.template-escaping-disabled
const page = Handlebars.compile(source, { noEscape: true });
// ok: aegiscode.javascript.xss.template-escaping-disabled
const safePage = Handlebars.compile(source);

Handlebars.registerHelper("bold", function (text) {
  // ruleid: aegiscode.javascript.xss.template-escaping-disabled
  return new Handlebars.SafeString("<b>" + text + "</b>");
});
Handlebars.registerHelper("rule", function () {
  // ok: aegiscode.javascript.xss.template-escaping-disabled
  return new Handlebars.SafeString("<hr>");
});

// ruleid: aegiscode.javascript.xss.template-escaping-disabled
Mustache.escape = function (text) { return text; };
