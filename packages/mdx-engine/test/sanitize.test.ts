import DOMPurify from "isomorphic-dompurify";

it("strips script tags from untrusted MDX-rendered HTML", () => {
  const dirty = '<p>hello</p><script>alert("xss")</script>';
  const clean = DOMPurify.sanitize(dirty);

  expect(clean).not.toContain("<script>");
  expect(clean).toContain("<p>hello</p>");
});
