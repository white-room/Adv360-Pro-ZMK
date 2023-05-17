#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/*
Default layout shown using QWERTY. 
ABC123 = normal keys (QWERTY layout)
mX = macro keys
lX = left thumb keys (1 and 2 are the two row vertical keys)
rX = right thumb keys
? = programmable (special keys)
* = none (represented as &none in the bindings)
_ = spacer (represented as white space in the bindings)

*/
const layout = parseKeymap(`
? 1 2 3 4 5 m0 __ __ _ _ __ __ m0 6 7 8 9 0 ?
? Q W E R T m1 __ __ _ _ __ __ m3 Y U I O P ?
? A S D F G m2 l3 l4 * * r5 r6 m4 H J K L ; ?
? Z X C V B  *  * l5 * * r4  *  * N M , . / ?
? ? ? ? ? _ l1 l2 l6 _ _ r3 r2 r1 _ ? ? ? ? ? 
`);

main();

// Read the file
function main() {
    const filePath = path.join(__dirname, '..', 'config', 'adv360.keymap');
    const file = fs.readFileSync(filePath, 'utf8');
    const lines = file.split('\n');
    let out = '';
    let keymap = [];

    lines.forEach((line, lineIdx) => {
        if (isKeybindings(line)) {
            const bindings = parseBindingsLine(line);
            const row = keymap.length;
            let col = 0;

            const bindingsWithSpacers = bindings.reduce((acc, value) => {
                let layoutValue = layout[row][col];

                if (isSpacer(layoutValue)) {
                    while (isSpacer(layoutValue)) {
                        acc.push('');
                        col++;
                        layoutValue = layout[row][col];
                    }

                } else if (isNone(layoutValue) && value !== '&none') {
                    throw new Error('expected &none binding but got: ' + value + ' at line: ' + (lineIdx + 1) + ', binding: ' + (col + 1));
                }

                acc.push(value);
                col++;

                return acc;
            }, []);

            keymap.push(bindingsWithSpacers);
        }
        else if (keymap.length > 0 && isBindingsEnd(line)) {
            let maxLengths = Array(keymap[0]?.length || 0).fill(0);

            keymap.forEach((row, y) => {
                row.forEach((col, x) => {
                    maxLengths[x] = Math.max(maxLengths[x], row[x].length);
                });
            });

            keymap.forEach((row, y) => {
                row.forEach((col, x) => {
                    row[x] = col.padEnd(maxLengths[x] + 1, ' ');
                });
            });

            out += keymap
                .map(row => row.join(' '))
                .join('\n');
            out += '\n' + line + `\n`;
            keymap = [];
        } else {
            out += line + `\n`;
        }
    });

    fs.writeFileSync(filePath, out.replace(/\n{2,}$/, '\n'));
}

function isBindingsStart(line) {
    return line.trim() === ('bindings = <');
}

function isBindingsEnd(line) {
    return line.trim() === '>;';
}

function isKeybindings(line) {
    return /^\&\w+/.test(line.trim());
}

function parseKeymap(keymap) {
    return keymap.split('\n')
        .map(v => v.trim())
        .map(v => v.replace(/_+/g, '_').replace(/\s+/g, ' '))
        .filter(Boolean)
        .map(v => v.split(' '));
}

function isSpacerOrNone(value) {
    return isSpacer(value) || isNone(value);
}

function isNone(value) {
    return value === '*';
}

function isSpacer(value) {
    return value === '_';
}

function parseBindingsLine(line) {
    return line.replace(/\s+/g, ' ')
        .split('&')
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => `&${v}`);
}