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

/* Token Readers */
// TODO: floating point precision issue e.g. 6.022e23
export function readNumber(s, i) {
  let sign;
  let power = 1.0;
  let exp = 0;
  let totalNumber = 0;

  // sign
  sign = s[i] === "-" ? -1 : 1;
  if (s[i] === "-") i++;

  while (i < s.length && s[i].match(/[0-9]/)) {
    let currentNumber = s[i].charCodeAt(0) - "0".charCodeAt(0);
    totalNumber = 10 * totalNumber + currentNumber;
    i++;
  }

  // decimal point
  if (s[i] === ".") {
    i++;

    while (i < s.length && s[i].match(/[0-9]/)) {
      let currentNumber = s[i].charCodeAt(0) - "0".charCodeAt(0);
      totalNumber = 10 * totalNumber + currentNumber;
      power *= 10;
      i++;
    }
  }

  // exponent
  if (s[i] === "e" || s[i] === 'E') {
    i++;
    let sign = s[i] === "-" ? -1 : 1;

    if (s[i] === "-" || s[i] === "+") i++;
    while (i < s.length && s[i].match(/[0-9]/)) {
      let currentNumber = s[i].charCodeAt(0) - "0".charCodeAt(0);
      exp = 10 * exp + currentNumber;
      i++;
    }
    exp = exp * sign;
  }

  return {
    value: ((sign * totalNumber) / power) * Math.pow(10, exp),
    nextIndex: i,
  };
}

// TODO: handle escape sequence
function readString(s, i) {
  let stringValue = "";

  while (i < s.length && s[i] !== '"') {
    stringValue += s[i];
    i++;
  }

  return { value: stringValue, nextIndex: i + 1 };
}

/* Tokenizer */
export function tokenize(source) {
  let tokens = [];
  let i = 0;

  while (i < source.length) {
    if (source[i].match(/[0-9]/) || source[i] === "-") {
      const { value, nextIndex } = readNumber(source, i);

      tokens.push(new Token(TOKEN_TYPE.NUMBER, value));
      i = nextIndex;
    } else if (source[i] === `"`) {
      // pass next index to skip current quote
      const { value, nextIndex } = readString(source, i + 1);

      tokens.push(new Token(TOKEN_TYPE.STRING, value));
      i = nextIndex;
    } else if (source[i] === " ") {
      i++;
      continue;
    } else {
      switch (source[i]) {
        case "{":
          tokens.push(new Token(TOKEN_TYPE.LBRACE));
          break;
        case "}":
          tokens.push(new Token(TOKEN_TYPE.RBRACE));
          break;
        case '"':
          break;
        case ":":
          tokens.push(new Token(TOKEN_TYPE.COLON));
          break;
        case ",":
          tokens.push(new Token(TOKEN_TYPE.COMMA));
          break;
        default:
          throw new Error(`Unexpected token at position: ${i}`);
      }
      i++;
    }
  }

  return tokens;
}

function main() {
  // const jsonString = '{"age":45, "name": "john doe"}';
  // console.log(tokenize(jsonString));
}

main();
