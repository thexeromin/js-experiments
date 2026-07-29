export const TOKEN_TYPE = Object.freeze({
  NUMBER: "NUMBER",
  STRING: "STRING",
  LBRACE: "LBRACE",
  RBRACE: "RBRACE",
  LBRACKET: "LBRACKET",
  RBRACKET: "LBRACKET",
  COLON: "COLON",
  COMMA: "COMMA",
  NULL: "NULL",
  BOOLEAN: "BOOLEAN",
});

export class Token {
  constructor(type, value = null) {
    this.type = type;
    this.value = value;
  }
}

function readNext4HexDigits(input, i) {
  let hex = "";

  for (let j = 0; j < 4; j++) {
    let ch = input[i + j];

    if (!/[0-9a-fA-F]/.test(ch)) throw new Error("Invalid Unicode escape");

    hex += ch;
  }

  return hex;
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
  if (s[i] === "e" || s[i] === "E") {
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

export function readString(s, i) {
  let result = "";

  while (i < s.length && s[i] !== '"') {
    if (s[i] === "\\") {
      i++;

      if (i >= s.length) throw new Error("Unterminated escape sequence");

      switch (s[i]) {
        case '"':
          result += '"';
          break;
        case "\\":
          result += "\\";
          break;
        case "/":
          result += "/";
          break;
        case "b":
          result += "\b";
          break;
        case "f":
          result += "\f";
          break;
        case "n":
          result += "\n";
          break;
        case "r":
          result += "\r";
          break;
        case "t":
          result += "\t";
          break;
        case "u":
          let hex = readNext4HexDigits(s, i + 1);
          result += String.fromCharCode(parseInt(hex, 16));
          i += 4;
          break;
        default:
          throw new Error("Invalid escape sequence");
      }
      i++;
    } else {
      if (s[i] < " ") {
        throw new Error("Bad control character in string");
      }

      result += s[i];
      i++;
    }
  }

  if (s[i] !== `"`) throw new Error("Unterminated string");
  return { value: result, nextIndex: i + 1 };
}

export function readNull(s, i) {
  const target = "null";
  const parsedString = s.slice(i, i + target.length);

  if (target !== parsedString) throw new Error("Unexpected token");

  return { value: null, nextIndex: i + target.length };
}

export function readBoolean(s, i) {
  const targets = ["true", "false"];

  if (s.slice(i, i + targets[0].length) === targets[0])
    return { value: true, nextIndex: i + targets[0].length };
  else if (s.slice(i, i + targets[1].length) === targets[1])
    return { value: false, nextIndex: i + targets[1].length };
  else
    throw new Error("Unexpected Token")
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
    } else if (source[i] === "n") {
      const { value, nextIndex } = readNull(source, i);

      tokens.push(new Token(TOKEN_TYPE.NULL, value));
      i = nextIndex;
    } else if (source[i] === "t" || source[i] === "f") {
      const { value, nextIndex } = readBoolean(source, i);

      tokens.push(new Token(TOKEN_TYPE.BOOLEAN, value));
      i = nextIndex;
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
