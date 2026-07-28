import { test, describe, expect } from "vitest";
import {
  tokenize,
  Token,
  TOKEN_TYPE,
  readNumber,
  readString,
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

test("tokenize simple object with number", () => {
  const input = '{"age":45}';

  const result = tokenize(input);

  const expected = [
    new Token(TOKEN_TYPE.LBRACE),
    new Token(TOKEN_TYPE.STRING, "age"),
    new Token(TOKEN_TYPE.COLON),
    new Token(TOKEN_TYPE.NUMBER, 45),
    new Token(TOKEN_TYPE.RBRACE),
  ];

  expect(result).toEqual(expected);
});
