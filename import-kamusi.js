let fs = require('fs');

let english = fs.readFileSync(__dirname + '/kamusi-cli/eall.txt', 'utf-8').split('\n');

let keyRewrite = {
    'English Word': 'eng',
    'English Plural': 'engp',
    'Swahili Word': 'swah',
    'Swahili Plural': 'swahp',
    'Part of Speech': 'pos',
    'Class': 'class',
    'Related Words': 'rel',
    'Terminology': 'term',
    'English Definition': 'engdef',
    'Swahili Definition': 'swahdef',
    'Taxonomy': 'tax',
    'English Example': 'engex',
    'Swahili Example': 'swahex',
    'Derived Word': 'dword',
    'Dialect': 'dialect',
    'Derived Language': 'dlang',
    'Note': 'note'
};

var data = [];
var i = 0;
var count = 0;
var definition, defKey, defValue;

// Start from the line and read each item
while (i < english.length) {

    // While there is more data to read
    while (! english[i].match(/^\-+$/) &&
           i < english.length) {

        if (english[i] == 'Copyright Notice') {
            break
        }

        if (english[i].match(/^\-\s[A-Z]\s\-$/)) {
            i += 2
            break
        }

        // The definition object
        definition = {};

        // Skip empty lines
        while (english[i].length > 0) {
            // Skip lines that are not key-value pairs
            if (english[i].indexOf('[') != 0) {
                i++;
                continue;
            }

            defKey = english[i].substring(
                english[i].indexOf('[') + 1, english[i].indexOf(']'));
            defValue = english[i].substring(english[i].indexOf(']') + 2);

            if (keyRewrite[defKey]) {
                definition[defKey] = defValue
            }

            i++;
        }
        // Add the definition to the data
        data.push(definition);
        i++;
    }

    //fs.writeFileSync(__dirname + '/data/')
    //console.log(data);
    count++;

    i++;
}

console.log('Got ' + count + ' items.');
