import { expect, test } from "bun:test";
import { html } from "./html";

test("html", async () => {
  const colors = ["red", "green", "blue"];
  const got = html`
    <div>
      <h1>Colors</h1>
      <ul>
        ${colors.map((color) => `<li>${color}</li>`)}
      </ul>
    </div>
  `;

  expect(got).toEqual(`
    <div>
      <h1>Colors</h1>
      <ul>
        <li>red</li><li>green</li><li>blue</li>
      </ul>
    </div>
  `);
});
