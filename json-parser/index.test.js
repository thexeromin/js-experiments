import { test, describe, expect } from "vitest";
import { tokenize, Token, TOKEN_TYPE, readNumber } from "./index.js";

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
        nextIndex: numStr.length
      });
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
