import { test, expect } from "vitest";
import { tokenize, Token, TOKEN_TYPE } from "./index.js";

test("parses simple object with number", () => {
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
