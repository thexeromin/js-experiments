const TOKEN_TYPE = Object.freeze({
  NUMBER: "NUMBER",
  STRING: "STRING",
  LBRACE: "{",
  RBRACE: "}",
  COLON: ":",
});

class Token {
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

function tokenize(source) {
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
        i++;
        let stringValue = "";

        while (
          i < source.length &&
          source[i] !== '"' &&
          source[i].match(/[a-zA-Z]/)
        ) {
          stringValue += source[i];
          i++;
        }

        tokens.push(new Token(TOKEN_TYPE.STRING, stringValue));
        break;
      case ":":
        tokens.push(new Token(TOKEN_TYPE.COLON));
        break;
    }
  }

  return tokens;
}

function main() {
  const jsonString = '{"age":45}';

  console.log(tokenize(jsonString));
}

main();
