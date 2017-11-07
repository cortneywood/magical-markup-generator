var HTML = 0;
var HOMEBREWERY = 1;

// =========================================================================
//  EVENT HANDLERS
// =========================================================================
function CreateTableCheckboxHandler(chk) {
    var tableOptions = document.getElementById('tableOptions');
    var numColumns = document.getElementById('columnCount');
    var prefixCell = document.getElementById('prefixCell');
    var suffixCell = document.getElementById('suffixCell');

    if (chk.checked) {
        tableOptions.classList.remove("text-muted");
        Enable(numColumns);
        Enable(prefixCell);
        Enable(suffixCell);
    }
    else {
        tableOptions.classList.add("text-muted");
        Disable(numColumns);
        Disable(prefixCell);
        Disable(suffixCell);
    }

    function Enable(control) { control.removeAttribute("disabled"); }

    function Disable(control) { control.setAttribute("disabled", ""); }
}

function CopyOutput() {
    var copyText = document.getElementById("generatedOutput");

    var copyMessage = document.getElementById("copyOutputMessage");
    copyMessage.classList.add("label-primary");

    if (copyText.value) {
        copyText.select();
        document.execCommand("Copy");
        copyMessage.innerHTML = "Copied!";
    }
    else {
        copyMessage.innerHTML = "No text to copy! :C";
    }

    document.body.addEventListener('click', ResetCopyMessage, true)

    function ResetCopyMessage() {
        var copyMessage = document.getElementById("copyOutputMessage");
        copyMessage.classList.remove("label-primary");
        copyMessage.innerHTML = "&nbsp;";
        document.body.removeEventListener('click', ResetCopyMessage, true)
    }
}

// =========================================================================
//  *~~ THE MAGICAL MARKUP GENERATOR ~~*
// =========================================================================
function RunMagicalMarkupGenerator() {

    var ParseOptions = ReadFormData();
    var Syntax = SyntaxManager();
    var Parser = Parser();

    // Parse
    Parser.ParseItemPrefix();
    Parser.ParseItemSuffix();

    // Generate Output
    var outputResult = GenerateOutput();

    // Display Output in Textarea
    document.getElementById('generatedOutput').value = outputResult;

    // DONE. Everything else below this is fake JS object-oriented design.

    // =========================================================================
    //  ACTUAL MARKUP PARSER
    // =========================================================================
    function Parser() {
        var result = {};
        var RegexManager = RegexManager();

        result.ParseItemPrefix = function (text) {
            var itemPrefix = ParseOptions.ItemPrefix;
            ParseOptions.ItemPrefix = Parser.ParseNumberIncrementer(itemPrefix);
        }

        result.ParseItemSuffix = function (text) {
            var itemSuffix = ParseOptions.ItemSuffix;
            ParseOptions.ItemSuffix = Parser.ParseNumberIncrementer(itemSuffix);
        }

        result.ParseNumberIncrementer = function (text) {

            // Parse for other markup and create initial return value
            text = ParseMarkup(text);
            var retValue = { HasIncrement: false, Text: text }

            // Split the text to find the Increment
            var split = text.split(RegexManager.NumberIncrementer.SplitForIncrement);
            for (var i = 0; i < split.length; i++) {
                if (split[i] == "[numInc|") {
                    retValue.Increment = parseInt(split[i + 1]);
                    break;
                }
            }

            // Found an increment; generate parsed result. 
            if (typeof (retValue.Increment) != undefined) {
                retValue.HasIncrement = true;
                retValue.Text = text.replace("[numInc|" + retValue.Increment + "]", "%NUM_INCREMENT_HERE%");
                retValue.ReplaceValue = "%NUM_INCREMENT_HERE%";
            }

            return retValue;
        }
        
        return result; 

        function ParseMarkup(text) {
            var parsedText;
            parsedText = text.replace(RegexManager.Bold.BothTags, ReplaceBold)
            parsedText = parsedText.replace(RegexManager.Italic.BothTags, ReplaceItalic)
            return parsedText;

            function ReplaceBold(text) {
                text = text.replace(RegexManager.Bold.OpenTag, Syntax.Bold.OpenTag);
                text = text.replace(RegexManager.Bold.CloseTag, Syntax.Bold.CloseTag);
                return text;
            }

            function ReplaceItalic(text) {
                text = text.replace(RegexManager.Italic.OpenTag, Syntax.Italic.OpenTag);
                text = text.replace(RegexManager.Italic.CloseTag, Syntax.Italic.CloseTag);
                return text;
            }
        }

        // -------------------------------------------------------------------------
        //  MANAGE REGEX FOR PARSING
        // -------------------------------------------------------------------------
        function RegexManager() {

            var result = {};

            result.Bold = generateRegexTags("b");

            result.Italic = generateRegexTags("i");

            result.Underline = generateRegexTags("u");

            result.NumberIncrementer = {
                Markup: /\[numInc\|[1-9]\]/,
                SplitForIncrement: /(\[numInc\||\])/
            }

            // Generic Regex Generator for Markup Tags
            function generateRegexTags(tagValue) {

                var tagResult = {};
                tagResult.OpenTag = generateOpenTagRegex();
                tagResult.CloseTag = generateCloseTagRegex();
                tagResult.BothTags = generateBothTagsRegex();
                return tagResult;

                function generateOpenTagRegex() {
                    var regex = "\\[" + tagValue + "\\]";
                    regex = RegExp(regex);
                    return regex;
                }

                function generateCloseTagRegex() {
                    var regex = "\\[\\/" + tagValue + "\\]";
                    regex = RegExp(regex);
                    return regex;
                }

                function generateBothTagsRegex() {
                    var regex = "\\[" + tagValue + "\\].*\\[\\/" + tagValue + "\\]";
                    regex = RegExp(regex);
                    return regex;
                }
            }

            return result;
        }
    }



    // =========================================================================
    //  MANAGE PLATFORM-SPECIFIC SYNTAX OPTIONS
    // =========================================================================
    function SyntaxManager() {

        switch (ParseOptions.Platform) {
            case HOMEBREWERY:
                return HomebrewerySyntax();
                break;
            default:
                return HTMLSyntax();
        }

        // HTML
        function HTMLSyntax() {
            var result = {};

            result.Table = {
                TableOpen: "<table>",
                TableClose: "</table>",
                RowOpen: "<tr>",
                RowClose: "</tr> \n",
                CellOpen: "<td>",
                CellClose: "</td> \n"
            }

            result.Bold = {
                OpenTag: "<b>",
                CloseTag: "</b>"
            }

            result.Italic = {
                OpenTag: "<i>",
                CloseTag: "</i>"
            }

            return result;
        }

        // Homebrewery
        function HomebrewerySyntax() {
            var result = {};

            result.Table = {
                TableOpen: GenerateHomebreweryTableHeader(),
                TableClose: "",
                RowOpen: "",
                RowClose: "\n",
                CellOpen: "| ",
                CellClose: ""
            }

            result.Bold = {
                OpenTag: "**",
                CloseTag: "**"
            }

            result.Italic = {
                OpenTag: "*",
                CloseTag: "*"
            }

            return result;

            // Homebrewery's Weird Table Header Utility
            function GenerateHomebreweryTableHeader() {
                var header = "|";
                for (var i = 0; i < ParseOptions.TableOptions.ColumnCount; i++)
                    header += " |"
                header += "\n|";
                for (var i = 0; i < ParseOptions.TableOptions.ColumnCount; i++)
                    header += ":-|";
                header += "\n";
                return header;
            }
        }
    }

    function GenerateOutput() {

        var result = "";

        // Generate Output with Table
        if (ParseOptions.CreateTable) {
            var itemsPerColumn = Math.ceil(ParseOptions.ItemList.length / ParseOptions.TableOptions.ColumnCount);
            var currentItem = 0;

            var rows = [];
            for (var i = 0; i < itemsPerColumn; i++) {
                rows.push(Syntax.Table.RowOpen);
            }

            result += Syntax.Table.TableOpen;
            for (var c = 0; c < ParseOptions.TableOptions.ColumnCount; c++) {
                for (var i = 0; i < itemsPerColumn && currentItem < ParseOptions.ItemList.length; i++) {

                    rows[i] += Syntax.Table.CellOpen;
                    rows[i] += ApplyIncrement(ParseOptions.ItemPrefix, currentItem);

                    if (ParseOptions.TableOptions.PrefixCell && ParseOptions.ItemPrefix.Text != "")
                        rows[i] += (Syntax.Table.CellClose + Syntax.Table.CellOpen);

                    rows[i] += ParseOptions.ItemList[currentItem];

                    if (ParseOptions.TableOptions.SuffixCell && ParseOptions.ItemSuffix.Text != "")
                        rows[i] += (Syntax.Table.CellClose + Syntax.Table.CellOpen);

                    rows[i] += ApplyIncrement(ParseOptions.ItemSuffix, currentItem);
                    rows[i] += Syntax.Table.CellClose;
                    currentItem++;

                }
            }

            for (var i = 0; i < itemsPerColumn; i++) {
                rows[i] += Syntax.Table.RowClose;
                result += rows[i];
            }
            result += Syntax.Table.TableClose;
        }

        // Generate Output without Table
        else {
            for (var i = 0; i < ParseOptions.ItemList.length; i++) {
                result += ApplyIncrement(ParseOptions.ItemPrefix, i);
                result += ParseOptions.ItemList[i];
                result += ApplyIncrement(ParseOptions.ItemSuffix, i);
                result += "\n";
            }
        }

        return result;

        // Increment Utility
        function ApplyIncrement(incObject, currentIndex) {
            if (!incObject.HasIncrement)
                return incObject.Text;

            return incObject.Text.replace(incObject.ReplaceValue, (currentIndex + 1) * incObject.Increment);
        }
    }
}

// =========================================================================
//  READ FORM DATA INTO VARIABLES
// =========================================================================
function ReadFormData() {
    var result = {};

    // Item Data
    result.ItemPrefix = document.getElementById('itemPrefix').value;
    result.ItemSuffix = document.getElementById('itemSuffix').value;
    result.ItemList = (document.getElementById('itemList').value).split("\n");

    // Output Data
    var tmpPlatform = document.getElementById('platform').value;
    switch (tmpPlatform) {
        case "homebrewery":
            result.Platform = HOMEBREWERY;
            break;
        default:
            result.Platform = HTML;
    }

    // Table Options
    result.CreateTable = document.getElementById('createTable').checked;
    result.TableOptions = {
        ColumnCount: parseInt(document.getElementById('columnCount').value),
        PrefixCell: document.getElementById('prefixCell').checked,
        SuffixCell: document.getElementById('suffixCell').checked
    }

    return result;
}


