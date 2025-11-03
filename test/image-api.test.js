import { html, fixture, expect } from '@open-wc/testing';
import "../image-api.js";

describe("ImageApi test", () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html`
      <image-api
        title="title"
      ></image-api>
    `);
  });

  it("basic will it blend", async () => {
    expect(element).to.exist;
  });

  it("passes the a11y audit", async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
