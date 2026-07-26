export const TOKEN_TYPE = Object.freeze({
  NUMBER: "NUMBER",
  STRING: "STRING",
  LBRACE: "LBRACE",
  RBRACE: "RBRACE",
  LBRACKET: "LBRACKET",
  RBRACKET: "LBRACKET",
  COLON: "COLON",
  COMMA: "COMMA",
});

export class Token {
  constructor(type, value = null) {
    this.type = type;
    this.value = value;
  }
}

function parseNumber(s, i) {
  let totalNumber = 0;

  while (i < s.length && s[i].match(/[0-9]/)) {
    let currentNumber = s[i].charCodeAt(0) - "0".charCodeAt(0);
    totalNumber = 10 * totalNumber + currentNumber;
    i++;
  }

  return { value: totalNumber, nextIndex: i };
}

function parseString(s, i) {
  let stringValue = "";

  while (i < s.length && s[i] !== '"') {
    stringValue += s[i];
    i++;
  }

  return { value: stringValue, nextIndex: i };
}

export function tokenize(source) {
  let tokens = [];

  for (let i = 0; i < source.length; i++) {
    if (source[i].match(/[0-9]/)) {
      const { value, nextIndex } = parseNumber(source, i);
      tokens.push(new Token(TOKEN_TYPE.NUMBER, value));
      i = nextIndex;
    }

    switch (source[i]) {
      case "{":
        tokens.push(new Token(TOKEN_TYPE.LBRACE));
        break;
      case "}":
        tokens.push(new Token(TOKEN_TYPE.RBRACE));
        break;
      case '"':
        const { value, nextIndex } = parseString(source, i + 1);

        i = nextIndex;
        tokens.push(new Token(TOKEN_TYPE.STRING, value));
        break;
      case ":":
        tokens.push(new Token(TOKEN_TYPE.COLON));
        break;
      case ",":
        tokens.push(new Token(TOKEN_TYPE.COMMA));
        break;
    }
  }

  return tokens;
}

function main() {
  // const jsonString = '{"age":45, "name": "Abhijit"}';

  // console.log(tokenize(jsonString));
}

main();
