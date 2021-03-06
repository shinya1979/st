// LICENSE : MIT
"use strict";
var dictTranslator = require("./en-ja-translator");
function isEmptyText(text) {
    return /^\s*$/.test(text);
}
/**
 * if check node can ruby?
 * @param {Node} node textNode
 * @returns {boolean}
 */
function canTranslateNode(node) {
    var nameReg = /^(#text|PRE|CODE|SPAN|A|RUBY|RT)$/;
    var text = node.textContent;
    if (isEmptyText(text)) {
        return false;
    }
    var parentNodeName = node.parentNode.nodeName;
    if (nameReg.test(parentNodeName)) {
        return false;
    }
    if (text.length <= 2) {
        return false;
    }
    return true;
}
function translateNode(node) {
    var speRegExp = /([\s,.;:=@#<>\[\]{}()`'"!\/])/g;
    var text = node.textContent;
    var fragment = document.createDocumentFragment();
    var match, last_idx = 0;
    while (match = speRegExp.exec(text)) {
        var matchSeparator = match[0];
        var word = text.slice(last_idx, speRegExp.lastIndex - matchSeparator.length);
        last_idx = speRegExp.lastIndex;
        if (word.length === 0) {
            fragment.appendChild(document.createTextNode(matchSeparator));
            continue;
        }
        if (isEmptyText(word)) {
            fragment.appendChild(document.createTextNode(word));
            continue;
        }
        if (word.length > 4) {
            var jaWords = dictTranslator(word);
            if (jaWords && jaWords.length > 0) {
                fragment.appendChild(wrapRuby(word, jaWords[0]));
            } else {
                fragment.appendChild(wrapNonRuby(word));
            }
        } else {
            fragment.appendChild(wrapNonRuby(word));
        }
        fragment.appendChild(document.createTextNode(matchSeparator));
    }
    var lastWord = text.slice(last_idx);
    fragment.appendChild(wrapNonRuby(lastWord));
    return fragment;
}
function wrapNonRuby(text) {
    var span = document.createElement("span");
    span.className = "non-ruby-translator";
    span.appendChild(document.createTextNode(text));
    return span;
}
function wrapRuby(text, annotation) {
    var span = document.createElement("span");
    span.className = "ruby-translator";
    var ruby = document.createElement("ruby");
    var rt = document.createElement("rt");
    rt.appendChild(document.createTextNode(annotation));
    ruby.appendChild(document.createTextNode(text));
    ruby.appendChild(rt);
    span.appendChild(ruby);
    return span;
}

function annotateRubyToBody(body) {
    if (body == null) {
        return;
    }
    var r = document.evaluate(
        './/text()',
        body,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
    );
    var i;
    for (i = 0; i < r.snapshotLength; i++) {
        var node = r.snapshotItem(i);
        if (!canTranslateNode(node)) {
            continue;
        }
        var rubyContainerNode = translateNode(node);
        if (rubyContainerNode == null) {
            continue;
        }
        node.parentNode.replaceChild(rubyContainerNode, node);
    }
}

module.exports = {
    canTranslateNode: canTranslateNode,
    translateNode: translateNode,
    annotateRubyToBody: annotateRubyToBody
};
