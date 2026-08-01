import { test, describe, expect } from "vitest";
import {
  tokenize,
  parse,
  Token,
  TOKEN_TYPE,
  readNumber,
  readString,
  readNull,
  readBoolean,
} from "./index.js";

describe("Read valid numbers used in JSON", () => {
  const validNumbers = [
    "4334",
    "-3456",
    "-43.3344",
    "43.34",
    "1e3",
    "1e+3",
    "1e-3",
    "2.5e10",
    "0e0",
    "10E5",
    // TODO: fix floating point precision issue
    // "-3.1e-2",
    // "6.022e23",
  ];

  validNumbers.forEach((numStr) => {
    test(`should read valid number: ${numStr}`, () => {
      const res = readNumber(numStr, 0);

      expect(res).toEqual({
        value: Number(numStr),
        nextIndex: numStr.length,
      });
    });
  });
});

describe("Read strings used in JSON", () => {
  const validCases = [
    { input: `"hello"`, expected: "hello" },
    { input: `"with space"`, expected: "with space" },
    { input: `"with\\nnewline"`, expected: "with\nnewline" },
    { input: `"with\\ttab"`, expected: "with\ttab" },
    { input: `"with\\\\backslash"`, expected: "with\\backslash" },
    { input: `"with\\\"quote"`, expected: `with"quote` },
    { input: `"123numbers"`, expected: "123numbers" },
    { input: `"\\u0041"`, expected: "A" }, // A
    { input: `"\\u0061"`, expected: "a" }, // a
    { input: `"hello\\u0020world"`, expected: "hello world" }, // space
    { input: `"\\u03A9"`, expected: "Ω" }, // Greek Omega
  ];

  const invalidCases = [
    '"' + "unterminated", // missing closing quote
    `"bad\\escape"`, // invalid escape
    `"bad
  newline"`, // raw newline (not allowed)
    `"\\u12G4"`, // invalid hex
    `"\\x12"`, // unsupported escape
  ];

  validCases.forEach(({ input, expected }) => {
    test(`valid JSON string: ${input}`, () => {
      const res = readString(input.split(""), 1);

      expect(res).toEqual({
        value: expected,
        nextIndex: input.length,
      });
    });
  });

  invalidCases.forEach((input) => {
    test(`invalid JSON string: ${input}`, () => {
      expect(() => readString(input.split(""), 1)).toThrow();
    });
  });
});

describe("Read null used in JSON", () => {
  test("valid null read", () => {
    const input = `"null"`;
    const res = readNull(input, 1);
    expect(res).toEqual({
      value: null,
      nextIndex: input.length - 1,
    });
  });

  test("valid null read at start of string", () => {
    const input = "null";
    const res = readNull(input, 0);
    expect(res).toEqual({
      value: null,
      nextIndex: 4,
    });
  });

  test("invalid null read - truncated", () => {
    const input = "nul";
    expect(() => readNull(input, 0)).toThrow();
  });

  test("invalid null read - wrong casing", () => {
    const input = "Null";
    expect(() => readNull(input, 0)).toThrow();
  });
});

describe("Read boolean used in JSON", () => {
  test("valid true read", () => {
    const input = `"true"`;
    const res = readBoolean(input, 1);
    expect(res).toEqual({
      value: true,
      nextIndex: input.length - 1,
    });
  });

  test("valid true read at start of string", () => {
    const input = "true";
    const res = readBoolean(input, 0);
    expect(res).toEqual({
      value: true,
      nextIndex: 4,
    });
  });

  test("valid false read", () => {
    const input = `"false"`;
    const res = readBoolean(input, 1);
    expect(res).toEqual({
      value: false,
      nextIndex: input.length - 1,
    });
  });

  test("valid false read at start of string", () => {
    const input = "false";
    const res = readBoolean(input, 0);
    expect(res).toEqual({
      value: false,
      nextIndex: 5,
    });
  });

  test("invalid boolean read - truncated true", () => {
    const input = "tru";
    expect(() => readBoolean(input, 0)).toThrow();
  });

  test("invalid boolean read - truncated false", () => {
    const input = "fals";
    expect(() => readBoolean(input, 0)).toThrow();
  });

  test("invalid boolean read - wrong casing true", () => {
    const input = "True";
    expect(() => readBoolean(input, 0)).toThrow();
  });

  test("invalid boolean read - wrong casing false", () => {
    const input = "False";
    expect(() => readBoolean(input, 0)).toThrow();
  });
});

describe("tokenize", () => {
  describe("primitive values", () => {
    test("tokenize simple object with number", () => {
      const input = '{"age":45}';
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "age"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.NUMBER, 45),
        new Token(TOKEN_TYPE.RBRACE),
      ]);
    });

    test("tokenize null", () => {
      const input = '{"foo":null}';
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "foo"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.NULL, null),
        new Token(TOKEN_TYPE.RBRACE),
      ]);
    });

    test("tokenize boolean value true", () => {
      const input = '{"foo":true}';
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "foo"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.BOOLEAN, true),
        new Token(TOKEN_TYPE.RBRACE),
      ]);
    });

    test("tokenize boolean value false", () => {
      const input = '{"foo":false}';
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "foo"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.BOOLEAN, false),
        new Token(TOKEN_TYPE.RBRACE),
      ]);
    });
  });

  describe("structural tokens", () => {
    test("tokenize empty object", () => {
      const input = "{}";
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.RBRACE),
      ]);
    });

    test("tokenize empty array", () => {
      const input = "[]";
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACKET),
        new Token(TOKEN_TYPE.RBRACKET),
      ]);
    });

    test("tokenize array of numbers", () => {
      const input = "[1,2,3]";
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACKET),
        new Token(TOKEN_TYPE.NUMBER, 1),
        new Token(TOKEN_TYPE.COMMA),
        new Token(TOKEN_TYPE.NUMBER, 2),
        new Token(TOKEN_TYPE.COMMA),
        new Token(TOKEN_TYPE.NUMBER, 3),
        new Token(TOKEN_TYPE.RBRACKET),
      ]);
    });

    test("tokenize object with multiple keys", () => {
      const input = '{"a":1,"b":2}';
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "a"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.NUMBER, 1),
        new Token(TOKEN_TYPE.COMMA),
        new Token(TOKEN_TYPE.STRING, "b"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.NUMBER, 2),
        new Token(TOKEN_TYPE.RBRACE),
      ]);
    });

    test("tokenize nested object", () => {
      const input = '{"a":{"b":1}}';
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "a"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "b"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.NUMBER, 1),
        new Token(TOKEN_TYPE.RBRACE),
        new Token(TOKEN_TYPE.RBRACE),
      ]);
    });

    test("tokenize array of objects", () => {
      const input = '[{"a":1},{"b":2}]';
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACKET),
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "a"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.NUMBER, 1),
        new Token(TOKEN_TYPE.RBRACE),
        new Token(TOKEN_TYPE.COMMA),
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "b"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.NUMBER, 2),
        new Token(TOKEN_TYPE.RBRACE),
        new Token(TOKEN_TYPE.RBRACKET),
      ]);
    });
  });

  describe("whitespace handling", () => {
    test("tokenize object with insignificant whitespace", () => {
      const input = `{
        "age" : 45 ,
        "ok" : true
      }`;
      const result = tokenize(input);
      expect(result).toEqual([
        new Token(TOKEN_TYPE.LBRACE),
        new Token(TOKEN_TYPE.STRING, "age"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.NUMBER, 45),
        new Token(TOKEN_TYPE.COMMA),
        new Token(TOKEN_TYPE.STRING, "ok"),
        new Token(TOKEN_TYPE.COLON),
        new Token(TOKEN_TYPE.BOOLEAN, true),
        new Token(TOKEN_TYPE.RBRACE),
      ]);
    });
  });

  describe("invalid input", () => {
    test("throws on unterminated string", () => {
      const input = '{"foo":"bar}';
      expect(() => tokenize(input)).toThrow();
    });

    test("throws on invalid literal", () => {
      const input = '{"foo":nul}';
      expect(() => tokenize(input)).toThrow();
    });

    test("throws on unexpected character", () => {
      const input = '{"foo":@}';
      expect(() => tokenize(input)).toThrow();
    });

    test("throws on malformed number", () => {
      const input = '{"foo":1.2.3}';
      expect(() => tokenize(input)).toThrow();
    });
  });
});

describe("parse", () => {
  // primitives
  test("parse empty array", () => {
    let tokens = [
      new Token(TOKEN_TYPE.LBRACKET),
      new Token(TOKEN_TYPE.RBRACKET),
    ];
    expect(parse(tokens)).toEqual([]);
  });

  test("parse empty object", () => {
    let tokens = [new Token(TOKEN_TYPE.LBRACE), new Token(TOKEN_TYPE.RBRACE)];
    expect(parse(tokens)).toEqual({});
  });

  test("parse a number", () => {
    let tokens = [new Token(TOKEN_TYPE.NUMBER, 42)];
    expect(parse(tokens)).toEqual(42);
  });

  test("parse a string", () => {
    let tokens = [new Token(TOKEN_TYPE.STRING, "hello")];
    expect(parse(tokens)).toEqual("hello");
  });

  test("parse true", () => {
    let tokens = [new Token(TOKEN_TYPE.BOOLEAN, true)];
    expect(parse(tokens)).toEqual(true);
  });

  test("parse false", () => {
    let tokens = [new Token(TOKEN_TYPE.BOOLEAN, false)];
    expect(parse(tokens)).toEqual(false);
  });

  test("parse null", () => {
    let tokens = [new Token(TOKEN_TYPE.NULL)];
    expect(parse(tokens)).toEqual(null);
  });

  // Arrays with content
  test("parse array with single number", () => {
    let tokens = [
      new Token(TOKEN_TYPE.LBRACKET),
      new Token(TOKEN_TYPE.NUMBER, 1),
      new Token(TOKEN_TYPE.RBRACKET),
    ];
    expect(parse(tokens)).toEqual([1]);
  });

  test("parse array with multiple numbers", () => {
    let tokens = [
      new Token(TOKEN_TYPE.LBRACKET),
      new Token(TOKEN_TYPE.NUMBER, 1),
      new Token(TOKEN_TYPE.COMMA),
      new Token(TOKEN_TYPE.NUMBER, 2),
      new Token(TOKEN_TYPE.COMMA),
      new Token(TOKEN_TYPE.NUMBER, 3),
      new Token(TOKEN_TYPE.RBRACKET),
    ];
    expect(parse(tokens)).toEqual([1, 2, 3]);
  });

  test("parse array with mixed types", () => {
    let tokens = [
      new Token(TOKEN_TYPE.LBRACKET),
      new Token(TOKEN_TYPE.STRING, "a"),
      new Token(TOKEN_TYPE.COMMA),
      new Token(TOKEN_TYPE.NUMBER, 1),
      new Token(TOKEN_TYPE.COMMA),
      new Token(TOKEN_TYPE.BOOLEAN, true),
      new Token(TOKEN_TYPE.COMMA),
      new Token(TOKEN_TYPE.NULL),
      new Token(TOKEN_TYPE.RBRACKET),
    ];
    expect(parse(tokens)).toEqual(["a", 1, true, null]);
  });

  test("parse nested array", () => {
    let tokens = [
      new Token(TOKEN_TYPE.LBRACKET),
      new Token(TOKEN_TYPE.LBRACKET),
      new Token(TOKEN_TYPE.NUMBER, 1),
      new Token(TOKEN_TYPE.RBRACKET),
      new Token(TOKEN_TYPE.RBRACKET),
    ];
    expect(parse(tokens)).toEqual([[1]]);
  });
});
