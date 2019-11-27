"use strict";

function BashHighlightScheme(originalHighlighter)
{
    this.id = "BashHighlight";

    this.labelMap =
    {
        "if": "#cc33cc",
        "else": "#cc33cc"
    };

    this.labelMap[SyntaxHelper.COMMENT] = "green";
    this.labelMap[SyntaxHelper.STRING] = "yellow";
    this.labelMap[SyntaxHelper.NUMBER_START] = "pink";
    this.labelMap[SyntaxHelper.NUMBER_STOP] = "pink";
    this.labelMap[SyntaxHelper.END_SCRIPT] = "#44ffff"; // End script.


    this.labelSearchSeparators =
    {
    };

    this.labelSearchSeparators[SyntaxHelper.NUMBER_START] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.NUMBER_STOP] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.STRING] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.COMMENT] = SyntaxHelper.SEARCH_ALL;

    this.labelSearchRegexes =
    {
        start:
        {
        },
        end:
        {
        }
    };

    this.labelExtensions =
    {
        start: {},
        end: {}
    };

    this.labelSearchRegexes.start[SyntaxHelper.COMMENT] = new RegExp("\\\#", "g");
    this.labelSearchRegexes.start[SyntaxHelper.STRING] = new RegExp("[\\\"\\\']", "g");
    // this.labelSearchRegexes.start[SyntaxHelper.END_SCRIPT] = new RegExp("\\<\\w*/\\w*script\\w*\\>");

    this.labelSearchRegexes.end[SyntaxHelper.NUMBER_START] = SyntaxHelper.regexps.NUMBER_START;
    this.labelSearchRegexes.end[SyntaxHelper.NUMBER_STOP] = SyntaxHelper.regexps.NUMBER_STOP;
    this.labelSearchRegexes.end[SyntaxHelper.STRING] = new RegExp("[\\\"\\\']", "g");


    this.labelSearchFunctions =
    {
        start: {},
        end: {}
    };

    this.multiLineLabels =
    {

    };

    this.highlightSchemeSpecificLabels =
    {

    };

    // this.transitionHighlighterLabels[SyntaxHelper.TRANSIT_HIGHLIGHT_BLOCK] = originalHighlighter;

    var addedLabels = {};
    this.labelPrecedence =
    [["COMMENT"]];

    // Add any un-recorded labels to the precedence list.
    for (var i = 0; i < this.labelPrecedence.length; i++)
    {
        if (typeof this.labelPrecedence[i] !== "object")
        {
            addedLabels[this.labelPrecedence[i]] = true;
        }
        else
        {
            for (var j = 0; j < this.labelPrecedence[i].length; j++)
            {
                addedLabels[this.labelPrecedence[i][j]] = true;
            }
        }
    }

    for (var label in this.labelMap)
    {
        if (!addedLabels[label])
        {
            this.labelPrecedence.push(label);

            addedLabels[label] = true;
        }
    }
}

function JavaHighlightScheme(originalHighlighter)
{
    this.id = "JavaHighlight";

    this.labelMap =
    {
        "if": "#ca33ca",
        "else": "#ca33ca",
        "void": "#ca40cc",
        "int": "#ca40cc",
        "double": "#ca40cc",
        "float": "#ca40cc",
        "long": "#ca40cc",
        "short": "#ca40cc",
        "char": "#ca40cc",
        "boolean": "#ca40cc",
        "{": "#00ffff",
        "}": "#00ffff",
        "(": "#00ffff",
        ")": "#00ffff",
        "[": "#00ffff",
        "]": "#00ffff",
        "==": "#33aabb",
        "===": "#33aabb",
        "!": "#33aabb",
        "=": "#33aabb",
        ">": "#33aabb",
        "<": "#33aabb",
        ">=": "#33aabb",
        "<=": "#33aabb",
        "%": "#33aabb",
        "+": "#33aabb",
        "-": "#33aabb",
        "*": "#33aabb",
        "/": "#33aabb",
        "%=": "#33aabb",
        "+=": "#33aabb",
        "-=": "#33aabb",
        "*=": "#33aabb",
        "/=": "#33aabb",
        ";": "#33aabb",
        ",": "#c0aabb",
        ":": "#f0aabb",
        "&": "#33aabb",
        "|": "#33aabb",
        "do": "#ab00cd",
        "while": "#ab00cd",
        "for": "#ab00cd",
        "in": "#ab70cd",
        "false": "#abab00",
        "true": "#abab00",
        "null": "#00ff66",
        "this": "#00ffff",
        "super": "#00ffff",
        "const": "#ffee00",
        "return": "#ff6677",
        "switch": "#00ccff",
        "case": "#00ccff",
        "default": "#00ccff",
        "break": "#bb00ee",
        "new": "#bb00ee",
        "throw": "#ff6677",
        "try": "#aaffff",
        "instanceof": "#77ff77",
        "catch": "#aaffff",
        "finally": "#aaffff",
        "class": "#77ffaa",
        "public": "#aaffaa",
        "private": "#aaffaa",
        "protected": "#aaffaa",
        "interface": "#77ffaa",
        "extends": "#77ee99",
        "implements": "#77ee99",
        "static": "#77ee99",
        "volatile": "#77ee99",
        "search": "#eeddff",
        "indexOf": "#eeddff",
        "startsWith": "#eeddff",
        "endsWith": "#eeddff",
        "replace": "#eeddff",
        "Math": "#ffaaff",
        "String": "#aaaaff",
        "Double": "#aaaaff",
        "Boolean": "#aaaaff",
        "Character": "#aaaaff",
        "Integer": "#aaaaff",
        "Thread": "#aaaaff",
        "InetAddress": "#ccccff",
        "Collections": "#ccccff",
        "Comparator": "#ccccff",
        "Exception": "#ffaaaa",
        "log": "#eeaaee",
        "add": "#eeaaee",
        "put": "#eeaaee",
        "println": "#eeaaee",
        "System": "#eeddcc",
        "out": "#aaaaff",
        "err": "#aaaaff",
        "in": "#aaaaff",
        "ArrayList": "#ccaaff",
        "HashMap": "#ccaaff",
        "TreeMap": "#ccaaff",
        "HashSet": "#ccaaff",
        "TreeSet": "#ccaaff",
        "Set": "#ccaaff",
        "List": "#ccaaff",
        "Stack": "#eeaaff",
        "Queue": "#eeaaff",
        "LinkedList": "#aaaaff",
        "StringBuilder": "#ddaaff",
        "Scanner": "#ddaaff",
        "toString": "#aaaaff",
        "final": "#ffcccc",
        "Map": "#ccaaff",
        "push": "#eeddff",
        "get": "#eeddff",
        "pop": "#eeddff",
        "substring": "#eeddff",
        "substr": "#eeddff",
        "size": "#77eecc",
        "length": "#77eecc",
        "Iterator": "#ffddcc",
        "hasNext": "#ccddff",
        "next": "#ddffcc",
        "remove": "#ffddcc",
        "@": "#ffaaaa",
        "import": "#cccc77",
        "package": "#cccc77",
        "toUpperCase": "#eeddff",
        "toLowerCase": "#eeddff",
        "throws": "#ff88ff"
    };


    this.labelMap[SyntaxHelper.COMMENT] = "green";
    this.labelMap[SyntaxHelper.COMMENT_MULTI_LINE] = "green";
    this.labelMap[SyntaxHelper.STRING] = "yellow";
    this.labelMap["CHAR"] = "orange";
    this.labelMap[SyntaxHelper.NUMBER_START] = "pink";
    this.labelMap[SyntaxHelper.NUMBER_STOP] = "pink";
    this.labelMap[SyntaxHelper.END_SCRIPT] = "#44ffff"; // End script.


    this.labelSearchSeparators =
    {
    };

    this.labelSearchSeparators[SyntaxHelper.NUMBER_START] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.NUMBER_STOP] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.STRING] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["CHAR"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["@"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.COMMENT] = SyntaxHelper.SEARCH_ALL;
    // this.labelSearchSeparators[SyntaxHelper.END_SCRIPT] = SyntaxHelper.SEARCH_ALL,
    this.labelSearchSeparators[SyntaxHelper.COMMENT_MULTI_LINE] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["{"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["}"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["("] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators[")"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["["] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["]"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["!"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators[";"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["&"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["|"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators[","] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators[":"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["="] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["=="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["==="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["=>"] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators[">="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["<="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators[">"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["<"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["%"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["*"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["+"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["-"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["/"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;

    this.labelSearchRegexes =
    {
        start:
        {
        },
        end:
        {
        }
    };

    this.labelExtensions =
    {
        start: {},
        end: {}
    };

    
    this.labelSearchRegexes.start[SyntaxHelper.COMMENT_MULTI_LINE] = new RegExp("\\\/\\\*", "g");
    this.labelSearchRegexes.start[SyntaxHelper.COMMENT] = new RegExp("\\\/\\\/", "g");
    this.labelSearchRegexes.start[SyntaxHelper.STRING] = new RegExp("[\\\"]", "g");
    this.labelSearchRegexes.start["CHAR"] = new RegExp("[\\\']", "g");
    // this.labelSearchRegexes.start[SyntaxHelper.END_SCRIPT] = new RegExp("\\<\\w*/\\w*script\\w*\\>");

    this.labelSearchRegexes.end[SyntaxHelper.COMMENT_MULTI_LINE] = new RegExp("\\\*\\\/", "g");
    this.labelSearchRegexes.end[SyntaxHelper.STRING] = new RegExp("[\\\"]", "g");
    this.labelSearchRegexes.end["CHAR"] = new RegExp("[\\\']", "g");
    this.labelSearchRegexes.end["@"] = new RegExp("\\@\\w+", "g");
    this.labelSearchRegexes.end[SyntaxHelper.NUMBER_START] = SyntaxHelper.regexps.NUMBER_START;
    this.labelSearchRegexes.end[SyntaxHelper.NUMBER_STOP] = SyntaxHelper.regexps.NUMBER_STOP;



    this.labelSearchFunctions =
    {
        start: {},
        end: {}
    };

    this.multiLineLabels =
    {
        "LONG_QUOTE": true
    };

    this.multiLineLabels[SyntaxHelper.COMMENT_MULTI_LINE] = true;

    this.highlightSchemeSpecificLabels =
    {

    };

    // this.transitionHighlighterLabels[SyntaxHelper.TRANSIT_HIGHLIGHT_BLOCK] = originalHighlighter;

    var addedLabels = {};
    this.labelPrecedence =
    [["COMMENT", "QUOTE", "CHAR", SyntaxHelper.COMMENT_MULTI_LINE], [">", "=", "<"]];

    // Add any un-recorded labels to the precedence list.
    for (var i = 0; i < this.labelPrecedence.length; i++)
    {
        if (typeof this.labelPrecedence[i] !== "object")
        {
            addedLabels[this.labelPrecedence[i]] = true;
        }
        else
        {
            for (var j = 0; j < this.labelPrecedence[i].length; j++)
            {
                addedLabels[this.labelPrecedence[i][j]] = true;
            }
        }
    }

    for (var label in this.labelMap)
    {
        if (!addedLabels[label])
        {
            this.labelPrecedence.push(label);

            addedLabels[label] = true;
        }
    }
}


function JavaScriptHighlightScheme(originalHighlighter)
{
    this.id = "JavaScriptHighlight";

    this.labelMap =
    {
        "LONG_QUOTE": "red",
        "if": "#ca53ca",
        "else": "#ca53ca",
        "function": "#ca60cc",
        "{": "#30ffff",
        "}": "#30ffff",
        "==": "#70aabb",
        "===": "#70aabb",
        "!": "#70aabb",
        "=": "#70aabb",
        ">": "#70aabb",
        "<": "#70aabb",
        "%": "#70aabb",
        "+": "#70aabb",
        "-": "#70aabb",
        "*": "#70aabb",
        "/": "#70aabb",
        "do": "#ab00cd",
        "while": "#ab00cd",
        "for": "#ab00cd",
        "in": "#ab70cd",
        "false": "#abab00",
        "true": "#abab00",
        "null": "#00ff66",
        "undefined": "#bbbbdd",
        "=>": "#ea00ea",
        "this": "#00ffff",
        "let": "#ffaacc",
        "var": "#ffaadd",
        "const": "#ffee00",
        "return": "#ff6677",
        "switch": "#00ccff",
        "case": "#00ccff",
        "default": "#00ccff",
        "break": "#bb00ee",
        "new": "#bb00ee",
        "throw": "#ff6677",
        "try": "#aaffff",
        "typeof": "#77ff77",
        "createElement": "#eeffee",
        "catch": "#aaffff",
        "class": "#77ffaa",
        "get": "#77ee99",
        "extends": "#77ee99",
        "__constructor": "#77ee99",
        "async": "#aa66aa",
        "await": "#aa66aa",
        "document": "#bbffbb",
        "window": "#bbffbb",
        "alert": "#ffaabb",
        "confirm": "#ffaabb",
        "prompt": "#ffaabb",
        "innerHTML": "#ff7aaa",
        "outerHTML": "#ff7aaa",
        "search": "#eeddff",
        "indexOf": "#eeddff",
        "lastIndexOf": "#eeddff",
        "replace": "#eeddff",
        "Math": "#ffaaff",
        "innerText": "#ff7eaa",
        "me": "#aaffaa",
        "getContext": "#aaeeff",
        "style": "#ffeeff",
        ";": "#ffaaff",
        "save": "#a000ff",
        "restore": "#a000ff",
        "ctx": "#a060ff",
        "gl": "#a060ff",
        "continue": "#88bbcc",
        "delete": "#ff7799",
        "concat": "#aaffaa",
        "sort": "#aaffaa",
        "textContent": "#7affaa",
        "createElement": "#7affaa",
        "appendChild": "#7affaa",
        "script": "#ffccff",
        "removeChild": "#7affaa",
        "addEventListener": "#7affaa",
        "then": "#7aff99",
        "Promise": "#7aff99",
        "push": "#eeddff",
        "pop": "#eeddff",
        "substring": "#eeddff",
        "substr": "#eeddff",
        "splice": "#eeddff",
        "length": "#77eecc",
        "eval": "#ff7777",
        "JSON": "#aaffaa",
        "__proto__": "#ffaaaa",
        "prototype": "#aaaaff",
        "RegExp": "#aaaaff",
        "clientWidth": "#eeeeff",
        "clientHeight": "#eeeeff",
        "[": "#80aaff",
        "]": "#80aaff",
        "|": "#80aaff",
        "&": "#80aaff",
        "^": "#80aaff",
        "(": "#ffcece",
        ")": "#ffcece"
    };


    this.labelMap[SyntaxHelper.COMMENT] = "green";
    this.labelMap[SyntaxHelper.COMMENT_MULTI_LINE] = "green";
    this.labelMap[SyntaxHelper.STRING + "1"] = "yellow";
    this.labelMap[SyntaxHelper.STRING + "2"] = "yellow";
    this.labelMap[SyntaxHelper.NUMBER_START] = "pink";
    this.labelMap[SyntaxHelper.NUMBER_STOP] = "pink";
    this.labelMap[SyntaxHelper.END_SCRIPT] = "#44ffff"; // End script.


    this.labelSearchSeparators =
    {
    };

    this.labelSearchSeparators[SyntaxHelper.NUMBER_START] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.NUMBER_STOP] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.STRING + "1"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.STRING + "2"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.COMMENT] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["__constructor"] = SyntaxHelper.SEARCH_ALL;
    // this.labelSearchSeparators[SyntaxHelper.END_SCRIPT] = SyntaxHelper.SEARCH_ALL,
    this.labelSearchSeparators[SyntaxHelper.COMMENT_MULTI_LINE] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["LONG_QUOTE"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["{"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["}"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["("] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators[")"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["["] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["]"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["^"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["&"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["|"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["!"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators[";"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["=="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["==="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["=>"] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators[">"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["<"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["%"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["*"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["+"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["-"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["/"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;

    this.labelSearchRegexes =
    {
        start:
        {
        },
        end:
        {
        }
    };

    this.labelExtensions =
    {
        start: {},
        end: {}
    };

    this.labelSearchRegexes.start[SyntaxHelper.COMMENT_MULTI_LINE] = new RegExp("\\\/\\\*", "g");
    this.labelSearchRegexes.start[SyntaxHelper.COMMENT] = new RegExp("\\\/\\\/", "g");
    this.labelSearchRegexes.start[SyntaxHelper.STRING + "1"] = new RegExp("[\\\"]", "g");
    this.labelSearchRegexes.start[SyntaxHelper.STRING + "2"] = new RegExp("[\\\']", "g");
    this.labelSearchRegexes.start["LONG_QUOTE"] = new RegExp("\\\`", "g");
    // this.labelSearchRegexes.start[SyntaxHelper.END_SCRIPT] = new RegExp("\\<\\w*/\\w*script\\w*\\>");

    this.labelSearchRegexes.end[SyntaxHelper.COMMENT_MULTI_LINE] = new RegExp("\\\*\\\/", "g");
    this.labelSearchRegexes.end[SyntaxHelper.STRING + "1"] = new RegExp("[\\\"]", "g");
    this.labelSearchRegexes.end[SyntaxHelper.STRING + "2"] = new RegExp("[\\\']", "g");
    this.labelSearchRegexes.end["LONG_QUOTE"] = this.labelSearchRegexes.start["LONG_QUOTE"];
    this.labelSearchRegexes.end["__constructor"] = new RegExp("constructor", "g");
    this.labelSearchRegexes.end[SyntaxHelper.NUMBER_START] = SyntaxHelper.regexps.NUMBER_START;
    this.labelSearchRegexes.end[SyntaxHelper.NUMBER_STOP] = SyntaxHelper.regexps.NUMBER_STOP;


    this.labelSearchFunctions =
    {
        start: {},
        end: {}
    };

    this.multiLineLabels =
    {
        "LONG_QUOTE": true
    };

    this.multiLineLabels[SyntaxHelper.COMMENT_MULTI_LINE] = true;

    this.highlightSchemeSpecificLabels =
    {

    };

    // this.transitionHighlighterLabels[SyntaxHelper.TRANSIT_HIGHLIGHT_BLOCK] = originalHighlighter;

    var addedLabels = {};
    this.labelPrecedence =
    [["COMMENT", "QUOTE2", "QUOTE1", "LONG_QUOTE", SyntaxHelper.COMMENT_MULTI_LINE], "=>", [">", "=", "<"]];

    // Add any un-recorded labels to the precedence list.
    for (var i = 0; i < this.labelPrecedence.length; i++)
    {
        if (typeof this.labelPrecedence[i] !== "object")
        {
            addedLabels[this.labelPrecedence[i]] = true;
        }
        else
        {
            for (var j = 0; j < this.labelPrecedence[i].length; j++)
            {
                addedLabels[this.labelPrecedence[i][j]] = true;
            }
        }
    }

    for (var label in this.labelMap)
    {
        if (!addedLabels[label])
        {
            this.labelPrecedence.push(label);

            addedLabels[label] = true;
        }
    }
}

function CSSSyntaxHighlightScheme()
{
    this.id = "CSSHighlight";

    this.labelMap =
    {
        "#": "#00ff77",
        ".": "#00ff77",
        "@": "#00ff77",
        "body": "#00bbbb",
        "html": "#00bbbb",
        "p": "#00bbbb",
        "br": "#00bbbb",
        "button": "#9077eb",
        "hr": "#9077eb",
        "input": "#9077eb",
        "h1": "#9077eb",
        "textarea": "#9077eb",
        "center": "#9077eb",
        "a": "#9077eb",
        "div": "#9077eb",
        "ol": "#9077eb",
        "li": "#9077eb",
        "tr": "#9077eb",
        "td": "#9077eb",
        "thead": "#9077eb",
        "tbody": "#9077eb",
        "table": "#9077eb",
        "background": "#bb00bb",
        "rgba": "#aa4488",
        "color": "#bb00bb",
        "gradient": "#aa4488",
        "linear": "#aa4488",
        "radial": "#aa4488",
        "url": "#ccccdd",
        "border": "#bb00bb",
        "radius": "#bb00bb",
        "outline": "#bb00bb",
        "position": "#ffff00",
        "display": "#ffff00",
        "top": "#bb00bb",
        "left": "#bb00bb",
        "bottom": "#bb00bb",
        "right": "#bb00bb",
        "padding": "#bb00bb",
        "margin": "#bb00bb",
        "none": "#00ffaa",
        "auto": "#00ffaa",
        "block": "#00ffaa",
        "absolute": "#00ffaa",
        "flex": "#00ffaa",
        "grow": "#00ffaa",
        "style": "#00ffaa",
        "width": "#bb00bb",
        "height": "#bb00bb",
        "min": "#bb00bb",
        "max": "#bb00bb",
        "transform": "#cc04cc",
        "rotate": "#00cccc",
        "scale": "#00cccc",
        "font": "#bb00bb",
        "box-shadow": "#00cccc",
        "text-shadow": "#00cccc",
        "cursor": "#00cccc",
        "filter": "#00cccc",
        "size": "#bb00bb",
        "image": "#bb00bb",
        "matrix": "#00cccc",
        "overflow-x": "#bb00bb",
        "overflow-y": "#bb00bb",
        "animation": "#bb00bb",
        "transition": "#bb00bb",
        "NUMBER": "#00ff77",
        "text": "#bb00bb",
        "line": "#bb00bb",
        "align": "#bb00bb",
        "indent": "#bb00bb",
        "red": "#ffaaaa",
        "green": "#aaffaa",
        "blue": "#aaaaff",
        "orange": "#ffaa44",
        "purple": "#ffaaff",
        "gray": "#cccccc",
        "brown": "#aaaa77",
        "black": "#bbbbcc",
        "yellow": "#ffffaa",
        "pink": "#ffaaff",
        "violet": "#ff00ff"
    };

    this.labelMap[SyntaxHelper.COMMENT] = "#ff50ff";

    this.labelSearchSeparators =
    {
    };

    this.labelSearchSeparators["#"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["."] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["@"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["NUMBER"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.COMMENT] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["h1"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["box-shadow"] = SyntaxHelper.CSS_LABEL_SEPARATORS;
    this.labelSearchSeparators["text-shadow"] = SyntaxHelper.CSS_LABEL_SEPARATORS;
    this.labelSearchSeparators["overflow-x"] = SyntaxHelper.CSS_LABEL_SEPARATORS;
    this.labelSearchSeparators["overflow-y"] = SyntaxHelper.CSS_LABEL_SEPARATORS;

    this.labelSearchRegexes =
    {
        start:
        {
        },
        end:
        {
        }
    };

    //this.labelSearchRegexes.start["#"] = new RegExp("\\#\\w+", "g");
    this.labelSearchRegexes.start[SyntaxHelper.COMMENT] = new RegExp("\\/\\*", "g");

    this.labelSearchRegexes.end["#"] = new RegExp("\\#\\w+", "g");
    this.labelSearchRegexes.end["."] = new RegExp("\\.\\w+", "g");
    this.labelSearchRegexes.end["@"] = new RegExp("\\@\\w+", "g");
    this.labelSearchRegexes.end["h1"] = new RegExp("h[0-6]", "g");
    this.labelSearchRegexes.end["NUMBER"] = new RegExp("[0-9]", "g");

    this.labelSearchRegexes.end[SyntaxHelper.COMMENT] = new RegExp("\\*\\/", "g");

    this.labelExtensions =
    {
        start: {},
        end: {}
    };

    this.multiLineLabels =
    {

    };

    this.multiLineLabels[SyntaxHelper.COMMENT] = true;

    this.highlightSchemeSpecificLabels =
    {

    };

    var addedLabels = {};
    this.labelPrecedence =
    [SyntaxHelper.COMMENT];

    // Add any un-recorded labels to the precedence list.
    for (var i = 0; i < this.labelPrecedence.length; i++)
    {
        if (typeof this.labelPrecedence[i] !== "object")
        {
            addedLabels[this.labelPrecedence[i]] = true;
        }
        else
        {
            for (var j = 0; j < this.labelPrecedence[i].length; j++)
            {
                addedLabels[this.labelPrecedence[i][j]] = true;
            }
        }
    }

    for (var label in this.labelMap)
    {
        if (!addedLabels[label])
        {
            this.labelPrecedence.push(label);

            addedLabels[label] = true;
        }
    }
}

function HTMLSyntaxHighlightScheme()
{
    this.id = "htmlHighlight";

    this.labelMap =
    {
        "!": "#00aabb",
        "=": "#00aabb",
        "DOCTYPE": "#ff7700",
        "html": "#ff7700"
    };

    this.labelMap[SyntaxHelper.COMMENT_HTML] = "gray";
    this.labelMap[SyntaxHelper.STRING] = "yellow";
    this.labelMap[SyntaxHelper.SCRIPT_BLOCK] = "#44ffff";
    this.labelMap[SyntaxHelper.STYLE_BLOCK] = "#44ffff";
    this.labelMap["ELEMENT"] = "#ffcc00";

    this.labelSearchSeparators =
    {
    };

    this.labelSearchSeparators[SyntaxHelper.STRING] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.SCRIPT_BLOCK] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.STYLE_BLOCK] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.COMMENT_HTML] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["!"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["ELEMENT"] = SyntaxHelper.SEARCH_ALL;

    this.labelSearchRegexes =
    {
        start:
        {
        },
        end:
        {
        }
    };

    this.labelSearchRegexes.start[SyntaxHelper.COMMENT_HTML] = new RegExp("\\<\\!\\-\\-", "g");
    this.labelSearchRegexes.start[SyntaxHelper.STRING] = new RegExp("[\\\"\\\']", "g");
    this.labelSearchRegexes.start[SyntaxHelper.SCRIPT_BLOCK] = new RegExp("\\<\\s*script\\s*(?:[type\\=text\\\ \\\/JavaScript\\\"\\']+)?\\s*\\>", "ig");
    this.labelSearchRegexes.start[SyntaxHelper.STYLE_BLOCK] = new RegExp("\\<\\s*style\\s*(?:[type\\=text\\\ \\\/css\\\"\\']+)?\\s*\\>", "ig");
    this.labelSearchRegexes.start["ELEMENT"] = new RegExp("[<]", "g");

    this.labelSearchRegexes.end[SyntaxHelper.SCRIPT_BLOCK] = new RegExp("\\<\\s*\\/\\s*script\\s*\\>", "ig");
    this.labelSearchRegexes.end[SyntaxHelper.STYLE_BLOCK] = new RegExp("\\<\\s*\\/\\s*style\\s*\\>", "ig");
    this.labelSearchRegexes.end[SyntaxHelper.STRING] = new RegExp("[\\\"\\\']", "g");
    this.labelSearchRegexes.end[SyntaxHelper.COMMENT_HTML] = new RegExp("\\-\\-\\>", "g");
    this.labelSearchRegexes.end["ELEMENT"] = new RegExp("[>]", "g");

    this.labelExtensions =
    {
        start: {},
        end: {}
    };

    this.labelExtensions.end["ELEMENT"] = 0;

    this.multiLineLabels =
    {

    };

    this.multiLineLabels[SyntaxHelper.COMMENT_HTML] = true;
    this.multiLineLabels[SyntaxHelper.SCRIPT_BLOCK] = true;
    this.multiLineLabels[SyntaxHelper.STYLE_BLOCK] = true;

    this.highlightSchemeSpecificLabels =
    {

    };

    this.highlightSchemeSpecificLabels[SyntaxHelper.SCRIPT_BLOCK] = new JavaScriptHighlightScheme(this);
    this.highlightSchemeSpecificLabels[SyntaxHelper.STYLE_BLOCK] = new CSSSyntaxHighlightScheme(this);

    var addedLabels = {};
    this.labelPrecedence =
    [[SyntaxHelper.SCRIPT_BLOCK, SyntaxHelper.STYLE_BLOCK, SyntaxHelper.COMMENT_HTML, SyntaxHelper.STRING], "ELEMENT"];

    // Add any un-recorded labels to the precedence list.
    for (var i = 0; i < this.labelPrecedence.length; i++)
    {
        if (typeof this.labelPrecedence[i] !== "object")
        {
            addedLabels[this.labelPrecedence[i]] = true;
        }
        else
        {
            for (var j = 0; j < this.labelPrecedence[i].length; j++)
            {
                addedLabels[this.labelPrecedence[i][j]] = true;
            }
        }
    }

    for (var label in this.labelMap)
    {
        if (!addedLabels[label])
        {
            this.labelPrecedence.push(label);

            addedLabels[label] = true;
        }
    }
}

function PythonHighlightScheme(originalHighlighter)
{
    this.id = "PythonHighlight";

    this.labelMap =
    {
        "LONG_QUOTE": "red",
        "if": "#ca53ca",
        "else": "#ca53ca",
        "elif": "#ca53ca",
        "def": "#ca60cc",
        "class": "#ca60cc",
        "__init__": "#ca60cc",
        "{": "#30ffff",
        "}": "#30ffff",
        "==": "#70aabb",
        "is": "#70aabb",
        "not": "#70aabb",
        "=": "#70aabb",
        ">": "#70aabb",
        "<": "#70aabb",
        "%": "#70aabb",
        "+": "#70aabb",
        "-": "#70aabb",
        "*": "#70aabb",
        "/": "#70aabb",
        "do": "#ab00cd",
        "while": "#ab00cd",
        "for": "#ab00cd",
        "in": "#ab70cd",
        "range": "#fb70fd",
        "str": "#fb70fd",
        "global": "#fbfd00",
        "False": "#abab00",
        "True": "#abab00",
        "null": "#00ff66",
        "None": "#bbbbdd",
        "lambda": "#ea00ea",
        "self": "#00ffff",
        "const": "#ffee00",
        "return": "#ff6677",
        "switch": "#00ccff",
        "case": "#00ccff",
        "default": "#00ccff",
        "break": "#bb00ee",
        "import": "#ffaa00",
        "from": "#ffaa00",
        "as": "#ffaa00",
        "len": "#77eecc",
        "exec": "#ff7777",
        "print": "#ff00ff",
        "help": "#ff00ff",
        "input": "#ff0000",
        "[": "#80aaff",
        "]": "#80aaff",
        "or": "#80aaff",
        "and": "#80aaff",
        "^": "#80aaff",
        "(": "#ffaece",
        ")": "#ffaece",
        ":": "#ffbece",
        "async": "#ff7777",
        "await": "#ff7777",
        "isinstance": "#ffcc88",
        "dir": "#ffcc88",
        "list": "#ff88ff"
    };


    this.labelMap[SyntaxHelper.COMMENT] = "green";
    //this.labelMap[SyntaxHelper.COMMENT_MULTI_LINE] = "green";
    this.labelMap[SyntaxHelper.STRING + "1"] = "yellow";
    this.labelMap[SyntaxHelper.STRING + "2"] = "yellow";
    this.labelMap[SyntaxHelper.NUMBER_START] = "pink";
    this.labelMap[SyntaxHelper.NUMBER_STOP] = "pink";
    this.labelMap[SyntaxHelper.END_SCRIPT] = "#44ffff"; // End script.


    this.labelSearchSeparators =
    {
    };

    this.labelSearchSeparators[SyntaxHelper.NUMBER_START] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.NUMBER_STOP] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.STRING + "1"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.STRING + "2"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators[SyntaxHelper.COMMENT] = SyntaxHelper.SEARCH_ALL;
    //this.labelSearchSeparators["__constructor"] = SyntaxHelper.SEARCH_ALL;
    // this.labelSearchSeparators[SyntaxHelper.END_SCRIPT] = SyntaxHelper.SEARCH_ALL,
    //this.labelSearchSeparators[SyntaxHelper.COMMENT_MULTI_LINE] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["LONG_QUOTE"] = SyntaxHelper.SEARCH_ALL;
    this.labelSearchSeparators["{"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["}"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["("] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators[")"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators[":"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["["] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["]"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["^"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["!"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators[";"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["=="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["==="] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators["=>"] = SyntaxHelper.COMPARISON_SEARCH_SEPARATOR;
    this.labelSearchSeparators[">"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["<"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["%"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["*"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["+"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["-"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;
    this.labelSearchSeparators["/"] = SyntaxHelper.SINGLE_CHAR_SEPARATOR;

    this.labelSearchRegexes =
    {
        start:
        {
        },
        end:
        {
        }
    };

    this.labelExtensions =
    {
        start: {},
        end: {}
    };

    //this.labelSearchRegexes.start[SyntaxHelper.COMMENT_MULTI_LINE] = new RegExp("\\\/\\\*", "g");
    this.labelSearchRegexes.start[SyntaxHelper.COMMENT] = new RegExp("\\\/\\\/", "g");
    this.labelSearchRegexes.start[SyntaxHelper.STRING + "1"] = new RegExp("[\\\"]", "g");
    this.labelSearchRegexes.start[SyntaxHelper.STRING + "2"] = new RegExp("[\\\']", "g");
    this.labelSearchRegexes.start["LONG_QUOTE"] = new RegExp("[\"\']{3}", "g");
    // this.labelSearchRegexes.start[SyntaxHelper.END_SCRIPT] = new RegExp("\\<\\w*/\\w*script\\w*\\>");

    //this.labelSearchRegexes.end[SyntaxHelper.COMMENT_MULTI_LINE] = new RegExp("\\\*\\\/", "g");
    this.labelSearchRegexes.end[SyntaxHelper.STRING + "1"] = new RegExp("[\\\"]", "g");
    this.labelSearchRegexes.end[SyntaxHelper.STRING + "2"] = new RegExp("[\\\']", "g");
    this.labelSearchRegexes.end["LONG_QUOTE"] = this.labelSearchRegexes.start["LONG_QUOTE"];
    this.labelSearchRegexes.end["__constructor"] = new RegExp("constructor", "g");
    this.labelSearchRegexes.end[SyntaxHelper.NUMBER_START] = SyntaxHelper.regexps.NUMBER_START;
    this.labelSearchRegexes.end[SyntaxHelper.NUMBER_STOP] = SyntaxHelper.regexps.NUMBER_STOP;


    this.labelSearchFunctions =
    {
        start: {},
        end: {}
    };

    this.multiLineLabels =
    {
        "LONG_QUOTE": true
    };

    this.multiLineLabels[SyntaxHelper.COMMENT_MULTI_LINE] = true;

    this.highlightSchemeSpecificLabels =
    {

    };

    // this.transitionHighlighterLabels[SyntaxHelper.TRANSIT_HIGHLIGHT_BLOCK] = originalHighlighter;

    var addedLabels = {};
    this.labelPrecedence =
    [["COMMENT", "LONG_QUOTE", "QUOTE2", "QUOTE1", SyntaxHelper.COMMENT_MULTI_LINE], "=>", [">", "=", "<"]];

    // Add any un-recorded labels to the precedence list.
    for (var i = 0; i < this.labelPrecedence.length; i++)
    {
        if (typeof this.labelPrecedence[i] !== "object")
        {
            addedLabels[this.labelPrecedence[i]] = true;
        }
        else
        {
            for (var j = 0; j < this.labelPrecedence[i].length; j++)
            {
                addedLabels[this.labelPrecedence[i][j]] = true;
            }
        }
    }

    for (var label in this.labelMap)
    {
        if (!addedLabels[label])
        {
            this.labelPrecedence.push(label);

            addedLabels[label] = true;
        }
    }
}

